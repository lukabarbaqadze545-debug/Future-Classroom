/**
 * Human review of lesson content before classroom use. Internal to teachers:
 * students never see these states.
 *
 * draft → technical (facts, answers, hints checked) → language (Georgian read
 * by a native speaker; skipped for other languages) → subject (a subject
 * teacher approved the pedagogy) → ready (classroom ready).
 */
export const REVIEW_STATUSES = ["draft", "technical", "language", "subject", "ready"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

/** The steps that apply to a lesson in this language (only Georgian lessons get a language review). */
export function reviewSteps(language: string): ReviewStatus[] {
  return REVIEW_STATUSES.filter((s) => s !== "language" || language === "ka");
}

/** The next step after the current one, or null when classroom ready. */
export function nextReviewStatus(current: ReviewStatus, language: string): ReviewStatus | null {
  const steps = reviewSteps(language);
  const index = steps.indexOf(current);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : null;
}

export interface ReviewEntry {
  id: string;
  status: ReviewStatus;
  /** "edited": the lesson was changed after a review and went back to draft. */
  kind: "review" | "edited";
  userName: string | null;
  note: string;
  createdAt: number;
}
