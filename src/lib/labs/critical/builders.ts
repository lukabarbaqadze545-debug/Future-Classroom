import type { L } from "../localized";
import { BIAS_CARDS, FALLACY_CARDS } from "./concepts";
import type { BiasId, ChoiceItem, FallacyId, MultiItem, TagItem, TagRole } from "./types";

/** Small deterministic hash so option order is stable but not predictable. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffled<T extends { id: string }>(seed: string, options: T[]): T[] {
  return [...options].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
}

export function choice(
  id: string,
  prompt: L,
  options: [string, L][],
  correct: string,
  explanation: L,
  extra: { context?: L; better?: L; tag?: string } = {},
): ChoiceItem {
  return { type: "choice", id, prompt, options: options.map(([oid, text]) => ({ id: oid, text })), correct, explanation, ...extra };
}

export function multi(id: string, prompt: L, options: [L, boolean][], explanation: L, context?: L): MultiItem {
  return {
    type: "multi",
    id,
    prompt,
    context,
    options: shuffled(
      id,
      options.map(([text, correct], i) => ({ id: `o${i + 1}`, text, correct })),
    ),
    explanation,
  };
}

export function tags(id: string, prompt: L, segments: [TagRole, L][], explanation: L): TagItem {
  return { type: "tag", id, prompt, segments: segments.map(([role, text], i) => ({ id: `s${i + 1}`, role, text })), explanation };
}

const WHICH_FALLACY: L = { en: "Which fallacy is this?", ka: "რომელი ლოგიკური შეცდომაა ეს?" };
const WHICH_BIAS: L = { en: "Which bias is at work here?", ka: "რომელი მიკერძოება მოქმედებს აქ?" };

export function fallacyItem(id: string, context: L, correct: FallacyId, distractors: [FallacyId, FallacyId, FallacyId], explanation: L, better: L): ChoiceItem {
  const options = shuffled(
    id,
    [correct, ...distractors].map((f) => ({ id: f, text: FALLACY_CARDS.find((c) => c.id === f)!.name })),
  );
  return { type: "choice", id, prompt: WHICH_FALLACY, context, options, correct, explanation, better, tag: correct };
}

export function biasItem(id: string, context: L, correct: BiasId, distractors: [BiasId, BiasId, BiasId], explanation: L): ChoiceItem {
  const options = shuffled(
    id,
    [correct, ...distractors].map((b) => ({ id: b, text: BIAS_CARDS.find((c) => c.id === b)!.name })),
  );
  return { type: "choice", id, prompt: WHICH_BIAS, context, options, correct, explanation, tag: correct };
}
