import "server-only";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { isPlatformPath } from "@/lib/classroom/areas";
import { getClassForTeacher } from "./classes";

/*
 * Classroom control: the teacher sees, for each student of a class, which
 * page of the platform they have open and whether they are working, sees
 * raised hands, and can send the class (or one student) to a page, send a
 * message, or lock their screens to get everyone's attention.
 *
 * Students' browsers report in with a heartbeat every few seconds and get
 * back what the teacher sent them. Only the path of a platform page and its
 * title are recorded — never query strings, other websites or programs.
 */

/** No heartbeat for this long: the student is offline. */
export const OFFLINE_MS = 75_000;
/** No keyboard, mouse or touch for this long: idle. */
export const IDLE_MS = 2 * 60_000;
/** Another tab of the same student takes over the presence row after this long. */
const TAB_TAKEOVER_MS = 15_000;
/** "Open this page" is followed only while it is fresh. */
const OPEN_TTL_MS = 5 * 60_000;
/** Unread messages are shown for this long. */
const MESSAGE_TTL_MS = 12 * 60 * 60_000;
/** A paused screen ends by itself after this long, so a forgotten pause cannot stall a student for good. */
export const LOCK_MAX_MS = 45 * 60_000;
const VISIT_RETENTION_MS = 14 * 24 * 60 * 60_000;

export type StudentStatus = "active" | "idle" | "away" | "offline";

export interface HeartbeatInput {
  tabId: string;
  path: string;
  title: string;
  visible: boolean;
  idleMs: number;
}

export interface ScreenCommand {
  id: string;
  kind: "open" | "message";
  path: string | null;
  text: string;
  from: string;
  createdAt: number;
}

/** What a student's browser needs to show. */
export interface ScreenState {
  locked: boolean;
  lockMessage: string;
  lockedBy: string;
  open: ScreenCommand | null;
  messages: ScreenCommand[];
  help: { raisedAt: number; note: string; ackAt: number | null } | null;
}

interface PresenceRow {
  user_id: string;
  tab_id: string;
  path: string;
  title: string;
  page_since: number;
  last_seen: number;
  last_input: number;
  visible: number;
  left_at: number | null;
  help_at: number | null;
  help_note: string;
  help_ack_at: number | null;
  locked: number;
  locked_at: number | null;
  lock_message: string;
  locked_by: string | null;
}

