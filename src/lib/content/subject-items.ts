import "server-only";
import { getDb } from "@/lib/db";
import type { Difficulty, Subject } from "@/lib/domain/catalog";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem } from "@/lib/labs/programming/service";
import { findExercise } from "@/lib/labs/critical/catalog";
import { findExperiment } from "@/lib/labs/stem/experiments";
import { findSimulation } from "@/lib/labs/stem/simulations";
import { findChallengeSet } from "@/lib/labs/stem/service";
import { ROBOTICS_PROJECTS } from "@/lib/labs/stem/robotics";
import { ELECTRONICS_TOPICS } from "@/lib/labs/stem/electronics";
import { PROJECT_TEMPLATES } from "@/lib/labs/stem/projects";
import { CAREERS } from "@/lib/labs/career/careers";
import { getResource } from "@/lib/labs/library/service";
import { inLocale, listPublishedLessons, type LessonSummary } from "@/lib/services/lessons";
import { SUBJECT_CATALOG, type ItemRef, type LabTool, type SubjectEntry } from "./subjects";
import type { ActivityKind, ResolvedItem } from "./subject-kinds";

export type { ActivityKind, ResolvedItem } from "./subject-kinds";

export interface ResolvedTopic {
  id: string;
  name: string;
  items: ResolvedItem[];
}

export interface ResolvedSubject {
  id: Subject;
  entry: SubjectEntry;
  description: string;
  topics: ResolvedTopic[];
  path: ResolvedItem[];
  /** Published lessons written by the school's teachers (not built in). */
  schoolLessons: ResolvedItem[];
  counts: Partial<Record<ActivityKind, number>>;
}

const LEVEL: Record<1 | 2 | 3, Difficulty> = { 1: "foundation", 2: "standard", 3: "advanced" };

const TOOL_HREF: Record<LabTool, string> = {
  research: "/labs/research",
  universities: "/career#universities",
  portfolio: "/career/portfolio",
  skills: "/career#skills",
  goals: "/career#development",
};

interface Context {
  locale: Locale;
  lessonsByGroup: Map<string, LessonSummary>;
  quizByLesson: Map<string, string>;
  toolTitles: Record<LabTool, string>;
}

function lessonContext(locale: Locale, toolTitles: Record<LabTool, string>): Context & { lessons: LessonSummary[] } {
  const lessons = inLocale(listPublishedLessons(), locale);
  const lessonsByGroup = new Map<string, LessonSummary>();
  for (const lesson of lessons) if (lesson.contentGroup) lessonsByGroup.set(lesson.contentGroup, lesson);
  const quizByLesson = new Map(
    (getDb().prepare("SELECT lesson_id, id FROM quizzes WHERE status = 'published' AND lesson_id IS NOT NULL ORDER BY created_at").all() as { lesson_id: string; id: string }[]).map((r) => [r.lesson_id, r.id]),
  );
  return { locale, lessons, lessonsByGroup, quizByLesson, toolTitles };
}

function base(key: string, source: ItemRef["kind"], kinds: ActivityKind[], title: string, href: string, difficulty: Difficulty | null): ResolvedItem {
  return { key, source, kinds, title, href, difficulty, language: null, lessonId: null, lessonOwnerId: null, quizId: null, assign: null, sessionKey: null, status: null };
}

function lessonItem(lesson: LessonSummary, ctx: Context): ResolvedItem {
  const quizId = ctx.quizByLesson.get(lesson.id) ?? null;
  return {
    ...base(`lesson:${lesson.contentGroup ?? lesson.id}`, "lesson", quizId ? ["lesson", "quiz"] : ["lesson"], lesson.title, `/student/learn/${lesson.id}`, lesson.difficulty),
    language: lesson.language !== ctx.locale ? lesson.language : null,
    lessonId: lesson.id,
    lessonOwnerId: lesson.teacherId,
    quizId,
    assign: { kind: "lesson", ref: lesson.id },
  };
}

