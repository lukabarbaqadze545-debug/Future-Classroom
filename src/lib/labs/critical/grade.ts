import { z } from "zod";
import type { L } from "../localized";
import type { CtExercise, CtItem, DecisionExercise, HumilityExercise, ItemExercise, TagRole } from "./types";
import { TAG_ROLES } from "./types";

/*
 * Deterministic feedback for every critical-thinking exercise. No AI: item
 * answers are compared with the answer key, and written work is checked
 * against a transparent checklist (structure, not truth).
 */

// ---------------------------------------------------------------- Answers

const text = (max = 2000) => z.string().max(max).default("");

export const itemAnswersSchema = z.object({
  items: z.record(z.string().max(40), z.union([z.string().max(40), z.array(z.string().max(40)).max(20), z.record(z.string().max(10), z.enum(TAG_ROLES))])).default({}),
});

export const EVIDENCE_TYPES = ["statistic", "study", "expert", "document", "example", "personal"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
const STRONG_EVIDENCE: EvidenceType[] = ["statistic", "study", "expert", "document"];

export const builderAnswersSchema = z.object({
  questionId: z.string().max(40),
  claim: text(),
  reasons: z.array(z.object({ text: text(), evidence: text(), evidenceType: z.enum(EVIDENCE_TYPES).default("example") })).max(5).default([]),
  counter: text(),
  rebuttal: text(),
  conclusion: text(),
});

export const debateAnswersSchema = z.object({
  side: z.enum(["for", "against"]),
  arguments: z.array(z.object({ point: text(), support: text() })).max(5).default([]),
  steelman: text(),
  rebuttal: text(),
  switched: text(),
});

export const humilityAnswersSchema = z.object({
  ratings: z.record(z.string().max(20), z.object({ before: z.number().min(0).max(100), after: z.number().min(0).max(100) })).default({}),
  belief: text(),
  changeMind: text(),
  opposing: text(),
});

export const decisionAnswersSchema = z.object({
  options: z.array(z.string().trim().max(120)).min(1).max(6),
  criteria: z.array(z.object({ name: z.string().trim().max(120), weight: z.number().int().min(1).max(5) })).min(1).max(8),
  scores: z.array(z.array(z.number().int().min(0).max(5)).max(8)).max(6),
  reflection: text(),
});

export type ItemAnswers = z.infer<typeof itemAnswersSchema>;
export type BuilderAnswers = z.infer<typeof builderAnswersSchema>;
export type DebateAnswers = z.infer<typeof debateAnswersSchema>;
export type HumilityAnswers = z.infer<typeof humilityAnswersSchema>;
export type DecisionAnswers = z.infer<typeof decisionAnswersSchema>;

export function answersSchemaFor(kind: CtExercise["kind"]) {
  switch (kind) {
    case "builder":
      return builderAnswersSchema;
    case "debate":
      return debateAnswersSchema;
    case "humility":
      return humilityAnswersSchema;
    case "decision":
      return decisionAnswersSchema;
    default:
      return itemAnswersSchema;
  }
}

// ---------------------------------------------------------------- Results

export interface ItemFeedback {
  id: string;
  type: CtItem["type"];
  correct: boolean;
  points: number;
  max: number;
  /** The correct answer, revealed after submitting. */
  answer: string | string[] | Record<string, TagRole>;
  given: string | string[] | Record<string, TagRole> | null;
  explanation: L;
  better?: L;
  tag?: string;
}

/** Checklist ids map to localized messages in the dictionary. */
export type CheckId =
  | "claim_clear"
  | "two_reasons"
  | "evidence_each"
  | "evidence_strong"
  | "counter"
  | "rebuttal"
  | "conclusion"
  | "no_absolutes"
  | "respectful"
  | "three_arguments"
  | "supported"
  | "steelman"
  | "switched"
  | "belief"
  | "change_mind"
  | "opposing"
  | "options"
  | "criteria"
  | "all_scored"
  | "reflection";

export interface CheckFeedback {
  id: CheckId;
  met: boolean;
  /** Words that triggered the check (e.g. absolute words), shown to the student. */
  found?: string[];
}

export interface ScenarioFeedback {
  id: string;
  before: number;
  after: number;
  direction: "up" | "down" | "none";
  ok: boolean;
  explanation: L;
}

export interface DecisionSummary {
  totals: { option: string; total: number; max: number }[];
  winner: string | null;
  close: boolean;
}

export interface CtResult {
  score: number;
  max: number;
  items?: ItemFeedback[];
  checks?: CheckFeedback[];
  scenarios?: ScenarioFeedback[];
  decision?: DecisionSummary;
}

// ---------------------------------------------------------------- Helpers

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

const ABSOLUTE_WORDS = [
  "always",
  "never",
  "everyone",
  "everybody",
  "nobody",
  "no one",
  "all",
  "none",
  "everything",
  "nothing",
  "completely",
  "totally",
  "ყოველთვის",
  "არასდროს",
  "არასოდეს",
  "ყველა",
  "ყველას",
  "ყველაფერი",
  "არავინ",
  "არაფერი",
  "სრულიად",
  "აბსოლუტურად",
];

const DISRESPECTFUL_WORDS = ["stupid", "idiot", "idiotic", "dumb", "moron", "pathetic", "shut up", "სულელი", "სულელური", "იდიოტი", "ბრიყვი", "დებილი", "სისულელე"];

function findWords(value: string, words: string[]): string[] {
  const lower = value.toLowerCase();
  return words.filter((w) => new RegExp(`(^|[^\\p{L}])${w.replace(/ /g, "\\s+")}($|[^\\p{L}])`, "u").test(lower));
}

export function absoluteWords(value: string): string[] {
  return findWords(value, ABSOLUTE_WORDS);
}

export function disrespectfulWords(value: string): string[] {
  return findWords(value, DISRESPECTFUL_WORDS);
}

function scoreOf(checks: CheckFeedback[]) {
  return { score: checks.filter((c) => c.met).length, max: checks.length };
}

// ---------------------------------------------------------------- Graders

export function gradeItems(exercise: ItemExercise, answers: ItemAnswers): CtResult {
  const items: ItemFeedback[] = exercise.items.map((item) => {
    const given = answers.items[item.id] ?? null;
    if (item.type === "choice") {
      const correct = given === item.correct;
      return { id: item.id, type: item.type, correct, points: correct ? 1 : 0, max: 1, answer: item.correct, given, explanation: item.explanation, better: item.better, tag: item.tag };
    }
    if (item.type === "multi") {
      const selected = new Set(Array.isArray(given) ? given : []);
      const right = item.options.filter((o) => o.correct).map((o) => o.id);
      const correct = item.options.every((o) => selected.has(o.id) === o.correct);
      return { id: item.id, type: item.type, correct, points: correct ? 1 : 0, max: 1, answer: right, given: [...selected], explanation: item.explanation, tag: item.tag };
    }
    const map = given && typeof given === "object" && !Array.isArray(given) ? (given as Record<string, TagRole>) : {};
    const key = Object.fromEntries(item.segments.map((s) => [s.id, s.role])) as Record<string, TagRole>;
    const points = item.segments.filter((s) => map[s.id] === s.role).length;
    return { id: item.id, type: item.type, correct: points === item.segments.length, points, max: item.segments.length, answer: key, given: map, explanation: item.explanation, tag: item.tag };
  });
  return { score: items.reduce((s, i) => s + i.points, 0), max: items.reduce((s, i) => s + i.max, 0), items };
}

export function gradeBuilder(answers: BuilderAnswers): CtResult {
  const reasons = answers.reasons.filter((r) => wordCount(r.text) > 0);
  const absolutes = absoluteWords(`${answers.claim} ${answers.conclusion}`);
  const rude = disrespectfulWords([answers.claim, answers.counter, answers.rebuttal, answers.conclusion, ...answers.reasons.flatMap((r) => [r.text, r.evidence])].join(" "));
  const checks: CheckFeedback[] = [
    { id: "claim_clear", met: wordCount(answers.claim) >= 5 },
    { id: "two_reasons", met: reasons.filter((r) => wordCount(r.text) >= 4).length >= 2 },
    { id: "evidence_each", met: reasons.length > 0 && reasons.every((r) => wordCount(r.evidence) >= 4) },
    { id: "evidence_strong", met: reasons.some((r) => wordCount(r.evidence) >= 4 && STRONG_EVIDENCE.includes(r.evidenceType)) },
    { id: "counter", met: wordCount(answers.counter) >= 5 },
    { id: "rebuttal", met: wordCount(answers.rebuttal) >= 5 },
    { id: "conclusion", met: wordCount(answers.conclusion) >= 5 },
    { id: "no_absolutes", met: absolutes.length === 0, found: absolutes },
    { id: "respectful", met: rude.length === 0, found: rude },
  ];
  return { ...scoreOf(checks), checks };
}

export function gradeDebate(answers: DebateAnswers): CtResult {
  const args = answers.arguments.filter((a) => wordCount(a.point) > 0);
  const rude = disrespectfulWords([answers.steelman, answers.rebuttal, answers.switched, ...answers.arguments.flatMap((a) => [a.point, a.support])].join(" "));
  const checks: CheckFeedback[] = [
    { id: "three_arguments", met: args.filter((a) => wordCount(a.point) >= 5).length >= 3 },
    { id: "supported", met: args.length >= 3 && args.every((a) => wordCount(a.support) >= 5) },
    { id: "steelman", met: wordCount(answers.steelman) >= 8 },
    { id: "rebuttal", met: wordCount(answers.rebuttal) >= 5 },
    { id: "switched", met: wordCount(answers.switched) >= 5 },
    { id: "respectful", met: rude.length === 0, found: rude },
  ];
  return { ...scoreOf(checks), checks };
}

/** Did the confidence move in the direction the new evidence justifies? */
export function updateIsReasonable(before: number, after: number, direction: "up" | "down" | "none"): boolean {
  if (direction === "none") return Math.abs(after - before) <= 10;
  if (direction === "up") return after - before >= 5 || (before >= 95 && after >= before);
  return before - after >= 5 || (before <= 5 && after <= before);
}

export function gradeHumility(exercise: HumilityExercise, answers: HumilityAnswers): CtResult {
  const scenarios: ScenarioFeedback[] = exercise.scenarios.map((s) => {
    const rating = answers.ratings[s.id];
    const before = rating?.before ?? 50;
    const after = rating?.after ?? before;
    return { id: s.id, before, after, direction: s.direction, ok: rating ? updateIsReasonable(before, after, s.direction) : false, explanation: s.explanation };
  });
  const checks: CheckFeedback[] = [
    { id: "belief", met: wordCount(answers.belief) >= 5 },
    { id: "change_mind", met: wordCount(answers.changeMind) >= 5 },
    { id: "opposing", met: wordCount(answers.opposing) >= 5 },
  ];
  return {
    score: scenarios.filter((s) => s.ok).length + checks.filter((c) => c.met).length,
    max: scenarios.length + checks.length,
    scenarios,
    checks,
  };
}

export function gradeDecision(_exercise: DecisionExercise, answers: DecisionAnswers): CtResult {
  const options = answers.options.map((o) => o.trim());
  const criteria = answers.criteria.filter((c) => c.name.trim());
  const maxTotal = criteria.reduce((s, c) => s + c.weight * 5, 0);
  const totals = options
    .map((option, i) => ({
      option,
      total: answers.criteria.reduce((s, c, j) => (c.name.trim() ? s + c.weight * (answers.scores[i]?.[j] ?? 0) : s), 0),
      max: maxTotal,
    }))
    .filter((t) => t.option);
  const sorted = [...totals].sort((a, b) => b.total - a.total);
  const allScored = options.every((o, i) => !o || answers.criteria.every((c, j) => !c.name.trim() || (answers.scores[i]?.[j] ?? 0) >= 1));
  const checks: CheckFeedback[] = [
    { id: "options", met: totals.length >= 2 },
    { id: "criteria", met: criteria.length >= 3 },
    { id: "all_scored", met: allScored },
    { id: "reflection", met: wordCount(answers.reflection) >= 8 },
  ];
  const winner = allScored && sorted.length ? sorted[0].option : null;
  const close = sorted.length >= 2 && maxTotal > 0 && (sorted[0].total - sorted[1].total) / maxTotal < 0.05;
  return { ...scoreOf(checks), checks, decision: { totals, winner, close } };
}

export function grade(exercise: CtExercise, answers: unknown): CtResult {
  switch (exercise.kind) {
    case "builder":
      return gradeBuilder(builderAnswersSchema.parse(answers));
    case "debate":
      return gradeDebate(debateAnswersSchema.parse(answers));
    case "humility":
      return gradeHumility(exercise, humilityAnswersSchema.parse(answers));
    case "decision":
      return gradeDecision(exercise, decisionAnswersSchema.parse(answers));
    default:
      return gradeItems(exercise, itemAnswersSchema.parse(answers));
  }
}
