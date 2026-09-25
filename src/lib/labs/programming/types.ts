import type { L } from "../localized";

export const PROG_LANGUAGES = ["python", "cpp"] as const;
export type ProgLanguage = (typeof PROG_LANGUAGES)[number];

export const PROG_LEVELS = [1, 2, 3, 4] as const;
export type ProgLevel = (typeof PROG_LEVELS)[number];

export const PROG_TOPICS = [
  "output",
  "input",
  "variables",
  "types",
  "arithmetic",
  "conditions",
  "loops",
  "functions",
  "lists",
  "strings",
  "debugging",
  "complexity",
  "sorting",
  "searching",
  "prefix_sums",
  "two_pointers",
  "recursion",
  "data_structures",
  "contest",
] as const;
export type ProgTopic = (typeof PROG_TOPICS)[number];

export interface TestCase {
  input: string;
  output: string;
  /** Sample tests are shown in full; hidden tests never reveal their expected output. */
  sample: boolean;
}

interface ProblemBase {
  id: string;
  level: ProgLevel;
  topic: ProgTopic;
  /** 1–3 stars within the level. */
  difficulty: 1 | 2 | 3;
  title: L;
  statement: L;
  /** Hint ladder: concept first, then more specific. Never the full answer. */
  hints: L[];
  /** Shown after the problem is solved. */
  explanation: L;
  /** Set for teacher-created problems. */
  authorId?: string;
  authorName?: string;
}

/** Write a program that reads standard input and prints the answer. */
export interface CodeProblem extends ProblemBase {
  kind: "code";
  inputFormat: L;
  outputFormat: L;
  constraints: L;
  tests: TestCase[];
  starter: Record<ProgLanguage, string>;
  /** Reference solutions — visible to teachers only. */
  solution: Record<ProgLanguage, string>;
  timeLimitMs: number;
}

/** Read the code and predict exactly what it prints. */
export interface PredictProblem extends ProblemBase {
  kind: "predict";
  code: Record<ProgLanguage, string>;
  expected: Record<ProgLanguage, string>;
}

/** Concept check: debugging, complexity, constraints. */
export interface ChoiceProblem extends ProblemBase {
  kind: "choice";
  code?: Partial<Record<ProgLanguage, string>>;
  options: { id: string; text: L }[];
  correct: string;
}

export type Problem = CodeProblem | PredictProblem | ChoiceProblem;