function resolve(ref: ItemRef, ctx: Context): ResolvedItem | null {
  const t = (value: Parameters<typeof tr>[0]) => tr(value, ctx.locale);
  switch (ref.kind) {
    case "lesson": {
      const lesson = ctx.lessonsByGroup.get(ref.group);
      return lesson ? lessonItem(lesson, ctx) : null;
    }
    case "programming": {
      const p = getProblem(ref.id);
      if (!p) return null;
      return { ...base(`programming:${p.id}`, "programming", ["coding"], t(p.title), `/labs/programming/${p.id}`, LEVEL[p.difficulty]), assign: { kind: "programming", ref: p.id }, sessionKey: `programming:${p.id}` };
    }
    case "critical": {
      const e = findExercise(ref.id);
      if (!e) return null;
      return { ...base(`critical:${e.id}`, "critical", ["exercise"], t(e.title), `/labs/critical-thinking/${e.id}`, LEVEL[e.difficulty]), assign: { kind: "critical", ref: e.id }, sessionKey: `critical:${e.id}` };
    }
    case "experiment": {
      const e = findExperiment(ref.id);
      if (!e) return null;
      return { ...base(`experiment:${e.id}`, "experiment", ["experiment"], t(e.title), `/labs/stem/experiments/${e.id}`, LEVEL[e.difficulty]), assign: { kind: "experiment", ref: e.id }, sessionKey: `experiment:${e.id}` };
    }
    case "simulation": {
      const s = findSimulation(ref.id);
      if (!s) return null;
      return { ...base(`simulation:${s.id}`, "simulation", ["simulation"], t(s.title), `/labs/stem/simulations/${s.id}`, LEVEL[s.difficulty]), assign: { kind: "simulation", ref: s.id }, sessionKey: `simulation:${s.id}` };
    }
    case "challenge": {
      const c = findChallengeSet(ref.id);
      if (!c) return null;
      return { ...base(`challenge:${c.id}`, "challenge", ["exercise"], t(c.title), `/labs/stem/challenges/${c.id}`, LEVEL[c.difficulty]), assign: { kind: "stem_challenge", ref: c.id }, sessionKey: `challenge:${c.id}` };
    }
    case "robotics": {
      const r = ROBOTICS_PROJECTS.find((x) => x.id === ref.id);
      return r ? base(`robotics:${r.id}`, "robotics", ["project"], t(r.title), `/labs/stem/robotics/${r.id}`, LEVEL[r.difficulty]) : null;
    }
    case "electronics": {
      const e = ELECTRONICS_TOPICS.find((x) => x.id === ref.id);
      return e ? base(`electronics:${e.id}`, "electronics", ["reading"], t(e.title), "/labs/stem#electronics", null) : null;
    }
    case "project": {
      const p = PROJECT_TEMPLATES.find((x) => x.id === ref.id);
      return p ? { ...base(`project:${p.id}`, "project", ["project"], t(p.title), "/labs/stem#projects", LEVEL[p.difficulty]), assign: { kind: "stem_project", ref: p.id } } : null;
    }
    case "library": {
      const r = getResource(ref.id);
      if (!r) return null;
      const language = r.language === "en" || r.language === "ka" ? r.language : null;
      return { ...base(`library:${r.id}`, "library", ["reading"], r.title, `/library/${r.id}`, null), language: language && language !== ctx.locale ? language : null, assign: { kind: "library", ref: r.id } };
    }
    case "career": {
      const c = CAREERS.find((x) => x.id === ref.id);
      return c ? base(`career:${c.id}`, "career", ["career"], t(c.title), `/career/careers/${c.id}`, null) : null;
    }
    case "tool":
      return base(`tool:${ref.id}`, "tool", ref.id === "research" ? ["project"] : ["career"], ctx.toolTitles[ref.id], TOOL_HREF[ref.id], null);
  }
}

