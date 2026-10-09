import type { Expr, Loc } from "../ast";
import { CppError, runtimeError } from "../errors";
import type { CE, ClassInfo, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { arithFn } from "../conv";
import * as I from "../int64";
import { CStr, ElemPlace, Func, HMap, HSet, OMap, OSet, Pair, Tup, Vec } from "../values";
import {
  T_BOOL,
  T_DOUBLE,
  T_INT,
  T_LL,
  T_LONG,
  T_SIZE,
  T_VOID,
  commonType,
  decay,
  isArithmetic,
  isClassLike,
  isFloating,
  isIntegral,
  noConst,
  pairOf,
  promote,
  sameType,
  stdTy,
  strip,
  tyStr,
  type Ty,
} from "../types";
import { eqFn, lessFn, three } from "./order";
import { It, charAt, iterElemTy, snapshotOf } from "./iter";
import { checkArgs, numArg, val, type Call } from "./helpers";
import { lowerBound, upperBound } from "./containers";

/** <algorithm>, <numeric> and friends. */

/** A range of elements as the algorithms see it: copy out, work, write back. */
export interface RangeRef {
  /** The elements (a copy for strings and reversed ranges, the live array otherwise). */
  read(): any[];
  /** Write the (possibly rearranged) elements back. */
  write(values: any[]): void;
  length: number;
  /** Iterators into the range's container, for results (a position `k` counted from the start of the range). */
  at(k: number): any;
}

export function rangeRef(first: any, last: any, line: number): RangeRef {
  if (first instanceof It && last instanceof It) {
    const c = first.c;
    if (first.snap) {
      return { length: last.i - first.i, read: () => first.snap!.slice(first.i, last.i), write: () => undefined, at: (k) => new It(c, first.i + k, first.snap) };
    }
    if (c instanceof CStr) {
      const from = first.i;
      const to = last.i;
      return {
        length: to - from,
        read: () => Array.from({ length: to - from }, (_, i) => charAt(c.s, from + i)),
        write: (vals) => {
          c.s = c.s.slice(0, from) + vals.map((v) => String.fromCharCode(v & 255)).join("") + c.s.slice(to);
        },
        at: (k) => new It(c, from + k),
      };
    }
    const arr: any[] = c instanceof Vec || c instanceof OSet || c instanceof OMap ? c.a : [];
    const from = first.i;
    const to = last.i;
    if (from > to || to > arr.length || from < 0) throw runtimeError("iterator-range", "the range [first, last) is not valid", line);
    return {
      length: to - from,
      read: () => arr.slice(from, to),
      write: (vals) => {
        for (let i = 0; i < vals.length; i++) arr[from + i] = vals[i];
      },
      at: (k) => new It(c, from + k),
    };
  }
  if (first instanceof ElemPlace && last instanceof ElemPlace) {
    const arr = first.arr;
    const from = first.i;
    const to = last.i;
    if (from > to || to > arr.length || from < 0) throw runtimeError("iterator-range", "the range [first, last) is not valid", line);
    return {
      length: to - from,
      read: () => arr.slice(from, to),
      write: (vals) => {
        for (let i = 0; i < vals.length; i++) arr[from + i] = vals[i];
      },
      at: (k) => new ElemPlace(arr, from + k),
    };
  }
  throw runtimeError("bad-range", "the two ends of the range must be iterators (or pointers) of the same container", line);
}

/** For reverse iterators: the range seen from the end. */
function reverseRange(first: It, last: It): RangeRef {
  const c = first.c;
  const n = c instanceof CStr ? c.s.length : c instanceof Vec ? c.a.length : 0;
  const from = n - last.i;
  const to = n - first.i;
  const fwd = rangeRef(new It(c, from), new It(c, to), 0);
  return {
    length: fwd.length,
    read: () => fwd.read().reverse(),
    write: (vals) => fwd.write([...vals].reverse()),
    at: (k) => new It(c, first.i + k),
  };
}

function rangeOf(first: any, last: any, rev: boolean, line: number): RangeRef {
  return rev ? reverseRange(first, last) : rangeRef(first, last, line);
}

/** Compile `first, last` arguments into a function giving the range. */
export function rangeArgs(fc: FnCompiler, e: Call, i: number): { range: (fr: Frame) => RangeRef; elem: Ty; kind: "iter" | "ptr"; rev: boolean } {
  const a = fc.expr(e.args[i]);
  const b = fc.expr(e.args[i + 1]);
  const at = strip(a.ty.k === "arr" ? { k: "ptr", to: (a.ty as { of: Ty }).of } : a.ty);
  const bt = strip(b.ty.k === "arr" ? { k: "ptr", to: (b.ty as { of: Ty }).of } : b.ty);
  if (at.k === "iter" && bt.k === "iter") {
    const av = a.ev;
    const bv = b.ev;
    const rev = !!at.reverse;
    return { range: (fr) => rangeOf(av(fr), bv(fr), rev, e.line), elem: iterElemTy(at.of), kind: "iter", rev };
  }
  if (at.k === "ptr" && bt.k === "ptr") {
    const av = strip(a.ty).k === "arr" ? (fr: Frame) => new ElemPlace(a.ev(fr), 0) : a.ev;
    const bv = strip(b.ty).k === "arr" ? (fr: Frame) => new ElemPlace(b.ev(fr), 0) : b.ev;
    return { range: (fr) => rangeRef(av(fr), bv(fr), e.line), elem: at.to, kind: "ptr", rev: false };
  }
  return fc.err("bad-range", `expected two iterators or pointers, got ${tyStr(a.ty)} and ${tyStr(b.ty)}`, e, { a: tyStr(a.ty), b: tyStr(b.ty) });
}

/** A function value turned into a JS function of its arguments. */
export function callable(fc: FnCompiler, ce: CE, at: Loc, elem: Ty, arity: number): (fr: Frame) => (...a: any[]) => any {
  const t = strip(ce.ty);
  const rt = fc.rt;
  // The bare name of a function (`sort(v.begin(), v.end(), byAge)`).
  if (ce.fn && ce.fn.length) {
    const func = new Func(ce.fn[0], null);
    return () => (...a) => rt.invoke(func, a);
  }
  if (t.k === "fn") {
    const ev = ce.ev;
    return (fr) => {
      const f = ev(fr) as Func;
      return (...a) => rt.invoke(f, a);
    };
  }
  if (t.k === "cls") {
    const info = t.cls.info as ClassInfo;
    const op = info.methods.get("operator()")?.[0];
    if (!op) fc.err("not-callable", `${info.name} has no operator()`, at, { name: info.name });
    const func = new Func(op!, null);
    const ev = ce.ev;
    return (fr) => {
      const obj = ev(fr);
      return (...a) => rt.invoke(func, [obj, ...a]);
    };
  }
  if (t.k === "std") {
    const less = lessFn(fc.cc, t.args[0] ?? elem, at);
    const eq = eqFn(fc.cc, t.args[0] ?? elem, at);
    switch (t.name) {
      case "less":
        return () => (a, b) => less(a, b);
      case "greater":
        return () => (a, b) => less(b, a);
      case "less_equal":
        return () => (a, b) => !less(b, a);
      case "greater_equal":
        return () => (a, b) => !less(a, b);
      case "equal_to":
        return () => (a, b) => eq(a, b);
      case "not_equal_to":
        return () => (a, b) => !eq(a, b);
    }
    void arity;
  }
  return fc.err("not-callable", `${tyStr(ce.ty)} cannot be called here`, at, { type: tyStr(ce.ty) });
}

/** `less(a, b)` as a JS predicate for sorting: the user's comparison, or the element type's natural order. */
export function lessOf(fc: FnCompiler, e: Call, i: number, elem: Ty): (fr: Frame) => (a: any, b: any) => boolean {
  if (e.args.length > i) {
    const ce = fc.expr(e.args[i], { k: "fn", ret: T_BOOL, params: [elem, elem] });
    const c = callable(fc, ce, e, elem, 2);
    return (fr) => {
      const f = c(fr);
      return (a, b) => !!f(a, b);
    };
  }
  const natural = lessFn(fc.cc, elem, e);
  return () => natural;
}

const sortWith = (arr: any[], less: (a: any, b: any) => boolean): any[] => arr.sort(three(less));

/** The algorithms and numeric functions by name; null when the name is not one of them. */
export function algorithmCall(fc: FnCompiler, name: string, e: Call): CE | null {
  const line = e.line;
  switch (name) {
    case "sort":
    case "stable_sort": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const less = lessOf(fc, e, 2, r.elem);
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        range.write(sortWith(range.read(), less(fr)));
      }, line);
    }
    case "partial_sort": {
      checkArgs(fc, e, name, 3, 4);
      const first = fc.expr(e.args[0]).ev;
      const last = fc.expr(e.args[2]).ev;
      const t = strip(fc.typeOfExpr(e.args[0]));
      const elem = t.k === "iter" ? iterElemTy(t.of) : t.k === "ptr" ? t.to : T_INT;
      const less = lessOf(fc, e, 3, elem);
      return val(T_VOID, (fr) => {
        const range = rangeRef(first(fr), last(fr), line);
        range.write(sortWith(range.read(), less(fr)));
      }, line);
    }
    case "nth_element": {
      checkArgs(fc, e, name, 3, 4);
      const first = fc.expr(e.args[0]).ev;
      const last = fc.expr(e.args[2]).ev;
      const t = strip(fc.typeOfExpr(e.args[0]));
      const elem = t.k === "iter" ? iterElemTy(t.of) : t.k === "ptr" ? t.to : T_INT;
      const less = lessOf(fc, e, 3, elem);
      return val(T_VOID, (fr) => {
        const range = rangeRef(first(fr), last(fr), line);
        range.write(sortWith(range.read(), less(fr)));
      }, line);
    }
    case "reverse": {
      checkArgs(fc, e, name, 2);
      const r = rangeArgs(fc, e, 0);
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        range.write(range.read().reverse());
      }, line);
    }
    case "rotate": {
      checkArgs(fc, e, name, 3);
      const first = fc.expr(e.args[0]).ev;
      const mid = fc.expr(e.args[1]).ev;
      const last = fc.expr(e.args[2]).ev;
      return val(T_VOID, (fr) => {
        const f = first(fr);
        const m = mid(fr);
        const range = rangeRef(f, last(fr), line);
        const k = (m instanceof It ? m.i - (f as It).i : (m as ElemPlace).i - (f as ElemPlace).i) % Math.max(1, range.length);
        const a = range.read();
        range.write([...a.slice(k), ...a.slice(0, k)]);
      }, line);
    }
    case "unique": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const eq = e.args.length > 2 ? callable(fc, fc.expr(e.args[2]), e, r.elem, 2) : (() => { const q = eqFn(fc.cc, r.elem, e); return () => q; })();
      const itTy: Ty = r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[0]));
      return val(itTy, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const same = eq(fr);
        const out: any[] = [];
        for (const x of a) if (out.length === 0 || !same(out[out.length - 1], x)) out.push(x);
        range.write([...out, ...a.slice(out.length)]);
        return range.at(out.length);
      }, line);
    }
    case "remove":
    case "remove_if": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const arg = fc.expr(e.args[2]);
      const itTy: Ty = r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[0]));
      let test: (fr: Frame) => (x: any) => boolean;
      if (name === "remove") {
        const eq = eqFn(fc.cc, r.elem, e);
        const v = fc.coerce(arg, r.elem, e, "init").ev;
        test = (fr) => {
          const x = v(fr);
          return (y) => eq(y, x);
        };
      } else {
        const c = callable(fc, arg, e, r.elem, 1);
        test = (fr) => {
          const f = c(fr);
          return (y) => !!f(y);
        };
      }
      return val(itTy, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const t = test(fr);
        const kept = a.filter((x) => !t(x));
        range.write([...kept, ...a.slice(kept.length)]);
        return range.at(kept.length);
      }, line);
    }
    case "next_permutation":
    case "prev_permutation": {
      checkArgs(fc, e, name, 2);
      const r = rangeArgs(fc, e, 0);
      const less = lessFn(fc.cc, r.elem, e);
      const next = name === "next_permutation";
      return val(T_BOOL, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const lt = next ? less : (x: any, y: any) => less(y, x);
        let i = a.length - 2;
        while (i >= 0 && !lt(a[i], a[i + 1])) i--;
        if (i < 0) {
          a.reverse();
          range.write(a);
          return false;
        }
        let j = a.length - 1;
        while (!lt(a[i], a[j])) j--;
        [a[i], a[j]] = [a[j], a[i]];
        const tail = a.splice(i + 1).reverse();
        range.write([...a, ...tail]);
        return true;
      }, line);
    }
    case "min_element":
    case "max_element": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const less = lessOf(fc, e, 2, r.elem);
      const isMin = name === "min_element";
      const itTy: Ty = r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[0]));
      return val(itTy, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const lt = less(fr);
        if (a.length === 0) return range.at(0);
        let best = 0;
        for (let i = 1; i < a.length; i++) if (isMin ? lt(a[i], a[best]) : lt(a[best], a[i])) best = i;
        return range.at(best);
      }, line);
    }
    case "accumulate":
    case "reduce": {
      checkArgs(fc, e, name, 3, 4);
      const r = rangeArgs(fc, e, 0);
      const init = fc.expr(e.args[2]);
      const ty = noConst(decay(init.ty));
      const iv = fc.coerce(init, ty, e, "init").ev;
      const elemT = strip(r.elem);
      if (e.args.length === 4) {
        const f = callable(fc, fc.expr(e.args[3], { k: "fn", ret: ty, params: [ty, r.elem] }), e, r.elem, 2);
        const conv = fc.coerce({ ty: fc.typeOfExpr(e.args[3]), ev: () => undefined, line }, { k: "tparam", name: "any" }, e, "cast");
        void conv;
        return val(ty, (fr) => {
          const g = f(fr);
          let acc = iv(fr);
          for (const x of r.range(fr).read()) acc = g(acc, x);
          return acc;
        }, line);
      }
      if (!isArithmetic(strip(ty)) && strip(ty).k !== "str") return fc.err("bad-argument", `accumulate needs a numeric starting value, not ${tyStr(ty)}`, e);
      if (strip(ty).k === "str") {
        return val(ty, (fr) => {
          const acc = iv(fr) as CStr;
          let s = acc.s;
          for (const x of r.range(fr).read()) s += (x as CStr).s;
          return new CStr(s);
        }, line);
      }
      // each element is converted to the type of the starting value
      const from = strip(elemT);
      const ct = strip(ty);
      const add = arithFn("+", ct)!;
      const conv = convertFor(fc, from, ct, e);
      return val(ty, (fr) => {
        let acc = iv(fr);
        for (const x of r.range(fr).read()) acc = add(acc, conv(x));
        return acc;
      }, line);
    }
    case "partial_sum": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const out = fc.expr(e.args[2]);
      const ov = out.ev;
      const ot = strip(out.ty);
      const et = strip(r.elem);
      const add = arithFn("+", et.k === "int" || et.k === "double" || et.k === "float" ? (et.k === "int" && et.bits < 32 ? T_INT : et) : T_INT)!;
      return val(out.ty, (fr) => {
        const a = r.range(fr).read();
        const dest = ov(fr);
        let acc: any = 0;
        a.forEach((x, i) => {
          acc = i === 0 ? x : add(acc, x);
          if (dest instanceof ElemPlace) dest.arr[dest.i + i] = acc;
          else if (dest instanceof It) (dest.c as Vec).a[dest.i + i] = acc;
        });
        return dest;
      }, line);
      void ot;
    }
    case "adjacent_difference": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const ov = fc.expr(e.args[2]).ev;
      const et = strip(r.elem);
      const sub = arithFn("-", et.k === "int" && et.bits < 32 ? T_INT : et)!;
      return val(strip(fc.typeOfExpr(e.args[2])), (fr) => {
        const a = r.range(fr).read();
        const dest = ov(fr);
        a.forEach((x, i) => {
          const v = i === 0 ? x : sub(x, a[i - 1]);
          if (dest instanceof ElemPlace) dest.arr[dest.i + i] = v;
          else if (dest instanceof It) (dest.c as Vec).a[dest.i + i] = v;
        });
        return dest;
      }, line);
    }
    case "iota": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const start = fc.coerce(fc.expr(e.args[2]), r.elem, e, "cast").ev;
      const et = strip(r.elem);
      const add = arithFn("+", et.k === "int" && et.bits < 32 ? T_INT : et.k === "bool" ? T_INT : et)!;
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        let v = start(fr);
        const out = new Array(range.length);
        for (let i = 0; i < out.length; i++) {
          out[i] = v;
          v = add(v, 1);
        }
        range.write(out);
      }, line);
    }
    case "fill":
    case "fill_n": {
      checkArgs(fc, e, name, 3);
      if (name === "fill") {
        const r = rangeArgs(fc, e, 0);
        const v = fc.copyOf(fc.coerce(fc.expr(e.args[2], r.elem), r.elem, e, "init"), r.elem);
        const clone = fc.cloner(r.elem);
        return val(T_VOID, (fr) => {
          const range = r.range(fr);
          const x = v(fr);
          range.write(Array.from({ length: range.length }, () => (clone ? clone(x) : x)));
        }, line);
      }
      const first = fc.expr(e.args[0]);
      const n = numArg(fc, fc.expr(e.args[1]), e);
      const ft = strip(first.ty);
      const elem = ft.k === "iter" ? iterElemTy(ft.of) : ft.k === "ptr" ? ft.to : ft.k === "arr" ? ft.of : T_INT;
      const v = fc.coerce(fc.expr(e.args[2], elem), elem, e, "init").ev;
      const fv = first.ev;
      return val(T_VOID, (fr) => {
        const p = fv(fr);
        const k = n(fr);
        const x = v(fr);
        if (p instanceof ElemPlace) for (let i = 0; i < k; i++) p.arr[p.i + i] = x;
        else if (p instanceof It) for (let i = 0; i < k; i++) (p.c as Vec).a[p.i + i] = x;
      }, line);
    }
    case "copy":
    case "copy_n":
    case "copy_if":
    case "transform": {
      return copyLike(fc, name, e);
    }
    case "for_each": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const f = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_VOID, params: [r.elem] }), e, r.elem, 1);
      return val(T_VOID, (fr) => {
        const g = f(fr);
        for (const x of r.range(fr).read()) g(x);
      }, line);
    }
    case "count":
    case "count_if": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      let test: (fr: Frame) => (x: any) => boolean;
      if (name === "count") {
        const eq = eqFn(fc.cc, r.elem, e);
        const v = fc.coerce(fc.expr(e.args[2], r.elem), r.elem, e, "init").ev;
        test = (fr) => {
          const x = v(fr);
          return (y) => eq(y, x);
        };
      } else {
        const c = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_BOOL, params: [r.elem] }), e, r.elem, 1);
        test = (fr) => {
          const f = c(fr);
          return (y) => !!f(y);
        };
      }
      return val({ k: "int", bits: 64, signed: true, name: "long" }, (fr) => {
        const t = test(fr);
        let n = 0;
        for (const x of r.range(fr).read()) if (t(x)) n++;
        return n;
      }, line);
    }
    case "find":
    case "find_if":
    case "find_if_not": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const itTy: Ty = r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[0]));
      let test: (fr: Frame) => (x: any) => boolean;
      if (name === "find") {
        const eq = eqFn(fc.cc, r.elem, e);
        const v = fc.coerce(fc.expr(e.args[2], r.elem), r.elem, e, "init").ev;
        test = (fr) => {
          const x = v(fr);
          return (y) => eq(y, x);
        };
      } else {
        const c = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_BOOL, params: [r.elem] }), e, r.elem, 1);
        const neg = name === "find_if_not";
        test = (fr) => {
          const f = c(fr);
          return (y) => !!f(y) !== neg;
        };
      }
      return val(itTy, (fr) => {
        const range = r.range(fr);
        const t = test(fr);
        const a = range.read();
        for (let i = 0; i < a.length; i++) if (t(a[i])) return range.at(i);
        return range.at(a.length);
      }, line);
    }
    case "any_of":
    case "all_of":
    case "none_of": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const c = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_BOOL, params: [r.elem] }), e, r.elem, 1);
      return val(T_BOOL, (fr) => {
        const f = c(fr);
        const a = r.range(fr).read();
        if (name === "any_of") return a.some((x) => f(x));
        if (name === "all_of") return a.every((x) => f(x));
        return !a.some((x) => f(x));
      }, line);
    }
    case "binary_search":
    case "lower_bound":
    case "upper_bound": {
      checkArgs(fc, e, name, 3, 4);
      const r = rangeArgs(fc, e, 0);
      const v = fc.coerce(fc.expr(e.args[2], r.elem), r.elem, e, "init").ev;
      const less = lessOf(fc, e, 3, r.elem);
      const itTy: Ty = r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[0]));
      return val(name === "binary_search" ? T_BOOL : itTy, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const lt = less(fr);
        const x = v(fr);
        const cmp = three(lt);
        if (name === "lower_bound") return range.at(lowerBound(a, x, cmp));
        if (name === "upper_bound") return range.at(upperBound(a, x, cmp));
        const i = lowerBound(a, x, cmp);
        return i < a.length && cmp(a[i], x) === 0;
      }, line);
    }
    case "equal": {
      checkArgs(fc, e, name, 3, 4);
      const r = rangeArgs(fc, e, 0);
      const other = fc.expr(e.args[2]).ev;
      const eq = eqFn(fc.cc, r.elem, e);
      return val(T_BOOL, (fr) => {
        const a = r.range(fr).read();
        const o = other(fr);
        const arr = o instanceof ElemPlace ? o.arr.slice(o.i, o.i + a.length) : o instanceof It ? (o.c as Vec).a.slice(o.i, o.i + a.length) : [];
        return arr.length === a.length && a.every((x, i) => eq(x, arr[i]));
      }, line);
    }
    case "lexicographical_compare": {
      checkArgs(fc, e, name, 4);
      const r1 = rangeArgs(fc, e, 0);
      const r2 = rangeArgs(fc, e, 2);
      const less = lessFn(fc.cc, r1.elem, e);
      return val(T_BOOL, (fr) => {
        const a = r1.range(fr).read();
        const b = r2.range(fr).read();
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) {
          if (less(a[i], b[i])) return true;
          if (less(b[i], a[i])) return false;
        }
        return a.length < b.length;
      }, line);
    }
    case "is_sorted": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const less = lessOf(fc, e, 2, r.elem);
      return val(T_BOOL, (fr) => {
        const a = r.range(fr).read();
        const lt = less(fr);
        for (let i = 1; i < a.length; i++) if (lt(a[i], a[i - 1])) return false;
        return true;
      }, line);
    }
    case "replace": {
      checkArgs(fc, e, name, 4);
      const r = rangeArgs(fc, e, 0);
      const o = fc.coerce(fc.expr(e.args[2], r.elem), r.elem, e, "init").ev;
      const n = fc.coerce(fc.expr(e.args[3], r.elem), r.elem, e, "init").ev;
      const eq = eqFn(fc.cc, r.elem, e);
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        const from = o(fr);
        const to = n(fr);
        range.write(range.read().map((x) => (eq(x, from) ? to : x)));
      }, line);
    }
    case "distance": {
      checkArgs(fc, e, name, 2);
      const a = fc.expr(e.args[0]).ev;
      const b = fc.expr(e.args[1]).ev;
      return val(T_LONG, (fr) => {
        const x = a(fr);
        const y = b(fr);
        return x instanceof It ? (y as It).i - x.i : (y as ElemPlace).i - (x as ElemPlace).i;
      }, line);
    }
    case "next":
    case "prev":
    case "advance": {
      checkArgs(fc, e, name, 1, 2);
      const it = fc.expr(e.args[0]);
      const n = e.args.length > 1 ? numArg(fc, fc.expr(e.args[1]), e) : () => 1;
      const sign = name === "prev" ? -1 : 1;
      const mv = (x: any, k: number) => (x instanceof It ? new It(x.c, x.i + k, x.snap) : new ElemPlace((x as ElemPlace).arr, (x as ElemPlace).i + k));
      if (name === "advance") {
        const lv = it.lv;
        if (!lv) return fc.err("not-lvalue", "advance needs an iterator variable", e);
        return val(T_VOID, (fr) => {
          const p = lv(fr);
          p.set(mv(p.get(), n(fr)));
        }, line);
      }
      return val(it.ty, (fr) => mv(it.ev(fr), sign * n(fr)), line);
    }
    case "swap":
    case "iter_swap":
      return swapCall(fc, name, e);
    case "max":
    case "min":
      return minMax(fc, name, e);
    case "minmax":
      return null;
    case "clamp": {
      checkArgs(fc, e, name, 3);
      const x = fc.expr(e.args[0]);
      const lo = fc.expr(e.args[1]);
      const hi = fc.expr(e.args[2]);
      const ct = commonType(x.ty, commonType(lo.ty, hi.ty));
      const a = fc.coerce(x, ct, e, "cast").ev;
      const l = fc.coerce(lo, ct, e, "cast").ev;
      const h = fc.coerce(hi, ct, e, "cast").ev;
      return val(ct, (fr) => {
        const v = a(fr);
        const lv = l(fr);
        const hv = h(fr);
        return v < lv ? lv : hv < v ? hv : v;
      }, line);
    }
    case "__gcd":
    case "gcd":
    case "lcm":
    case "__gcd":
    case "__lcm": {
      checkArgs(fc, e, name, 2);
      const x = fc.expr(e.args[0]);
      const y = fc.expr(e.args[1]);
      if (!isIntegral(strip(x.ty)) || !isIntegral(strip(y.ty))) return fc.err("bad-argument", `${name} needs integers`, e);
      const ct = commonType(x.ty, y.ty);
      const a = fc.coerce(x, ct, e, "cast").ev;
      const b = fc.coerce(y, ct, e, "cast").ev;
      const big = strip(ct).k === "int" && (strip(ct) as { bits: number }).bits === 64;
      const lcm = name.endsWith("lcm");
      return val(ct, (fr) => {
        let p = big ? BigInt(a(fr)) : a(fr);
        let q = big ? BigInt(b(fr)) : b(fr);
        const abs = (v: any) => (v < 0 ? -v : v);
        p = abs(p);
        q = abs(q);
        const orig = [p, q];
        while (q !== (big ? 0n : 0)) [p, q] = [q, p % q];
        let g = p;
        if (lcm) g = orig[0] === (big ? 0n : 0) || orig[1] === (big ? 0n : 0) ? (big ? 0n : 0) : (orig[0] / g) * orig[1];
        if (!big) return g;
        return I.toInt(I.wrapS64(g as bigint), 64, true);
      }, line);
    }
  }
  return null;
}

