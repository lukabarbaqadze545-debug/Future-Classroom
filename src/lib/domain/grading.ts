import type { Activity, Answer, QuizQuestion } from "./schemas";
import { GRADABLE_ACTIVITY_TYPES } from "./catalog";

/**
 * Answer checking. Kept deliberately forgiving about formatting
 * ("x = 2, 3", "3 and 2", "{2; 3}" are the same answer) and strict about
 * content. Returns null when an answer cannot be checked automatically.
 */

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[“”«»"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?;:]+$/g, "")
    .trim();
}

const NUMBER_WITH_POINT = /-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g;
const NUMBER_WITH_COMMA = /-?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g;

/**
 * Extracts numeric values from an answer ("1/2" → 0.5). With
 * `commaIsDecimal` "2,5" is read as 2.5 (Georgian convention); otherwise a
 * comma separates values ("2,3" → [2, 3]). Subscripted variable names such as
 * "x1 =" or "x₂=" are ignored.
 */
export function extractNumbers(value: string, commaIsDecimal = false): number[] {
  const cleaned = value
    .replace(/[−–—]/g, "-")
    .replace(/[a-z]\s*_?\s*[0-9₀-₉](?=\s*=)/gi, "x");
  const matches = cleaned.match(commaIsDecimal ? NUMBER_WITH_COMMA : NUMBER_WITH_POINT) ?? [];
  const numbers: number[] = [];
  for (const raw of matches) {
    const normalized = raw.replace(/\s/g, "").replace(",", ".");
    if (normalized.includes("/")) {
      const [a, b] = normalized.split("/").map(Number);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) numbers.push(a / b);
    } else {
      const n = Number(normalized);
      if (Number.isFinite(n)) numbers.push(n);
    }
  }
  return numbers;
}

function sameNumberMultiset(a: number[], b: number[], tolerance = 1e-6): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, i) => Math.abs(value - right[i]) <= tolerance);
}

/**
 * Units a student may write after a number ("20 m/s", "20 მ/წმ", "4 m/s²",
 * "5 ₾"). They are ignored when numbers are compared, in either script.
 */
const UNIT =
  /(?<![\p{L}\d])(?:m\/s[²2]|m\/s|km\/h|მ\/წმ[²2]|მ\/წმ|კმ\/სთ|kg|km|cm|mm|min|m|s|h|g|n|j|w|v|a|ω|კგ|კმ|სმ|მმ|წმ|წთ|სთ|მ|გ|ნ|ჯ|ვტ|ვ|ა|ომი|ლარი|₾|°c|°|%)(?![\p{L}\d])/giu;

export function withoutUnits(value: string): string {
  return value.replace(UNIT, " ");
}

function isMostlyNumeric(value: string): boolean {
  const withoutNumbers = value
    .replace(NUMBER_WITH_COMMA, "")
    .replace(/\b(x|y|t|and|or|და|ან)\b/gi, "")
    .replace(/[\s=,;{}()[\]±]/g, "");
  return withoutNumbers.length <= 3;
}

/** Checks a free-text answer against a list of accepted answers. */
export function matchesAcceptedAnswer(given: string, accepted: string[]): boolean {
  const normalizedGiven = normalizeText(given);
  if (!normalizedGiven) return false;
  for (const candidate of accepted) {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedGiven === normalizedCandidate) return true;
    if (normalizedGiven.replace(/\s/g, "") === normalizedCandidate.replace(/\s/g, "")) return true;
    const [givenNumbers, candidateNumbers] = [withoutUnits(given), withoutUnits(candidate)];
    if (isMostlyNumeric(candidateNumbers) && isMostlyNumeric(givenNumbers)) {
      for (const commaIsDecimal of [false, true]) {
        if (sameNumberMultiset(extractNumbers(givenNumbers, commaIsDecimal), extractNumbers(candidateNumbers, commaIsDecimal))) {
          return true;
        }
      }
    }
  }
  return false;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((value) => set.has(value));
}

export function isActivityGradable(activity: Activity): boolean {
  if (!GRADABLE_ACTIVITY_TYPES.includes(activity.type)) return false;
  if (activity.type === "multiple_choice") return activity.correctOptionIds.length > 0;
  return activity.acceptedAnswers.length > 0;
}

/** Returns true/false for gradable activities, null for open ones. */
export function gradeActivity(activity: Activity, answer: Answer): boolean | null {
  if (!isActivityGradable(activity)) return null;
  if (activity.type === "multiple_choice") {
    return sameIdSet(answer.optionIds, activity.correctOptionIds);
  }
  return matchesAcceptedAnswer(answer.text, activity.acceptedAnswers);
}

export function gradeQuizQuestion(question: QuizQuestion, answer: Answer): boolean {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
      return sameIdSet(answer.optionIds, question.correctOptionIds);
    case "numerical": {
      if (question.numericAnswer === null) return false;
      const target = question.numericAnswer;
      const tolerance = Math.max(question.tolerance, 1e-9);
      return [false, true].some((commaIsDecimal) => {
        const numbers = extractNumbers(withoutUnits(answer.text), commaIsDecimal);
        return numbers.length === 1 && Math.abs(numbers[0] - target) <= tolerance;
      });
    }
    case "short_answer":
      return matchesAcceptedAnswer(answer.text, question.acceptedAnswers);
  }
}

/** Human-readable version of an answer, used in results and mistake review. */
export function describeAnswer(
  answer: Answer,
  options: { id: string; text: string }[],
): string {
  if (answer.optionIds.length > 0) {
    return answer.optionIds
      .map((optionId) => options.find((o) => o.id === optionId)?.text ?? optionId)
      .join(", ");
  }
  return answer.text.trim();
}

export function isAnswerEmpty(answer: Answer): boolean {
  return answer.optionIds.length === 0 && answer.text.trim().length === 0;
}
