import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { areaOf, isPlatformPath } from "@/lib/classroom/areas";
import { createClass } from "@/lib/services/classes";
import {
  classroomControlAvailable,
  IDLE_MS,
  LOCK_MAX_MS,
  OFFLINE_MS,
  answerHelp,
  classroomState,
  cleanPath,
  markMessagesRead,
  raiseHand,
  recordHeartbeat,
  recordLeave,
  sendMessage,
  sendToPage,
  setLocked,
  studentActivity,
} from "@/lib/services/classroom";
import { ApiError } from "@/lib/http/errors";

const T0 = 1_800_000_000_000;
const beat = (tab = "tab1", path = "/labs/stem", visible = true, idleMs = 0, title = "STEM") => ({ tabId: tab, path, title, visible, idleMs });

describe("classroom paths", () => {
  it("names the area of a page", () => {
    expect(areaOf("/labs/programming/l1-sum-to-n")).toBe("programming");
    expect(areaOf("/labs/critical-thinking")).toBe("critical");
    expect(areaOf("/labs")).toBe("labs");
    expect(areaOf("/student/learn/abc")).toBe("lesson");
    expect(areaOf("/student")).toBe("home");
    expect(areaOf("/library/lib-1")).toBe("library");
    expect(areaOf("/labsX")).toBe("other");
  });
  it("opens only pages of this platform", () => {
    for (const ok of ["/library", "/labs/stem/simulations/projectile", "/career#guide"]) expect(isPlatformPath(ok), ok).toBe(true);
    for (const bad of ["https://example.com", "//example.com", "javascript:alert(1)", "library", "/api/auth/logout", "/api", "/a b", "/\\evil.com", `/${"x".repeat(400)}`, "/x://y"]) expect(isPlatformPath(bad), bad).toBe(false);
  });
  it("records the path only: no query string, no fragment, nothing outside the platform", () => {
    expect(cleanPath("/student/learn/abc?token=secret#x")).toBe("/student/learn/abc");
    expect(cleanPath("https://evil.example/page")).toBe("/");
  });
});

describe("classroom control with open access", () => {
  const saved = process.env.OPEN_ACCESS;
  afterEach(() => {
    if (saved === undefined) delete process.env.OPEN_ACCESS;
    else process.env.OPEN_ACCESS = saved;
  });

  it("is off: everyone shares one demo student, so nobody could be allowed to pause the others", () => {
    freshDb();
    const teacher = makeUser("teacher", "nino");
    const mariam = makeUser("student", "mariam");
    const classId = createClass(teacher, "9A", [mariam.id]).id;
    delete process.env.OPEN_ACCESS; // open access is the default
    expect(classroomControlAvailable()).toBe(false);
    expect(recordHeartbeat(mariam, beat(), T0)).toBeNull();
    expect(() => raiseHand(mariam, "", T0)).toThrow(ApiError);
    expect(() => classroomState(classId, teacher)).toThrow(ApiError);
    expect(() => setLocked(classId, teacher, null, true)).toThrow(ApiError);
    expect(() => sendMessage(classId, teacher, null, "hi")).toThrow(ApiError);
    process.env.OPEN_ACCESS = "false";
    expect(classroomControlAvailable()).toBe(true);
  });
});

