import type { SourceInput } from "./model";

/*
 * Transparent source-quality guidance: the student answers the checklist;
 * the rating only summarises their answers and never claims more.
 */

export type QualityLevel = "strong" | "moderate" | "weak" | "unclear";

export const QUALITY_CHECKS = ["authorKnown", "recent", "evidenceShown", "balanced", "corroborated"] as const;
export type QualityCheck = (typeof QUALITY_CHECKS)[number];

export function sourceQuality(source: Pick<SourceInput, QualityCheck | "primary">): { level: QualityLevel; yes: number; no: number; unsure: number; warnings: QualityCheck[] } {
  const answers = QUALITY_CHECKS.map((k) => source[k]);
  const yes = answers.filter((a) => a === "yes").length;
  const no = answers.filter((a) => a === "no").length;
  const unsure = answers.length - yes - no;
  const warnings = QUALITY_CHECKS.filter((k) => source[k] === "no");
  let level: QualityLevel;
  if (unsure >= 3) level = "unclear";
  else if (source.evidenceShown === "no" || source.authorKnown === "no" || no >= 2) level = "weak";
  else if (yes >= 4) level = "strong";
  else level = "moderate";
  return { level, yes, no, unsure, warnings };
}
