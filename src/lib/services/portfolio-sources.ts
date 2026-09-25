import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem } from "@/lib/labs/programming/service";
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