function convertFor(fc: FnCompiler, from: Ty, to: Ty, at: Loc): (v: any) => any {
  if (sameType(from, to)) return (v) => v;
  const probe = fc.coerce({ ty: from, ev: (fr) => fr[0], line: at.line }, to, at, "cast");
  return (v) => probe.ev([v]);
}

function swapCall(fc: FnCompiler, name: string, e: Call): CE {
  checkArgs(fc, e, name, 2);
  const a = fc.expr(e.args[0]);
  const b = fc.expr(e.args[1]);
  const line = e.line;
  if (name === "iter_swap") {
    const av = a.ev;
    const bv = b.ev;
    return val(T_VOID, (fr) => {
      const x = av(fr);
      const y = bv(fr);
      const xa = x instanceof It ? (x.c as Vec).a : (x as ElemPlace).arr;
      const xi = x instanceof It ? x.i : (x as ElemPlace).i;
      const ya = y instanceof It ? (y.c as Vec).a : (y as ElemPlace).arr;
      const yi = y instanceof It ? y.i : (y as ElemPlace).i;
      [xa[xi], ya[yi]] = [ya[yi], xa[xi]];
    }, line);
  }
  const at = strip(a.ty);
  if (!sameType(at, b.ty)) return fc.err("bad-argument", `swap needs two values of the same type (${tyStr(a.ty)} and ${tyStr(b.ty)})`, e);
  if (!a.lv || !b.lv) return fc.err("not-lvalue", "swap needs two variables", e);
  if (isClassLike(at)) {
    const clone = fc.cloner(at);
    const assign = fc.assigner(at);
    const av = a.ev;
    const bv = b.ev;
    return val(T_VOID, (fr) => {
      const x = av(fr);
      const y = bv(fr);
      const tmp = clone ? clone(x) : x;
      assign(x, y);
      assign(y, tmp);
    }, line);
  }
  const al = a.lv;
  const bl = b.lv;
  return val(T_VOID, (fr) => {
    const p = al(fr);
    const q = bl(fr);
    const t = p.get();
    p.set(q.get());
    q.set(t);
  }, line);
}

