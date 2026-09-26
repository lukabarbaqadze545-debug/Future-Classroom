import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { hashToken, newId, newJoinCode, newToken, normalizeJoinCode } from "@/lib/domain/ids";
import { activitySchema, answerSchema, type Activity, type Answer } from "@/lib/domain/schemas";
import { describeAnswer, gradeActivity, isActivityGradable, isAnswerEmpty, normalizeText } from "@/lib/domain/grading";
import { OPTION_ACTIVITY_TYPES, type Subject } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import { publishSessionUpdate } from "@/lib/realtime/bus";
import type { CurrentUser } from "@/lib/auth/session";
import { getLessonForEditor, getPublishedLesson, type LessonRecord } from "./lessons";
import { recordLearningEvent } from "./progress";
import { getHint, hintLadderInfo, isSolutionLevel, type HintResult } from "@/lib/ai/hint-service";

export type SessionStatus = "lobby" | "live" | "ended";
export type ActivityState = "pending" | "open" | "closed";

export interface SessionRecord {
  id: string;
  teacherId: string;
  lessonId: string | null;
  classId: string | null;
  joinCode: string;
  title: string;
  subject: Subject;
  grade: number;
  classLabel: string;
  status: SessionStatus;
  paused: boolean;
  currentActivityId: string | null;
  version: number;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
}

export interface SessionActivityRecord {
  id: string;
  position: number;
  activity: Activity;
  state: ActivityState;
  revealed: boolean;
  launchedAt: number | null;
  closedAt: number | null;
  timerEndsAt: number | null;
}

export interface ParticipantRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  displayName: string;
  joinedAt: number;
  lastSeenAt: number;
}

interface SessionRow {
  id: string;
  teacher_id: string;
  lesson_id: string | null;
  class_id: string | null;
  join_code: string;
  title: string;
  subject: Subject;
  grade: number;
  class_label: string;
  status: SessionStatus;
  paused: number;
  current_activity_id: string | null;
  version: number;
  created_at: number;
  started_at: number | null;
  ended_at: number | null;
}

interface ActivityRow {
  id: string;
  session_id: string;
  position: number;
  data: string;
  state: ActivityState;
  revealed: number;
  launched_at: number | null;
  closed_at: number | null;
  timer_ends_at: number | null;
}

interface ResponseRow {
  id: string;
  session_activity_id: string;
  participant_id: string;
  answer: string;
  is_correct: number | null;
  attempts: number;
  hints_used: number;
  submitted_at: number;
}

const ONLINE_WINDOW_MS = 45_000;

function toSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    lessonId: row.lesson_id,
    classId: row.class_id,
    joinCode: row.join_code,
    title: row.title,
    subject: row.subject,
    grade: row.grade,
    classLabel: row.class_label,
    status: row.status,
    paused: row.paused === 1,
    currentActivityId: row.current_activity_id,
    version: row.version,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function toActivity(row: ActivityRow): SessionActivityRecord {
  return {
    id: row.id,
    position: row.position,
    activity: activitySchema.parse(parseJson(row.data, {})),
    state: row.state,
    revealed: row.revealed === 1,
    launchedAt: row.launched_at,
    closedAt: row.closed_at,
    timerEndsAt: row.timer_ends_at,
  };
}

function toParticipant(row: {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  joined_at: number;
  last_seen_at: number;
}): ParticipantRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    displayName: row.display_name,
    joinedAt: row.joined_at,
    lastSeenAt: row.last_seen_at,
  };
}

function toAnswer(raw: string): Answer {
  const parsed = answerSchema.safeParse(parseJson(raw, {}));
  return parsed.success ? parsed.data : { optionIds: [], text: "" };
}

export function getSession(id: string): SessionRecord | null {
  const row = getDb().prepare("SELECT * FROM classroom_sessions WHERE id = ?").get(id) as SessionRow | undefined;
  return row ? toSession(row) : null;
}

function getSessionOrThrow(id: string): SessionRecord {
  const session = getSession(id);
  if (!session) throw new ApiError(404, "session_not_found");
  return session;
}

