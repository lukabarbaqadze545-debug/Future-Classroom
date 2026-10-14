import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readBook } from "../../scripts/problem-book/parse";

/**
 * The C++ problem book is written in content/books-src/cpp-problems and built
 * into content/books/cpp-problems-1.docx/.md by scripts/build-problem-book.ts
 * (which also compiles and runs every solution; it needs g++, so it is not part
 * of this test). These checks need no compiler: the sources are well formed and
 * the shipped book is the one the sources describe.
 */
const SOURCES = path.join(process.cwd(), "content", "books-src", "cpp-problems");
const book = readBook(SOURCES);
const problems = book.chapters.flatMap((c) => c.problems);

describe("C++ problem book", () => {
  it("has numbered chapters with a solid number of problems at every level", () => {
    expect(book.chapters.map((c) => c.number)).toEqual(book.chapters.map((_, i) => i + 1));
    expect(problems.length).toBeGreaterThanOrEqual(150);
    for (const level of [1, 2, 3, 4, 5]) expect(problems.filter((p) => p.level === level).length).toBeGreaterThanOrEqual(5);
    expect(new Set(problems.map((p) => p.id)).size).toBe(problems.length);
    expect(new Set(problems.map((p) => p.title + p.id.split(".")[0])).size).toBe(problems.length);
  });

  it("gives every problem hints, a solution and a way to check it", () => {
    for (const p of problems) {
      expect(p.hints.length, p.id).toBeGreaterThanOrEqual(p.kind === "predict" ? 1 : 3);
      if (p.kind === "predict") {
        expect(p.given, p.id).toBeTruthy();
        expect(p.solution.answer, p.id).toBeTruthy();
      } else {
        expect(p.solution.code, p.id).toContain("main");
        expect(p.examples.length, p.id).toBeGreaterThan(0);
      }
      // Programs print Latin text only: Georgian output breaks in many terminals.
      for (const out of [...p.examples.map((e) => e.output), p.solution.answer ?? ""]) expect(out, p.id).not.toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it("ships the book the sources describe", () => {
    const text = fs.readFileSync(path.join(process.cwd(), "content", "books", "cpp-problems-1.md"), "utf-8");
    expect(text.startsWith(`${problems.length} ამოცანა C++-ში`)).toBe(true);
    let at = 0;
    for (const p of problems) {
      const heading = `## ${p.id}. ${p.title}`;
      const found = text.indexOf(heading, at);
      expect(found, `${heading} is missing or out of order: rebuild with scripts/build-problem-book.ts`).toBeGreaterThanOrEqual(at);
      at = found;
    }
    expect(fs.statSync(path.join(process.cwd(), "content", "books", "cpp-problems-1.docx")).size).toBeGreaterThan(50_000);
  });
});
