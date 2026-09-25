import "server-only";
import { z } from "zod";
import type { Subject } from "@/lib/domain/catalog";
import type { CurrentUser } from "@/lib/auth/session";
import { searchPassages, type RetrievedPassage } from "@/lib/services/materials";
import { getAIProvider, withAIStatus } from "./index";
import { EDUCATIONAL_GUARDRAILS, detectLanguage, languageInstruction } from "./prompts";

/**
 * "Ask the school library": answers questions using ONLY passages retrieved
 * from approved school materials, with numbered citations. When AI is not
 * available the passages themselves are returned — the student still gets a
 * real, sourced result, and the UI says no AI summary was written.
 */
export interface LibraryAnswer {
  mode: "ai" | "passages_only";
  answer: string | null;
  /** True when the model said the materials do not answer the question. */
  notCovered: boolean;
  citations: number[];
  passages: (RetrievedPassage & { index: number })[];
  aiError: boolean;
}

const answerSchema = z.object({
  answer: z.string().describe("Answer grounded only in the passages, citing them like [1] or [2]."),
  covered: z.boolean().describe("False if the passages do not contain the answer."),
  citations: z.array(z.number()).describe("Numbers of the passages actually used."),
});

export async function askLibrary(user: CurrentUser, question: string, subject?: Subject): Promise<LibraryAnswer> {
  const passages = searchPassages(user, question, { subject, limit: 5 }).map((p, i) => ({ ...p, index: i + 1 }));
  const base = { passages, notCovered: passages.length === 0, citations: [] as number[], aiError: false };
  if (passages.length === 0 || !getAIProvider()) return { ...base, mode: "passages_only", answer: null };

  const language = detectLanguage(question);
  try {
    const result = await withAIStatus((ai) =>
      ai.generateObject({
        system: [
          EDUCATIONAL_GUARDRAILS,
          "You answer students' questions using only the numbered passages from the school's approved materials.",
          "If the passages do not answer the question, set covered to false and say so briefly — do not use outside knowledge to fill gaps.",
          "Cite passages inline as [1], [2]. Keep the answer under 150 words and at a level a school student understands.",
          languageInstruction(language),
        ].join("\n\n"),
        prompt: `Question: ${question}\n\nPassages:\n${passages
          .map((p) => `[${p.index}] (${p.materialTitle}${p.page ? `, p. ${p.page}` : ""})\n${p.content}`)
          .join("\n\n")}`,
        schema: answerSchema,
        maxTokens: 3000,
        effort: "low",
        timeoutMs: 45_000,
      }),
    );
    return {
      ...base,
      mode: "ai",
      answer: result.answer.trim(),
      notCovered: !result.covered,
      citations: result.citations.filter((n) => passages.some((p) => p.index === n)),
    };
  } catch {
    return { ...base, mode: "passages_only", answer: null, aiError: true };
  }
}