/** The path of a platform page, without query string or fragment. */
export function cleanPath(path: string): string {
  const bare = path.split(/[?#]/)[0] ?? "";
  return isPlatformPath(bare) ? bare.slice(0, 300) : "/";
}

function presenceOf(userId: string): PresenceRow | null {
  return (getDb().prepare("SELECT * FROM student_presence WHERE user_id = ?").get(userId) as PresenceRow | undefined) ?? null;
}

function ensurePresence(userId: string): void {
  getDb()
    .prepare("INSERT INTO student_presence (user_id, tab_id, path, page_since, last_seen, last_input, visible) VALUES (?, '', '', 0, 0, 0, 0) ON CONFLICT(user_id) DO NOTHING")
    .run(userId);
}

export function statusOf(row: Pick<PresenceRow, "last_seen" | "last_input" | "visible" | "left_at"> | null, at = now()): StudentStatus {
  if (!row || row.left_at !== null || at - row.last_seen > OFFLINE_MS) return "offline";
  if (!row.visible) return "away";
  if (at - row.last_input > IDLE_MS) return "idle";
  return "active";
}

function closeVisit(userId: string, at: number): void {
  getDb()
    .prepare("UPDATE page_visits SET ended_at = ? WHERE id = (SELECT id FROM page_visits WHERE user_id = ? ORDER BY started_at DESC LIMIT 1) AND ended_at < ?")
    .run(at, userId, at);
}

function isLocked(row: Pick<PresenceRow, "locked" | "locked_at"> | null | undefined, at: number): boolean {
  return row?.locked === 1 && row.locked_at !== null && at - row.locked_at < LOCK_MAX_MS;
}

function teacherName(id: string | null): string {
  if (!id) return "";
  return (getDb().prepare("SELECT display_name FROM users WHERE id = ?").get(id) as { display_name: string } | undefined)?.display_name ?? "";
}

function screenState(userId: string, row: PresenceRow | null, owner: boolean, at: number): ScreenState {
  const db = getDb();
  let open: ScreenCommand | null = null;
  let messages: ScreenCommand[] = [];
  // Only the tab the student is looking at follows commands, so two open tabs do not both act.
  if (owner) {
    const rows = db
      .prepare(
        `SELECT c.id, c.kind, c.path, c.text, c.created_at, c.delivered_at, u.display_name AS sender FROM classroom_commands c
           LEFT JOIN users u ON u.id = c.teacher_id
          WHERE c.student_id = ? AND ((c.kind = 'open' AND c.delivered_at IS NULL) OR (c.kind = 'message' AND c.read_at IS NULL AND c.created_at > ?))
          ORDER BY c.created_at`,
      )
      .all(userId, at - MESSAGE_TTL_MS) as { id: string; kind: "open" | "message"; path: string | null; text: string; created_at: number; delivered_at: number | null; sender: string | null }[];
    const toCommand = (r: (typeof rows)[number]): ScreenCommand => ({ id: r.id, kind: r.kind, path: r.path, text: r.text, from: r.sender ?? "", createdAt: r.created_at });
    const opens = rows.filter((r) => r.kind === "open");
    const latest = opens.at(-1);
    if (latest && at - latest.created_at <= OPEN_TTL_MS) open = toCommand(latest);
    messages = rows.filter((r) => r.kind === "message").map(toCommand);
    const delivered = rows.filter((r) => r.delivered_at === null).map((r) => r.id);
    if (delivered.length) {
      const mark = db.prepare("UPDATE classroom_commands SET delivered_at = ? WHERE id = ?");
      db.transaction(() => delivered.forEach((id) => mark.run(at, id)))();
    }
  }
  return {
    locked: isLocked(row, at),
    lockMessage: row?.lock_message ?? "",
    lockedBy: row && isLocked(row, at) ? teacherName(row.locked_by) : "",
    open,
    messages,
    help: row?.help_at ? { raisedAt: row.help_at, note: row.help_note, ackAt: row.help_ack_at } : null,
  };
}

/**
 * A student's browser reports which page is open. The tab the student is
 * looking at owns the presence row; a hidden tab only takes over when the
 * visible one has gone quiet.
 */
export function recordHeartbeat(user: CurrentUser, input: HeartbeatInput, at = now()): ScreenState | null {
  if (user.role !== "student") return null;
  const db = getDb();
  const path = cleanPath(input.path);
  const title = input.title.replace(/\s+/g, " ").trim().slice(0, 160);
  const lastInput = at - Math.max(0, Math.min(input.idleMs, 24 * 60 * 60_000));
  const existing = presenceOf(user.id);
  const owner =
    !existing ||
    existing.tab_id === input.tabId ||
    input.visible ||
    !existing.visible ||
    existing.left_at !== null ||
    at - existing.last_seen > TAB_TAKEOVER_MS;

  if (owner) {
    db.transaction(() => {
      const samePage = existing && existing.left_at === null && existing.path === path && at - existing.last_seen <= OFFLINE_MS;
      if (samePage) {
        db.prepare("UPDATE page_visits SET ended_at = ?, title = CASE WHEN ? <> '' THEN ? ELSE title END WHERE id = (SELECT id FROM page_visits WHERE user_id = ? ORDER BY started_at DESC LIMIT 1)").run(at, title, title, user.id);
      } else {
        closeVisit(user.id, existing?.last_seen && existing.left_at === null ? Math.min(at, existing.last_seen) : at);
        db.prepare("INSERT INTO page_visits (id, user_id, path, title, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?)").run(newId(), user.id, path, title, at, at);
        db.prepare("DELETE FROM page_visits WHERE user_id = ? AND started_at < ?").run(user.id, at - VISIT_RETENTION_MS);
      }
      db.prepare(
        `INSERT INTO student_presence (user_id, tab_id, path, title, page_since, last_seen, last_input, visible, left_at)
         VALUES (@user, @tab, @path, @title, @at, @at, @input, @visible, NULL)
         ON CONFLICT(user_id) DO UPDATE SET tab_id = @tab, path = @path, title = @title,
           page_since = CASE WHEN @same = 1 THEN page_since ELSE @at END,
           last_seen = @at, last_input = @input, visible = @visible, left_at = NULL`,
      ).run({ user: user.id, tab: input.tabId.slice(0, 40), path, title, at, input: lastInput, visible: input.visible ? 1 : 0, same: samePage ? 1 : 0 });
    })();
  }
  return screenState(user.id, presenceOf(user.id), owner, at);
}

/** The tab closed or the student signed out. */
export function recordLeave(user: CurrentUser, tabId: string, at = now()): void {
  if (user.role !== "student") return;
  const row = presenceOf(user.id);
  if (!row || row.tab_id !== tabId || row.left_at !== null) return;
  getDb().transaction(() => {
    closeVisit(user.id, at);
    getDb().prepare("UPDATE student_presence SET left_at = ?, visible = 0 WHERE user_id = ?").run(at, user.id);
  })();
}

export function raiseHand(user: CurrentUser, note: string, at = now()): void {
  if (user.role !== "student") throw new ApiError(403, "forbidden");
  ensurePresence(user.id);
  getDb()
    .prepare("UPDATE student_presence SET help_at = COALESCE(help_at, ?), help_note = ?, help_ack_at = CASE WHEN help_at IS NULL THEN NULL ELSE help_ack_at END WHERE user_id = ?")
    .run(at, note.trim().slice(0, 200), user.id);
}

export function lowerHand(user: CurrentUser): void {
  getDb().prepare("UPDATE student_presence SET help_at = NULL, help_note = '', help_ack_at = NULL WHERE user_id = ?").run(user.id);
}

export function markMessagesRead(user: CurrentUser, ids: string[], at = now()): void {
  const mark = getDb().prepare("UPDATE classroom_commands SET read_at = ?, delivered_at = COALESCE(delivered_at, ?) WHERE id = ? AND student_id = ? AND kind = 'message' AND read_at IS NULL");
  getDb().transaction(() => ids.slice(0, 50).forEach((id) => mark.run(at, at, id, user.id)))();
}

/* ------------------------------- teacher side ------------------------------- */

export interface ClassroomStudent {
  id: string;
  displayName: string;
  username: string;
  status: StudentStatus;
  path: string | null;
  title: string;
  pageSince: number | null;
  lastSeen: number | null;
  idleSince: number | null;
  help: { raisedAt: number; note: string; ackAt: number | null } | null;
  locked: boolean;
  unreadMessages: number;
}

export interface ClassroomState {
  class: { id: string; name: string };
  at: number;
  students: ClassroomStudent[];
  counts: Record<StudentStatus, number> & { help: number; locked: number; total: number };
}

const STATUS_ORDER: Record<StudentStatus, number> = { active: 0, idle: 1, away: 2, offline: 3 };

export function classroomState(classId: string, teacher: CurrentUser, at = now()): ClassroomState {
  const cls = getClassForTeacher(classId, teacher);
  const db = getDb();
  const presence = db.prepare("SELECT * FROM student_presence WHERE user_id = ?");
  const unread = db.prepare("SELECT COUNT(*) AS n FROM classroom_commands WHERE student_id = ? AND kind = 'message' AND read_at IS NULL AND created_at > ?");
  const students = cls.members.map((m): ClassroomStudent => {
    const row = presence.get(m.id) as PresenceRow | undefined;
    const status = statusOf(row?.last_seen ? row : null, at);
    return {
      id: m.id,
      displayName: m.displayName,
      username: m.username,
      status,
      path: row?.path || null,
      title: row?.title ?? "",
      pageSince: row?.page_since || null,
      lastSeen: row?.last_seen || null,
      idleSince: status === "idle" ? row!.last_input : null,
      help: row?.help_at ? { raisedAt: row.help_at, note: row.help_note, ackAt: row.help_ack_at } : null,
      locked: isLocked(row, at),
      unreadMessages: (unread.get(m.id, at - MESSAGE_TTL_MS) as { n: number }).n,
    };
  });
  // Raised hands first (oldest first), then by status, then by name.
  students.sort((a, b) => {
    if (a.help && b.help) return a.help.raisedAt - b.help.raisedAt;
    if (a.help || b.help) return a.help ? -1 : 1;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.displayName.localeCompare(b.displayName);
  });
  const counts = { active: 0, idle: 0, away: 0, offline: 0, help: 0, locked: 0, total: students.length };
  for (const s of students) {
    counts[s.status] += 1;
    if (s.help) counts.help += 1;
    if (s.locked) counts.locked += 1;
  }
  return { class: { id: cls.id, name: cls.name }, at, students, counts };
}

/** The students of the class a command is for: all of them, or the chosen ones (members only). */
function recipients(classId: string, teacher: CurrentUser, studentIds: string[] | null): string[] {
  const members = getClassForTeacher(classId, teacher).members.map((m) => m.id);
  if (!studentIds) return members;
  const chosen = studentIds.filter((id) => members.includes(id));
  if (!chosen.length) throw new ApiError(400, "invalid_input", "None of these students is in the class.");
  return chosen;
}

export function setLocked(classId: string, teacher: CurrentUser, studentIds: string[] | null, locked: boolean, message = ""): number {
  const ids = recipients(classId, teacher, studentIds);
  const db = getDb();
  const at = now();
  const update = db.prepare("UPDATE student_presence SET locked = ?, locked_at = ?, lock_message = ?, locked_by = ? WHERE user_id = ?");
  db.transaction(() => {
    for (const id of ids) {
      ensurePresence(id);
      update.run(locked ? 1 : 0, locked ? at : null, locked ? message.trim().slice(0, 200) : "", locked ? teacher.id : null, id);
    }
  })();
  return ids.length;
}

function insertCommands(classId: string, teacher: CurrentUser, ids: string[], kind: "open" | "message", path: string | null, text: string, at: number): number {
  const db = getDb();
  const insert = db.prepare("INSERT INTO classroom_commands (id, student_id, teacher_id, class_id, kind, path, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  db.transaction(() => {
    // A newer "open" replaces any the student has not followed yet.
    if (kind === "open") {
      const supersede = db.prepare("UPDATE classroom_commands SET delivered_at = ? WHERE student_id = ? AND kind = 'open' AND delivered_at IS NULL");
      ids.forEach((id) => supersede.run(at, id));
    }
    ids.forEach((id) => insert.run(newId(), id, teacher.id, classId, kind, path, text, at));
  })();
  return ids.length;
}

export function sendToPage(classId: string, teacher: CurrentUser, studentIds: string[] | null, path: string, at = now()): number {
  const target = path.trim();
  if (!isPlatformPath(target)) throw new ApiError(400, "invalid_input", "Only pages of this platform can be opened.");
  return insertCommands(classId, teacher, recipients(classId, teacher, studentIds), "open", target, "", at);
}

export function sendMessage(classId: string, teacher: CurrentUser, studentIds: string[] | null, text: string, at = now()): number {
  const clean = text.trim().slice(0, 500);
  if (!clean) throw new ApiError(400, "invalid_input");
  return insertCommands(classId, teacher, recipients(classId, teacher, studentIds), "message", null, clean, at);
}

/** The teacher saw the raised hand ("I'm coming") or dealt with it. */
export function answerHelp(classId: string, teacher: CurrentUser, studentId: string, action: "ack" | "resolve", at = now()): void {
  recipients(classId, teacher, [studentId]);
  const db = getDb();
  if (action === "ack") db.prepare("UPDATE student_presence SET help_ack_at = ? WHERE user_id = ? AND help_at IS NOT NULL").run(at, studentId);
  else db.prepare("UPDATE student_presence SET help_at = NULL, help_note = '', help_ack_at = NULL WHERE user_id = ?").run(studentId);
}

export interface StudentActivity {
  student: ClassroomStudent;
  visits: { path: string; title: string; startedAt: number; endedAt: number }[];
  work: { kind: string; subject: string; topic: string; correct: boolean | null; at: number }[];
  messages: { text: string; at: number; deliveredAt: number | null; readAt: number | null }[];
}

/** One student in detail: today's pages, recent work and the messages sent to them. */
export function studentActivity(classId: string, teacher: CurrentUser, studentId: string, since: number, at = now()): StudentActivity {
  const state = classroomState(classId, teacher, at);
  const student = state.students.find((s) => s.id === studentId);
  if (!student) throw new ApiError(404, "not_found");
  const db = getDb();
  const visits = (
    db
      .prepare("SELECT path, title, started_at, ended_at FROM page_visits WHERE user_id = ? AND ended_at >= ? ORDER BY started_at DESC LIMIT 60")
      .all(studentId, since) as { path: string; title: string; started_at: number; ended_at: number }[]
  ).map((v) => ({ path: v.path, title: v.title, startedAt: v.started_at, endedAt: v.ended_at }));
  const work = (
    db
      .prepare("SELECT kind, subject, topic, correct, created_at FROM learning_events WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 30")
      .all(studentId, since) as { kind: string; subject: string; topic: string; correct: number | null; created_at: number }[]
  ).map((w) => ({ kind: w.kind, subject: w.subject, topic: w.topic, correct: w.correct === null ? null : w.correct === 1, at: w.created_at }));
  const messages = (
    db
      .prepare("SELECT text, created_at, delivered_at, read_at FROM classroom_commands WHERE student_id = ? AND kind = 'message' AND created_at >= ? ORDER BY created_at DESC LIMIT 20")
      .all(studentId, since) as { text: string; created_at: number; delivered_at: number | null; read_at: number | null }[]
  ).map((m) => ({ text: m.text, at: m.created_at, deliveredAt: m.delivered_at, readAt: m.read_at }));
  return { student, visits, work, messages };
}
