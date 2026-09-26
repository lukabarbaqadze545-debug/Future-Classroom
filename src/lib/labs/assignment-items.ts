import "server-only";
import type { Locale } from "@/lib/i18n/config";
import { getDb } from "@/lib/db";
import { inLocale, listPublishedLessons } from "@/lib/services/lessons";
import { listPublishedQuizzes } from "@/lib/services/quizzes";
import type { AssignmentKind } from "./registry";
import { tr } from "./localized";
import { listProblems } from "./programming/service";
import { CT_EXERCISES } from "./critical/catalog";
import { EXPERIMENTS } from "./stem/experiments";
import { SIMULATIONS } from "./stem/simulations";
import { CHALLENGE_SETS } from "./stem/service";
import { PROJECT_TEMPLATES } from "./stem/projects";
import { listResources } from "./library/service";
import { resolveActivity } from "./activity-links";

export interface AssignableItem {
  id: string;
  title: string;
  group?: string;
}

/** Everything a teacher can assign, per kind (for the assignment form). */
export function assignableItems(locale: Locale): Record<AssignmentKind, AssignableItem[]> {
  return {
    programming: listProblems().map((p) => ({ id: p.id, title: tr(p.title, locale), group: `L${p.level}` })),
    critical: CT_EXERCISES.map((e) => ({ id: e.id, title: tr(e.title, locale) })),
    experiment: EXPERIMENTS.map((e) => ({ id: e.id, title: tr(e.title, locale) })),
    simulation: SIMULATIONS.map((s) => ({ id: s.id, title: tr(s.title, locale) })),
    stem_challenge: CHALLENGE_SETS.map((c) => ({ id: c.id, title: tr(c.title, locale) })),
    stem_project: PROJECT_TEMPLATES.map((t) => ({ id: t.id, title: tr(t.title, locale) })),
    research: [],
    library: listResources().map((r) => ({ id: r.id, title: r.title })),
    portfolio: [],
    lesson: inLocale(listPublishedLessons(), locale).map((l) => ({ id: l.id, title: l.title })),
    quiz: inLocale(listPublishedQuizzes(), locale).map((q) => ({ id: q.id, title: q.title })),
    custom: [],
  };
}

/** Title and link of the assigned item (null for "any work" assignments). */
export function assignedItem(kind: AssignmentKind, refId: string | null, locale: Locale): { title: string; href: string } | null {
  if (!refId) {
    if (kind === "research") return { title: "", href: "/labs/research" };
    if (kind === "portfolio") return { title: "", href: "/career/portfolio" };
    if (kind === "stem_project") return { title: "", href: "/labs/stem#projects" };
    return null;
  }
  switch (kind) {
    case "programming":
    case "critical":
    case "experiment":
    case "simulation":
      return resolveActivity(kind, refId, locale);
    case "stem_challenge":
      return resolveActivity("challenge", refId, locale);
    case "stem_project": {
      const t = PROJECT_TEMPLATES.find((x) => x.id === refId);
      return t ? { title: tr(t.title, locale), href: "/labs/stem#projects" } : null;
    }
    case "library": {
      const r = listResources().find((x) => x.id === refId);
      return r ? { title: r.title, href: `/library/${refId}` } : null;
    }
    case "lesson": {
      const l = getDb().prepare("SELECT title FROM lessons WHERE id = ?").get(refId) as { title: string } | undefined;
      return l ? { title: l.title, href: `/student/learn/${refId}` } : null;
    }
    case "quiz": {
      const q = getDb().prepare("SELECT title FROM quizzes WHERE id = ?").get(refId) as { title: string } | undefined;
      return q ? { title: q.title, href: `/student/quizzes/${refId}` } : null;
    }
    default:
      return null;
  }
}

/** Where a teacher (or the student) can open the handed-in work. */
export function workHref(kind: AssignmentKind, refId: string | null, workRef: string | null, studentId: string): string | null {
  if (!workRef) return null;
  switch (kind) {
    case "programming":
      return `/labs/programming/submissions/${workRef}`;
    case "critical":
      return refId ? `/labs/critical-thinking/${refId}?attempt=${workRef}` : null;
    case "experiment":
    case "simulation":
    case "stem_challenge":
      return `/labs/stem/records/${workRef}`;
    case "stem_project":
      return `/labs/stem/projects/${workRef}`;
    case "research":
      return `/labs/research/${workRef}`;
    case "portfolio":
      return `/portfolio/${studentId}`;
    case "library":
      return `/library/${workRef}`;
    default:
      return null;
  }
}

/** The student's own works that can be handed in for an open-work assignment. */
export function ownWorks(kind: AssignmentKind, studentId: string, refId: string | null): { id: string; title: string }[] {
  const db = getDb();
  if (kind === "research") return db.prepare("SELECT id, title FROM research_projects WHERE user_id = ? ORDER BY updated_at DESC").all(studentId) as { id: string; title: string }[];
  if (kind === "stem_project") {
    return (refId
      ? db.prepare("SELECT id, title FROM stem_projects WHERE user_id = ? AND template_id = ? ORDER BY updated_at DESC").all(studentId, refId)
      : db.prepare("SELECT id, title FROM stem_projects WHERE user_id = ? ORDER BY updated_at DESC").all(studentId)) as { id: string; title: string }[];
  }
  if (kind === "portfolio") return db.prepare("SELECT id, title FROM portfolio_items WHERE user_id = ? ORDER BY item_date DESC").all(studentId) as { id: string; title: string }[];
  return [];
}
