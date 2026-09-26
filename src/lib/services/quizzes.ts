import "server-only";
import { recordLabProgress } from "./assignments";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import {
  answerSchema,
  quizDraftSchema,
  quizQuestionSchema,
  type Answer,
  type QuizDraft,
  type QuizFeedbackMode,
  type QuizQuestion,
} from "@/lib/domain/schemas";
import { describeAnswer, gradeQuizQuestion, isAnswerEmpty, normalizeText } from "@/lib/domain/grading";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { ContentOrigin } from "./lessons";
import { recordLearningEvent } from "./progress";

export interface QuizRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  lessonId: string | null;
  title: string;
  subject: Subject;
  grade: number;
  topic: string;
  status: "draft" | "published";
  origin: ContentOrigin;
  feedbackMode: QuizFeedbackMode;
  questions: QuizQuestion[];
  createdAt: number;
  updatedAt: number;
  /** Built-in quizzes: the translation group and language of their lesson. */
  contentGroup: string | null;
  language: ContentLanguage | null;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  points: number;
  earned: number;
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, Answer>;
  results: QuestionResult[];
  score: number;
  maxScore: number;
  submittedAt: number;
}

interface QuizRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  lesson_id: string | null;
  title: string;
  subject: Subject;
  grade: number;
  topic: string;
  status: "draft" | "published";
  origin: ContentOrigin;
  feedback_mode: QuizFeedbackMode;
  questions: string;
  created_at: number;
  updated_at: number;
  content_group: string | null;
  lesson_language: ContentLanguage | null;
}

const SELECT = `SELECT q.*, u.display_name AS teacher_name, l.content_group AS content_group, l.language AS lesson_language
  FROM quizzes q JOIN users u ON u.id = q.teacher_id LEFT JOIN lessons l ON l.id = q.lesson_id`;

function toRecord(row: QuizRow): QuizRecord {
  const questions = quizQuestionSchema.array().safeParse(parseJson(row.questions, []));
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    lessonId: row.lesson_id,
    title: row.title,
    subject: row.subject,
    grade: row.grade,
    topic: row.topic,
    status: row.status,
    origin: row.origin,
    feedbackMode: row.feedback_mode,
    questions: questions.success ? questions.data : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contentGroup: row.content_group,
    language: row.lesson_language,
  };
}

