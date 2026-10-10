import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCpp } from "@/lib/cpp";

/**
 * The C++ runner must behave exactly like g++. tests/fixtures/cpp holds programs
 * together with what the real g++ printed for them (scripts/cpp-golden.ts writes
 * the .out files; this test needs no compiler).
 */
const DIR = path.join(process.cwd(), "tests", "fixtures", "cpp");
const programs = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".cpp"))
  .map((f) => f.slice(0, -4))
  .sort();

describe("C++ runner against g++", () => {
  it("has a solid set of programs", () => {
    expect(programs.length).toBeGreaterThanOrEqual(30);
    for (const name of programs) expect(fs.existsSync(path.join(DIR, `${name}.out`)), `${name}.out is missing: run scripts/cpp-golden.ts`).toBe(true);
  });

  for (const name of programs) {
    it(`prints what g++ prints: ${name}`, () => {
      const source = fs.readFileSync(path.join(DIR, `${name}.cpp`), "utf8");
      const inFile = path.join(DIR, `${name}.in`);
      const stdin = fs.existsSync(inFile) ? fs.readFileSync(inFile, "utf8") : "";
      const want = fs.readFileSync(path.join(DIR, `${name}.out`), "utf8");
      const result = runCpp(source, { stdin, stepLimit: 200_000_000 });
      expect(result.diagnostic?.message ?? "", name).toBe("");
      expect(result.status).toBe("ok");
      expect(result.stdout).toBe(want);
      expect(result.exitCode).toBe(0);
    });
  }
});
