import { checkCpp, runCpp, type Diagnostic, type RunResult } from "@/lib/cpp";
import { normalizeOutput, outputsMatch } from "@/lib/labs/programming/compare";
import type { CheckResult, TestCase, TestOutcome, Verdict } from "./types";

/**
 * Runs a student's C++ program on the tests of an exercise.
 *
 * The program is not run by a compiler on this machine: it is run by the site's own C++
 * interpreter (src/lib/cpp), which is plain JavaScript with no access to files, the network
 * or processes. Time is measured in interpreter steps, not seconds, so a verdict never
 * depends on how busy the server is. Memory and output are capped too.
 */

export interface JudgeLimits {
  /** How long a sensible solution may take on one test (a native program), in milliseconds. */
  timeMs: number;
  /** All tests together may not use more than this many steps. */
  totalSteps: number;
  memoryBytes: number;
  outputBytes: number;
}

/** Interpreter steps per millisecond of the time limit. The runner does about 30 million steps a second; this is a safe margin. */
export const STEPS_PER_MS = 20_000;

export const DEFAULT_LIMITS: JudgeLimits = {
  timeMs: 1000,
  totalSteps: 160_000_000,
  memoryBytes: 128 * 1024 * 1024,
  outputBytes: 200_000,
};

const SHOW = 600;
const clip = (s: string) => (s.length > SHOW ? `${s.slice(0, SHOW)}…` : s);

const tokens = (s: string) => s.split(/\s+/).filter(Boolean).join(" ");

export type Compare = "exact" | "tokens";

export function sameOutput(got: string, want: string, mode: Compare = "exact"): boolean {
  return mode === "tokens" ? tokens(got) === tokens(want) : outputsMatch(got, want);
}

const diag = (d: Diagnostic) => ({ code: d.code, message: d.message, args: d.args, line: d.line });

/** Turns one run into a test outcome (ok / wrong / error / timeout). */
function outcome(run: RunResult, test: TestCase, sample: boolean, mode: Compare): TestOutcome {
  if (run.status === "time_limit" || run.status === "stack_overflow") {
    return { status: "timeout", sample, input: test.input, diagnostic: run.diagnostic ? diag(run.diagnostic) : undefined };
  }
  if (run.status !== "ok") {
    return { status: "error", sample, input: test.input, diagnostic: run.diagnostic ? diag(run.diagnostic) : undefined };
  }
  if (run.exitCode !== 0) {
    return {
      status: "error",
      sample,
      input: test.input,
      got: clip(run.stdout),
      diagnostic: { code: "exit-code", message: `The program ended with exit code ${run.exitCode}`, args: { code: run.exitCode }, line: 0 },
    };
  }
  if (sameOutput(run.stdout, test.output, mode)) return { status: "ok", sample };
  return { status: "wrong", sample, input: test.input, expected: clip(normalizeOutput(test.output)), got: clip(normalizeOutput(run.stdout)) };
}

export interface JudgeInput {
  code: string;
  /** The tests in order; `samples` of them (the first ones) are shown to the student in full. */
  tests: TestCase[];
  samples: number;
  compare?: Compare;
  limits?: Partial<JudgeLimits>;
}

/**
 * Compiles the program once to find mistakes in it, then runs it on every test. The first test that
 * fails is described in full; the others only by their status. After a timeout the remaining tests
 * are not run (they would only waste the budget).
 */
export function judge(input: JudgeInput): CheckResult {
  const limits = { ...DEFAULT_LIMITS, ...input.limits };
  const mode = input.compare ?? "exact";
  const total = input.tests.length;

  const problem = checkCpp(input.code);
  if (problem) {
    const verdict: Verdict = problem.kind === "unsupported" ? "unsupported" : "compile_error";
    return { verdict, passed: 0, total, tests: [], diagnostic: { code: problem.code, message: problem.message, args: problem.args, line: problem.line, col: problem.col } };
  }

  const perTest = Math.max(1_000_000, Math.floor(limits.timeMs * STEPS_PER_MS));
  let budget = limits.totalSteps;
  const outcomes: TestOutcome[] = [];
  let firstFailure: TestOutcome | null = null;
  let note: string | undefined;
  let stopped = false;

  input.tests.forEach((test, i) => {
    const sample = i < input.samples;
    if (stopped || budget <= 0) {
      outcomes.push({ status: "skipped", sample });
      return;
    }
    const run = runCpp(input.code, {
      stdin: test.input,
      stepLimit: Math.min(perTest, budget),
      memoryLimit: limits.memoryBytes,
      outputLimit: limits.outputBytes,
    });
    budget -= run.steps;
    let result = outcome(run, test, sample, mode);
    if (result.status === "ok" && run.stderr && !note) note = "stderr";
    if (result.status === "timeout") stopped = true;
    if (result.status !== "ok") {
      if (!firstFailure) firstFailure = result;
      else if (!sample) result = { status: result.status, sample };
    }
    outcomes.push(result);
  });

  // Hidden tests are only described when they are the first failure.
  const tests = outcomes.map((o) => (o === firstFailure || o.sample ? o : { status: o.status, sample: o.sample }));
  const passed = tests.filter((o) => o.status === "ok").length;
  const first = firstFailure as TestOutcome | null;
  let verdict: Verdict = "accepted";
  if (first) verdict = first.status === "error" ? "runtime_error" : first.status === "timeout" ? "time_limit" : "wrong_answer";
  return { verdict, passed, total, tests, note };
}
