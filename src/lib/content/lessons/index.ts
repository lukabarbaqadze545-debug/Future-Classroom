import type { CuratedLesson } from "@/lib/ai/templates/types";
import { quadraticEn } from "@/lib/ai/templates/quadratic-en";
import { quadraticKa } from "@/lib/ai/templates/quadratic-ka";
import { ecosystemsEn, newtonEn } from "@/lib/ai/templates/science-en";
import { algorithmsEn, mapReadingEn } from "@/lib/ai/templates/other-en";
import { lessonVersions, type BiLesson } from "../bilingual";

/** Bilingual lessons, grouped by subject file. */
const BILINGUAL: BiLesson[] = [];

/**
 * Every lesson that ships with the platform, one record per language. New
 * lessons are added here; `syncBuiltInContent` installs them in every school
 * database (existing ones too) on the next start.
 */
export const BUILT_IN_LESSONS: CuratedLesson[] = [quadraticEn, quadraticKa, newtonEn, algorithmsEn, ecosystemsEn, mapReadingEn, ...BILINGUAL.flatMap(lessonVersions)];
