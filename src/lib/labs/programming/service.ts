import "server-only";
import { z } from "zod";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { recordLabProgress } from "@/lib/services/assignments";
import { same, type L } from "../localized";
import { BUILT_IN_PROBLEMS, findBuiltInProblem } from "./catalog";
import { outputsMatch } from "./compare";
import { getServerJudge, type RunResult } from "./judge";
import { PROG_LANGUAGES, PROG_TOPICS, type CodeProblem, type ProgLanguage, type Problem } from "./types";

export type Verdict = "accepted" | "wrong_answer" | "runtime_error" | "time_limit" | "compile_error" | "correct" | "incorrect";
/** How a submission was checked — shown honestly to students and teachers. */
export type Checker = "browser" | "judge" | "self" | "answer";

export const SOLVED_VERDICTS: Verdict[] = ["accepted", "correct"];

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

interface CustomRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  data: string;
  published: number;
  created_at: number;
  updated_at: number;
}

export const customProblemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  topic: z.enum(PROG_TOPICS),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  statement: z.string().trim().min(1).max(6000),
  inputFormat: z.string().trim().max(1000).default(""),
  outputFormat: z.string().trim().max(1000).default(""),
  constraints: z.string().trim().max(1000).default(""),
  tests: z
    .array(z.object({ input: z.string().max(20000), output: z.string().max(20000), sample: z.boolean() }))
    .min(1)
    .max(20)
    .refine((tests) => tests.some((t) => t.sample), "At least one sample test is required."),
  hints: z.array(z.string().trim().max(1000)).max(3).default([]),
  explanation: z.string().trim().max(3000).default(""),
  starterPython: z.string().max(5000).default(""),
  starterCpp: z.string().max(5000).default(""),
  solutionPython: z.string().max(10000).default(""),
  solutionCpp: z.string().max(10000).default(""),
  timeLimitMs: z.number().int().min(500).max(10000).default(2000),
});
export type CustomProblemInput = z.infer<typeof customProblemSchema>;

function customToProblem(row: CustomRow): CodeProblem | null {
  const parsed = customProblemSchema.safeParse(parseJson(row.data, {}));
  if (!parsed.success) return null;
  const d = parsed.data;
  return {
    id: row.id,
    kind: "code",
    level: d.level,
    topic: d.topic,
    difficulty: d.difficulty,
    title: same(d.title),
    statement: same(d.statement),
    inputFormat: same(d.inputFormat || "—"),
    outputFormat: same(d.outputFormat || "—"),
    constraints: same(d.constraints || "—"),
    tests: d.tests,
    hints: d.hints.filter(Boolean).map(same),
    explanation: same(d.explanation),
    starter: { python: d.starterPython || "# Write your solution here\n", cpp: d.starterCpp || "#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n" },
    solution: { python: d.solutionPython, cpp: d.solutionCpp },
    timeLimitMs: d.timeLimitMs,
    authorId: row.teacher_id,
    authorName: row.teacher_name,
  };
}

const SELECT_CUSTOM = "SELECT p.*, u.display_name AS teacher_name FROM programming_problems p JOIN users u ON u.id = p.teacher_id";

export function listProblems(): Problem[] {
  const custom = (getDb().prepare(`${SELECT_CUSTOM} WHERE p.published = 1 ORDER BY p.created_at`).all() as CustomRow[])
    .map(customToProblem)
    .filter((p): p is CodeProblem => p !== null);
  return [...BUILT_IN_PROBLEMS, ...custom];
}

export function getProblem(id: string): Problem | null {
  const builtIn = findBuiltInProblem(id);
  if (builtIn) return builtIn;
  const row = getDb().prepare(`${SELECT_CUSTOM} WHERE p.id = ?`).get(id) as CustomRow | undefined;
  return row ? customToProblem(row) : null;
}

export function getProblemOrThrow(id: string): Problem {
  const problem = getProblem(id);
  if (!problem) throw new ApiError(404, "not_found");
  return problem;
}

