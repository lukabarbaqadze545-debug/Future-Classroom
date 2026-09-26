import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { createLesson, getLesson, lessonsForSessions, setLessonStatus, updateLesson } from "@/lib/services/lessons";
import { getLessonForStaff, recordReview, reviewHistory, reviewQueue } from "@/lib/services/lesson-review";
import {
  controlSession,
  createSessionFromLesson,
  getStudentSessionView,
  getTeacherSessionView,
  joinSession,
  listActiveSessionsForStudent,
  submitResponse,
} from "@/lib/services/sessions";
import { addClassMembers, canViewStudent, classProgress, createClass, removeClassMember } from "@/lib/services/classes";
import { changeOwnPassword, createStudentAccounts, romanize, setTemporaryPassword, suggestUsername, temporaryPassword } from "@/lib/services/accounts";
import { authenticate } from "@/lib/services/users";
import { subscribeToSession, type SessionEvent } from "@/lib/realtime/bus";
import { getDb } from "@/lib/db";
import { quadraticEn } from "@/lib/ai/templates/quadratic-en";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

function lessonFor(teacher: CurrentUser) {
  return createLesson({
    teacherId: teacher.id,
    meta: { title: quadraticEn.title, subject: "mathematics", grade: 11, topic: quadraticEn.topic, durationMin: 45, objective: "", difficulty: "standard", language: "en" },
    content: quadraticEn.content,
    origin: "template",
  });
}

function expectApiError(fn: () => unknown, status: number) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    return;
  }
  throw new Error(`expected ApiError ${status}`);
}

describe("class-linked classroom sessions", () => {
  let nino: CurrentUser;
  let davit: CurrentUser;
  let mariam: CurrentUser;
  let giorgi: CurrentUser;
  beforeEach(() => {
    freshDb();
    nino = makeUser("teacher", "nino");
    davit = makeUser("teacher", "davit");
    mariam = makeUser("student", "mariam", "Mariam");
    giorgi = makeUser("student", "giorgi", "Giorgi");
  });

  it("starts a lesson for a class, shows who has not joined and each student's status", () => {
    const cls = createClass(nino, "11A", [mariam.id, giorgi.id]);
    const session = createSessionFromLesson({ user: nino, lessonId: lessonFor(nino).id, classId: cls.id });
    expect(session.classId).toBe(cls.id);
    expect(session.classLabel).toBe("11A");

    // Students of the class see the lesson on their home page before joining.
    expect(listActiveSessionsForStudent(mariam.id)).toEqual([expect.objectContaining({ id: session.id, joined: false })]);
    const joined = joinSession({ code: session.joinCode, displayName: "", user: mariam });
    expect(listActiveSessionsForStudent(mariam.id)[0].joined).toBe(true);

    let view = getTeacherSessionView(session.id, nino);
    expect(view.absent.map((a) => a.name)).toEqual(["Giorgi"]);
    expect(view.participants[0].current).toBeNull();

    controlSession(session.id, nino, { type: "next" });
    view = getTeacherSessionView(session.id, nino);
    expect(view.participants[0].current).toBe("waiting");
    const activity = view.current!.activity;
    submitResponse({ sessionId: session.id, participant: joined.participant, activityId: view.current!.id, answer: { optionIds: activity.correctOptionIds, text: "" } });
    expect(getTeacherSessionView(session.id, nino).participants[0].current).toBe("correct");
  });

  it("lets a teacher run any published lesson but not someone else's draft or class", () => {
    const draft = lessonFor(davit);
    expectApiError(() => createSessionFromLesson({ user: nino, lessonId: draft.id }), 404);
    setLessonStatus(draft.id, davit, "published");
    expect(createSessionFromLesson({ user: nino, lessonId: draft.id }).teacherId).toBe(nino.id);
    const davitsClass = createClass(davit, "10B");
    expectApiError(() => createSessionFromLesson({ user: nino, lessonId: draft.id, classId: davitsClass.id }), 403);
    // The lesson picker offers own lessons and published ones.
    expect(lessonsForSessions(nino, "en").map((l) => l.id)).toContain(draft.id);
  });

  it("removes a participant and their answers; only the session's teacher can", () => {
    const session = createSessionFromLesson({ user: nino, lessonId: lessonFor(nino).id });
    const other = createSessionFromLesson({ user: nino, lessonId: lessonFor(nino).id });
    const prank = joinSession({ code: session.joinCode, displayName: "Prank", user: null });
    controlSession(session.id, nino, { type: "next" });
    const current = getStudentSessionView(session.id, prank.participant).current!;
    submitResponse({ sessionId: session.id, participant: prank.participant, activityId: current.id, answer: { optionIds: [current.options[0].id], text: "" } });

    expectApiError(() => controlSession(session.id, davit, { type: "remove", participantId: prank.participant.id }), 403);
    expectApiError(() => controlSession(other.id, nino, { type: "remove", participantId: prank.participant.id }), 404);
    controlSession(session.id, nino, { type: "remove", participantId: prank.participant.id });
    const view = getTeacherSessionView(session.id, nino);
    expect(view.participants).toHaveLength(0);
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM responses WHERE participant_id = ?").get(prank.participant.id)).toEqual({ n: 0 });
  });

  it("counts a retried answer once and tells students only what changes their screen", () => {
    const session = createSessionFromLesson({ user: nino, lessonId: lessonFor(nino).id });
    const a = joinSession({ code: session.joinCode, displayName: "Ana", user: null });
    controlSession(session.id, nino, { type: "next" });
    const current = getStudentSessionView(session.id, a.participant).current!;
    const events: SessionEvent[] = [];
    const stop = subscribeToSession(session.id, (e) => events.push(e));

    const answer = { optionIds: [current.options[0].id], text: "" };
    const first = submitResponse({ sessionId: session.id, participant: a.participant, activityId: current.id, answer, submissionId: "retry-0001" });
    const again = submitResponse({ sessionId: session.id, participant: a.participant, activityId: current.id, answer, submissionId: "retry-0001" });
    expect(again).toEqual(first);
    expect(first.attempts).toBe(1);
    // Results hidden: only the teacher's screens need to update.
    expect(events.map((e) => e.audience)).toEqual(["staff"]);

    controlSession(session.id, nino, { type: "reveal", revealed: true });
    submitResponse({ sessionId: session.id, participant: a.participant, activityId: current.id, answer, submissionId: "retry-0002" });
    expect(events.map((e) => e.audience)).toEqual(["staff", "all", "all"]);
    stop();
  });
});

