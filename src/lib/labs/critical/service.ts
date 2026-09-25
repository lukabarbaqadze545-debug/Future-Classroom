import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { recordLabProgress } from "@/lib/services/assignments";
import { CT_EXERCISES, findExercise } from "./catalog";
import { answersSchemaFor, grade, type CtResult } from "./grade";
import { FALLACIES, type CtExercise, type CtKind, type CtTopic } from "./types";

/*
 * Critical thinking attempts. The student view never contains answer keys,
 * explanations or the direction of evidence; they come back with the result.
 */

export function listExercises(): CtExercise[] {
  return CT_EXERCISES;
}

export function getExerciseOrThrow(id: string): CtExercise {
  const exercise = findExercise(id);
  if (!exercise) throw new ApiError(404, "not_found");
  return exercise;
}

export type StudentExercise = ReturnType<typeof toStudentExercise>;

export function toStudentExercise(exercise: CtExercise) {
  const base = { id: exercise.id, kind: exercise.kind, topic: exercise.topic, title: exercise.title, intro: exercise.intro, minutes: exercise.minutes, difficulty: exercise.difficulty };
  switch (exercise.kind) {
    case "builder":
      return { ...base, questions: exercise.questions, items: [], passage: null, scenarios: [], motion: null, context: null, scenario: null, options: [], criteria: [] };
    case "debate":
      return { ...base, questions: [], items: [], passage: null, scenarios: [], motion: exercise.motion, context: exercise.context, scenario: null, options: [], criteria: [] };
    case "humility":
      return {
        ...base,
        questions: [],
        items: [],
        passage: null,
        // The expected direction and explanation stay on the server.
        scenarios: exercise.scenarios.map((s) => ({ id: s.id, situation: s.situation, claim: s.claim, newEvidence: s.newEvidence })),
        motion: null,
        context: null,
        scenario: null,
        options: [],
        criteria: [],
      };
    case "decision":
      return { ...base, questions: [], items: [], passage: null, scenarios: [], motion: null, context: null, scenario: exercise.scenario, options: exercise.options, criteria: exercise.criteria };
    default:
      return {
        ...base,
        questions: [],
        passage: exercise.passage ?? null,
        items: exercise.items.map((item) =>
          item.type === "choice"
            ? { type: item.type, id: item.id, prompt: item.prompt, context: item.context ?? null, options: item.options, segments: [] }
            : item.type === "multi"
              ? { type: item.type, id: item.id, prompt: item.prompt, context: item.context ?? null, options: item.options.map((o) => ({ id: o.id, text: o.text })), segments: [] }
              : { type: item.type, id: item.id, prompt: item.prompt, context: null, options: [], segments: item.segments.map((s) => ({ id: s.id, text: s.text })) },
        ),
        scenarios: [],
        motion: null,
        context: null,
        scenario: null,
        options: [],
        criteria: [],
      };
  }
}

export interface AttemptRecord {
  id: string;
  userId: string;
  exerciseId: string;
  kind: CtKind;
  answers: unknown;
  result: CtResult;
  score: number;
  maxScore: number;
  createdAt: number;
}

interface Row {
  id: string;
  user_id: string;
  exercise_id: string;
  kind: CtKind;
  answers: string;
  result: string;
  score: number;
  max_score: number;
  created_at: number;
}

function toAttempt(row: Row): AttemptRecord {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    kind: row.kind,
    answers: parseJson(row.answers, {}),
    result: parseJson<CtResult>(row.result, { score: row.score, max: row.max_score }),
    score: row.score,
    maxScore: row.max_score,
    createdAt: row.created_at,
  };
}

