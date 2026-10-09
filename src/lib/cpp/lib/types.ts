import type { Expr, Loc } from "../ast";
import type { CE, ClassInfo, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import type { Ty } from "../types";

/** How iterating a type works (range-based for). */
export interface RangeInfo {
  elemTy: Ty;
  /** Take a snapshot or other form of the container before the loop starts. */
  prepare?: (c: any) => any;
  length: (c: any) => number;
  at: (c: any, i: number) => any;
  /** For numbers: a reference to the element (for `auto&`). */
  place?: (c: any, i: number) => any;
  /** The container can change while the loop runs. */
  live: boolean;
}

/** What the compiler asks of the standard library. */
export interface Lib {
  makeStr(s: string): any;
  cstring(p: any): string;
  defaultStd(ty: Ty): () => any;
  convert(fc: FnCompiler, ce: CE, to: Ty, at: Loc): CE | null;
  construct(fc: FnCompiler, ty: Ty, args: Expr[], at: Loc): CE;
  listInit(fc: FnCompiler, ty: Ty, args: Expr[], at: Loc): CE;
  constructFromOne?(fc: FnCompiler, info: ClassInfo, ce: CE, at: Loc): CE | null;
  rangeInfo(ty: Ty): RangeInfo | null;
  builtinValue(fc: FnCompiler, name: string, e: Loc, qualified: boolean): CE | null;
  callBuiltin(fc: FnCompiler, name: string, e: Extract<Expr, { k: "call" }>, callee: Extract<Expr, { k: "id" }>, qualified: boolean, hint?: Ty): CE | null;
  methodCall(fc: FnCompiler, obj: CE, name: string, e: Extract<Expr, { k: "call" }>, arrow: boolean): CE | null;
  streamOut(fc: FnCompiler, os: CE, rhs: Expr, at: Loc): CE;
  streamIn(fc: FnCompiler, is: CE, rhs: Expr, at: Loc): CE;
  indexStd(fc: FnCompiler, base: CE, idx: CE, at: Loc): CE | null;
  binaryStd(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null;
  compoundStd(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null;
  derefStd(fc: FnCompiler, x: CE, at: Loc): CE | null;
  arrowStd(fc: FnCompiler, base: CE, name: string, at: Loc): CE | null;
  incIter(t: Ty, dir: number): (v: any) => any;
  newExpr(fc: FnCompiler, e: Extract<Expr, { k: "new" }>): CE;
  deleteExpr(fc: FnCompiler, e: Extract<Expr, { k: "delete" }>): CE;
}

export type FrameFn = (fr: Frame) => any;
