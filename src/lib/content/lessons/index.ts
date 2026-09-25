import type { CuratedLesson } from "@/lib/ai/templates/types";
import { quadraticEn } from "@/lib/ai/templates/quadratic-en";
import { quadraticKa } from "@/lib/ai/templates/quadratic-ka";
import { ecosystemsEn, newtonEn } from "@/lib/ai/templates/science-en";
import { algorithmsEn, mapReadingEn } from "@/lib/ai/templates/other-en";
import { lessonVersions, type BiLesson } from "../bilingual";
import { algorithmsKa, ecosystemsKa, mapReadingKa, newtonKa } from "./ka-versions";
import { MATHEMATICS } from "./mathematics";
import { PHYSICS } from "./physics";
import { CHEMISTRY } from "./chemistry";
import { BIOLOGY } from "./biology";
import { COMPUTER_SCIENCE } from "./computer-science";
import { GEORGIAN } from "./georgian";
import { ENGLISH } from "./english";
import { HISTORY } from "./history";
import { GEOGRAPHY } from "./geography";
import { CIVICS } from "./civics";
import { ECONOMICS } from "./economics";
import { CRITICAL_THINKING, RESEARCH_SKILLS } from "./skills";
import { CREATIVE } from "./creative";
import { WELLBEING } from "./wellbeing";

/** Bilingual lessons, one file per subject area. */
const BILINGUAL: BiLesson[] = [
  ...MATHEMATICS,
  ...PHYSICS,
  ...CHEMISTRY,
  ...BIOLOGY,
  ...COMPUTER_SCIENCE,
  ...GEORGIAN,
  ...ENGLISH,
  ...HISTORY,
  ...GEOGRAPHY,
  ...CIVICS,
  ...ECONOMICS,
  ...RESEARCH_SKILLS,
  ...CRITICAL_THINKING,
  ...CREATIVE,
  ...WELLBEING,
];

/**
 * Every lesson that ships with the platform, one record per language. New
 * lessons are added here; `syncBuiltInContent` installs them in every school
 * database (existing ones too) on the next start.
 */
export const BUILT_IN_LESSONS: CuratedLesson[] = [
  quadraticEn,
  quadraticKa,
  newtonEn,
  newtonKa,
  algorithmsEn,
  algorithmsKa,
  ecosystemsEn,
  ecosystemsKa,
  mapReadingEn,
  mapReadingKa,
  ...BILINGUAL.flatMap(lessonVersions),
];

/** Built-in lesson groups (one per lesson, whatever the number of languages). */
export const BUILT_IN_GROUPS = [...new Set(BUILT_IN_LESSONS.map((lesson) => lesson.group))];
