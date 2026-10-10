import type { Block, CalloutTone, Exercise, ExerciseKind, Lesson, Text, WrongSolution } from "./types";

/**
 * Small helpers that keep course sources short and readable.
 *
 *   p("ტექსტი")                    a paragraph
 *   code("hello", `…`, { out })    a runnable example
 *   quiz("q1", "კითხვა", [...], 1, "რატომ")
 */

export const T = (ka: string, en?: string): Text => (en === undefined ? { ka } : { ka, en });

export const p = (ka: string, en?: string): Block => ({ k: "text", text: T(ka, en) });
export const h = (ka: string, en?: string): Block => ({ k: "heading", text: T(ka, en) });
export const ul = (...items: (string | Text)[]): Block => ({ k: "list", items: items.map((i) => (typeof i === "string" ? T(i) : i)) });
export const ol = (...items: (string | Text)[]): Block => ({ k: "list", ordered: true, items: items.map((i) => (typeof i === "string" ? T(i) : i)) });

const callout =
  (tone: CalloutTone) =>
  (ka: string, title?: string): Block => ({ k: "callout", tone, title: title ? T(title) : undefined, text: T(ka) });
export const tip = callout("tip");
export const warn = callout("warn");
export const note = callout("note");
export const remember = callout("remember");

export function code(id: string, source: string, opts: { out?: string; stdin?: string; caption?: string; readonly?: boolean; error?: string } = {}): Block {
  return { k: "code", id, code: trimCode(source), out: opts.out, stdin: opts.stdin, caption: opts.caption ? T(opts.caption) : undefined, readonly: opts.readonly, error: opts.error };
}

/** A small deterministic random generator for test data (same numbers every time). */
export function rng(seed: number): (lo: number, hi: number) => number {
  let s = seed >>> 0;
  return (lo, hi) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return lo + Math.floor((s / 4294967296) * (hi - lo + 1));
  };
}

/** Input lines from rows of numbers: lines([1, 2], [3]) is "1 2\n3\n". */
export const lines = (...rows: (number | string)[][]): string => rows.map((r) => r.join(" ")).join("\n") + "\n";

export function predict(id: string, source: string, opts: { stdin?: string; ask?: string; why?: string } = {}): Block {
  return { k: "predict", id, code: trimCode(source), stdin: opts.stdin, ask: opts.ask ? T(opts.ask) : undefined, why: opts.why ? T(opts.why) : undefined };
}

export function quiz(id: string, question: string, options: string[], answer: number, why: string): Block {
  return { k: "quiz", id, question: T(question), options: options.map((o) => T(o)), answer, why: T(why) };
}

export const table = (head: string[], rows: string[][]): Block => ({ k: "table", head: head.map((x) => T(x)), rows });

/** Removes the leading newline and the common indentation of a template literal. */
export function trimCode(source: string): string {
  const lines = source.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length));
  return lines.map((l) => l.slice(Math.min(indent, /^ */.exec(l)![0].length))).join("\n") + "\n";
}

export interface ExerciseInput {
  id: string;
  kind?: ExerciseKind;
  title: string;
  statement: string;
  input?: string;
  output?: string;
  starter?: string;
  solution: string;
  samples?: string[];
  /** Hidden test inputs. */
  tests: string[];
  hints: [string, string, string];
  explanation?: string;
  wrong?: WrongSolution[];
  timeMs?: number;
  weight?: 1 | 2 | 3;
  compare?: "exact" | "tokens";
}

const STARTER = `#include <iostream>
using namespace std;

int main() {
    // აქ დაწერე შენი კოდი

    return 0;
}
`;

export function exercise(i: ExerciseInput): Exercise {
  return {
    id: i.id,
    kind: i.kind ?? "write",
    title: T(i.title),
    statement: T(i.statement),
    inputFormat: i.input ? T(i.input) : undefined,
    outputFormat: i.output ? T(i.output) : undefined,
    starter: i.starter ? trimCode(i.starter) : STARTER,
    solution: trimCode(i.solution),
    samples: i.samples ?? [i.tests[0] ?? ""],
    tests: i.tests,
    hints: [T(i.hints[0]), T(i.hints[1]), T(i.hints[2])],
    explanation: i.explanation ? T(i.explanation) : undefined,
    wrong: i.wrong?.map((w) => ({ code: trimCode(w.code), why: w.why })),
    timeMs: i.timeMs,
    weight: i.weight ?? 1,
    compare: i.compare,
  };
}

export interface LessonInput {
  id: string;
  title: string;
  tagline: string;
  minutes: number;
  kind?: "lesson" | "checkpoint";
  goals: string[];
  blocks: Block[];
  exercises: Exercise[];
  mistakes?: string[];
  summary: string[];
  en?: { title?: string; tagline?: string };
}

export function lesson(i: LessonInput): Lesson {
  return {
    id: i.id,
    title: T(i.title, i.en?.title),
    tagline: T(i.tagline, i.en?.tagline),
    minutes: i.minutes,
    kind: i.kind ?? "lesson",
    goals: i.goals.map((g) => T(g)),
    blocks: i.blocks,
    exercises: i.exercises,
    mistakes: (i.mistakes ?? []).map((m) => T(m)),
    summary: i.summary.map((s) => T(s)),
  };
}
