import { clip } from "./language";
import type { KnowledgeType } from "./knowledge";

/**
 * Questions worth asking about a topic, built from the material's own
 * definitions, formulas, claims and sections. The platform supplies the
 * shape of the question (localised in the interface); the words inside it
 * come from the material, so nothing here is invented.
 */

export const QUESTION_KINDS = ["meaning", "own_example", "formula_parts", "evidence_for", "compare", "objection", "main_idea", "not_covered"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

export interface SuggestedQuestion {
  kind: QuestionKind;
  /** The words from the material the question is about. */
  subject: string;
  /** Index of the passage the question comes from, when it comes from one. */
  passage: number | null;
}

export interface QuestionSource {
  type: KnowledgeType;
  term: string | null;
  content: string;
  section: string | null;
  passage: number | null;
}

const FORMULA_TEXT = /[A-Za-zΔΣπλ][A-Za-z₀-₉²³]*\s*=\s*[^,;:.。]*[^\s,;:.]/u;

export function formulaIn(sentence: string): string | null {
  const match = FORMULA_TEXT.exec(sentence);
  return match ? match[0].trim() : null;
}

export function suggestQuestions(items: readonly QuestionSource[], sections: readonly { title: string; passage: number }[], limit = 6): SuggestedQuestion[] {
  const out: SuggestedQuestion[] = [];
  const seen = new Set<string>();
  const add = (question: SuggestedQuestion) => {
    const key = `${question.kind}:${question.subject.toLowerCase()}`;
    if (seen.has(key) || !question.subject.trim()) return;
    seen.add(key);
    out.push(question);
  };

  const definitions = items.filter((i) => i.type === "definition" && i.term);
  for (const item of definitions.slice(0, 2)) add({ kind: "meaning", subject: item.term!, passage: item.passage });
  const formula = items.map((i) => (i.type === "formula" ? { f: formulaIn(i.content), passage: i.passage } : null)).find((x) => x?.f);
  if (formula?.f) add({ kind: "formula_parts", subject: formula.f, passage: formula.passage });
  const claim = items.find((i) => i.type === "claim" || i.type === "argument");
  if (claim) add({ kind: "evidence_for", subject: clip(claim.content, 140), passage: claim.passage });
  const distinction = items.find((i) => i.type === "distinction");
  if (distinction) add({ kind: "compare", subject: clip(distinction.content, 140), passage: distinction.passage });
  else if (definitions.length >= 2) add({ kind: "compare", subject: `${definitions[0].term} / ${definitions[1].term}`, passage: definitions[0].passage });
  const objection = items.find((i) => i.type === "objection" || i.type === "counterargument");
  if (objection) add({ kind: "objection", subject: clip(objection.content, 140), passage: objection.passage });
  if (definitions[0]) add({ kind: "own_example", subject: definitions[0].term!, passage: definitions[0].passage });
  for (const section of sections) {
    if (out.length >= limit - 1) break;
    add({ kind: "main_idea", subject: section.title, passage: section.passage });
  }
  return out.slice(0, limit - 1);
}