export function createQuiz(input: {
  teacherId: string;
  draft: QuizDraft;
  lessonId?: string | null;
  origin: ContentOrigin;
  status?: "draft" | "published";
  id?: string;
  createdAt?: number;
}): QuizRecord {
  const draft = quizDraftSchema.parse(input.draft);
  const id = input.id ?? newId();
  const timestamp = input.createdAt ?? now();
  getDb()
    .prepare(
      `INSERT INTO quizzes (id, teacher_id, lesson_id, title, subject, grade, topic, status, origin, feedback_mode, questions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.teacherId,
      input.lessonId ?? null,
      draft.title,
      draft.subject,
      draft.grade,
      draft.topic,
      input.status ?? "draft",
      input.origin,
      draft.feedbackMode,
      JSON.stringify(draft.questions),
      timestamp,
      timestamp,
    );
  return getQuizOrThrow(id);
}

export function getQuiz(id: string): QuizRecord | null {
  const row = getDb().prepare(`${SELECT} WHERE q.id = ?`).get(id) as QuizRow | undefined;
  return row ? toRecord(row) : null;
}

function getQuizOrThrow(id: string): QuizRecord {
  const quiz = getQuiz(id);
  if (!quiz) throw new ApiError(404, "not_found");
  return quiz;
}

export function getQuizForEditor(id: string, user: CurrentUser): QuizRecord {
  const quiz = getQuizOrThrow(id);
  if (quiz.teacherId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return quiz;
}

export function listQuizzesForTeacher(teacherId: string): (QuizRecord & { attemptCount: number; averagePercent: number | null })[] {
  const rows = getDb().prepare(`${SELECT} WHERE q.teacher_id = ? ORDER BY q.updated_at DESC`).all(teacherId) as QuizRow[];
  const stats = getDb().prepare(
    "SELECT COUNT(*) AS n, AVG(CAST(score AS REAL) / NULLIF(max_score, 0)) AS avg FROM quiz_attempts WHERE quiz_id = ?",
  );
  return rows.map((row) => {
    const s = stats.get(row.id) as { n: number; avg: number | null };
    return { ...toRecord(row), attemptCount: s.n, averagePercent: s.avg === null ? null : Math.round(s.avg * 100) };
  });
}

export function listPublishedQuizzes(): QuizRecord[] {
  return (getDb().prepare(`${SELECT} WHERE q.status = 'published' ORDER BY q.updated_at DESC`).all() as QuizRow[]).map(toRecord);
}

export function listQuizzesForLesson(lessonId: string): QuizRecord[] {
  return (getDb().prepare(`${SELECT} WHERE q.lesson_id = ? ORDER BY q.updated_at DESC`).all(lessonId) as QuizRow[]).map(
    toRecord,
  );
}

export function updateQuiz(id: string, user: CurrentUser, draft: QuizDraft): QuizRecord {
  getQuizForEditor(id, user);
  const parsed = quizDraftSchema.parse(draft);
  getDb()
    .prepare(
      `UPDATE quizzes SET title = ?, subject = ?, grade = ?, topic = ?, feedback_mode = ?, questions = ?, updated_at = ? WHERE id = ?`,
    )
    .run(parsed.title, parsed.subject, parsed.grade, parsed.topic, parsed.feedbackMode, JSON.stringify(parsed.questions), now(), id);
  return getQuizOrThrow(id);
}

export function setQuizStatus(id: string, user: CurrentUser, status: "draft" | "published"): QuizRecord {
  const quiz = getQuizForEditor(id, user);
  if (status === "published" && quiz.questions.length === 0) throw new ApiError(400, "invalid_input", "Add at least one question.");
  getDb().prepare("UPDATE quizzes SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), id);
  return getQuizOrThrow(id);
}

export function deleteQuiz(id: string, user: CurrentUser): void {
  getQuizForEditor(id, user);
  getDb().prepare("DELETE FROM quizzes WHERE id = ?").run(id);
}

/** Question data a student may see before submitting (no answers). */
export interface StudentQuizQuestion {
  id: string;
  type: QuizQuestion["type"];
  prompt: string;
  options: { id: string; text: string }[];
  points: number;
}

export function toStudentQuestions(quiz: QuizRecord): StudentQuizQuestion[] {
  return quiz.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options, points: q.points }));
}

export function getPublishedQuiz(id: string): QuizRecord {
  const quiz = getQuizOrThrow(id);
  if (quiz.status !== "published") throw new ApiError(404, "not_found");
  return quiz;
}

export function submitQuizAttempt(quizId: string, student: CurrentUser, rawAnswers: Record<string, unknown>): QuizAttemptRecord {
  const quiz = getPublishedQuiz(quizId);
  const answers: Record<string, Answer> = {};
  const results: QuestionResult[] = [];
  for (const question of quiz.questions) {
    const answer = answerSchema.parse(rawAnswers[question.id] ?? {});
    answers[question.id] = answer;
    const correct = !isAnswerEmpty(answer) && gradeQuizQuestion(question, answer);
    results.push({ questionId: question.id, correct, points: question.points, earned: correct ? question.points : 0 });
  }
  const score = results.reduce((sum, r) => sum + r.earned, 0);
  const maxScore = results.reduce((sum, r) => sum + r.points, 0);
  const attempt: QuizAttemptRecord = {
    id: newId(),
    quizId,
    studentId: student.id,
    answers,
    results,
    score,
    maxScore,
    submittedAt: now(),
  };
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, answers, results, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(attempt.id, quizId, student.id, JSON.stringify(answers), JSON.stringify(results), score, maxScore, attempt.submittedAt);
    for (const result of results) {
      const question = quiz.questions.find((q) => q.id === result.questionId)!;
      recordLearningEvent({
        userId: student.id,
        kind: "quiz",
        subject: quiz.subject,
        topic: quiz.topic || quiz.title,
        lessonId: quiz.lessonId,
        refId: quiz.id,
        correct: result.correct,
        detail: {
          prompt: question.prompt,
          given: describeAnswer(answers[question.id], question.options),
          quizTitle: quiz.title,
        },
      });
    }
  })();
  // Quizzes can be assigned: the attempt completes the assignment (best score kept).
  recordLabProgress(student.id, "quiz", quiz.id, { status: "completed", workRef: attempt.id, score, maxScore });
  return attempt;
}

function toAttempt(row: {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: string;
  results: string;
  score: number;
  max_score: number;
  submitted_at: number;
}): QuizAttemptRecord {
  return {
    id: row.id,
    quizId: row.quiz_id,
    studentId: row.student_id,
    answers: parseJson(row.answers, {}),
    results: parseJson(row.results, []),
    score: row.score,
    maxScore: row.max_score,
    submittedAt: row.submitted_at,
  };
}

export function getAttempt(id: string): QuizAttemptRecord | null {
  const row = getDb().prepare("SELECT * FROM quiz_attempts WHERE id = ?").get(id) as Parameters<typeof toAttempt>[0] | undefined;
  return row ? toAttempt(row) : null;
}

export function listAttemptsForStudent(studentId: string, quizId?: string): (QuizAttemptRecord & { quizTitle: string; subject: Subject })[] {
  const rows = getDb()
    .prepare(
      `SELECT a.*, q.title AS quiz_title, q.subject AS subject FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
        WHERE a.student_id = ? ${quizId ? "AND a.quiz_id = ?" : ""} ORDER BY a.submitted_at DESC`,
    )
    .all(...(quizId ? [studentId, quizId] : [studentId])) as (Parameters<typeof toAttempt>[0] & { quiz_title: string; subject: Subject })[];
  return rows.map((row) => ({ ...toAttempt(row), quizTitle: row.quiz_title, subject: row.subject }));
}

/**
 * Feedback a student may see for an attempt. With "score_only" the teacher
 * keeps correct answers private (e.g. for a quiz still in progress).
 */
export function studentAttemptView(quiz: QuizRecord, attempt: QuizAttemptRecord) {
  const full = quiz.feedbackMode === "full";
  return {
    score: attempt.score,
    maxScore: attempt.maxScore,
    submittedAt: attempt.submittedAt,
    feedbackMode: quiz.feedbackMode,
    questions: quiz.questions.map((q) => {
      const result = attempt.results.find((r) => r.questionId === q.id);
      const answer = attempt.answers[q.id] ?? { optionIds: [], text: "" };
      return {
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        points: q.points,
        yourAnswer: describeAnswer(answer, q.options),
        yourOptionIds: answer.optionIds,
        correct: result?.correct ?? false,
        correctOptionIds: full ? q.correctOptionIds : [],
        correctAnswer: full ? correctAnswerText(q) : null,
        explanation: full ? q.explanation : "",
      };
    }),
  };
}

export function correctAnswerText(q: QuizQuestion): string {
  if (q.type === "numerical") return q.numericAnswer === null ? "" : String(q.numericAnswer);
  if (q.type === "short_answer") return q.acceptedAnswers[0] ?? "";
  return q.options
    .filter((o) => q.correctOptionIds.includes(o.id))
    .map((o) => o.text)
    .join(", ");
}

/** Class results for the teacher: averages and the most common wrong answers. */
export function getQuizResults(id: string, user: CurrentUser) {
  const quiz = getQuizForEditor(id, user);
  const rows = getDb()
    .prepare(
      `SELECT a.*, u.display_name AS student_name FROM quiz_attempts a JOIN users u ON u.id = a.student_id
        WHERE a.quiz_id = ? ORDER BY a.submitted_at DESC`,
    )
    .all(id) as (Parameters<typeof toAttempt>[0] & { student_name: string })[];
  const attempts = rows.map((row) => ({ ...toAttempt(row), studentName: row.student_name }));
  const questions = quiz.questions.map((q) => {
    const answered = attempts.map((a) => ({ answer: a.answers[q.id], result: a.results.find((r) => r.questionId === q.id) }));
    const correctCount = answered.filter((x) => x.result?.correct).length;
    const wrong = new Map<string, number>();
    for (const x of answered) {
      if (x.result?.correct || !x.answer || isAnswerEmpty(x.answer)) continue;
      const label = describeAnswer(x.answer, q.options);
      const key = normalizeText(label);
      wrong.set(key, (wrong.get(key) ?? 0) + 1);
    }
    return {
      id: q.id,
      prompt: q.prompt,
      correctAnswer: correctAnswerText(q),
      correctPercent: answered.length ? Math.round((correctCount / answered.length) * 100) : null,
      commonWrongAnswers: [...wrong.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([answer, count]) => ({ answer, count })),
    };
  });
  const average = attempts.length
    ? Math.round((attempts.reduce((s, a) => s + (a.maxScore ? a.score / a.maxScore : 0), 0) / attempts.length) * 100)
    : null;
  return {
    quiz,
    averagePercent: average,
    attempts: attempts.map((a) => ({ id: a.id, studentName: a.studentName, score: a.score, maxScore: a.maxScore, submittedAt: a.submittedAt })),
    questions,
  };
}