export function getSessionForTeacher(id: string, user: CurrentUser): SessionRecord {
  const session = getSessionOrThrow(id);
  if (session.teacherId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return session;
}

export function listActivities(sessionId: string): SessionActivityRecord[] {
  return (
    getDb().prepare("SELECT * FROM session_activities WHERE session_id = ? ORDER BY position").all(sessionId) as ActivityRow[]
  ).map(toActivity);
}

function getActivityRow(sessionId: string, activityId: string): SessionActivityRecord {
  const row = getDb()
    .prepare("SELECT * FROM session_activities WHERE id = ? AND session_id = ?")
    .get(activityId, sessionId) as ActivityRow | undefined;
  if (!row) throw new ApiError(404, "not_found");
  return toActivity(row);
}

export function listParticipants(sessionId: string): ParticipantRecord[] {
  return (
    getDb().prepare("SELECT * FROM session_participants WHERE session_id = ? ORDER BY joined_at").all(sessionId) as Parameters<
      typeof toParticipant
    >[0][]
  ).map(toParticipant);
}

/** Bumps the session version and notifies connected clients (see SessionEvent.audience). */
function touch(sessionId: string, audience: "all" | "staff" = "all"): number {
  const db = getDb();
  db.prepare("UPDATE classroom_sessions SET version = version + 1 WHERE id = ?").run(sessionId);
  const { version } = db.prepare("SELECT version FROM classroom_sessions WHERE id = ?").get(sessionId) as { version: number };
  publishSessionUpdate({ sessionId, version, audience });
  return version;
}

// ---------------------------------------------------------------------------
// Teacher: create and run a session
// ---------------------------------------------------------------------------

/**
 * The lesson a teacher may run: their own (any status) or any published lesson,
 * including the built-in ones. A session copies the activities, so running
 * someone else's lesson never changes it.
 */
export function lessonForSession(lessonId: string, user: CurrentUser): LessonRecord {
  try {
    return getLessonForEditor(lessonId, user);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) throw error;
    return getPublishedLesson(lessonId);
  }
}

/** The teacher's class for a session (null when none was chosen). */
function classForSession(classId: string | null | undefined, user: CurrentUser): { id: string; name: string } | null {
  if (!classId) return null;
  const row = getDb().prepare("SELECT id, name, teacher_id FROM classes WHERE id = ?").get(classId) as { id: string; name: string; teacher_id: string } | undefined;
  if (!row) throw new ApiError(404, "not_found");
  if (row.teacher_id !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return { id: row.id, name: row.name };
}

export function createSessionFromLesson(input: {
  user: CurrentUser;
  lessonId: string;
  classLabel?: string;
  classId?: string | null;
  activityIds?: string[];
}): SessionRecord {
  const lesson = lessonForSession(input.lessonId, input.user);
  const cls = classForSession(input.classId, input.user);
  const selected = input.activityIds?.length
    ? lesson.content.activities.filter((a) => input.activityIds!.includes(a.id))
    : lesson.content.activities;
  if (selected.length === 0) throw new ApiError(400, "invalid_input", "This lesson has no activities yet.");
  return createSession({
    teacherId: input.user.id,
    lessonId: lesson.id,
    title: lesson.title,
    subject: lesson.subject,
    grade: lesson.grade,
    classLabel: cls?.name ?? input.classLabel ?? "",
    classId: cls?.id ?? null,
    activities: selected,
  });
}

export function createSession(input: {
  teacherId: string;
  lessonId: string | null;
  title: string;
  subject: Subject;
  grade: number;
  classLabel: string;
  classId?: string | null;
  activities: Activity[];
  id?: string;
  createdAt?: number;
}): SessionRecord {
  const db = getDb();
  const id = input.id ?? newId();
  const timestamp = input.createdAt ?? now();
  const insertSession = db.prepare(
    `INSERT INTO classroom_sessions (id, teacher_id, lesson_id, class_id, join_code, title, subject, grade, class_label, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'lobby', ?)`,
  );
  const insertActivity = db.prepare(
    `INSERT INTO session_activities (id, session_id, position, data, state) VALUES (?, ?, ?, ?, 'pending')`,
  );
  db.transaction(() => {
    let inserted = false;
    for (let attempt = 0; attempt < 50 && !inserted; attempt++) {
      try {
        insertSession.run(id, input.teacherId, input.lessonId, input.classId ?? null, newJoinCode(), input.title, input.subject, input.grade, input.classLabel.trim(), timestamp);
        inserted = true;
      } catch (error) {
        if (!(error instanceof Error) || !/UNIQUE/.test(error.message)) throw error;
      }
    }
    if (!inserted) throw new ApiError(503, "conflict", "No free join code available. End an old session and try again.");
    input.activities.forEach((activity, index) => {
      insertActivity.run(newId(), id, index, JSON.stringify(activitySchema.parse(activity)));
    });
  })();
  return getSessionOrThrow(id);
}

export type ControlAction =
  | { type: "launch"; activityId: string }
  | { type: "next" }
  | { type: "close" }
  | { type: "reopen"; activityId: string }
  | { type: "reveal"; revealed: boolean }
  | { type: "timer"; seconds: number | null }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "clear" }
  | { type: "end" }
  /** Removes a participant (e.g. a prank name); their answers in this session go too. They can join again. */
  | { type: "remove"; participantId: string };

