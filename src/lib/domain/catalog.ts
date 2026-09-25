/**
 * Static catalogue values shared by server and client.
 * Labels live in the i18n dictionaries; these are only stable identifiers.
 */

export const SUBJECTS = [
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "computer_science",
  "georgian",
  "english",
  "history",
  "geography",
  "civics",
  "economics",
  "arts",
  "engineering",
  "health",
  "career",
  "research",
  "critical_thinking",
  "entrepreneurship",
] as const;
export type Subject = (typeof SUBJECTS)[number];

export const GRADES = [5, 6, 7, 8, 9, 10, 11, 12] as const;

export const DIFFICULTIES = ["foundation", "standard", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const CONTENT_LANGUAGES = ["en", "ka"] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export const ACTIVITY_TYPES = [
  "multiple_choice",
  "short_answer",
  "discussion",
  "exercise",
  "poll",
  "exit_ticket",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Activity types whose answers can be checked automatically. */
export const GRADABLE_ACTIVITY_TYPES: readonly ActivityType[] = [
  "multiple_choice",
  "short_answer",
  "exercise",
];

/** Activity types where students pick from options. */
export const OPTION_ACTIVITY_TYPES: readonly ActivityType[] = ["multiple_choice", "poll"];

export const SECTION_KINDS = [
  "introduction",
  "explanation",
  "example",
  "practice",
  "discussion",
  "summary",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const QUIZ_QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "numerical",
] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const MATERIAL_VISIBILITIES = ["private", "teachers", "students"] as const;
export type MaterialVisibility = (typeof MATERIAL_VISIBILITIES)[number];

export const ROLES = ["student", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Progressive hint ladder. Level 5 (full solution) is only offered when the
 * teacher allows it for that activity.
 */
export const HINT_LEVELS = [1, 2, 3, 4, 5] as const;
export type HintLevel = (typeof HINT_LEVELS)[number];
export const MAX_AUTHORED_HINTS = 4;

export function isSubject(value: string): value is Subject {
  return (SUBJECTS as readonly string[]).includes(value);
}
