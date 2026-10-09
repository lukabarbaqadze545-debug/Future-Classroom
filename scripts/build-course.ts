/**
 * Development tool: makes the expected outputs of every course exercise, runnable example and
 * "what does it print?" program by compiling the reference code with the real g++, and checks the
 * site's own C++ runner against it.
 *
 *   npx tsx scripts/build-course.ts            # only what changed
 *   npx tsx scripts/build-course.ts --force    # everything again
 *
 * Writes src/lib/courses/cpp/generated.json (the unit tests need no compiler: they run the same
 * reference solutions through the runner and compare). Also checks that:
 *  - every example's stated output is what the program prints,
 *  - every exercise's starter code is not already a solution (except fix tasks that pass trivially),
 *  - every listed "wrong" solution is rejected by the tests.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { runCpp } from "../src/lib/cpp";
import { cppCourse } from "../src/lib/courses/cpp";
import { judge, sameOutput } from "../src/lib/courses/judge";
import { blockSig, exerciseSig } from "../src/lib/courses/signature";
import type { Block, Exercise, Lesson, TestCase } from "../src/lib/courses/types";
import type { Generated } from "../src/lib/courses/data";

const run = promisify(execFile);
const OUT = path.resolve(__dirname, "..", "src", "lib", "courses", "cpp", "generated.json");
const force = process.argv.includes("--force");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-course-"));
const previous: Generated = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { version: 1, exercises: {}, outputs: {} };
const next: Generated = { version: 1, exercises: {}, outputs: {} };
const problems: string[] = [];
let compiled = 0;
let n = 0;

const fail = (where: string, what: string) => problems.push(`✗ ${where}: ${what}`);

async function gpp(source: string): Promise<string | null> {
  const key = `p${n++}`;
  const src = path.join(dir, `${key}.cpp`);
  const bin = path.join(dir, key);
  fs.writeFileSync(src, source);
  try {
    await run("g++", ["-std=c++17", "-O1", "-w", "-o", bin, src], { timeout: 60_000 });
  } catch (e) {
    problems.push(`✗ does not compile with g++:\n${String((e as { stderr?: string }).stderr ?? e).slice(0, 800)}\n--- source ---\n${source}`);
    return null;
  }
  compiled++;
  return bin;
}

async function execute(bin: string, input: string): Promise<{ out: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = execFile(bin, [], { timeout: 10_000, maxBuffer: 16 * 1024 * 1024, encoding: "buffer" }, (error, stdout) => {
      const code = error && typeof (error as { code?: unknown }).code === "number" ? ((error as { code: number }).code as number) : error ? null : 0;
      resolve({ out: Buffer.from(stdout).toString("utf8"), code });
    });
    // A program that never reads its input may finish before it is written: that is not an error.
    child.stdin?.on("error", () => undefined);
    child.stdin?.end(input);
  });
}

async function outputOfGpp(source: string, inputs: string[]): Promise<string[] | null> {
  const bin = await gpp(source);
  if (!bin) return null;
  const outs: string[] = [];
  for (const input of inputs) {
    const r = await execute(bin, input);
    if (r.code !== 0) {
      fail("run", `exit code ${r.code} on input ${JSON.stringify(input.slice(0, 80))}\n${source.slice(0, 300)}`);
      return null;
    }
    outs.push(r.out);
  }
  return outs;
}

/** Runs `jobs` with a few at a time. */
async function pool<T>(items: T[], worker: (item: T) => Promise<void>, size = Math.max(2, Math.min(6, os.cpus().length))): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) await worker(items[i++]); }));
}

