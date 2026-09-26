import "server-only";
import { getDb } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem, programmingProgress } from "@/lib/labs/programming/service";
import { criticalProgress } from "@/lib/labs/critical/service";
import { findExercise } from "@/lib/labs/critical/catalog";
import { findChallengeSet, listProjects, listRecords, stemProgress } from "@/lib/labs/stem/service";
import { findExperiment } from "@/lib/labs/stem/experiments";
import { findSimulation } from "@/lib/labs/stem/simulations";
import { getResearchBundle, listResearchProjects, researchStepStatus } from "@/lib/labs/research/service";
import { libraryProgress, listReading } from "@/lib/labs/library/service";
import { careerProgress } from "@/lib/labs/career/service";
import { FALLACY_CARDS } from "@/lib/labs/critical/concepts";
import { listPortfolio } from "./portfolio";
import { assignmentStats, listAssignmentsForStudent } from "./assignments";
import { getStudentProgress } from "./progress";
import type { CurrentUser } from "@/lib/auth/session";
import { parseJson } from "@/lib/db";
import { GRADABLE_ACTIVITY_TYPES } from "@/lib/domain/catalog";
import { lessonContentSchema } from "@/lib/domain/schemas";

export type LabKey = "lessons" | "programming" | "stem" | "research" | "critical" | "library" | "career";

export interface RecentWork {
  lab: LabKey;
  title: string;
  detail: string;
  href: string;
  at: number;
  /** Language of a title that is not interface text (e.g. a book title). */
  lang?: string;
}

/**
 * One view of a student's work across every laboratory, for the student,
 * their teachers and a mentor. Everything is read from the stored records.
 */
