/**
 * The six laboratories of the Future Classroom. Each has its own accent
 * colour (defined in globals.css) but shares the platform's components.
 */
export const LAB_IDS = ["programming", "stem", "research", "critical", "library", "career"] as const;
export type LabId = (typeof LAB_IDS)[number];

export const LAB_ROUTES: Record<LabId, string> = {
  programming: "/labs/programming",
  stem: "/labs/stem",
  research: "/labs/research",
  critical: "/labs/critical-thinking",
  library: "/library",
  career: "/career",
};

/** Things a teacher can assign. `ref` identifies the item inside its lab. */
export const ASSIGNMENT_KINDS = [
  "programming",
  "experiment",
  "simulation",
  "stem_challenge",
  "stem_project",
  "research",
  "critical",
  "library",
  "portfolio",
  "lesson",
  "quiz",
  "custom",
] as const;
export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number];

export const ASSIGNMENT_LAB: Record<AssignmentKind, LabId | "lessons" | "custom"> = {
  programming: "programming",
  experiment: "stem",
  simulation: "stem",
  stem_challenge: "stem",
  stem_project: "stem",
  research: "research",
  critical: "critical",
  library: "library",
  portfolio: "career",
  lesson: "lessons",
  quiz: "lessons",
  custom: "custom",
};

/** Kinds completed automatically by the lab (vs. submitted by the student for review). */
export const AUTO_CHECKED_KINDS: readonly AssignmentKind[] = ["programming", "critical", "simulation", "stem_challenge", "quiz"];
/** Kinds where the student chooses which of their own works to hand in. */
export const OPEN_WORK_KINDS: readonly AssignmentKind[] = ["stem_project", "research", "portfolio", "custom"];
