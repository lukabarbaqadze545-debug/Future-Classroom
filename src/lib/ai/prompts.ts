import type { ContentLanguage } from "@/lib/domain/catalog";

/** Detects Georgian script so AI output matches the language of the content. */
export function detectLanguage(text: string): ContentLanguage {
  return /[Ⴀ-ჿ]/.test(text) ? "ka" : "en";
}

export function languageInstruction(language: ContentLanguage): string {
  return language === "ka"
    ? "Write everything in Georgian (ქართული). Use standard Georgian school terminology."
    : "Write everything in clear English suitable for the stated grade.";
}

/**
 * Rules shared by every prompt. The platform is used in schools, so content
 * must be accurate, honest about uncertainty, and never fabricate sources.
 */
export const EDUCATIONAL_GUARDRAILS = `
You support teachers and students at a secondary school. Follow these rules strictly:
- Be factually accurate. If a fact depends on the national curriculum, textbook or local context, say that the teacher should verify it rather than guessing.
- Never invent sources, citations, book titles, page numbers, statistics, quotes, people or URLs.
- Keep content age-appropriate, inclusive and free of stereotypes. No unsafe instructions (e.g. dangerous experiments without supervision notes).
- Prefer clear, concrete examples over jargon. Explain reasoning, not only results.
- Mathematical notation: use plain text with ^ for powers (x^2) and * or implicit multiplication; do not use LaTeX.
`.trim();

export const HINT_LEVEL_GUIDE = `
Hint levels (progressive assistance — the student should do the thinking):
1. Conceptual hint: name the idea or principle that applies. Ask a guiding question. Do not start the calculation.
2. More specific hint: point to the exact step or relationship to use, still without doing it.
3. Guided next step: show how to begin the first step and ask the student to continue.
4. Detailed explanation: walk through the method in detail, but leave the final answer for the student.
5. Complete solution: a full worked solution with the final answer and a one-line check.
Never reveal the final answer at levels 1–4.
`.trim();
