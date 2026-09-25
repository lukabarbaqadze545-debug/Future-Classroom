import type { L } from "../localized";

export const CT_TOPICS = [
  "arguments",
  "claims",
  "evidence",
  "assumptions",
  "reasoning",
  "fallacies",
  "biases",
  "media_literacy",
  "misinformation",
  "source_evaluation",
  "debate",
  "decision_making",
  "humility",
] as const;
export type CtTopic = (typeof CT_TOPICS)[number];

/** A–F from the curriculum, plus item sets for biases and sources. */
export const CT_KINDS = ["claim", "builder", "fallacy", "media", "debate", "humility", "bias", "sources", "decision"] as const;
export type CtKind = (typeof CT_KINDS)[number];

export const FALLACIES = [
  "ad_hominem",
  "straw_man",
  "false_dilemma",
  "appeal_to_authority",
  "appeal_to_popularity",
  "hasty_generalization",
  "slippery_slope",
  "circular_reasoning",
  "false_cause",
  "red_herring",
] as const;
export type FallacyId = (typeof FALLACIES)[number];

export const BIASES = ["confirmation", "anchoring", "availability", "survivorship", "sunk_cost", "framing"] as const;
export type BiasId = (typeof BIASES)[number];

export const TAG_ROLES = ["claim", "evidence", "background"] as const;
export type TagRole = (typeof TAG_ROLES)[number];

export interface ChoiceItem {
  type: "choice";
  id: string;
  prompt: L;
  /** Quotation, dialogue or short scenario the question is about. */
  context?: L;
  options: { id: string; text: L }[];
  correct: string;
  explanation: L;
  /** For fallacies: a fairer way to make the same point. */
  better?: L;
  /** Concept tag used for the skill map (e.g. a fallacy id). */
  tag?: string;
}

export interface MultiItem {
  type: "multi";
  id: string;
  prompt: L;
  context?: L;
  options: { id: string; text: L; correct: boolean }[];
  explanation: L;
  tag?: string;
}

export interface TagItem {
  type: "tag";
  id: string;
  prompt: L;
  segments: { id: string; text: L; role: TagRole }[];
  explanation: L;
  tag?: string;
}

export type CtItem = ChoiceItem | MultiItem | TagItem;

interface ExerciseBase {
  id: string;
  kind: CtKind;
  topic: CtTopic;
  title: L;
  intro: L;
  minutes: number;
  difficulty: 1 | 2 | 3;
}

/** Fallacies, biases, claim analysis, media literacy, sources: scored item by item. */
export interface ItemExercise extends ExerciseBase {
  kind: "claim" | "fallacy" | "media" | "bias" | "sources";
  /** A text the items refer to. Fictional texts are always labelled as such. */
  passage?: { title: L; body: L; label: L };
  items: CtItem[];
}

export interface BuilderExercise extends ExerciseBase {
  kind: "builder";
  questions: { id: string; text: L; context: L }[];
}

export interface DebateExercise extends ExerciseBase {
  kind: "debate";
  motion: L;
  context: L;
}

export interface HumilityExercise extends ExerciseBase {
  kind: "humility";
  scenarios: { id: string; situation: L; claim: L; newEvidence: L; direction: "up" | "down" | "none"; explanation: L }[];
}

export interface DecisionExercise extends ExerciseBase {
  kind: "decision";
  scenario: L;
  options: L[];
  criteria: L[];
}

export type CtExercise = ItemExercise | BuilderExercise | DebateExercise | HumilityExercise | DecisionExercise;