export function controlSession(sessionId: string, user: CurrentUser, action: ControlAction): SessionRecord {
  const session = getSessionForTeacher(sessionId, user);
  if (session.status === "ended") throw new ApiError(409, "session_ended");
  const db = getDb();
  const timestamp = now();

  const closeOpen = () =>
    db.prepare("UPDATE session_activities SET state = 'closed', closed_at = ?, timer_ends_at = NULL WHERE session_id = ? AND state = 'open'").run(
      timestamp,
      sessionId,
    );

  const launch = (activityId: string) => {
    const target = getActivityRow(sessionId, activityId);
    closeOpen();
    db.prepare(
      `UPDATE session_activities SET state = 'open', revealed = 0, closed_at = NULL,
              launched_at = COALESCE(launched_at, ?),
              timer_ends_at = CASE WHEN ? IS NULL THEN NULL ELSE ? END
        WHERE id = ?`,
    ).run(timestamp, target.activity.timeLimitSec, timestamp + (target.activity.timeLimitSec ?? 0) * 1000, activityId);
    db.prepare(
      `UPDATE classroom_sessions SET current_activity_id = ?, status = 'live', paused = 0, started_at = COALESCE(started_at, ?) WHERE id = ?`,
    ).run(activityId, timestamp, sessionId);
  };

  db.transaction(() => {
    switch (action.type) {
      case "launch":
        launch(action.activityId);
        break;
      case "next": {
        const activities = listActivities(sessionId);
        const current = activities.find((a) => a.id === session.currentActivityId);
        const next =
          activities.find((a) => a.state === "pending" && (!current || a.position > current.position)) ??
          activities.find((a) => a.state === "pending");
        if (!next) throw new ApiError(409, "no_open_activity", "All activities have been used.");
        launch(next.id);
        break;
      }
      case "close":
        closeOpen();
        break;
      case "reopen": {
        getActivityRow(sessionId, action.activityId);
        closeOpen();
        db.prepare("UPDATE session_activities SET state = 'open', closed_at = NULL WHERE id = ?").run(action.activityId);
        db.prepare("UPDATE classroom_sessions SET current_activity_id = ?, status = 'live' WHERE id = ?").run(action.activityId, sessionId);
        break;
      }
      case "reveal": {
        if (!session.currentActivityId) throw new ApiError(409, "no_open_activity");
        db.prepare("UPDATE session_activities SET revealed = ? WHERE id = ?").run(action.revealed ? 1 : 0, session.currentActivityId);
        break;
      }
      case "timer": {
        if (!session.currentActivityId) throw new ApiError(409, "no_open_activity");
        db.prepare("UPDATE session_activities SET timer_ends_at = ? WHERE id = ?").run(
          action.seconds ? timestamp + action.seconds * 1000 : null,
          session.currentActivityId,
        );
        break;
      }
      case "pause":
        db.prepare("UPDATE classroom_sessions SET paused = 1 WHERE id = ?").run(sessionId);
        break;
      case "resume":
        db.prepare("UPDATE classroom_sessions SET paused = 0 WHERE id = ?").run(sessionId);
        break;
      case "clear":
        db.prepare("UPDATE classroom_sessions SET current_activity_id = NULL WHERE id = ?").run(sessionId);
        break;
      case "remove": {
        const removed = db.prepare("DELETE FROM session_participants WHERE id = ? AND session_id = ?").run(action.participantId, sessionId);
        if (removed.changes === 0) throw new ApiError(404, "not_found");
        break;
      }
      case "end":
        closeOpen();
        db.prepare(
          "UPDATE classroom_sessions SET status = 'ended', paused = 0, ended_at = ?, started_at = COALESCE(started_at, ?) WHERE id = ?",
        ).run(timestamp, timestamp, sessionId);
        break;
    }
  })();
  touch(sessionId);
  return getSessionOrThrow(sessionId);
}