export function submitAttempt(user: CurrentUser, exerciseId: string, rawAnswers: unknown, options: { id?: string; createdAt?: number } = {}): AttemptRecord {
  const exercise = getExerciseOrThrow(exerciseId);
  const answers = answersSchemaFor(exercise.kind).parse(rawAnswers);
  const result = grade(exercise, answers);
  const id = options.id ?? newId();
  getDb()
    .prepare("INSERT INTO ct_attempts (id, user_id, exercise_id, kind, answers, result, score, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, user.id, exercise.id, exercise.kind, JSON.stringify(answers), JSON.stringify(result), result.score, result.max, options.createdAt ?? now());
  if (user.role === "student") recordLabProgress(user.id, "critical", exercise.id, { status: "completed", workRef: id, score: result.score, maxScore: result.max });
  return getAttempt(id)!;
}

export function getAttempt(id: string): AttemptRecord | null {
  const row = getDb().prepare("SELECT * FROM ct_attempts WHERE id = ?").get(id) as Row | undefined;
  return row ? toAttempt(row) : null;
}

/** Owners and staff may read an attempt. */
export function getAttemptFor(id: string, viewer: CurrentUser): AttemptRecord {
  const attempt = getAttempt(id);
  if (!attempt || (attempt.userId !== viewer.id && viewer.role === "student")) throw new ApiError(404, "not_found");
  return attempt;
}

export function listAttempts(userId: string, exerciseId?: string, limit = 20): AttemptRecord[] {
  const rows = exerciseId
    ? getDb().prepare("SELECT * FROM ct_attempts WHERE user_id = ? AND exercise_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, exerciseId, limit)
    : getDb().prepare("SELECT * FROM ct_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit);
  return (rows as Row[]).map(toAttempt);
}

/** Best score per exercise for one student. */
export function bestScores(userId: string): Map<string, { score: number; max: number; attempts: number }> {
  const rows = getDb()
    .prepare(
      `SELECT exercise_id, MAX(CAST(score AS REAL) / MAX(max_score, 1)) AS ratio, MAX(max_score) AS max, COUNT(*) AS attempts
         FROM ct_attempts WHERE user_id = ? GROUP BY exercise_id`,
    )
    .all(userId) as { exercise_id: string; ratio: number; max: number; attempts: number }[];
  return new Map(rows.map((r) => [r.exercise_id, { score: Math.round(r.ratio * r.max), max: r.max, attempts: r.attempts }]));
}

/** Progress by topic and a fallacy recognition map from all answered fallacy items. */
export function criticalProgress(userId: string) {
  const best = bestScores(userId);
  const byTopic = new Map<CtTopic, { done: number; total: number }>();
  for (const e of CT_EXERCISES) {
    const entry = byTopic.get(e.topic) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (best.has(e.id)) entry.done += 1;
    byTopic.set(e.topic, entry);
  }
  const fallacyStats = new Map<string, { correct: number; total: number }>(FALLACIES.map((f) => [f, { correct: 0, total: 0 }]));
  const rows = getDb().prepare("SELECT result FROM ct_attempts WHERE user_id = ? AND kind IN ('fallacy','bias')").all(userId) as { result: string }[];
  for (const row of rows) {
    for (const item of parseJson<CtResult>(row.result, { score: 0, max: 0 }).items ?? []) {
      if (!item.tag) continue;
      const s = fallacyStats.get(item.tag) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (item.correct) s.correct += 1;
      fallacyStats.set(item.tag, s);
    }
  }
  const totalScore = [...best.values()].reduce((s, b) => s + b.score, 0);
  const totalMax = [...best.values()].reduce((s, b) => s + b.max, 0);
  return {
    completed: best.size,
    total: CT_EXERCISES.length,
    accuracy: totalMax ? Math.round((totalScore / totalMax) * 100) : null,
    byTopic: [...byTopic.entries()].map(([topic, v]) => ({ topic, ...v })),
    fallacies: [...fallacyStats.entries()].map(([id, v]) => ({ id, ...v })),
  };
}

/** For teachers: how the class did on one exercise. */
export function exerciseClassStats(exerciseId: string) {
  return getDb()
    .prepare(
      `SELECT COUNT(DISTINCT a.user_id) AS students, ROUND(AVG(CAST(a.score AS REAL) / MAX(a.max_score, 1)) * 100) AS average
         FROM ct_attempts a JOIN users u ON u.id = a.user_id WHERE a.exercise_id = ? AND u.role = 'student'`,
    )
    .get(exerciseId) as { students: number; average: number | null };
}