describe("class roster and accounts", () => {
  let nino: CurrentUser;
  beforeEach(() => {
    freshDb();
    nino = makeUser("teacher", "nino");
  });

  it("romanises Georgian names into unique usernames", () => {
    expect(romanize("მარიამ ლომიძე")).toBe("mariam lomidze");
    const taken = new Set(["mariam.l"]);
    expect(suggestUsername("მარიამ ლომიძე", (u) => taken.has(u))).toBe("mariam.l2");
    expect(suggestUsername("ჭაბუკი", () => false)).toBe("chabuki");
    expect(temporaryPassword()).toMatch(/^[a-hj-km-np-z2-9]{8}$/);
  });

  it("creates student accounts with temporary passwords that work and must be changed", () => {
    const [account, second] = createStudentAccounts(["მარიამ ლომიძე", "მარიამ ლაშხი"]);
    expect(account.username).toBe("mariam.l");
    expect(second.username).toBe("mariam.l2");
    const user = authenticate(account.username, account.password)!;
    expect(user.displayName).toBe("მარიამ ლომიძე");
    expect((getDb().prepare("SELECT must_change_password AS m FROM users WHERE id = ?").get(user.id) as { m: number }).m).toBe(1);

    changeOwnPassword({ ...user }, account.password, "my-own-password");
    expect(authenticate(account.username, "my-own-password")).not.toBeNull();
    expect(() => changeOwnPassword({ ...user }, "wrong", "another-password")).toThrow(ApiError);

    // A teacher reset signs the student out everywhere.
    getDb().prepare("INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES ('t', ?, ?, 0)").run(user.id, Date.now() + 1e6);
    const fresh = setTemporaryPassword(user.id);
    expect(authenticate(account.username, fresh)).not.toBeNull();
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM auth_sessions WHERE user_id = ?").get(user.id)).toEqual({ n: 0 });
  });

  it("adds and removes members and limits profiles to the student's own teachers", () => {
    const davit = makeUser("teacher", "davit");
    const admin = makeUser("admin", "admin");
    const [s1, s2] = createStudentAccounts(["Ana", "Luka"]);
    const cls = createClass(nino, "11A");
    expect(addClassMembers(cls.id, nino, [s1.id, s2.id]).members).toHaveLength(2);
    expect(removeClassMember(cls.id, nino, s2.id).members.map((m) => m.id)).toEqual([s1.id]);
    expectApiError(() => addClassMembers(cls.id, davit, [s2.id]), 403);

    expect(canViewStudent(nino, s1.id)).toBe(true);
    expect(canViewStudent(nino, s2.id)).toBe(false);
    expect(canViewStudent(davit, s1.id)).toBe(false);
    expect(canViewStudent(admin, s2.id)).toBe(true);
    const student = { id: s1.id, role: "student" as const, username: s1.username, displayName: s1.displayName };
    expect(canViewStudent(student, s1.id)).toBe(true);
    expect(canViewStudent(student, s2.id)).toBe(false);
  });

  it("summarises a class from stored records", () => {
    const mariam = makeUser("student", "mariam", "Mariam");
    const cls = createClass(nino, "11A", [mariam.id]);
    const session = createSessionFromLesson({ user: nino, lessonId: lessonFor(nino).id, classId: cls.id });
    const joined = joinSession({ code: session.joinCode, displayName: "", user: mariam });
    controlSession(session.id, nino, { type: "next" });
    const view = getTeacherSessionView(session.id, nino);
    submitResponse({ sessionId: session.id, participant: joined.participant, activityId: view.current!.id, answer: { optionIds: view.current!.activity.correctOptionIds, text: "" } });
    const progress = classProgress(cls.id, nino);
    expect(progress.sessions).toHaveLength(1);
    expect(progress.students[0]).toMatchObject({ sessionsAttended: 1, sessionAnswers: 1, sessionGraded: 1, sessionCorrect: 1 });
  });
});

