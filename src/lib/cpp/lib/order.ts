import type { Loc } from "../ast";
import type { ClassInfo, FnInfo } from "../core";
import type { Compiler } from "../compiler";
import { Func, Pair, Tup, Vec, CStr } from "../values";
import { strip, tyStr, type Ty } from "../types";

/** How values of a type are ordered, compared for equality and hashed (for sort, set, map, ==). */

export type Less = (a: any, b: any) => boolean;
export type Eq = (a: any, b: any) => boolean;
export type Cmp3 = (a: any, b: any) => number;

/** The user's `operator<` (or `==`) for a class, as a callable. */
function userOp(cc: Compiler, info: ClassInfo, op: string): ((a: any, b: any) => any) | null {
  const rt = cc.rt;
  const m = info.methods.get(op)?.find((f) => f.params.length === 1);
  if (m) {
    const func = new Func(m, null);
    return (a, b) => rt.invoke(func, [a, b]);
  }
  const frees = cc.funcs.get(op)?.filter((f) => f.params.length === 2 && strip(f.params[0].ty).k === "cls" && (strip(f.params[0].ty) as { cls: { info: unknown } }).cls.info === info);
  if (frees?.length) {
    const func = new Func(frees[0] as FnInfo, null);
    return (a, b) => rt.invoke(func, [a, b]);
  }
  return null;
}

export function lessFn(cc: Compiler, ty: Ty, at: Loc): Less {
  const t = strip(ty);
  switch (t.k) {
    case "bool":
    case "int":
    case "enum":
    case "float":
    case "double":
      return (a, b) => a < b;
    case "ptr":
      return (a, b) => (a?.i ?? 0) < (b?.i ?? 0);
    case "str":
      return (a: CStr, b: CStr) => a.s < b.s;
    case "cls": {
      const info = t.cls.info as ClassInfo;
      const op = userOp(cc, info, "operator<");
      if (!op) cc.err("no-ordering", `${info.name} cannot be compared with '<': define operator< for it (or pass a comparison function)`, at, { type: info.name });
      return (a, b) => !!op(a, b);
    }
    case "std": {
      if (t.name === "pair") {
        const l0 = lessFn(cc, t.args[0], at);
        const l1 = lessFn(cc, t.args[1], at);
        return (a: Pair, b: Pair) => l0(a.first, b.first) || (!l0(b.first, a.first) && l1(a.second, b.second));
      }
      if (t.name === "tuple") {
        const ls = t.args.map((x) => lessFn(cc, x, at));
        return (a: Tup, b: Tup) => {
          for (let i = 0; i < ls.length; i++) {
            if (ls[i](a.e[i], b.e[i])) return true;
            if (ls[i](b.e[i], a.e[i])) return false;
          }
          return false;
        };
      }
      if (t.name === "vector" || t.name === "array" || t.name === "deque") {
        const l = lessFn(cc, t.args[0], at);
        return (a: Vec, b: Vec) => {
          const n = Math.min(a.a.length, b.a.length);
          for (let i = 0; i < n; i++) {
            if (l(a.a[i], b.a[i])) return true;
            if (l(b.a[i], a.a[i])) return false;
          }
          return a.a.length < b.a.length;
        };
      }
    }
  }
  return cc.err("no-ordering", `${tyStr(ty)} cannot be compared with '<'`, at, { type: tyStr(ty) });
}

export function eqFn(cc: Compiler, ty: Ty, at: Loc): Eq {
  const t = strip(ty);
  switch (t.k) {
    case "bool":
    case "int":
    case "enum":
    case "float":
    case "double":
      return (a, b) => a === b;
    case "ptr":
      return (a, b) => a === b || (a !== null && b !== null && a.arr === b.arr && a.i === b.i);
    case "str":
      return (a: CStr, b: CStr) => a.s === b.s;
    case "cls": {
      const info = t.cls.info as ClassInfo;
      const op = userOp(cc, info, "operator==");
      if (!op) cc.err("no-equality", `${info.name} cannot be compared with '==': define operator== for it`, at, { type: info.name });
      return (a, b) => !!op(a, b);
    }
    case "std": {
      if (t.name === "pair") {
        const e0 = eqFn(cc, t.args[0], at);
        const e1 = eqFn(cc, t.args[1], at);
        return (a: Pair, b: Pair) => e0(a.first, b.first) && e1(a.second, b.second);
      }
      if (t.name === "tuple") {
        const es = t.args.map((x) => eqFn(cc, x, at));
        return (a: Tup, b: Tup) => es.every((e, i) => e(a.e[i], b.e[i]));
      }
      if (t.name === "vector" || t.name === "array" || t.name === "deque") {
        const e = eqFn(cc, t.args[0], at);
        return (a: Vec, b: Vec) => a.a.length === b.a.length && a.a.every((x, i) => e(x, b.a[i]));
      }
    }
  }
  return cc.err("no-equality", `${tyStr(ty)} cannot be compared with '=='`, at, { type: tyStr(ty) });
}

/** A key usable in a JS Map that is equal exactly when the values are equal (for unordered containers). */
export function keyFn(cc: Compiler, ty: Ty, at: Loc): (v: any) => any {
  const t = strip(ty);
  switch (t.k) {
    case "bool":
    case "int":
    case "enum":
    case "float":
    case "double":
      return (v) => v;
    case "str":
      return (v: CStr) => v.s;
    case "std": {
      if (t.name === "pair") {
        const k0 = keyFn(cc, t.args[0], at);
        const k1 = keyFn(cc, t.args[1], at);
        return (v: Pair) => `${typeof k0(v.first)}:${String(k0(v.first))}|${typeof k1(v.second)}:${String(k1(v.second))}`;
      }
      if (t.name === "tuple") {
        const ks = t.args.map((x) => keyFn(cc, x, at));
        return (v: Tup) => ks.map((k, i) => String(k(v.e[i]))).join("|");
      }
      if (t.name === "vector") {
        const k = keyFn(cc, t.args[0], at);
        return (v: Vec) => v.a.map((x) => String(k(x))).join(",");
      }
    }
  }
  return cc.err("no-hash", `${tyStr(ty)} cannot be used as a key in an unordered container`, at, { type: tyStr(ty) });
}

export const three = (less: Less): Cmp3 => (a, b) => (less(a, b) ? -1 : less(b, a) ? 1 : 0);
