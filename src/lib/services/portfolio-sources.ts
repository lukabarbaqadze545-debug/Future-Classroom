import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem } from "@/lib/labs/programming/service";
import { findExperiment } from "@/lib/labs/stem/experiments";
import { findSimulation } from "@/lib/labs/stem/simulations";
import { findChallengeSet, getProjectFor, getRecordFor } from "@/lib/labs/stem/service";
import { createPortfolioItem, findPortfolioItemBySource, todayIso, type PortfolioItem, type PortfolioItemInput, type PortfolioSource } from "./portfolio";

/*
 * Cross-module bridge: a solved problem, a STEM project or record, or a
 * research project becomes a portfolio item with a sensible draft that the
 * student can edit afterwards. Only the owner's own work can be added.
 */

type Draft = Omit<PortfolioItemInput, "date"> & { date?: string };
type DraftBuilder = (user: CurrentUser, id: string, locale: Locale) => Draft;

const LABELS = {
  solved: { en: "Solved the programming problem “{title}” (level {level}) in {language}.", ka: "ამოვხსენი პროგრამირების ამოცანა „{title}“ ({level} დონე), ენა: {language}." },
  experiment: { en: "Carried out the classroom experiment “{title}” and recorded predictions, data and conclusions.", ka: "ჩავატარე საკლასო ექსპერიმენტი „{title}“ და ჩავიწერე ვარაუდები, მონაცემები და დასკვნები." },
  challenge: { en: "Completed “{title}” in the STEM Lab ({score}/{max}).", ka: "შევასრულე „{title}“ STEM ლაბორატორიაში ({score}/{max})." },
};

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
}

const builders: Partial<Record<PortfolioSource, DraftBuilder>> = {
  programming(user, id, locale) {
    const problem = getProblem(id);
    if (!problem) throw new ApiError(404, "not_found");
    const solved = getDb()
      .prepare("SELECT language, created_at FROM programming_submissions WHERE user_id = ? AND problem_id = ? AND verdict IN ('accepted','correct') ORDER BY created_at LIMIT 1")
      .get(user.id, id) as { language: string; created_at: number } | undefined;
    if (!solved) throw new ApiError(400, "invalid_input", "Solve the problem first.");
    return {
      title: tr(problem.title, locale),
      category: "programming",
      date: todayIso(solved.created_at),
      description: fill(LABELS.solved[locale], { title: tr(problem.title, locale), level: problem.level, language: solved.language === "cpp" ? "C++" : "Python" }),
      link: "",
      evidence: `/labs/programming/${id}`,
      skills: ["programming", "problem_solving"],
      reflection: "",
    };
  },
  stem_project(user, id) {
    const project = getProjectFor(id, user);
    if (project.userId !== user.id) throw new ApiError(403, "forbidden");
    return {
      title: project.title,
      category: "stem",
      date: todayIso(project.updatedAt),
      description: [project.data.problem, project.data.solution].filter(Boolean).join("\n\n").slice(0, 4000),
      link: "",
      evidence: `/labs/stem/projects/${id}`,
      skills: ["engineering_design", "problem_solving", "creativity"],
      reflection: project.data.reflection.slice(0, 4000),
    };
  },
  stem_record(user, id, locale) {
    const record = getRecordFor(id, user);
    if (record.userId !== user.id) throw new ApiError(403, "forbidden");
    const experiment = record.itemKind === "experiment" ? findExperiment(record.itemId) : null;
    const title = experiment?.title ?? (record.itemKind === "simulation" ? findSimulation(record.itemId)?.title : findChallengeSet(record.itemId)?.title);
    if (!title) throw new ApiError(404, "not_found");
    const data = record.data as { conclusion?: string };
    return {
      title: tr(title, locale),
      category: "stem",
      date: todayIso(record.updatedAt),
      description: experiment
        ? fill(LABELS.experiment[locale], { title: tr(title, locale) })
        : fill(LABELS.challenge[locale], { title: tr(title, locale), score: record.score ?? 0, max: record.maxScore ?? 0 }),
      link: "",
      evidence: experiment ? `/labs/stem/experiments/${record.itemId}` : `/labs/stem/${record.itemKind === "simulation" ? "simulations" : "challenges"}/${record.itemId}`,
      skills: experiment ? ["scientific_inquiry", "data_analysis"] : ["problem_solving", "math_reasoning"],
      reflection: (data.conclusion ?? "").slice(0, 4000),
    };
  },
};

export function addToPortfolioFromSource(user: CurrentUser, kind: PortfolioSource, id: string, locale: Locale): { item: PortfolioItem; created: boolean } {
  const existing = findPortfolioItemBySource(user.id, kind, id);
  if (existing) return { item: existing, created: false };
  const builder = builders[kind];
  if (!builder) throw new ApiError(400, "invalid_input");
  const draft = builder(user, id, locale);
  const item = createPortfolioItem(user, { ...draft, date: draft.date ?? todayIso() }, { kind, id });
  return { item, created: true };
}