/** Progress markers for one student, looked up in bulk. */
function applyStatus(items: ResolvedItem[], studentId: string) {
  const db = getDb();
  const set = (sql: string, ...params: unknown[]) => new Set((db.prepare(sql).all(...params) as { k: string }[]).map((r) => r.k));
  const lessonsDone = set("SELECT DISTINCT lesson_id AS k FROM learning_events WHERE user_id = ? AND kind IN ('practice','quiz','session') AND lesson_id IS NOT NULL", studentId);
  const lessonsSeen = set("SELECT DISTINCT lesson_id AS k FROM learning_events WHERE user_id = ? AND lesson_id IS NOT NULL", studentId);
  const solved = set("SELECT DISTINCT problem_id AS k FROM programming_submissions WHERE user_id = ? AND verdict IN ('accepted','correct')", studentId);
  const tried = set("SELECT DISTINCT problem_id AS k FROM programming_submissions WHERE user_id = ?", studentId);
  const ct = set("SELECT DISTINCT exercise_id AS k FROM ct_attempts WHERE user_id = ?", studentId);
  const records = new Map((db.prepare("SELECT item_kind || ':' || item_id AS k, status FROM stem_records WHERE user_id = ?").all(studentId) as { k: string; status: string }[]).map((r) => [r.k, r.status]));
  const reading = new Map((db.prepare("SELECT resource_id AS k, status FROM reading_progress WHERE user_id = ?").all(studentId) as { k: string; status: string }[]).map((r) => [r.k, r.status]));
  for (const item of items) {
    const id = item.key.slice(item.key.indexOf(":") + 1);
    switch (item.source) {
      case "lesson":
        item.status = item.lessonId && lessonsDone.has(item.lessonId) ? "done" : item.lessonId && lessonsSeen.has(item.lessonId) ? "started" : null;
        break;
      case "programming":
        item.status = solved.has(id) ? "done" : tried.has(id) ? "started" : null;
        break;
      case "critical":
        item.status = ct.has(id) ? "done" : null;
        break;
      case "experiment":
      case "simulation":
      case "challenge": {
        const status = records.get(`${item.source}:${id}`);
        item.status = status === "submitted" || (status && item.source !== "experiment") ? "done" : status ? "started" : null;
        break;
      }
      case "library": {
        const status = reading.get(id);
        item.status = status === "finished" ? "done" : status ? "started" : null;
        break;
      }
    }
  }
}

function countKinds(items: ResolvedItem[]): Partial<Record<ActivityKind, number>> {
  const counts: Partial<Record<ActivityKind, number>> = {};
  for (const item of items) for (const kind of item.kinds) counts[kind] = (counts[kind] ?? 0) + 1;
  return counts;
}

function resolveSubject(entry: SubjectEntry, ctx: Context & { lessons: LessonSummary[] }): ResolvedSubject {
  const seen = new Map<string, ResolvedItem>();
  const one = (ref: ItemRef) => {
    const item = resolve(ref, ctx);
    if (!item) return null;
    // The same item object everywhere, so progress is applied once.
    const existing = seen.get(item.key);
    if (existing) return existing;
    seen.set(item.key, item);
    return item;
  };
  const topics = entry.topics
    .map((topic) => ({ id: topic.id, name: tr(topic.name, ctx.locale), items: topic.items.map(one).filter((i): i is ResolvedItem => i !== null) }))
    .filter((topic) => topic.items.length > 0);
  const path = entry.path.map(one).filter((i): i is ResolvedItem => i !== null);
  const schoolLessons = ctx.lessons.filter((lesson) => lesson.subject === entry.id && !lesson.contentGroup).map((lesson) => lessonItem(lesson, ctx));
  const all = [...seen.values(), ...schoolLessons];
  return { id: entry.id, entry, description: tr(entry.description, ctx.locale), topics, path, schoolLessons, counts: countKinds(all) };
}

/** Every subject with its resolved items, for the catalogue page. */
export function resolveCatalog(locale: Locale, toolTitles: Record<LabTool, string>): ResolvedSubject[] {
  const ctx = lessonContext(locale, toolTitles);
  return SUBJECT_CATALOG.map((entry) => resolveSubject(entry, ctx));
}

/** One subject, with a student's progress markers when a student id is given. */
export function resolveSubjectPage(entry: SubjectEntry, locale: Locale, toolTitles: Record<LabTool, string>, studentId: string | null): ResolvedSubject {
  const ctx = lessonContext(locale, toolTitles);
  const subject = resolveSubject(entry, ctx);
  if (studentId) {
    const unique = new Map<string, ResolvedItem>();
    for (const item of [...subject.topics.flatMap((t) => t.items), ...subject.path, ...subject.schoolLessons]) unique.set(item.key, item);
    applyStatus([...unique.values()], studentId);
  }
  return subject;
}

/** References that do not resolve against the built-in content (for tests). */
export function unresolvedReferences(): string[] {
  const ctx = lessonContext("en", { research: "", universities: "", portfolio: "", skills: "", goals: "" });
  const missing: string[] = [];
  for (const entry of SUBJECT_CATALOG) {
    for (const ref of [...entry.topics.flatMap((t) => t.items), ...entry.path]) {
      if (!resolve(ref, ctx)) missing.push(`${entry.id}: ${JSON.stringify(ref)}`);
    }
  }
  return missing;
}