async function doExercise(lesson: Lesson, e: Exercise): Promise<void> {
  const where = `${e.id}`;
  const sig = exerciseSig(e);
  const old = previous.exercises[e.id];
  const inputs = [...e.samples, ...e.tests.filter((t) => !e.samples.includes(t))];
  let outs: string[] | null;
  if (!force && old && old.sig === sig) {
    outs = [...old.samples, ...old.tests].map((t) => t.output);
  } else {
    outs = await outputOfGpp(e.solution, inputs);
    if (!outs) return;
  }
  const cases: TestCase[] = inputs.map((input, i) => ({ input, output: outs![i] }));
  next.exercises[e.id] = { sig, samples: cases.slice(0, e.samples.length), tests: cases.slice(e.samples.length) };
  // The site's runner must agree with g++ on every test of the reference solution.
  const verdict = judge({ code: e.solution, tests: cases, samples: e.samples.length, compare: e.compare, limits: { timeMs: 4000, totalSteps: 1_000_000_000 } });
  if (verdict.verdict !== "accepted") fail(where, `the reference solution is not accepted by the runner: ${verdict.verdict} ${JSON.stringify(verdict.diagnostic ?? verdict.tests.find((t) => t.status !== "ok"))}`);
  // The starter must not already be a solution.
  if (e.kind === "write") {
    const starter = judge({ code: e.starter, tests: cases, samples: e.samples.length, compare: e.compare });
    if (starter.verdict === "accepted") fail(where, "the starter code already passes every test");
  }
  for (const w of e.wrong ?? []) {
    const r = judge({ code: w.code, tests: cases, samples: e.samples.length, compare: e.compare });
    if (r.verdict === "accepted") fail(where, `a wrong solution is accepted (${w.why})`);
    if (r.verdict === "compile_error") fail(where, `a wrong solution does not compile (${w.why}): ${JSON.stringify(r.diagnostic)}`);
  }
  void lesson;
}

async function doBlock(lesson: Lesson, b: Extract<Block, { k: "code" | "predict" }>): Promise<void> {
  const key = `${lesson.id}/${b.id}`;
  if (b.k === "code" && b.error) {
    // A program that is meant to fail: the runner must report this problem (there is no output to compare).
    const mine = runCpp(b.code, { stdin: b.stdin ?? "", stepLimit: 50_000_000 });
    if (mine.status === "ok" || mine.diagnostic?.code !== b.error) fail(key, `expected the diagnostic "${b.error}" but got ${mine.status} ${mine.diagnostic?.code}`);
    next.outputs[key] = { sig: blockSig(b), out: "" };
    return;
  }
  const sig = blockSig(b);
  const old = previous.outputs[key];
  let out: string;
  if (!force && old && old.sig === sig) out = old.out;
  else {
    const got = await outputOfGpp(b.code, [b.stdin ?? ""]);
    if (!got) return;
    out = got[0];
  }
  next.outputs[key] = { sig, out };
  const mine = runCpp(b.code, { stdin: b.stdin ?? "", stepLimit: 200_000_000 });
  if (mine.status !== "ok") fail(key, `the runner failed: ${mine.status} ${mine.diagnostic?.code}: ${mine.diagnostic?.message} (line ${mine.diagnostic?.line})`);
  else if (mine.stdout !== out) fail(key, `the runner prints ${JSON.stringify(mine.stdout.slice(0, 120))} but g++ prints ${JSON.stringify(out.slice(0, 120))}`);
  if (b.k === "code" && b.out !== undefined && !sameOutput(out, b.out)) fail(key, `the lesson says it prints ${JSON.stringify(b.out.slice(0, 120))} but it prints ${JSON.stringify(out.slice(0, 120))}`);
}

async function main(): Promise<void> {
  const ids = new Set<string>();
  const unique = (id: string, where: string) => {
    if (ids.has(id)) fail(where, `duplicate id ${id}`);
    ids.add(id);
  };
  const exercises: [Lesson, Exercise][] = [];
  const blocks: [Lesson, Extract<Block, { k: "code" | "predict" }>][] = [];
  for (const m of cppCourse.modules) {
    for (const l of m.lessons) {
      unique(l.id, l.id);
      for (const e of l.exercises) {
        unique(e.id, e.id);
        exercises.push([l, e]);
      }
      const seen = new Set<string>();
      for (const b of l.blocks) {
        if ("id" in b) {
          if (seen.has(b.id)) fail(l.id, `duplicate block id ${b.id}`);
          seen.add(b.id);
        }
        if (b.k === "code" || b.k === "predict") if (!(b.k === "code" && b.readonly)) blocks.push([l, b]);
      }
    }
  }
  await pool(blocks, ([l, b]) => doBlock(l, b));
  await pool(exercises, ([l, e]) => doExercise(l, e));

  const sortKeys = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  next.exercises = sortKeys(next.exercises);
  next.outputs = sortKeys(next.outputs);
  fs.writeFileSync(OUT, JSON.stringify(next, null, 1) + "\n");
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`${exercises.length} exercises, ${blocks.length} programs; compiled ${compiled} with g++.`);
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(`\n${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log("All course code checked against g++.");
}

main();
