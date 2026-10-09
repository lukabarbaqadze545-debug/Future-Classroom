import type { Expr, Loc } from "../ast";
import { runtimeError } from "../errors";
import type { CE, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { ElemPlace } from "../values";
import { T_LONG, isIntegral, strip, type Ty } from "../types";

export type Call = Extract<Expr, { k: "call" }>;

export const val = (ty: Ty, ev: (fr: Frame) => any, line: number): CE => ({ ty, ev, line });

/** The number of arguments must be in [min, max]. */
export function checkArgs(fc: FnCompiler, e: Call, name: string, min: number, max = min): void {
  if (e.args.length < min || e.args.length > max) {
    const want = min === max ? String(min) : `${min} to ${max}`;
    fc.err("arg-count", `'${name}' takes ${want} argument${max === 1 ? "" : "s"} but ${e.args.length} ${e.args.length === 1 ? "was" : "were"} given`, e, { name, expected: want, given: e.args.length });
  }
}

/** An integer argument as a plain JS number (for indexes, sizes and counts). */
export function numArg(fc: FnCompiler, ce: CE, at: Loc, what = "an integer"): (fr: Frame) => number {
  const t = strip(ce.ty);
  if (!isIntegral(t)) fc.err("bad-argument", `${what} is needed here, not ${t.k}`, at, { what });
  if (t.k === "int" && t.bits === 64) {
    const ev = fc.coerce(ce, T_LONG, at, "cast").ev;
    return (fr) => {
      const v = ev(fr);
      return typeof v === "number" ? v : Number(v);
    };
  }
  const ev = fc.coerce(ce, { k: "int", bits: 32, signed: true, name: "int" }, at, "cast").ev;
  if (t.k === "int" && t.bits === 32 && !t.signed) return (fr) => ce.ev(fr);
  return ev;
}

export function outOfRange(kind: string, i: number, n: number, line: number): never {
  throw runtimeError("index-range", `index ${i} is outside the ${kind} (size ${n})`, line, { index: i, size: n, kind });
}

export function emptyError(what: string, line: number): never {
  throw runtimeError("empty", `${what} on an empty container`, line, { what });
}

/** A pointer into an array, or null. */
export const isElemPlace = (p: any): p is ElemPlace => p instanceof ElemPlace;
