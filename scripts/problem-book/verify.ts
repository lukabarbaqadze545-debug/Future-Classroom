/**
 * Runs what the problem book promises: every reference solution is compiled
 * (with warnings on and the sanitizers), must print exactly the shown output
 * on every example and extra test, and must agree with a brute-force solution
 * on random inputs where the source has one. A "predict" program must print
 * the stated answer; a "debug" program must really fail on its example.
 * Needs g++ and python3 on the developer's machine.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { outputsMatch } from "../../src/lib/labs/programming/compare";
import type { Problem } from "./parse";

const work = path.join(os.tmpdir(), "fc-problem-book");
const STRESS_RUNS = 80;
const FLAGS = ["-O1", "-std=c++17", "-Wall", "-Wextra", "-fsanitize=address,undefined", "-fno-sanitize-recover=undefined"];

export interface Report {
  id: string;
  title: string;
  errors: string[];
  warnings: string[];
}

interface Compiled {
  bin: string | null;
  error: string;
  warnings: string;
}

function compile(code: string): Compiled {
  fs.mkdirSync(work, { recursive: true });
  const hash = crypto.createHash("sha1").update(code).update(FLAGS.join(" ")).digest("hex").slice(0, 16);
  const bin = path.join(work, hash);
  const log = `${bin}.log`;
  if (fs.existsSync(bin)) return { bin, error: "", warnings: fs.existsSync(log) ? fs.readFileSync(log, "utf-8") : "" };
  fs.writeFileSync(`${bin}.cpp`, code);
  const result = spawnSync("g++", [...FLAGS, "-o", bin, `${bin}.cpp`], { encoding: "utf8", timeout: 60_000 });
  if (result.status !== 0) return { bin: null, error: result.stderr.slice(0, 1500), warnings: "" };
  fs.writeFileSync(log, result.stderr);
  return { bin, error: "", warnings: result.stderr };
}

function run(bin: string, input: string): { out: string; err: string; status: number | null } {
  const r = spawnSync(bin, [], { input: input ? `${input}\n` : "", encoding: "utf8", timeout: 10_000, maxBuffer: 64 * 1024 * 1024 });
  return { out: r.stdout ?? "", err: (r.stderr ?? "").slice(0, 600), status: r.error ? -1 : r.status };
}

function short(text: string): string {
  const flat = JSON.stringify(text);
  return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat;
}

export function verifyProblem(p: Problem): Report {
  const report: Report = { id: p.id, title: p.title, errors: [], warnings: [] };
  const fail = (m: string) => report.errors.push(m);

  const check = (label: string, code: string, input: string, expected: string) => {
    const c = compile(code);
    if (!c.bin) return fail(`${label}: does not compile\n${c.error}`);
    if (c.warnings.trim()) report.warnings.push(`${label}: ${c.warnings.trim().split("\n").slice(0, 3).join(" | ")}`);
    const r = run(c.bin, input);
    if (r.status !== 0) return fail(`${label}: exit ${r.status} ${r.err}`);
    if (!outputsMatch(r.out, expected)) fail(`${label}: expected ${short(expected)}, got ${short(r.out)}`);
  };

  if (p.kind === "predict") {
    check("predict", p.given!, p.statementInput ?? "", p.solution.answer!);
    return report;
  }

  const solution = p.solution.code!;
  p.examples.forEach((ex, i) => check(`example ${i + 1}`, solution, ex.input, ex.output));
  p.extra.forEach((ex, i) => check(`extra test ${i + 1}`, solution, ex.input, ex.output));

  if (p.kind === "debug" && p.given) {
    const c = compile(p.given);
    if (c.bin) {
      const ex = p.examples[0];
      const r = run(c.bin, ex.input);
      if (r.status === 0 && outputsMatch(r.out, ex.output)) fail("debug: the faulty program already prints the right output on example 1, so the bug would not show");
    }
  }

  if (p.stress) {
    const sol = compile(solution);
    const brute = compile(p.stress.brute);
    if (!sol.bin || !brute.bin) {
      fail(`stress: ${brute.bin ? "solution" : "brute force"} does not compile\n${brute.error || sol.error}`);
      return report;
    }
    const genFile = path.join(work, `${crypto.createHash("sha1").update(p.stress.gen).digest("hex").slice(0, 16)}.py`);
    fs.writeFileSync(genFile, p.stress.gen);
    for (let seed = 1; seed <= STRESS_RUNS; seed++) {
      const g = spawnSync("python3", [genFile, String(seed)], { encoding: "utf8", timeout: 10_000 });
      if (g.status !== 0) return void fail(`stress: the generator failed on seed ${seed}: ${(g.stderr ?? "").slice(0, 300)}`);
      const input = g.stdout.replace(/\s+$/, "");
      const a = run(sol.bin, input);
      const b = run(brute.bin, input);
      if (a.status !== 0 || b.status !== 0) return void fail(`stress: seed ${seed} crashed (solution ${a.status} ${a.err}; brute ${b.status} ${b.err}) on input ${short(input)}`);
      if (!outputsMatch(a.out, b.out)) return void fail(`stress: seed ${seed} differs on input ${short(input)}: solution ${short(a.out)}, brute ${short(b.out)}`);
    }
  }
  return report;
}
