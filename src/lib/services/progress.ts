import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import type { Subject } from "@/lib/domain/catalog";

/**
 * Learning events are the only behavioural data the platform keeps: what was
 * practised, whether the answer was right, and when. No time-on-page, no
 * keystrokes, no device or location data.
 */
export type LearningEventKind = "practice" | "session" | "quiz" | "lesson_view";

export function recordLearningEvent(event: {
  userId: string;
  kind: LearningEventKind;
  subject: Subject;
  topic: string;
  lessonId?: string | null;
  refId?: string | null;
  correct?: boolean | null;
  detail?: Record<string, unknown>;
  createdAt?: number;
}): void {
  getDb()
    .prepare(
      `INSERT INTO learning_events (id, user_id, kind, subject, topic, lesson_id, ref_id, correct, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId(),
      event.userId,
      event.kind,
      event.subject,
      event.topic,
      event.lessonId ?? null,
      event.refId ?? null,
      event.correct === undefined || event.correct === null ? null : event.correct ? 1 : 0,
      JSON.stringify(event.detail ?? {}),
      event.createdAt ?? now(),
    );
}

/** Records that a student opened a lesson — at most once per lesson per day. */
export function recordLessonView(userId: string, lesson: { id: string; subject: Subject; topic: string }): void {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const exists = getDb()
    .prepare("SELECT 1 FROM learning_events WHERE user_id = ? AND kind = 'lesson_view' AND lesson_id = ? AND created_at >= ?")
    .get(userId, lesson.id, dayStart.getTime());
  if (!exists) recordLearningEvent({ userId, kind: "lesson_view", subject: lesson.subject, topic: lesson.topic, lessonId: lesson.id });
}

interface EventRow {
  id: string;
  kind: LearningEventKind;
  subject: Subject;
  topic: string;
  lesson_id: string | null;
  ref_id: string | null;
  correct: number | null;
  detail: string;
  created_at: number;
}

export interface StudentProgress {
  completedActivities: number;
  correctActivities: number;
  lessonsStudied: number;
  quizzesTaken: number;
  quizAveragePercent: number | null;
  activeDays: number;
  streakDays: number;
  /** Last 14 days, oldest first: number of answered activities per day. */
  activityByDay: { date: string; count: number }[];
  topics: { subject: Subject; topic: string; lessonId: string | null; answered: number; correct: number; lastAt: number }[];
  recentQuizzes: { quizId: string; title: string; subject: Subject; score: number; maxScore: number; submittedAt: number; attemptId: string }[];
}

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getStudentProgress(userId: string): StudentProgress {
  const db = getDb();
  const events = db
    .prepare("SELECT * FROM learning_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 2000")
    .all(userId) as EventRow[];
  const answered = events.filter((e) => e.kind !== "lesson_view");

  const topics = new Map<string, StudentProgress["topics"][number]>();
  for (const e of events) {
    const key = `${e.subject}|${e.topic.toLowerCase()}`;
    const entry = topics.get(key) ?? { subject: e.subject, topic: e.topic, lessonId: e.lesson_id, answered: 0, correct: 0, lastAt: e.created_at };
    if (e.kind !== "lesson_view") {
      entry.answered += 1;
      if (e.correct === 1) entry.correct += 1;
    }
    entry.lessonId ??= e.lesson_id;
    entry.lastAt = Math.max(entry.lastAt, e.created_at);
    topics.set(key, entry);
  }

  const days = new Set(events.map((e) => dayKey(e.created_at)));
  let streak = 0;
  const cursor = new Date();
  // A streak counts consecutive days with activity, ending today or yesterday.
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const activityByDay: StudentProgress["activityByDay"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    activityByDay.push({ date: key, count: answered.filter((e) => dayKey(e.created_at) === key).length });
  }

  const quizRows = db
    .prepare(
      `SELECT a.id, a.quiz_id, q.title, q.subject, a.score, a.max_score, a.submitted_at FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id WHERE a.student_id = ? ORDER BY a.submitted_at DESC LIMIT 20`,
    )
    .all(userId) as { id: string; quiz_id: string; title: string; subject: Subject; score: number; max_score: number; submitted_at: number }[];
  const quizAverage = quizRows.length
    ? Math.round((quizRows.reduce((s, r) => s + (r.max_score ? r.score / r.max_score : 0), 0) / quizRows.length) * 100)
    : null;

  return {
    completedActivities: answered.length,
    correctActivities: answered.filter((e) => e.correct === 1).length,
    lessonsStudied: new Set(events.filter((e) => e.lesson_id).map((e) => e.lesson_id)).size,
    quizzesTaken: quizRows.length,
    quizAveragePercent: quizAverage,
    activeDays: days.size,
    streakDays: streak,
    activityByDay,
    topics: [...topics.values()].sort((a, b) => b.lastAt - a.lastAt),
    recentQuizzes: quizRows.map((r) => ({
      quizId: r.quiz_id,
      attemptId: r.id,
      title: r.title,
      subject: r.subject,
      score: r.score,
      maxScore: r.max_score,
      submittedAt: r.submitted_at,
    })),
  };
}

export interface Mistake {
  id: string;
  kind: LearningEventKind;
  subject: Subject;
  topic: string;
  lessonId: string | null;
  prompt: string;
  given: string;
  source: string;
  createdAt: number;
}

/**
 * Mistakes to review: incorrect answers that were not later answered
 * correctly for the same question.
 */
export function getMistakesToReview(userId: string, limit = 20): Mistake[] {
  const events = getDb()
    .prepare("SELECT * FROM learning_events WHERE user_id = ? AND correct IS NOT NULL ORDER BY created_at DESC LIMIT 1000")
    .all(userId) as EventRow[];
  const resolved = new Set<string>();
  const mistakes: Mistake[] = [];
  for (const e of events) {
    const detail = parseJson<{ prompt?: string; given?: string; quizTitle?: string; activityId?: string }>(e.detail, {});
    const key = `${e.ref_id ?? ""}|${detail.activityId ?? detail.prompt ?? ""}`;
    if (e.correct === 1) {
      resolved.add(key);
      continue;
    }
    if (resolved.has(key)) continue;
    resolved.add(key);
    mistakes.push({
      id: e.id,
      kind: e.kind,
      subject: e.subject,
      topic: e.topic,
      lessonId: e.lesson_id,
      prompt: detail.prompt ?? "",
      given: detail.given ?? "",
      source: detail.quizTitle ?? e.topic,
      createdAt: e.created_at,
    });
    if (mistakes.length >= limit) break;
  }
  return mistakes;
}

/** Simple class overview for teachers: numbers a teacher can act on. */
export function getTeacherInsights(teacherId: string) {
  const db = getDb();
  const sessions = db
    .prepare(
      `SELECT s.id, s.title, s.subject, s.class_label, s.ended_at, s.started_at,
              (SELECT COUNT(*) FROM session_participants p WHERE p.session_id = s.id) AS participants
         FROM classroom_sessions s WHERE s.teacher_id = ? AND s.status = 'ended' ORDER BY s.ended_at DESC`,
    )
    .all(teacherId) as { id: string; title: string; subject: Subject; class_label: string; ended_at: number; started_at: number | null; participants: number }[];

  const responseStats = db
    .prepare(
      `SELECT COUNT(*) AS responses,
              SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
              SUM(CASE WHEN r.is_correct IS NOT NULL THEN 1 ELSE 0 END) AS graded,
              SUM(r.hints_used) AS hints
         FROM responses r JOIN session_activities a ON a.id = r.session_activity_id
         JOIN classroom_sessions s ON s.id = a.session_id WHERE s.teacher_id = ?`,
    )
    .get(teacherId) as { responses: number; correct: number | null; graded: number | null; hints: number | null };

  // Participation: answered activities / (participants × launched activities).
  const participation = db
    .prepare(
      `SELECT s.id,
              (SELECT COUNT(*) FROM session_participants p WHERE p.session_id = s.id) AS participants,
              (SELECT COUNT(*) FROM session_activities a WHERE a.session_id = s.id AND a.launched_at IS NOT NULL) AS launched,
              (SELECT COUNT(*) FROM responses r JOIN session_activities a ON a.id = r.session_activity_id WHERE a.session_id = s.id) AS responses
         FROM classroom_sessions s WHERE s.teacher_id = ? AND s.status = 'ended'`,
    )
    .all(teacherId) as { participants: number; launched: number; responses: number }[];
  const possible = participation.reduce((sum, p) => sum + p.participants * p.launched, 0);
  const given = participation.reduce((sum, p) => sum + p.responses, 0);

  const quizStats = db
    .prepare(
      `SELECT COUNT(*) AS n, AVG(CAST(a.score AS REAL) / NULLIF(a.max_score, 0)) AS avg
         FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id WHERE q.teacher_id = ?`,
    )
    .get(teacherId) as { n: number; avg: number | null };

  // Most common incorrect answers across live-session activities.
  const wrongRows = db
    .prepare(
      `SELECT a.data AS data, r.answer AS answer FROM responses r
         JOIN session_activities a ON a.id = r.session_activity_id
         JOIN classroom_sessions s ON s.id = a.session_id
        WHERE s.teacher_id = ? AND r.is_correct = 0 ORDER BY r.submitted_at DESC LIMIT 500`,
    )
    .all(teacherId) as { data: string; answer: string }[];
  const wrong = new Map<string, { prompt: string; answer: string; count: number }>();
  for (const row of wrongRows) {
    const activity = parseJson<{ prompt: string; options: { id: string; text: string }[] }>(row.data, { prompt: "", options: [] });
    const answer = parseJson<{ optionIds: string[]; text: string }>(row.answer, { optionIds: [], text: "" });
    const label = answer.optionIds.length
      ? answer.optionIds.map((id) => activity.options.find((o) => o.id === id)?.text ?? id).join(", ")
      : answer.text.trim();
    if (!label) continue;
    const key = `${activity.prompt}|${label.toLowerCase()}`;
    const entry = wrong.get(key) ?? { prompt: activity.prompt, answer: label, count: 0 };
    entry.count += 1;
    wrong.set(key, entry);
  }

  const topicRows = db
    .prepare(
      `SELECT s.title AS topic, s.subject AS subject,
              SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
              SUM(CASE WHEN r.is_correct IS NOT NULL THEN 1 ELSE 0 END) AS graded
         FROM responses r JOIN session_activities a ON a.id = r.session_activity_id
         JOIN classroom_sessions s ON s.id = a.session_id
        WHERE s.teacher_id = ? GROUP BY s.title, s.subject HAVING graded > 0 ORDER BY graded DESC LIMIT 8`,
    )
    .all(teacherId) as { topic: string; subject: Subject; correct: number; graded: number }[];

  return {
    sessionsCompleted: sessions.length,
    totalParticipants: sessions.reduce((sum, s) => sum + s.participants, 0),
    averageParticipants: sessions.length ? Math.round(sessions.reduce((s, x) => s + x.participants, 0) / sessions.length) : null,
    participationPercent: possible ? Math.round((given / possible) * 100) : null,
    responses: responseStats.responses,
    correctPercent: responseStats.graded ? Math.round(((responseStats.correct ?? 0) / responseStats.graded) * 100) : null,
    hintsUsed: responseStats.hints ?? 0,
    quizAttempts: quizStats.n,
    quizAveragePercent: quizStats.avg === null ? null : Math.round(quizStats.avg * 100),
    commonWrongAnswers: [...wrong.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    topics: topicRows.map((t) => ({ ...t, percent: Math.round((t.correct / t.graded) * 100) })),
    recentSessions: sessions.slice(0, 6),
  };
}
