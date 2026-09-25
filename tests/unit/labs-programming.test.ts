import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { outputsMatch } from "@/lib/labs/programming/compare";
import { BUILT_IN_PROBLEMS, findBuiltInProblem } from "@/lib/labs/programming/catalog";
import { Judge0Judge } from "@/lib/labs/programming/judge";
import { getProblem, listSubmissions, programmingProgress, saveCustomProblem, submit, toStudentProblem } from "@/lib/labs/programming/service";
import type { CodeProblem } from "@/lib/labs/programming/types";
import { createAssignment, getAssignmentForStudent } from "@/lib/services/assignments";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

const sumToN = findBuiltInProblem("l1-sum-to-n") as CodeProblem;

describe("output comparison", () => {
  it("ignores line endings, trailing spaces and surrounding blank lines", () => {
    expect(outputsMatch("15\r\n", "15")).toBe(true);
    expect(outputsMatch("1 2 3   \n4\n\n", "1 2 3\n4")).toBe(true);
    expect(outputsMatch("\n\n15", "15")).toBe(true);
  });
  it("is strict about content and inner whitespace", () => {
    expect(outputsMatch("16", "15")).toBe(false);
    expect(outputsMatch("1  2", "1 2")).toBe(false);
    expect(outputsMatch("", "0")).toBe(false);
  });
});

describe("curriculum", () => {
  it("has 30 bilingual problems across four levels with unique ids", () => {
    expect(BUILT_IN_PROBLEMS.length).toBe(30);
    expect(new Set(BUILT_IN_PROBLEMS.map((p) => p.id)).size).toBe(BUILT_IN_PROBLEMS.length);
    for (const level of [1, 2, 3, 4]) expect(BUILT_IN_PROBLEMS.some((p) => p.level === level)).toBe(true);
    for (const p of BUILT_IN_PROBLEMS) {
      expect(p.title.en && p.title.ka, p.id).toBeTruthy();
      expect(p.statement.en && p.statement.ka, p.id).toBeTruthy();
      if (p.kind === "code") {
        expect(p.tests.some((t) => t.sample), p.id).toBe(true);
        if (p.tests.length > 1) expect(p.tests.some((t) => !t.sample), p.id).toBe(true);
      }
    }
  });
});

describe("student view never leaks answers", () => {
  it("hides hidden outputs, solutions, expected output and correct option", () => {
    const view = toStudentProblem(sumToN);
    const json = JSON.stringify(view);
    expect(json).not.toContain(sumToN.solution.python.trim().split("\n")[0]);
    for (const test of view.tests) {
      if (!test.sample) expect(test.output).toBeNull();
    }
    const predict = toStudentProblem(findBuiltInProblem("l1-types-predict")!);
    expect(JSON.stringify(predict)).not.toContain('"expected"');
    const choice = toStudentProblem(findBuiltInProblem("l2-debug-average")!);
    expect(JSON.stringify(choice)).not.toContain('"correct"');
    expect(JSON.stringify(view)).not.toContain('"hints"');
  });
});

