/**
 * The shapes of a programming course.
 *
 * A course is written once, in full (answers, reference solutions, hidden tests), in
 * `src/lib/courses/<course>/`. That "authoring" form never leaves the server. What the
 * browser gets is the "student" form, made by `studentLesson()` in service.ts: the same
 * lesson with every answer key, solution and hidden test left out. Checking happens on
 * the server, through `/api/courses/...`.
 *
 * Text is Georgian first (the platform is built for Georgian schools); an English
 * version may be supplied and is used when the visitor reads the site in English.
 */

export interface Text {
  ka: string;
  en?: string;
}

/** Inline markup in text: `code`, **bold**, *italic*. Paragraphs are separated by a blank line. */

export type CalloutTone = "tip" | "warn" | "note" | "remember";

/** One piece of a lesson, in reading order. */
export type Block =
  | { k: "text"; text: Text }
  | { k: "heading"; text: Text }
  | { k: "list"; items: Text[]; ordered?: boolean }
  | { k: "callout"; tone: CalloutTone; title?: Text; text: Text }
  /** A program the student can read, change and run. `out` is what it prints (checked by the tests). */
  | { k: "code"; id: string; code: string; stdin?: string; out?: string; caption?: Text; /** Shown read-only (a fragment, not a program). */ readonly?: boolean }
  /** "What will this print?" — the student types the output; the server runs the program to check it. */
  | { k: "predict"; id: string; code: string; stdin?: string; ask?: Text; why?: Text }
  /** A multiple-choice question. `answer` is the index of the right option. */
  | { k: "quiz"; id: string; question: Text; options: Text[]; answer: number; why: Text }
  | { k: "table"; head: Text[]; rows: string[][] };

export interface TestCase {
  input: string;
  output: string;
}

export interface WrongSolution {
  /** A plausible mistake: the tests must catch it. */
  code: string;
  why: string;
}

export type ExerciseKind = "write" | "fix" | "complete";

/** A programming task checked by running the student's program on hidden tests. */
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  title: Text;
  statement: Text;
  inputFormat?: Text;
  outputFormat?: Text;
  /** The code the editor starts with. */
  starter: string;
  /** The reference solution (shown only after the student has solved the task). */
  solution: string;
  /** Inputs of the examples shown with the statement; their outputs are made from the solution. */
  samples: string[];
  /** Inputs of the hidden tests (the samples are tests too); outputs are made from the solution. */
  tests: string[];
  /** Three hints, from a nudge to almost the method. */
  hints: [Text, Text, Text];
  /** Explains the idea after the task is solved. */
  explanation?: Text;
  /** Mistakes the tests must catch (checked by the course tests). */
  wrong?: WrongSolution[];
  /** The expected speed: the tests are sized so that a sensible solution passes within this. */
  timeMs?: number;
  /** Harder tasks are worth more. 1–3. */
  weight?: 1 | 2 | 3;
  /** Output may differ in the order of lines/words (rare); default is exact match. */
  compare?: "exact" | "tokens";
}

export interface Lesson {
  id: string;
  title: Text;
  /** A line under the title: what the lesson is about. */
  tagline: Text;
  /** Reading plus doing, in minutes. */
  minutes: number;
  /** "lesson" teaches; "checkpoint" ends a module with mixed tasks and a small project. */
  kind: "lesson" | "checkpoint";
  goals: Text[];
  blocks: Block[];
  exercises: Exercise[];
  /** Typical mistakes of beginners on this topic. */
  mistakes: Text[];
  /** The few things to remember. */
  summary: Text[];
}

export interface Module {
  id: string;
  number: number;
  title: Text;
  summary: Text;
  /** What the student can do after the module. */
  outcomes: Text[];
  lessons: Lesson[];
}

/** A module that is planned and not yet written: shown on the map, honestly marked. */
export interface PlannedModule {
  number: number;
  title: Text;
  summary: Text;
  topics: Text[];
  /** Where to practise this topic meanwhile (the problem book chapter). */
  book?: { chapter: number };
}

export interface Course {
  id: string;
  language: "cpp";
  title: Text;
  tagline: Text;
  /** Who it is for and what it assumes. */
  audience: Text;
  modules: Module[];
  planned: PlannedModule[];
}

/* ------------------------------ what the browser sees ------------------------------ */

export type StudentBlock =
  | Exclude<Block, { k: "predict" } | { k: "quiz" }>
  | { k: "predict"; id: string; code: string; stdin?: string; ask?: Text }
  | { k: "quiz"; id: string; question: Text; options: Text[] };

export interface StudentExercise {
  id: string;
  kind: ExerciseKind;
  title: Text;
  statement: Text;
  inputFormat?: Text;
  outputFormat?: Text;
  starter: string;
  samples: TestCase[];
  weight: 1 | 2 | 3;
  hintCount: number;
  timeMs: number;
}

export interface StudentLesson {
  id: string;
  moduleId: string;
  moduleNumber: number;
  index: number;
  title: Text;
  tagline: Text;
  minutes: number;
  kind: "lesson" | "checkpoint";
  goals: Text[];
  blocks: StudentBlock[];
  exercises: StudentExercise[];
  mistakes: Text[];
  summary: Text[];
  /** Neighbours in the course order, for the "previous / next" links. */
  prev: { id: string; title: Text } | null;
  next: { id: string; title: Text } | null;
}

/** The map of the course: everything except the lesson bodies. */
export interface StudentCourse {
  id: string;
  language: "cpp";
  title: Text;
  tagline: Text;
  audience: Text;
  modules: {
    id: string;
    number: number;
    title: Text;
    summary: Text;
    outcomes: Text[];
    lessons: { id: string; title: Text; tagline: Text; minutes: number; kind: "lesson" | "checkpoint"; exerciseIds: string[]; itemIds: string[] }[];
  }[];
  planned: PlannedModule[];
}

/* ------------------------------------ checking ------------------------------------ */

export type TestStatus = "ok" | "wrong" | "error" | "timeout" | "skipped";

export interface TestOutcome {
  status: TestStatus;
  sample: boolean;
  /** Shown for samples and for the first test that failed. */
  input?: string;
  expected?: string;
  got?: string;
  /** For `error`: what went wrong (a stable code the UI translates). */
  diagnostic?: { code: string; message: string; args: Record<string, string | number>; line: number };
}

export type Verdict = "accepted" | "wrong_answer" | "runtime_error" | "time_limit" | "compile_error" | "unsupported";

export interface CheckResult {
  verdict: Verdict;
  passed: number;
  total: number;
  tests: TestOutcome[];
  /** A compile error or an unsupported feature, with its position. */
  diagnostic?: { code: string; message: string; args: Record<string, string | number>; line: number; col: number };
  /** The program wrote to stderr or exited with a non-zero code. */
  note?: string;
}