function minMax(fc: FnCompiler, name: string, e: Call): CE {
  const isMin = name === "min";
  const line = e.line;
  // max({a, b, c}) and max(list, cmp)
  if (e.args.length >= 1 && e.args[0].k === "init" && !e.args[0].type) {
    const list = e.args[0].elems.map((x) => fc.expr(x));
    const ct = list.reduce<Ty>((acc, c) => (strip(acc).k === "tparam" ? noConst(decay(c.ty)) : isArithmetic(strip(acc)) && isArithmetic(strip(c.ty)) ? commonType(acc, c.ty) : acc), { k: "tparam", name: "?" });
    const evs = list.map((c) => fc.coerce(c, ct, e, "cast").ev);
    const less = lessOf(fc, e, 1, ct);
    return val(ct, (fr) => {
      const lt = less(fr);
      let best = evs[0](fr);
      for (let i = 1; i < evs.length; i++) {
        const x = evs[i](fr);
        if (isMin ? lt(x, best) : lt(best, x)) best = x;
      }
      return best;
    }, line);
  }
  checkArgs(fc, e, name, 2, 3);
  const x = fc.expr(e.args[0]);
  const y = fc.expr(e.args[1]);
  const xt = strip(x.ty);
  const yt = strip(y.ty);
  let ct: Ty;
  if (isArithmetic(xt) && isArithmetic(yt)) {
    ct = xt.k === yt.k && sameType(xt, yt) ? noConst(xt) : (fc.err("min-max-types", `${name}(${tyStr(x.ty)}, ${tyStr(y.ty)}): both arguments must have the same type (write ${name}<long long>(a, b) or convert one of them)`, e, { name, a: tyStr(x.ty), b: tyStr(y.ty) }));
  } else if (sameType(xt, yt)) ct = noConst(xt);
  else if ((xt.k === "str" && y.lit !== undefined) || (yt.k === "str" && x.lit !== undefined)) ct = { k: "str" };
  else return fc.err("min-max-types", `${name} needs two values of the same type (${tyStr(x.ty)} and ${tyStr(y.ty)})`, e, { name, a: tyStr(x.ty), b: tyStr(y.ty) });
  const a = fc.coerce(x, ct, e, "cast");
  const b = fc.coerce(y, ct, e, "cast");
  const ae = fc.copyOf(a, ct);
  const be = fc.copyOf(b, ct);
  const less = lessOf(fc, e, 2, ct);
  const cmpArg = e.args.length > 2;
  if (!cmpArg && isArithmetic(strip(ct))) {
    const av = a.ev;
    const bv = b.ev;
    return val(ct, isMin ? (fr) => {
      const p = av(fr);
      const q = bv(fr);
      return q < p ? q : p;
    } : (fr) => {
      const p = av(fr);
      const q = bv(fr);
      return p < q ? q : p;
    }, line);
  }
  return val(ct, (fr) => {
    const lt = less(fr);
    const p = ae(fr);
    const q = be(fr);
    return isMin ? (lt(q, p) ? q : p) : lt(p, q) ? q : p;
  }, line);
}

