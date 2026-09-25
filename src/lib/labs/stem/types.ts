import type { L } from "../localized";

export const STEM_SUBJECTS = ["physics", "chemistry", "biology", "mathematics", "engineering", "computing"] as const;
export type StemSubject = (typeof STEM_SUBJECTS)[number];

/** How an activity happens — shown on every card so nobody confuses them. */
export type StemMode = "simulation" | "experiment" | "physical";

export interface Experiment {
  id: string;
  subject: StemSubject;
  difficulty: 1 | 2 | 3;
  grades: [number, number];
  minutes: number;
  title: L;
  summary: L;
  objectives: L[];
  materials: L[];
  safety: L[];
  procedure: L[];
  prediction: L;
  /** Column headings of the observation table; rows are added by the student. */
  table: { columns: L[]; rows: number };
  observationsPrompt: L;
  expected: L;
  reflection: L[];
}

export type StemItem =
  | { type: "choice"; id: string; prompt: L; options: { id: string; text: L }[]; correct: string; explanation: L }
  | { type: "numeric"; id: string; prompt: L; unit: string; answer: number; tolerance: number; explanation: L }
  | { type: "task"; id: string; prompt: L; task: SimTask; params: Record<string, number>; explanation: L };

export type SimTask = "projectile_target" | "circuit_current" | "fit_line" | "robot_goal";

export const SIMULATION_IDS = ["projectile", "motion", "circuit", "probability", "linear-model", "growth", "grid-robot"] as const;
export type SimulationId = (typeof SIMULATION_IDS)[number];

export interface Simulation {
  id: SimulationId;
  subject: StemSubject;
  area: "simulation" | "electronics" | "robotics";
  difficulty: 1 | 2 | 3;
  grades: [number, number];
  title: L;
  summary: L;
  /** What the student should notice while exploring. */
  explore: L[];
  items: StemItem[];
}

export interface ChallengeSet {
  id: string;
  area: "electronics" | "robotics";
  difficulty: 1 | 2 | 3;
  title: L;
  summary: L;
  items: StemItem[];
}

export interface ProjectTemplate {
  id: string;
  mode: StemMode;
  subject: StemSubject;
  difficulty: 1 | 2 | 3;
  title: L;
  brief: L;
  constraints: L[];
  criteria: L[];
  materials: L[];
  safety: L[];
}