export function listSessionsForTeacher(teacherId: string) {
  const rows = getDb()
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM session_participants p WHERE p.session_id = s.id) AS participant_count,
              (SELECT COUNT(*) FROM session_activities a WHERE a.session_id = s.id) AS activity_count
         FROM classroom_sessions s WHERE s.teacher_id = ? ORDER BY s.created_at DESC LIMIT 100`,
    )
    .all(teacherId) as (SessionRow & { participant_count: number; activity_count: number })[];
  return rows.map((row) => ({ ...toSession(row), participantCount: row.participant_count, activityCount: row.activity_count }));
}

/**
 * Live sessions for a signed-in student: ones they joined ("rejoin") and ones
 * started for one of their classes ("join" without typing the code).
 */
export function listActiveSessionsForStudent(userId: string) {
  return (
    getDb()
      .prepare(
        `SELECT s.id, s.title, s.subject, s.join_code, s.class_label, u.display_name AS teacher_name,
                EXISTS (SELECT 1 FROM session_participants p WHERE p.session_id = s.id AND p.user_id = ?) AS joined
           FROM classroom_sessions s
           JOIN users u ON u.id = s.teacher_id
          WHERE s.status != 'ended' AND (
                s.id IN (SELECT p.session_id FROM session_participants p WHERE p.user_id = ?)
             OR s.class_id IN (SELECT m.class_id FROM class_members m WHERE m.student_id = ?))
          ORDER BY s.created_at DESC LIMIT 5`,
      )
      .all(userId, userId, userId) as { id: string; title: string; subject: Subject; join_code: string; class_label: string; teacher_name: string; joined: number }[]
  ).map((r) => ({ id: r.id, title: r.title, subject: r.subject, joinCode: r.join_code, classLabel: r.class_label, teacherName: r.teacher_name, joined: r.joined === 1 }));
}

export function deleteSession(sessionId: string, user: CurrentUser): void {
  getSessionForTeacher(sessionId, user);
  getDb().prepare("DELETE FROM classroom_sessions WHERE id = ?").run(sessionId);
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function responsesFor(activityId: string): ResponseRow[] {
  return getDb().prepare("SELECT * FROM responses WHERE session_activity_id = ? ORDER BY submitted_at").all(activityId) as ResponseRow[];
}

export interface ActivityResults {
  responseCount: number;
  participantCount: number;
  gradedCount: number;
  correctCount: number;
  hintsRequested: number;
  distribution: { optionId: string; text: string; count: number; correct: boolean }[];
  answers: { participantId: string; name: string; text: string; isCorrect: boolean | null; attempts: number; hintsUsed: number; submittedAt: number }[];
  waiting: string[];
  commonWrongAnswers: { answer: string; count: number }[];
}

export function computeActivityResults(record: SessionActivityRecord, participants: ParticipantRecord[]): ActivityResults {
  const responses = responsesFor(record.id);
  const nameOf = new Map(participants.map((p) => [p.id, p.displayName]));
  const { activity } = record;
  const distribution = OPTION_ACTIVITY_TYPES.includes(activity.type)
    ? activity.options.map((option) => ({
        optionId: option.id,
        text: option.text,
        count: responses.filter((r) => toAnswer(r.answer).optionIds.includes(option.id)).length,
        correct: activity.correctOptionIds.includes(option.id),
      }))
    : [];
  const answers = responses.map((r) => {
    const answer = toAnswer(r.answer);
    return {
      participantId: r.participant_id,
      name: nameOf.get(r.participant_id) ?? "—",
      text: describeAnswer(answer, activity.options),
      isCorrect: r.is_correct === null ? null : r.is_correct === 1,
      attempts: r.attempts,
      hintsUsed: r.hints_used,
      submittedAt: r.submitted_at,
    };
  });
  const answeredIds = new Set(responses.map((r) => r.participant_id));
  const hints = getDb()
    .prepare("SELECT COALESCE(SUM(hints_used), 0) AS n FROM activity_progress WHERE session_activity_id = ?")
    .get(record.id) as { n: number };
  const wrong = new Map<string, { answer: string; count: number }>();
  for (const a of answers) {
    if (a.isCorrect !== false || !a.text) continue;
    const key = normalizeText(a.text);
    const entry = wrong.get(key) ?? { answer: a.text, count: 0 };
    entry.count += 1;
    wrong.set(key, entry);
  }
  return {
    responseCount: responses.length,
    participantCount: participants.length,
    gradedCount: responses.filter((r) => r.is_correct !== null).length,
    correctCount: responses.filter((r) => r.is_correct === 1).length,
    hintsRequested: hints.n,
    distribution,
    answers,
    waiting: participants.filter((p) => !answeredIds.has(p.id)).map((p) => p.displayName),
    commonWrongAnswers: [...wrong.values()].sort((a, b) => b.count - a.count).slice(0, 3),
  };
}

/** Everything the teacher console and presentation view need. */
export function getTeacherSessionView(sessionId: string, user: CurrentUser) {
  const session = getSessionForTeacher(sessionId, user);
  const activities = listActivities(sessionId);
  const participants = listParticipants(sessionId);
  const timestamp = now();
  const current = activities.find((a) => a.id === session.currentActivityId) ?? null;
  const counts = getDb()
    .prepare(
      `SELECT a.id, COUNT(r.id) AS n FROM session_activities a LEFT JOIN responses r ON r.session_activity_id = a.id
        WHERE a.session_id = ? GROUP BY a.id`,
    )
    .all(sessionId) as { id: string; n: number }[];
  const countById = new Map(counts.map((c) => [c.id, c.n]));
  const results = current ? computeActivityResults(current, participants) : null;
  const answerOf = new Map(results?.answers.map((a) => [a.participantId, a]) ?? []);
  // Class members who have not joined yet (only for sessions started for a class).
  const joinedUsers = new Set(participants.map((p) => p.userId).filter(Boolean));
  const absent = session.classId
    ? (
        getDb()
          .prepare(
            `SELECT u.id, u.display_name AS name FROM class_members m JOIN users u ON u.id = m.student_id
              WHERE m.class_id = ? ORDER BY u.display_name COLLATE NOCASE`,
          )
          .all(session.classId) as { id: string; name: string }[]
      ).filter((m) => !joinedUsers.has(m.id))
    : [];
  return {
    session,
    serverTime: timestamp,
    participants: participants.map((p) => {
      const answer = answerOf.get(p.id);
      return {
        id: p.id,
        name: p.displayName,
        hasAccount: p.userId !== null,
        online: timestamp - p.lastSeenAt < ONLINE_WINDOW_MS,
        joinedAt: p.joinedAt,
        /** Where this student is on the current activity. */
        current: !current ? null : !answer ? ("waiting" as const) : answer.isCorrect === null ? ("answered" as const) : answer.isCorrect ? ("correct" as const) : ("incorrect" as const),
      };
    }),
    absent,
    activities: activities.map((a) => ({ ...a, responseCount: countById.get(a.id) ?? 0, gradable: isActivityGradable(a.activity) })),
    current: current && results ? { ...current, gradable: isActivityGradable(current.activity), results } : null,
  };
}
export type TeacherSessionView = ReturnType<typeof getTeacherSessionView>;

export function getSessionSummary(sessionId: string, user: CurrentUser) {
  const session = getSessionForTeacher(sessionId, user);
  const activities = listActivities(sessionId);
  const participants = listParticipants(sessionId);
  const perActivity = activities
    .filter((a) => a.launchedAt !== null)
    .map((a) => ({ ...a, gradable: isActivityGradable(a.activity), results: computeActivityResults(a, participants) }));
  const allResponses = perActivity.flatMap((a) => a.results.answers);
  const graded = allResponses.filter((r) => r.isCorrect !== null);
  const possible = participants.length * perActivity.length;
  return {
    session,
    activitiesRun: perActivity.length,
    activitiesPlanned: activities.length,
    participantCount: participants.length,
    responseCount: allResponses.length,
    participationPercent: possible ? Math.round((allResponses.length / possible) * 100) : null,
    correctPercent: graded.length ? Math.round((graded.filter((r) => r.isCorrect).length / graded.length) * 100) : null,
    hintsUsed: perActivity.reduce((sum, a) => sum + a.results.hintsRequested, 0),
    durationMin: session.startedAt && session.endedAt ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000)) : null,
    activities: perActivity,
    students: participants.map((p) => {
      const mine = allResponses.filter((r) => r.participantId === p.id);
      return {
        name: p.displayName,
        answered: mine.length,
        correct: mine.filter((r) => r.isCorrect).length,
        graded: mine.filter((r) => r.isCorrect !== null).length,
        hintsUsed: mine.reduce((sum, r) => sum + r.hintsUsed, 0),
      };
    }),
  };
}
export type SessionSummary = ReturnType<typeof getSessionSummary>;

// ---------------------------------------------------------------------------
// Students: join, view, answer, ask for hints
// ---------------------------------------------------------------------------

export function findJoinableSession(code: string): SessionRecord {
  const normalized = normalizeJoinCode(code);
  if (!normalized) throw new ApiError(404, "session_not_found");
  const row = getDb()
    .prepare("SELECT * FROM classroom_sessions WHERE join_code = ? AND status != 'ended' ORDER BY created_at DESC LIMIT 1")
    .get(normalized) as SessionRow | undefined;
  if (!row) throw new ApiError(404, "session_not_found");
  return toSession(row);
}

export function joinSession(input: {
  code: string;
  displayName: string;
  user: CurrentUser | null;
}): { session: SessionRecord; participant: ParticipantRecord; token: string } {
  const session = findJoinableSession(input.code);
  const db = getDb();
  const token = newToken();
  const timestamp = now();
  const baseName = (input.user?.displayName ?? input.displayName).trim().replace(/\s+/g, " ").slice(0, 40);
  if (!baseName) throw new ApiError(400, "invalid_input", "Please enter your name.");

  // A signed-in student re-joining keeps the same participant record.
  if (input.user) {
    const existing = db
      .prepare("SELECT * FROM session_participants WHERE session_id = ? AND user_id = ?")
      .get(session.id, input.user.id) as Parameters<typeof toParticipant>[0] | undefined;
    if (existing) {
      db.prepare("UPDATE session_participants SET token_hash = ?, last_seen_at = ? WHERE id = ?").run(hashToken(token), timestamp, existing.id);
      touch(session.id, "staff");
      return { session, participant: toParticipant({ ...existing, last_seen_at: timestamp }), token };
    }
  }

  const taken = new Set(listParticipants(session.id).map((p) => p.displayName.toLowerCase()));
  let name = baseName;
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${baseName} ${n}`;

  const participant: ParticipantRecord = {
    id: newId(),
    sessionId: session.id,
    userId: input.user?.role === "student" ? input.user.id : null,
    displayName: name,
    joinedAt: timestamp,
    lastSeenAt: timestamp,
  };
  db.prepare(
    `INSERT INTO session_participants (id, session_id, user_id, display_name, token_hash, joined_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(participant.id, session.id, participant.userId, participant.displayName, hashToken(token), timestamp, timestamp);
  touch(session.id, "staff");
  return { session, participant, token };
}

export function getParticipantByToken(sessionId: string, token: string | undefined): ParticipantRecord | null {
  if (!token) return null;
  const row = getDb()
    .prepare("SELECT * FROM session_participants WHERE token_hash = ? AND session_id = ?")
    .get(hashToken(token), sessionId) as Parameters<typeof toParticipant>[0] | undefined;
  return row ? toParticipant(row) : null;
}

function markSeen(participant: ParticipantRecord): void {
  const timestamp = now();
  if (timestamp - participant.lastSeenAt < 10_000) return;
  getDb().prepare("UPDATE session_participants SET last_seen_at = ? WHERE id = ?").run(timestamp, participant.id);
  // A participant coming back online changes the teacher's roster.
  if (timestamp - participant.lastSeenAt > ONLINE_WINDOW_MS) touch(participant.sessionId, "staff");
}

function hintsUsedFor(activityId: string, participantId: string): number {
  const row = getDb()
    .prepare("SELECT hints_used FROM activity_progress WHERE session_activity_id = ? AND participant_id = ?")
    .get(activityId, participantId) as { hints_used: number } | undefined;
  return row?.hints_used ?? 0;
}

/**
 * The student's view of the session. Correct answers, hints and solutions
 * are never included unless the student has earned them (answered correctly,
 * requested the hint) or the teacher has revealed the results.
 */
export function getStudentSessionView(sessionId: string, participant: ParticipantRecord) {
  const session = getSessionOrThrow(sessionId);
  markSeen(participant);
  const base = {
    session: {
      id: session.id,
      title: session.title,
      subject: session.subject,
      status: session.status,
      paused: session.paused,
      version: session.version,
    },
    serverTime: now(),
    participant: { id: participant.id, name: participant.displayName },
  };

  if (session.status === "ended") {
    const rows = getDb()
      .prepare(
        `SELECT r.is_correct, r.hints_used FROM responses r JOIN session_activities a ON a.id = r.session_activity_id
          WHERE a.session_id = ? AND r.participant_id = ?`,
      )
      .all(sessionId, participant.id) as { is_correct: number | null; hints_used: number }[];
    return {
      ...base,
      current: null,
      summary: {
        answered: rows.length,
        correct: rows.filter((r) => r.is_correct === 1).length,
        graded: rows.filter((r) => r.is_correct !== null).length,
        hintsUsed: rows.reduce((s, r) => s + r.hints_used, 0),
      },
    };
  }

  if (!session.currentActivityId) return { ...base, current: null, summary: null };
  const record = getActivityRow(sessionId, session.currentActivityId);
  const { activity } = record;
  const response = getDb()
    .prepare("SELECT * FROM responses WHERE session_activity_id = ? AND participant_id = ?")
    .get(record.id, participant.id) as ResponseRow | undefined;
  const isCorrect = response ? (response.is_correct === null ? null : response.is_correct === 1) : null;
  const hintsUsed = hintsUsedFor(record.id, participant.id);
  const ladder = hintLadderInfo(activity);

  let results: {
    distribution: ActivityResults["distribution"];
    correctPercent: number | null;
    responseCount: number;
    correctOptionIds: string[];
    correctAnswer: string;
  } | null = null;
  if (record.revealed) {
    const computed = computeActivityResults(record, listParticipants(sessionId));
    results = {
      distribution: computed.distribution,
      responseCount: computed.responseCount,
      correctPercent: computed.gradedCount ? Math.round((computed.correctCount / computed.gradedCount) * 100) : null,
      correctOptionIds: activity.correctOptionIds,
      correctAnswer: activity.type === "multiple_choice" ? "" : (activity.acceptedAnswers[0] ?? ""),
    };
  }

  return {
    ...base,
    summary: null,
    current: {
      id: record.id,
      type: activity.type,
      title: activity.title,
      prompt: activity.prompt,
      options: activity.options,
      state: record.state,
      timerEndsAt: record.timerEndsAt,
      revealed: record.revealed,
      gradable: isActivityGradable(activity),
      hints: { used: hintsUsed, maxLevel: ladder.maxLevel },
      myResponse: response
        ? { answer: toAnswer(response.answer), isCorrect, attempts: response.attempts }
        : null,
      // Explanations are a reward for getting there, or shown once the teacher reveals.
      explanation: isCorrect === true || record.revealed ? activity.explanation : "",
      results,
    },
  };
}
export type StudentSessionView = ReturnType<typeof getStudentSessionView>;

function requireOpenActivity(sessionId: string, activityId: string): SessionActivityRecord {
  const session = getSessionOrThrow(sessionId);
  if (session.status === "ended") throw new ApiError(409, "session_ended");
  if (session.currentActivityId !== activityId) throw new ApiError(409, "activity_closed");
  const record = getActivityRow(sessionId, activityId);
  if (record.state !== "open") throw new ApiError(409, "activity_closed");
  return record;
}

export function submitResponse(input: {
  sessionId: string;
  participant: ParticipantRecord;
  activityId: string;
  answer: Answer;
  /** Generated by the student's browser per answer; a retried request with the same id is not counted twice. */
  submissionId?: string;
}): { isCorrect: boolean | null; attempts: number } {
  const record = requireOpenActivity(input.sessionId, input.activityId);
  const session = getSessionOrThrow(input.sessionId);
  if (session.paused) throw new ApiError(409, "activity_closed", "The teacher has paused the session.");
  const answer = answerSchema.parse(input.answer);
  if (isAnswerEmpty(answer)) throw new ApiError(400, "invalid_input", "Please enter an answer.");
  const db = getDb();
  const existing = db
    .prepare("SELECT attempts, is_correct, client_submission_id FROM responses WHERE session_activity_id = ? AND participant_id = ?")
    .get(record.id, input.participant.id) as { attempts: number; is_correct: number | null; client_submission_id: string | null } | undefined;
  if (input.submissionId && existing?.client_submission_id === input.submissionId) {
    // The same answer arrived again (the first response was lost on the way back).
    return { isCorrect: existing.is_correct === null ? null : existing.is_correct === 1, attempts: existing.attempts };
  }
  const isCorrect = gradeActivity(record.activity, answer);
  const hintsUsed = hintsUsedFor(record.id, input.participant.id);
  const timestamp = now();
  const attempts = (existing?.attempts ?? 0) + 1;
  db.transaction(() => {
    db.prepare(
      `INSERT INTO responses (id, session_activity_id, participant_id, answer, is_correct, attempts, hints_used, submitted_at, client_submission_id)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT (session_activity_id, participant_id) DO UPDATE SET
         answer = excluded.answer, is_correct = excluded.is_correct, attempts = responses.attempts + 1,
         hints_used = excluded.hints_used, submitted_at = excluded.submitted_at, client_submission_id = excluded.client_submission_id`,
    ).run(newId(), record.id, input.participant.id, JSON.stringify(answer), isCorrect === null ? null : isCorrect ? 1 : 0, hintsUsed, timestamp, input.submissionId ?? null);
    if (input.participant.userId) {
      recordLearningEvent({
        userId: input.participant.userId,
        kind: "session",
        subject: session.subject,
        topic: session.title,
        lessonId: session.lessonId,
        refId: session.id,
        correct: isCorrect,
        detail: { prompt: record.activity.prompt, given: describeAnswer(answer, record.activity.options), activityId: record.id },
      });
    }
  })();
  // Students only need to re-fetch when the class results are on their screens.
  touch(input.sessionId, record.revealed ? "all" : "staff");
  return { isCorrect, attempts };
}

export async function requestSessionHint(input: {
  sessionId: string;
  participant: ParticipantRecord;
  activityId: string;
}): Promise<HintResult> {
  const record = requireOpenActivity(input.sessionId, input.activityId);
  const used = hintsUsedFor(record.id, input.participant.id);
  // The full solution contains the answer: it opens only after a first attempt.
  if (isSolutionLevel(record.activity, used + 1)) {
    const answered = getDb().prepare("SELECT 1 FROM responses WHERE session_activity_id = ? AND participant_id = ?").get(record.id, input.participant.id);
    if (!answered) throw new ApiError(409, "attempt_first");
  }
  const hint = await getHint({ activity: record.activity, level: used + 1 });
  getDb()
    .prepare(
      `INSERT INTO activity_progress (session_activity_id, participant_id, hints_used) VALUES (?, ?, ?)
       ON CONFLICT (session_activity_id, participant_id) DO UPDATE SET hints_used = MAX(hints_used, excluded.hints_used)`,
    )
    .run(record.id, input.participant.id, hint.level);
  touch(input.sessionId, "staff");
  return hint;
}

/** Re-fetches hints a student has already unlocked (e.g. after a page reload). */
export async function getUnlockedHints(sessionId: string, participant: ParticipantRecord, activityId: string): Promise<HintResult[]> {
  const record = getActivityRow(sessionId, activityId);
  const used = hintsUsedFor(record.id, participant.id);
  const hints: HintResult[] = [];
  for (let level = 1; level <= used; level++) {
    hints.push(await getHint({ activity: record.activity, level, cachedOnly: true }));
  }
  return hints;
}