describe("classroom control", () => {
  const saved = process.env.OPEN_ACCESS;
  beforeEach(() => {
    process.env.OPEN_ACCESS = "false";
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.OPEN_ACCESS;
    else process.env.OPEN_ACCESS = saved;
  });

  let teacher: ReturnType<typeof makeUser>;
  let other: ReturnType<typeof makeUser>;
  let mariam: ReturnType<typeof makeUser>;
  let giorgi: ReturnType<typeof makeUser>;
  let outsider: ReturnType<typeof makeUser>;
  let classId: string;

  beforeEach(() => {
    freshDb();
    teacher = makeUser("teacher", "nino");
    other = makeUser("teacher", "davit");
    mariam = makeUser("student", "mariam");
    giorgi = makeUser("student", "giorgi");
    outsider = makeUser("student", "saba");
    classId = createClass(teacher, "9A", [mariam.id, giorgi.id]).id;
  });

  const student = (id: string) => classroomState(classId, teacher, T0 + 1000).students.find((s) => s.id === id)!;

  it("shows where each student is and whether they are working", () => {
    recordHeartbeat(mariam, beat(), T0);
    recordHeartbeat(giorgi, beat("g", "/library", true, 0, "Library"), T0);
    expect(student(mariam.id)).toMatchObject({ status: "active", path: "/labs/stem" });
    expect(student(giorgi.id)).toMatchObject({ status: "active", path: "/library", title: "Library" });
    // Connected but no keyboard, mouse or touch for longer than the idle limit, as the student's own browser reports it.
    recordHeartbeat(giorgi, beat("g", "/library", true, IDLE_MS + 60_000), T0 + 10_000);
    expect(classroomState(classId, teacher, T0 + 11_000).students.find((s) => s.id === giorgi.id)!.status).toBe("idle");
    recordHeartbeat(giorgi, beat("g", "/library", true, 5_000), T0 + 15_000);
    expect(classroomState(classId, teacher, T0 + 16_000).students.find((s) => s.id === giorgi.id)!.status).toBe("active");
    recordHeartbeat(giorgi, beat("g", "/library", false, 0), T0 + 20_000);
    expect(classroomState(classId, teacher, T0 + 21_000).students.find((s) => s.id === giorgi.id)!.status).toBe("away");
    const gone = classroomState(classId, teacher, T0 + OFFLINE_MS + 30_000).students.find((s) => s.id === mariam.id)!;
    expect(gone.status).toBe("offline");
  });

  it("counts a student who never connected as offline, without a page", () => {
    const s = classroomState(classId, teacher, T0).students.find((x) => x.id === giorgi.id)!;
    expect(s).toMatchObject({ status: "offline", path: null, lastSeen: null });
  });

  it("goes offline when the tab closes, and back when the page opens again", () => {
    recordHeartbeat(mariam, beat("t1"), T0);
    recordLeave(mariam, "other-tab", T0 + 1000);
    expect(student(mariam.id).status).toBe("active");
    recordLeave(mariam, "t1", T0 + 1000);
    expect(student(mariam.id).status).toBe("offline");
    recordHeartbeat(mariam, beat("t1", "/library"), T0 + 5000);
    expect(classroomState(classId, teacher, T0 + 6000).students.find((s) => s.id === mariam.id)!).toMatchObject({ status: "active", path: "/library" });
  });

  it("follows the tab the student is looking at, not a background one", () => {
    recordHeartbeat(mariam, beat("front", "/labs/stem"), T0);
    recordHeartbeat(mariam, beat("back", "/career", false), T0 + 2000);
    expect(student(mariam.id).path).toBe("/labs/stem");
    // The background tab does not receive commands, so two tabs never both act.
    sendToPage(classId, teacher, [mariam.id], "/library", T0 + 3000);
    expect(recordHeartbeat(mariam, beat("back", "/career", false), T0 + 4000)!.open).toBeNull();
    expect(recordHeartbeat(mariam, beat("front", "/labs/stem"), T0 + 5000)!.open).toMatchObject({ kind: "open", path: "/library" });
  });

  it("keeps a timeline of the pages opened, without splitting one visit", () => {
    recordHeartbeat(mariam, beat("t", "/labs/stem", true, 0, "STEM"), T0);
    recordHeartbeat(mariam, beat("t", "/labs/stem", true, 0, "STEM"), T0 + 6000);
    recordHeartbeat(mariam, beat("t", "/library", true, 0, "Library"), T0 + 60_000);
    recordHeartbeat(mariam, beat("t", "/library", true, 0, "Library"), T0 + 120_000);
    const { visits } = studentActivity(classId, teacher, mariam.id, T0 - 1000, T0 + 130_000);
    expect(visits.map((v) => v.path)).toEqual(["/library", "/labs/stem"]);
    expect(visits[1].endedAt - visits[1].startedAt).toBeGreaterThanOrEqual(6000);
  });

  it("raises a hand once, shows who asked first, and lets the teacher answer", () => {
    recordHeartbeat(mariam, beat(), T0);
    recordHeartbeat(giorgi, beat("g"), T0);
    raiseHand(giorgi, " I do not get question 3 ", T0 + 1000);
    raiseHand(mariam, "", T0 + 2000);
    raiseHand(giorgi, "again", T0 + 3000);
    const state = classroomState(classId, teacher, T0 + 4000);
    expect(state.counts.help).toBe(2);
    expect(state.students.map((s) => s.displayName)).toEqual(["giorgi", "mariam"]);
    expect(state.students[0].help).toMatchObject({ raisedAt: T0 + 1000, note: "again", ackAt: null });
    answerHelp(classId, teacher, giorgi.id, "ack", T0 + 5000);
    expect(recordHeartbeat(giorgi, beat("g"), T0 + 6000)!.help).toMatchObject({ ackAt: T0 + 5000 });
    answerHelp(classId, teacher, giorgi.id, "resolve", T0 + 7000);
    expect(student(giorgi.id).help).toBeNull();
    expect(() => raiseHand(teacher, "", T0)).toThrow(ApiError);
  });

  it("pauses screens for the class or chosen students, and a pause ends by itself", () => {
    recordHeartbeat(mariam, beat(), T0);
    recordHeartbeat(giorgi, beat("g"), T0);
    expect(setLocked(classId, teacher, [mariam.id], true, "Eyes up")).toBe(1);
    const now = Date.now();
    expect(recordHeartbeat(mariam, beat(), now)).toMatchObject({ locked: true, lockMessage: "Eyes up", lockedBy: "nino" });
    expect(recordHeartbeat(giorgi, beat("g"), now)!.locked).toBe(false);
    expect(setLocked(classId, teacher, null, true)).toBe(2);
    expect(recordHeartbeat(giorgi, beat("g"), now)!.locked).toBe(true);
    expect(recordHeartbeat(giorgi, beat("g"), now + LOCK_MAX_MS + 1000)!.locked).toBe(false);
    setLocked(classId, teacher, null, false);
    expect(recordHeartbeat(mariam, beat(), now)!.locked).toBe(false);
  });

  it("can pause a student who has not connected yet", () => {
    setLocked(classId, teacher, [giorgi.id], true);
    expect(recordHeartbeat(giorgi, beat("g"), Date.now())!.locked).toBe(true);
  });

  it("delivers a message once it is read, to the right students only", () => {
    recordHeartbeat(mariam, beat(), T0);
    sendMessage(classId, teacher, null, "  Finish question 4.  ", T0 + 1000);
    expect(student(mariam.id).unreadMessages).toBe(1);
    const shown = recordHeartbeat(mariam, beat(), T0 + 2000)!;
    expect(shown.messages).toMatchObject([{ text: "Finish question 4.", from: "nino" }]);
    // Still shown until the student closes it.
    expect(recordHeartbeat(mariam, beat(), T0 + 8000)!.messages).toHaveLength(1);
    markMessagesRead(mariam, shown.messages.map((m) => m.id), T0 + 9000);
    expect(recordHeartbeat(mariam, beat(), T0 + 10_000)!.messages).toHaveLength(0);
    const detail = studentActivity(classId, teacher, mariam.id, T0, T0 + 11_000);
    expect(detail.messages[0]).toMatchObject({ text: "Finish question 4.", deliveredAt: T0 + 2000, readAt: T0 + 9000 });
    // One student cannot read or close another's message.
    sendMessage(classId, teacher, [giorgi.id], "Just you", T0 + 12_000);
    expect(recordHeartbeat(mariam, beat(), T0 + 13_000)!.messages).toHaveLength(0);
    const gid = recordHeartbeat(giorgi, beat("g"), T0 + 13_000)!.messages[0].id;
    markMessagesRead(mariam, [gid], T0 + 14_000);
    // Giorgi still has both: the one for the class and the one for him alone.
    expect(recordHeartbeat(giorgi, beat("g"), T0 + 15_000)!.messages.map((m) => m.text)).toEqual(["Finish question 4.", "Just you"]);
    expect(() => sendMessage(classId, teacher, null, "   ")).toThrow(ApiError);
  });

  it("sends students to a page once, and only while the request is fresh", () => {
    recordHeartbeat(mariam, beat(), T0);
    sendToPage(classId, teacher, null, "/library", T0 + 1000);
    expect(recordHeartbeat(mariam, beat(), T0 + 2000)!.open).toMatchObject({ path: "/library" });
    expect(recordHeartbeat(mariam, beat(), T0 + 8000)!.open).toBeNull();
    // A student who was away and returns long after does not get dragged to an old page.
    sendToPage(classId, teacher, [mariam.id], "/career", T0 + 10_000);
    expect(recordHeartbeat(mariam, beat(), T0 + 10_000 + 6 * 60_000)!.open).toBeNull();
    // Newer replaces older.
    sendToPage(classId, teacher, [mariam.id], "/subjects", T0 + 500_000);
    sendToPage(classId, teacher, [mariam.id], "/labs/stem", T0 + 501_000);
    expect(recordHeartbeat(mariam, beat(), T0 + 502_000)!.open?.path).toBe("/labs/stem");
    expect(() => sendToPage(classId, teacher, null, "https://example.com")).toThrow(ApiError);
    expect(() => sendToPage(classId, teacher, null, "/api/auth/logout")).toThrow(ApiError);
  });

  it("keeps classes apart: only the class's own teacher controls it, and only its students", () => {
    expect(() => classroomState(classId, other)).toThrow(ApiError);
    expect(() => setLocked(classId, other, null, true)).toThrow(ApiError);
    expect(() => sendMessage(classId, other, null, "hi")).toThrow(ApiError);
    expect(() => studentActivity(classId, teacher, outsider.id, T0)).toThrow(ApiError);
    expect(() => sendMessage(classId, teacher, [outsider.id], "hi")).toThrow(ApiError);
    expect(() => answerHelp(classId, teacher, outsider.id, "resolve")).toThrow(ApiError);
    // A student's own pause never leaks to a student outside the class.
    expect(setLocked(classId, teacher, [mariam.id, outsider.id], true)).toBe(1);
    expect(recordHeartbeat(outsider, beat("o"), Date.now())!.locked).toBe(false);
    const admin = makeUser("admin", "admin");
    expect(classroomState(classId, admin).students).toHaveLength(2);
  });

  it("ignores heartbeats from teachers", () => {
    expect(recordHeartbeat(teacher, beat(), T0)).toBeNull();
  });
});