/** copy, copy_n, copy_if, transform: elements go to an output iterator, a pointer or a back_inserter. */
function copyLike(fc: FnCompiler, name: string, e: Call): CE {
  const line = e.line;
  const outIndex = name === "copy_n" ? 2 : name === "transform" && e.args.length >= 5 ? 3 : name === "transform" ? 2 : 2;
  const binary = name === "transform" && e.args.length === 5;
  let range: (fr: Frame) => RangeRef;
  let elem: Ty;
  if (name === "copy_n") {
    const first = fc.expr(e.args[0]);
    const n = numArg(fc, fc.expr(e.args[1]), e);
    const fv = first.ev;
    const ft = strip(first.ty);
    elem = ft.k === "iter" ? iterElemTy(ft.of) : ft.k === "ptr" ? ft.to : T_INT;
    range = (fr) => {
      const p = fv(fr);
      const k = n(fr);
      return p instanceof It ? rangeRef(p, new It(p.c, p.i + k, p.snap), line) : rangeRef(p, new ElemPlace(p.arr, p.i + k), line);
    };
  } else {
    const r = rangeArgs(fc, e, 0);
    range = r.range;
    elem = r.elem;
  }
  const out = fc.expr(e.args[outIndex]);
  const ot = strip(out.ty);
  const ov = out.ev;
  let fn: ((fr: Frame) => (...a: any[]) => any) | null = null;
  let outElem: Ty = elem;
  if (name === "transform") {
    const fce = fc.expr(e.args[e.args.length - 1], { k: "fn", ret: elem, params: binary ? [elem, elem] : [elem] });
    fn = callable(fc, fce, e, elem, binary ? 2 : 1);
    const ft = strip(fce.ty);
    if (ft.k === "fn") outElem = ft.ret;
  }
  let pred: ((fr: Frame) => (x: any) => boolean) | null = null;
  if (name === "copy_if") {
    const c = callable(fc, fc.expr(e.args[3], { k: "fn", ret: T_BOOL, params: [elem] }), e, elem, 1);
    pred = (fr) => {
      const f = c(fr);
      return (x) => !!f(x);
    };
  }
  let second: ((fr: Frame) => RangeRef) | null = null;
  if (binary) {
    const sv = fc.expr(e.args[2]).ev;
    const first = (fr: Frame) => sv(fr);
    second = (fr) => {
      const p = first(fr);
      return p instanceof It ? rangeRef(p, new It(p.c, p.i + 1e9, p.snap), line) : rangeRef(p, new ElemPlace(p.arr, p.arr.length), line);
    };
  }
  const clone = fc.cloner(outElem);
  const outTy = out.ty;
  void ot;
  return val(outTy, (fr) => {
    const src = range(fr).read();
    let values = src;
    if (pred) {
      const t = pred(fr);
      values = src.filter(t);
    }
    if (fn) {
      const f = fn(fr);
      if (binary) {
        const other = second!(fr).read();
        values = src.map((x, i) => f(x, other[i]));
      } else values = src.map((x) => f(x));
    } else if (clone) values = values.map(clone);
    const dest = ov(fr);
    if (dest instanceof BackInserter) {
      for (const v of values) dest.c.a.push(v);
      return dest;
    }
    if (dest instanceof ElemPlace) {
      for (let i = 0; i < values.length; i++) dest.arr[dest.i + i] = values[i];
      return new ElemPlace(dest.arr, dest.i + values.length);
    }
    if (dest instanceof It && dest.c instanceof CStr) {
      const str = dest.c;
      if (dest.i + values.length > str.s.length) throw runtimeError("iterator-range", "the output goes past the end of the string", line);
      str.s = str.s.slice(0, dest.i) + values.map((v) => String.fromCharCode(v & 255)).join("") + str.s.slice(dest.i + values.length);
      return new It(str, dest.i + values.length);
    }
    if (dest instanceof It) {
      const arr = (dest.c as Vec).a;
      for (let i = 0; i < values.length; i++) arr[dest.i + i] = values[i];
      return new It(dest.c, dest.i + values.length, dest.snap);
    }
    throw runtimeError("bad-range", "the output of the algorithm is not an iterator", line);
  }, line);
}

export class BackInserter {
  constructor(public c: Vec) {}
}

/** back_inserter(v): an output that appends. */
export function backInserterCall(fc: FnCompiler, e: Call): CE {
  checkArgs(fc, e, "back_inserter", 1);
  const v = fc.expr(e.args[0]);
  const ev = v.ev;
  return { ty: stdTy("back_insert_iterator", []), ev: (fr) => new BackInserter(ev(fr)), line: e.line };
}

export { Tup, Pair, pairOf, promote, T_SIZE, T_DOUBLE, T_LL, isFloating, CppError, HMap, HSet, snapshotOf };
export type { Expr };
