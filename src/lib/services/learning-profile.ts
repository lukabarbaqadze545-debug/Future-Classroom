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

export type LabKey = "lessons" | "programming" | "stem" | "research" | "critical" | "library" | "career";

export interface RecentWork {
  lab: LabKey;
  title: string;
  detail: string;
  href: string;
  at: number;
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
  for (const r of listReading(studentId).slice(0, 4)) recent.push({ lab: "library", title: r.title, detail: r.status, href: `/library/${r.resourceId}`, at: r.updatedAt });
  for (const i of portfolio.slice(0, 4)) recent.push({ lab: "career", title: i.title, detail: i.category, href: `/portfolio/${studentId}`, at: i.updatedAt });
  recent.sort((a, b) => b.at - a.at);

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
    assignments: { stats: assignmentStats(studentId), recent: assignments.slice(0, 8) },
    recent: recent.slice(0, 12),
  };
}

export type LearningProfile = ReturnType<typeof learningProfile>;
