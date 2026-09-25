/**
 * Development check: runs every built-in reference solution (Python and C++)
 * against every test case and every "predict the output" program.
 * Requires python3 and g++ on the developer's machine. Never runs in the app.
 *
 *   npx tsx scripts/verify-problems.ts
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BUILT_IN_PROBLEMS } from "../src/lib/labs/programming/catalog";
import { outputsMatch } from "../src/lib/labs/programming/compare";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-verify-"));
let failures = 0;

function runPython(code: string, input: string) {
  const file = path.join(dir, "main.py");
  fs.writeFileSync(file, code);
  return spawnSync("python3", [file], { input, encoding: "utf8", timeout: 10_000 });
}

function runCpp(code: string, input: string, key: string) {
  const src = path.join(dir, `${key}.cpp`);
  const bin = path.join(dir, key);
  if (!fs.existsSync(bin)) {
    fs.writeFileSync(src, code);
    execFileSync("g++", ["-O2", "-std=c++17", "-o", bin, src]);
  }
  return spawnSync(bin, [], { input, encoding: "utf8", timeout: 10_000 });
}

function check(label: string, actual: string, expected: string) {
  if (!outputsMatch(actual, expected)) {
    failures += 1;
    console.error(`✗ ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

for (const problem of BUILT_IN_PROBLEMS) {
  if (problem.kind === "code") {
    problem.tests.forEach((test, i) => {
      check(`${problem.id} python #${i + 1}`, runPython(problem.solution.python, test.input).stdout, test.output);
      check(`${problem.id} c++ #${i + 1}`, runCpp(problem.solution.cpp, test.input, `${problem.id}-sol`).stdout, test.output);
    });
    if (!problem.tests.some((t) => t.sample)) {
      failures += 1;
      console.error(`✗ ${problem.id} has no sample test`);
    }
  } else if (problem.kind === "predict") {
    check(`${problem.id} python predict`, runPython(problem.code.python, "").stdout, problem.expected.python);
    check(`${problem.id} c++ predict`, runCpp(problem.code.cpp, "", `${problem.id}-predict`).stdout, problem.expected.cpp);
  } else if (problem.kind === "choice" && !problem.options.some((o) => o.id === problem.correct)) {
    failures += 1;
    console.error(`✗ ${problem.id} correct option missing`);
  }
}

fs.rmSync(dir, { recursive: true, force: true });
console.log(failures ? `${failures} problem(s) failed` : `All ${BUILT_IN_PROBLEMS.length} problems verified.`);
process.exit(failures ? 1 : 0);