export function getCustomProblemInput(id: string, user: CurrentUser): CustomProblemInput {
  const row = getDb().prepare(`${SELECT_CUSTOM} WHERE p.id = ?`).get(id) as CustomRow | undefined;
  if (!row) throw new ApiError(404, "not_found");
  if (row.teacher_id !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return customProblemSchema.parse(parseJson(row.data, {}));
}

export function saveCustomProblem(user: CurrentUser, input: CustomProblemInput, id?: string): string {
  const data = customProblemSchema.parse(input);
  const db = getDb();
  if (id) {
    getCustomProblemInput(id, user);
    db.prepare("UPDATE programming_problems SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(data), now(), id);
    return id;
  }
  const newProblemId = `c-${newId(10)}`;
  db.prepare("INSERT INTO programming_problems (id, teacher_id, data, published, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)").run(
    newProblemId,
    user.id,
    JSON.stringify(data),
    now(),
    now(),
  );
  return newProblemId;
}

export function deleteCustomProblem(id: string, user: CurrentUser): void {
  getCustomProblemInput(id, user);
  getDb().prepare("DELETE FROM programming_problems WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Student view — never includes hidden expected outputs, answers or solutions
// ---------------------------------------------------------------------------

export type StudentProblem = ReturnType<typeof toStudentProblem>;

export function toStudentProblem(problem: Problem) {
  const base = {
    id: problem.id,
    kind: problem.kind,
    level: problem.level,
    topic: problem.topic,
    difficulty: problem.difficulty,
    title: problem.title,
    statement: problem.statement,
    hintCount: problem.hints.length,
    authorName: problem.authorName ?? null,
  };
  if (problem.kind === "code") {
    return {
      ...base,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      timeLimitMs: problem.timeLimitMs,
      starter: problem.starter,
      // Hidden tests keep their input (it is needed to run the code) but not their output.
      tests: problem.tests.map((t) => ({ input: t.input, sample: t.sample, output: t.sample ? t.output : null })),
      code: null,
      options: [],
    };
  }
  if (problem.kind === "predict") {
    return { ...base, code: problem.code, tests: [], options: [], starter: null, inputFormat: null, outputFormat: null, constraints: null, timeLimitMs: 0 };
  }
  return { ...base, code: problem.code ?? null, options: problem.options, tests: [], starter: null, inputFormat: null, outputFormat: null, constraints: null, timeLimitMs: 0 };
}

// ---------------------------------------------------------------------------
// Checking and submissions
// ---------------------------------------------------------------------------

export const submitSchema = z.object({
  problemId: z.string().max(40),
  language: z.enum(PROG_LANGUAGES),
  mode: z.enum(["answer", "browser", "self", "judge"]),
  code: z.string().max(50000).default(""),
  answer: z.string().max(5000).default(""),
  results: z
    .array(
      z.object({
        output: z.string().max(200000).default(""),
        error: z.string().max(4000).optional(),
        timedOut: z.boolean().optional(),
        skipped: z.boolean().optional(),
      }),
    )
    .max(50)
    .default([]),
});
export type SubmitInput = z.infer<typeof submitSchema>;

export interface TestReport {
  index: number;
  sample: boolean;
  passed: boolean;
  status: "passed" | "wrong_answer" | "runtime_error" | "time_limit" | "compile_error" | "not_run";
  input: string | null;
  expected: string | null;
  actual: string | null;
  error: string | null;
}

export interface SubmissionResult {
  id: string;
  verdict: Verdict;
  checker: Checker;
  passed: number;
  total: number;
  tests: TestReport[];
  /** Revealed only after a correct answer. */
  explanation: L | null;
  createdAt: number;
}

function evaluateRuns(problem: CodeProblem, runs: (RunResult & { skipped?: boolean })[]): { verdict: Verdict; tests: TestReport[]; passed: number } {
  const tests: TestReport[] = problem.tests.map((test, index) => {
    const run = runs[index];
    let status: TestReport["status"];
    if (!run || run.skipped) status = "not_run";
    else if (run.compileError) status = "compile_error";
    else if (run.timedOut) status = "time_limit";
    else if (run.error) status = "runtime_error";
    else status = outputsMatch(run.output, test.output) ? "passed" : "wrong_answer";
    return {
      index,
      sample: test.sample,
      passed: status === "passed",
      status,
      // Hidden tests reveal only whether they passed.
      input: test.sample ? test.input : null,
      expected: test.sample ? test.output : null,
      actual: test.sample && run ? run.output.slice(0, 4000) : null,
      error: run?.compileError ?? run?.error ?? null,
    };
  });
  const passed = tests.filter((t) => t.passed).length;
  const firstFailure = tests.find((t) => !t.passed);
  const verdict: Verdict = !firstFailure
    ? "accepted"
    : firstFailure.status === "compile_error"
      ? "compile_error"
      : firstFailure.status === "time_limit"
        ? "time_limit"
        : firstFailure.status === "runtime_error"
          ? "runtime_error"
          : "wrong_answer";
  return { verdict, tests, passed };
}

export async function submit(user: CurrentUser, raw: SubmitInput): Promise<SubmissionResult> {
  const input = submitSchema.parse(raw);
  const problem = getProblemOrThrow(input.problemId);
  let verdict: Verdict;
  let checker: Checker;
  let tests: TestReport[] = [];
  let passed = 0;
  let total = 1;

  if (problem.kind === "predict") {
    checker = "answer";
    verdict = outputsMatch(input.answer, problem.expected[input.language]) ? "correct" : "incorrect";
    passed = verdict === "correct" ? 1 : 0;
  } else if (problem.kind === "choice") {
    checker = "answer";
    verdict = input.answer === problem.correct ? "correct" : "incorrect";
    passed = verdict === "correct" ? 1 : 0;
  } else {
    total = problem.tests.length;
    let runs: (RunResult & { skipped?: boolean })[];
    if (input.mode === "judge") {
      const judge = getServerJudge();
      if (!judge || !judge.supports(input.language)) throw new ApiError(400, "invalid_input", "No code judge is configured for this language.");
      if (!input.code.trim()) throw new ApiError(400, "invalid_input");
      try {
        runs = await judge.run(input.code, input.language, problem.tests.map((t) => t.input), problem.timeLimitMs);
      } catch {
        throw new ApiError(502, "internal", "The code judge did not respond.");
      }
      checker = "judge";
    } else if (input.mode === "browser" || input.mode === "self") {
      if (input.results.length !== problem.tests.length) throw new ApiError(400, "invalid_input", "Results for every test are required.");
      if (input.mode === "browser" && input.language !== "python") throw new ApiError(400, "invalid_input");
      runs = input.results;
      checker = input.mode;
    } else {
      throw new ApiError(400, "invalid_input");
    }
    const evaluated = evaluateRuns(problem, runs);
    verdict = evaluated.verdict;
    tests = evaluated.tests;
    passed = evaluated.passed;
  }

  const id = newId();
  const createdAt = now();
  getDb()
    .prepare(
      `INSERT INTO programming_submissions (id, user_id, problem_id, language, code, answer, verdict, passed, total, checker, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, user.id, problem.id, input.language, input.code.slice(0, 50000), input.answer.slice(0, 5000), verdict, passed, total, checker, JSON.stringify(tests), createdAt);

  const solved = SOLVED_VERDICTS.includes(verdict);
  if (user.role === "student") {
    recordLabProgress(user.id, "programming", problem.id, solved ? { status: "completed", workRef: id, score: 1, maxScore: 1 } : { status: "in_progress", workRef: id });
  }
  return { id, verdict, checker, passed, total, tests, explanation: solved ? problem.explanation : null, createdAt };
}

export interface SubmissionSummary {
  id: string;
  problemId: string;
  language: ProgLanguage;
  verdict: Verdict;
  checker: Checker;
  passed: number;
  total: number;
  code: string;
  answer: string;
  createdAt: number;
}

interface SubmissionRow {
  id: string;
  user_id: string;
  problem_id: string;
  language: ProgLanguage;
  code: string;
  answer: string;
  verdict: Verdict;
  passed: number;
  total: number;
  checker: Checker;
  created_at: number;
}

function toSummary(row: SubmissionRow): SubmissionSummary {
  return {
    id: row.id,
    problemId: row.problem_id,
    language: row.language,
    verdict: row.verdict,
    checker: row.checker,
    passed: row.passed,
    total: row.total,
    code: row.code,
    answer: row.answer,
    createdAt: row.created_at,
  };
}

export function listSubmissions(userId: string, problemId: string, limit = 10): SubmissionSummary[] {
  return (
    getDb().prepare("SELECT * FROM programming_submissions WHERE user_id = ? AND problem_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, problemId, limit) as SubmissionRow[]
  ).map(toSummary);
}

export function getSubmission(id: string): (SubmissionSummary & { userId: string; details: TestReport[] }) | null {
  const row = getDb().prepare("SELECT * FROM programming_submissions WHERE id = ?").get(id) as (SubmissionRow & { details: string }) | undefined;
  return row ? { ...toSummary(row), userId: row.user_id, details: parseJson<TestReport[]>(row.details, []) } : null;
}

/** Per-problem status for one student: solved, attempted or untouched. */
export function problemStatuses(userId: string): Map<string, "solved" | "attempted"> {
  const rows = getDb()
    .prepare(
      `SELECT problem_id, MAX(CASE WHEN verdict IN ('accepted','correct') THEN 1 ELSE 0 END) AS solved
         FROM programming_submissions WHERE user_id = ? GROUP BY problem_id`,
    )
    .all(userId) as { problem_id: string; solved: number }[];
  return new Map(rows.map((r) => [r.problem_id, r.solved ? "solved" : "attempted"]));
}

export function programmingProgress(userId: string) {
  const statuses = problemStatuses(userId);
  const problems = listProblems();
  const byLevel = [1, 2, 3, 4].map((level) => {
    const inLevel = problems.filter((p) => p.level === level);
    return { level, total: inLevel.length, solved: inLevel.filter((p) => statuses.get(p.id) === "solved").length };
  });
  const recommended = problems.find((p) => statuses.get(p.id) !== "solved") ?? null;
  return {
    solved: [...statuses.values()].filter((s) => s === "solved").length,
    attempted: statuses.size,
    total: problems.length,
    byLevel,
    recommendedId: recommended?.id ?? null,
  };
}

/** For teachers: how many students solved / attempted a problem. */
export function problemClassStats(problemId: string) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(DISTINCT s.user_id) AS attempted,
              COUNT(DISTINCT CASE WHEN s.verdict IN ('accepted','correct') THEN s.user_id END) AS solved
         FROM programming_submissions s JOIN users u ON u.id = s.user_id WHERE s.problem_id = ? AND u.role = 'student'`,
    )
    .get(problemId) as { attempted: number; solved: number };
  return row;
}

export function judgeInfo() {
  const judge = getServerJudge();
  return { cpp: judge?.supports("cpp") ?? false, python: judge?.supports("python") ?? false };
}
