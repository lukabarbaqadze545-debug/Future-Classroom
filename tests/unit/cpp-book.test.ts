import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCpp } from "@/lib/cpp";
import { outputsMatch } from "@/lib/labs/programming/compare";
import { readBook } from "../../scripts/problem-book/parse";

/**
 * Every program of the C++ problem book runs in the interpreter and prints what
 * the book says it prints: the reference solutions on their examples and extra
 * checks, and the "what does it print?" programs.
 */
const book = readBook(path.join(process.cwd(), "content", "books-src", "cpp-problems"));
const problems = book.chapters.flatMap((c) => c.problems);

describe("the problem book in the C++ runner", () => {
  const solve = problems.filter((p) => p.kind !== "predict" && p.solution.code);
  const predict = problems.filter((p) => p.kind === "predict" && p.given);

  it("covers a lot of programs", () => {
    expect(solve.length).toBeGreaterThanOrEqual(150);
    expect(predict.length).toBeGreaterThanOrEqual(5);
  });

  for (const p of solve) {
    it(`${p.id} ${p.title}: the solution passes its examples`, () => {
      const cases = [...p.examples.map((e) => ({ input: e.input, output: e.output })), ...p.extra];
      for (const c of cases) {
        const r = runCpp(p.solution.code!, { stdin: c.input, stepLimit: 400_000_000 });
        expect(r.status, `${r.diagnostic?.code}: ${r.diagnostic?.message} (line ${r.diagnostic?.line})`).toBe("ok");
        expect(outputsMatch(r.stdout, c.output), `got ${JSON.stringify(r.stdout.slice(0, 120))}`).toBe(true);
      }
    }, 60_000);
  }

  for (const p of predict) {
    it(`${p.id} ${p.title}: the program prints the stated answer`, () => {
      const r = runCpp(p.given!, { stdin: p.statementInput ?? "" });
      expect(r.status).toBe("ok");
      expect(outputsMatch(r.stdout, p.solution.answer ?? "")).toBe(true);
    });
  }
});