describe("content review workflow", () => {
  let nino: CurrentUser;
  let davit: CurrentUser;
  beforeEach(() => {
    freshDb();
    nino = makeUser("teacher", "nino");
    davit = makeUser("teacher", "davit");
  });

  function georgianLesson() {
    const lesson = lessonFor(nino);
    const { title, subject, grade, topic, durationMin, objective, difficulty } = lesson;
    return updateLesson(lesson.id, nino, { meta: { title, subject, grade, topic, durationMin, objective, difficulty, language: "ka" }, content: lesson.content });
  }

  it("moves one step at a time; the language step applies to Georgian lessons only", () => {
    const ka = georgianLesson();
    expectApiError(() => recordReview(ka.id, nino, { status: "subject", note: "" }), 409);
    for (const status of ["technical", "language", "subject", "ready"] as const) {
      expect(recordReview(ka.id, nino, { status, note: "" }).reviewStatus).toBe(status);
    }
    expectApiError(() => recordReview(ka.id, nino, { status: "ready", note: "" }), 409);

    const en = lessonFor(nino);
    recordReview(en.id, nino, { status: "technical", note: "" });
    expectApiError(() => recordReview(en.id, nino, { status: "language", note: "" }), 409);
    expect(recordReview(en.id, nino, { status: "subject", note: "" }).reviewStatus).toBe("subject");
  });

  it("sends a lesson back with a note, and back to draft when reviewed content changes", () => {
    const lesson = georgianLesson();
    recordReview(lesson.id, nino, { status: "technical", note: "" });
    expectApiError(() => recordReview(lesson.id, nino, { status: "draft", note: "  " }), 400);

    // Saving without changes keeps the review.
    const same = getLesson(lesson.id)!;
    const meta = { title: same.title, subject: same.subject, grade: same.grade, topic: same.topic, durationMin: same.durationMin, objective: same.objective, difficulty: same.difficulty, language: same.language };
    expect(updateLesson(lesson.id, nino, { meta, content: same.content }).reviewStatus).toBe("technical");

    // Changing what students see does not.
    const changed = { ...same.content, activities: same.content.activities.map((a, i) => (i === 0 ? { ...a, prompt: `${a.prompt}?` } : a)) };
    expect(updateLesson(lesson.id, nino, { meta, content: changed }).reviewStatus).toBe("draft");
    expect(reviewHistory(lesson.id).map((h) => [h.kind, h.status])).toEqual([
      ["edited", "draft"],
      ["review", "technical"],
    ]);

    recordReview(lesson.id, nino, { status: "technical", note: "" });
    expect(recordReview(lesson.id, nino, { status: "draft", note: "Activity 3: unit" }).reviewStatus).toBe("draft");
    expect(reviewHistory(lesson.id)[0]).toMatchObject({ kind: "review", status: "draft", note: "Activity 3: unit" });
  });

  it("is staff-only and limited to lessons the teacher may read", () => {
    const student = makeUser("student", "mariam");
    const draft = lessonFor(davit);
    expectApiError(() => getLessonForStaff(draft.id, student), 403);
    expectApiError(() => getLessonForStaff(draft.id, nino), 404);
    expectApiError(() => recordReview(draft.id, nino, { status: "technical", note: "" }), 404);
    expectApiError(() => reviewQueue(student), 403);

    setLessonStatus(draft.id, davit, "published");
    expect(recordReview(draft.id, nino, { status: "technical", note: "" }).reviewStatus).toBe("technical");
    const { items, counts } = reviewQueue(nino);
    expect(items.find((i) => i.id === draft.id)).toMatchObject({ status: "technical", mine: false });
    expect(counts.technical).toBe(1);
  });
});