describe("checking submissions", () => {
  let student: CurrentUser;
  beforeEach(() => {
    freshDb();
    student = makeUser("student", "mariam");
  });

  const run = (outputs: string[]) => outputs.map((output) => ({ output }));

  it("accepts correct browser outputs and reveals the explanation", async () => {
    const result = await submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "print(1)", answer: "", results: run(sumToN.tests.map((t) => t.output)) });
    expect(result.verdict).toBe("accepted");
    expect(result.passed).toBe(sumToN.tests.length);
    expect(result.explanation).not.toBeNull();
    expect(programmingProgress(student.id).solved).toBe(1);
  });

  it("reports wrong answers without revealing hidden expected outputs", async () => {
    const outputs = sumToN.tests.map((t) => (t.sample ? t.output : "0"));
    const result = await submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "", answer: "", results: run(outputs) });
    expect(result.verdict).toBe("wrong_answer");
    expect(result.explanation).toBeNull();
    const hidden = result.tests.filter((t) => !t.sample);
    expect(hidden.every((t) => t.expected === null && t.input === null && t.actual === null)).toBe(true);
  });

  it("maps timeouts, errors and tests that were never run", async () => {
    const results = sumToN.tests.map((_, i) => (i === 0 ? { output: "", timedOut: true } : { output: "", skipped: true }));
    const result = await submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "", answer: "", results });
    expect(result.verdict).toBe("time_limit");
    expect(result.tests.slice(1).every((t) => t.status === "not_run")).toBe(true);
    const errored = await submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "", answer: "", results: sumToN.tests.map(() => ({ output: "", error: "NameError" })) });
    expect(errored.verdict).toBe("runtime_error");
  });

  it("requires a result for every test and refuses browser mode for C++", async () => {
    await expect(submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "", answer: "", results: run(["15"]) })).rejects.toBeInstanceOf(ApiError);
    await expect(submit(student, { problemId: sumToN.id, language: "cpp", mode: "browser", code: "", answer: "", results: run(sumToN.tests.map((t) => t.output)) })).rejects.toBeInstanceOf(ApiError);
    await expect(submit(student, { problemId: sumToN.id, language: "cpp", mode: "judge", code: "int main(){}", answer: "", results: [] })).rejects.toBeInstanceOf(ApiError);
  });

  it("checks self-reported C++ outputs the same way", async () => {
    const result = await submit(student, { problemId: sumToN.id, language: "cpp", mode: "self", code: "// c++", answer: "", results: run(sumToN.tests.map((t) => t.output)) });
    expect(result.verdict).toBe("accepted");
    expect(result.checker).toBe("self");
  });

  it("checks predict and choice answers", async () => {
    const predict = findBuiltInProblem("l1-types-predict")!;
    if (predict.kind !== "predict") throw new Error("expected predict");
    const good = await submit(student, { problemId: predict.id, language: "python", mode: "answer", code: "", answer: `${predict.expected.python}\n`, results: [] });
    expect(good.verdict).toBe("correct");
    const bad = await submit(student, { problemId: "l2-debug-average", language: "python", mode: "answer", code: "", answer: "z", results: [] });
    expect(bad.verdict).toBe("incorrect");
    expect(listSubmissions(student.id, "l2-debug-average")).toHaveLength(1);
  });

  it("completes a programming assignment and backfills work done earlier", async () => {
    const teacher = makeUser("teacher", "nino");
    const before = createAssignment(teacher, { kind: "programming", refId: sumToN.id, title: "Sum", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    expect(getAssignmentForStudent(before.id, student.id).recipient.status).toBe("assigned");
    await submit(student, { problemId: sumToN.id, language: "python", mode: "browser", code: "", answer: "", results: run(sumToN.tests.map((t) => t.output)) });
    expect(getAssignmentForStudent(before.id, student.id).recipient.status).toBe("completed");
    const after = createAssignment(teacher, { kind: "programming", refId: sumToN.id, title: "Sum again", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    expect(getAssignmentForStudent(after.id, student.id).recipient.status).toBe("completed");
  });

  it("lets teachers write problems that students can solve", async () => {
    const teacher = makeUser("teacher", "nino");
    const id = saveCustomProblem(teacher, {
      title: "Double it",
      level: 1,
      topic: "arithmetic",
      difficulty: 1,
      statement: "Read n and print 2n.",
      inputFormat: "",
      outputFormat: "",
      constraints: "",
      tests: [
        { input: "2", output: "4", sample: true },
        { input: "10", output: "20", sample: false },
      ],
      hints: [],
      explanation: "",
      starterPython: "",
      starterCpp: "",
      solutionPython: "print(int(input()) * 2)",
      solutionCpp: "",
      timeLimitMs: 2000,
    });
    const problem = getProblem(id)!;
    expect(problem.authorName).toBe("nino");
    const result = await submit(student, { problemId: id, language: "python", mode: "browser", code: "", answer: "", results: run(["4", "20"]) });
    expect(result.verdict).toBe("accepted");
  });
});

describe("Judge0 adapter", () => {
  const originalUrl = process.env.JUDGE0_URL;
  afterEach(() => {
    process.env.JUDGE0_URL = originalUrl;
  });

  it("sends base64 code and maps statuses", async () => {
    const statuses = [3, 5, 11];
    const bodies: unknown[] = [];
    const fake = (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      const status = statuses.shift()!;
      return new Response(JSON.stringify({ stdout: Buffer.from("15\n").toString("base64"), stderr: Buffer.from("boom").toString("base64"), status: { id: status, description: "x" } }), { status: 200 });
    }) as unknown as typeof fetch;
    const judge = new Judge0Judge("http://judge.local", "t", { python: 71, cpp: 54 }, fake);
    const results = await judge.run("print(1)", "cpp", ["1", "2", "3"], 1000);
    expect(results[0]).toEqual({ output: "15\n", timedOut: false, error: undefined });
    expect(results[1].timedOut).toBe(true);
    expect(results[2].error).toBe("boom");
    expect((bodies[0] as { language_id: number }).language_id).toBe(54);
    expect(Buffer.from((bodies[0] as { source_code: string }).source_code, "base64").toString()).toBe("print(1)");
  });

  it("stops after a compilation error", async () => {
    let calls = 0;
    const fake = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ compile_output: Buffer.from("error: expected ';'").toString("base64"), status: { id: 6 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const judge = new Judge0Judge("http://judge.local", undefined, { python: 71, cpp: 54 }, fake);
    const results = await judge.run("int main(", "cpp", ["1", "2"], 1000);
    expect(calls).toBe(1);
    expect(results.every((r) => r.compileError?.includes("expected"))).toBe(true);
  });
});
