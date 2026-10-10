import { CppError, limitError, type Diagnostic } from "./errors";
import { Compiler } from "./compiler";
import { parseProgram } from "./parser";
import { utf8Bytes } from "./lexer";
import { Machine } from "./machine";
import { ElemPlace, ExitSignal, IStream, OStream, type Rt } from "./values";

/**
 * Compiles and runs a C++ program: the entry point of the runner.
 *
 * The runner never touches anything outside the program: no files, no network,
 * no host objects. What it cannot do is bounded (steps, memory, output,
 * recursion depth), so a program that loops forever ends with a clear message.
 */

export interface RunOptions {
  /** What the program reads from standard input. */
  stdin?: string;
  /** Most steps (instructions, calls) the program may take. */
  stepLimit?: number;
  /** Most memory (an estimate, in bytes) it may use. */
  memoryLimit?: number;
  /** Most bytes it may print. */
  outputLimit?: number;
  /** Deepest recursion. */
  maxDepth?: number;
}

export type RunStatus = "ok" | "compile_error" | "runtime_error" | "time_limit" | "memory_limit" | "output_limit" | "stack_overflow" | "unsupported";

export interface RunResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
  /** The value `main` returned (or passed to exit). */
  exitCode: number;
  /** For anything but "ok": what went wrong, and where. */
  diagnostic: Diagnostic | null;
  /** How many steps the program took. */
  steps: number;
}

export const DEFAULTS = { stepLimit: 50_000_000, memoryLimit: 256 * 1024 * 1024, outputLimit: 1_000_000, maxDepth: 250_000 } as const;

function makeRt(options: RunOptions): Rt {
  return {
    budget: options.stepLimit ?? DEFAULTS.stepLimit,
    mem: 0,
    memLimit: options.memoryLimit ?? DEFAULTS.memoryLimit,
    depth: 0,
    maxDepth: options.maxDepth ?? DEFAULTS.maxDepth,
    cout: new OStream(options.outputLimit ?? DEFAULTS.outputLimit, "cout"),
    cerr: new OStream(options.outputLimit ?? DEFAULTS.outputLimit, "cerr"),
    cin: new IStream(utf8Bytes(options.stdin ?? "")),
    invoke: () => {
      throw new Error("not running");
    },
    atExit: [],
    line: 0,
  };
}

const STATUS_BY_CODE: Record<string, RunStatus> = {
  "time-limit": "time_limit",
  "memory-limit": "memory_limit",
  "output-limit": "output_limit",
  "stack-overflow": "stack_overflow",
};

function resultFor(rt: Rt, e: unknown, exitCode: number, steps: number, phase: "compile" | "run"): RunResult {
  const base = { stdout: rt.cout.text(), stderr: rt.cerr.text(), exitCode, steps };
  if (e instanceof CppError) {
    const d = e.diagnostic;
    let status: RunStatus;
    if (d.kind === "unsupported") status = "unsupported";
    else if (d.kind === "limit") status = STATUS_BY_CODE[d.code] ?? "time_limit";
    else if (phase === "compile") status = "compile_error";
    else status = "runtime_error";
    return { ...base, status, diagnostic: d };
  }
  if (e instanceof RangeError) {
    // The JS stack ran out inside a deeply nested expression.
    return { ...base, status: "stack_overflow", diagnostic: { kind: "limit", code: "stack-overflow", message: "the program nested too deeply (stack overflow)", args: {}, line: 0, col: 0 } };
  }
  throw e;
}

/** Compiles only: the diagnostics a student would see before running. */
export function checkCpp(source: string): Diagnostic | null {
  const rt = makeRt({});
  try {
    const program = parseProgram(source);
    new Compiler(rt, program).compile();
    return null;
  } catch (e) {
    if (e instanceof CppError) return e.diagnostic;
    throw e;
  }
}

/** Destroys globals and static locals, last constructed first. */
function runAtExit(rt: Rt): void {
  while (rt.atExit.length) rt.atExit.pop()!();
}

export function runCpp(source: string, options: RunOptions = {}): RunResult {
  const rt = makeRt(options);
  const start = rt.budget;
  let code;
  try {
    const program = parseProgram(source);
    code = new Compiler(rt, program).compile();
  } catch (e) {
    return resultFor(rt, e, 1, 0, "compile");
  }
  const machine = new Machine(rt);
  let exitCode = 0;
  try {
    if (code.init) machine.call(code.init, []);
    const main = code.main;
    const args: any[] = main.params.length >= 2 ? [1, new ElemPlace([new ElemPlace([112, 114, 111, 103, 0], 0), null], 0)] : [];
    const r = machine.call(main, args);
    exitCode = typeof r === "number" ? r : 0;
    runAtExit(rt);
  } catch (e) {
    if (e instanceof ExitSignal) {
      exitCode = e.code;
      try {
        runAtExit(rt);
      } catch (e2) {
        if (!(e2 instanceof ExitSignal)) return resultFor(rt, e2, 1, start - rt.budget, "run");
      }
    } else return resultFor(rt, e, 1, start - rt.budget, "run");
  }
  return { status: "ok", stdout: rt.cout.text(), stderr: rt.cerr.text(), exitCode, diagnostic: null, steps: start - rt.budget };
}

export { limitError };
export type { Diagnostic };