export function learningProfile(studentId: string, viewer: CurrentUser, locale: Locale) {
  const lessons = getStudentProgress(studentId);
  const prog = programmingProgress(studentId);
  const ct = criticalProgress(studentId);
  const stem = stemProgress(studentId);
  const library = libraryProgress(studentId);
  const career = careerProgress(studentId);
  const portfolio = listPortfolio(studentId);
  const research = listResearchProjects(studentId).map((p) => {
    const steps = researchStepStatus(getResearchBundle(p.id, viewer));
    return { id: p.id, title: p.title, status: p.status, done: Object.values(steps).filter(Boolean).length, total: Object.keys(steps).length, updatedAt: p.updatedAt };
  });
  const projects = listProjects(studentId);
  const assignments = listAssignmentsForStudent(studentId);

  const db = getDb();
  const recent: RecentWork[] = [];
  for (const s of db
    .prepare("SELECT id, problem_id, verdict, created_at FROM programming_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 6")
    .all(studentId) as { id: string; problem_id: string; verdict: string; created_at: number }[]) {
    const p = getProblem(s.problem_id);
    if (p) recent.push({ lab: "programming", title: tr(p.title, locale), detail: s.verdict, href: `/labs/programming/submissions/${s.id}`, at: s.created_at });
  }
  for (const a of db
    .prepare("SELECT id, exercise_id, score, max_score, created_at FROM ct_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 6")
    .all(studentId) as { id: string; exercise_id: string; score: number; max_score: number; created_at: number }[]) {
    const e = findExercise(a.exercise_id);
    if (e) recent.push({ lab: "critical", title: tr(e.title, locale), detail: `${a.score}/${a.max_score}`, href: `/labs/critical-thinking/${a.exercise_id}?attempt=${a.id}`, at: a.created_at });
  }
  for (const r of listRecords(studentId).slice(0, 6)) {
    const title = r.itemKind === "experiment" ? findExperiment(r.itemId)?.title : r.itemKind === "simulation" ? findSimulation(r.itemId)?.title : findChallengeSet(r.itemId)?.title;
    if (title) recent.push({ lab: "stem", title: tr(title, locale), detail: r.score !== null ? `${r.score}/${r.maxScore}` : r.status, href: `/labs/stem/records/${r.id}`, at: r.updatedAt });
  }
  for (const p of projects.slice(0, 4)) recent.push({ lab: "stem", title: p.title, detail: p.status, href: `/labs/stem/projects/${p.id}`, at: p.updatedAt });
  for (const p of research.slice(0, 4)) recent.push({ lab: "research", title: p.title, detail: `${p.done}/${p.total}`, href: `/labs/research/${p.id}`, at: p.updatedAt });
  for (const r of listReading(studentId).slice(0, 4)) recent.push({ lab: "library", title: r.title, detail: r.status, href: `/library/${r.resourceId}`, at: r.updatedAt, lang: r.language });
  for (const i of portfolio.slice(0, 4)) recent.push({ lab: "career", title: i.title, detail: i.category, href: `/portfolio/${studentId}`, at: i.updatedAt });
  recent.sort((a, b) => b.at - a.at);

  // Lessons worked on: practice and live answers per lesson, and the best quiz result for it.
  const lessonRows = db
    .prepare(
      `SELECT e.lesson_id, l.title, l.subject, l.content, COUNT(*) AS answered, SUM(e.correct = 1) AS correct, MAX(e.created_at) AS last_at,
              GROUP_CONCAT(DISTINCT json_extract(e.detail, '$.activityId')) AS activity_ids
         FROM learning_events e JOIN lessons l ON l.id = e.lesson_id
        WHERE e.user_id = ? AND e.kind IN ('practice', 'session') GROUP BY e.lesson_id ORDER BY last_at DESC LIMIT 12`,
    )
    .all(studentId) as { lesson_id: string; title: string; subject: string; content: string; answered: number; correct: number; last_at: number; activity_ids: string | null }[];
  const bestQuizFor = db.prepare(
    `SELECT MAX(CAST(a.score AS REAL) / NULLIF(a.max_score, 0)) AS best FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id WHERE a.student_id = ? AND q.lesson_id = ?`,
  );
  const lessonsWorked = lessonRows.map((r) => {
    const content = lessonContentSchema.safeParse(parseJson(r.content, {}));
    const gradable = content.success ? content.data.activities.filter((a) => GRADABLE_ACTIVITY_TYPES.includes(a.type)).map((a) => a.id) : [];
    const done = new Set((r.activity_ids ?? "").split(",").filter((id) => gradable.includes(id)));
    const best = (bestQuizFor.get(studentId, r.lesson_id) as { best: number | null }).best;
    return {
      lessonId: r.lesson_id,
      title: r.title,
      subject: r.subject,
      answered: r.answered,
      correct: r.correct,
      activitiesDone: done.size,
      activitiesTotal: gradable.length,
      quizBestPercent: best === null ? null : Math.round(best * 100),
      completed: best !== null || (gradable.length > 0 && done.size >= gradable.length),
      lastAt: r.last_at,
    };
  });

  const quizzes = (
    db
      .prepare(
        `SELECT q.id, q.title, COUNT(a.id) AS attempts, MAX(CAST(a.score AS REAL) / NULLIF(a.max_score, 0)) AS best, MAX(a.submitted_at) AS last_at
           FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id WHERE a.student_id = ? GROUP BY q.id ORDER BY last_at DESC LIMIT 10`,
      )
      .all(studentId) as { id: string; title: string; attempts: number; best: number | null; last_at: number }[]
  ).map((q) => ({ quizId: q.id, title: q.title, attempts: q.attempts, bestPercent: q.best === null ? null : Math.round(q.best * 100), lastAt: q.last_at }));

  const liveLessons = (
    db
      .prepare(
        `SELECT s.id, s.title, s.class_label, COALESCE(s.started_at, s.created_at) AS at, COUNT(r.id) AS answered,
                SUM(r.is_correct = 1) AS correct, SUM(r.is_correct IS NOT NULL) AS graded
           FROM session_participants p JOIN classroom_sessions s ON s.id = p.session_id
           LEFT JOIN responses r ON r.participant_id = p.id
          WHERE p.user_id = ? GROUP BY s.id ORDER BY at DESC LIMIT 8`,
      )
      .all(studentId) as { id: string; title: string; class_label: string; at: number; answered: number; correct: number | null; graded: number | null }[]
  ).map((s) => ({ sessionId: s.id, title: s.title, classLabel: s.class_label, at: s.at, answered: s.answered, correct: s.correct ?? 0, graded: s.graded ?? 0 }));

  const fallacies = ct.fallacies
    .filter((f) => f.total > 0)
    .map((f) => ({ ...f, name: FALLACY_CARDS.find((c) => c.id === f.id)?.name ?? null }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);

  return {
    lessons,
    programming: prog,
    critical: { ...ct, weakest: fallacies.slice(0, 3) },
    stem: { ...stem, projects: projects.map((p) => ({ id: p.id, title: p.title, status: p.status })) },
    research,
    library,
    career: { ...career, portfolio: portfolio.length },
    portfolioItems: portfolio.slice(0, 6).map((i) => ({ id: i.id, title: i.title, category: i.category, date: i.date })),
    lessonsWorked,
    quizzes,
    liveLessons,
    assignments: {
      stats: assignmentStats(studentId),
      recent: assignments.slice(0, 8),
      // Still to do: open work, overdue first.
      pending: assignments.filter((a) => !["submitted", "completed", "reviewed"].includes(a.recipient.status)).sort((a, b) => Number(b.overdue) - Number(a.overdue)),
      done: assignments.filter((a) => ["submitted", "completed", "reviewed"].includes(a.recipient.status)).slice(0, 8),
    },
    recent: recent.slice(0, 12),
  };
}

export type LearningProfile = ReturnType<typeof learningProfile>;
