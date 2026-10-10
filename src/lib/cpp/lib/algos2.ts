import { runtimeError } from "../errors";
import type { CE, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { arithFn } from "../conv";
import { CStr, ElemPlace, Pair, Vec } from "../values";
import { T_BOOL, T_INT, T_VOID, isArithmetic, noConst, decay, pairOf, strip, tyStr, type Ty } from "../types";
import { It, iterElemTy } from "./iter";
import { eqFn } from "./order";
import { BackInserter, callable, lessOf, rangeArgs, rangeRef, type RangeRef } from "./algos";
import { checkArgs, val, type Call } from "./helpers";
import { makeHeap, popHeap, pushHeap, sortHeap } from "./stdsort";

/**
 * More of <algorithm> and <numeric>: the set operations, merge, partition,
 * equal_range and the "_copy" family. Same approach as algos.ts: read the
 * elements out, work on a JS array, write the result back.
 */

/** Writes `values` through an output iterator (a back_inserter, a pointer, or a container iterator) and returns the advanced output. */
function emitTo(dest: any, values: any[], line: number): any {
  if (dest instanceof BackInserter) {
    for (const v of values) dest.c.a.push(v);
    return dest;
  }
  if (dest instanceof ElemPlace) {
    for (let i = 0; i < values.length; i++) dest.arr[dest.i + i] = values[i];
    return new ElemPlace(dest.arr, dest.i + values.length);
  }
  if (dest instanceof It && dest.c instanceof CStr) {
    const s = dest.c;
    if (dest.i + values.length > s.s.length) throw runtimeError("iterator-range", "the output goes past the end of the string", line);
    s.s = s.s.slice(0, dest.i) + values.map((v) => String.fromCharCode(v & 255)).join("") + s.s.slice(dest.i + values.length);
    return new It(s, dest.i + values.length);
  }
  if (dest instanceof It) {
    const arr = (dest.c as Vec).a;
    for (let i = 0; i < values.length; i++) arr[dest.i + i] = values[i];
    return new It(dest.c, dest.i + values.length, dest.snap);
  }
  throw runtimeError("bad-range", "the output of the algorithm is not an iterator", line);
}

/** A second range that starts at `first2` and is as long as `n` (for algorithms that take only the start of it). */
function followRange(p: any, n: number, line: number): RangeRef {
  return p instanceof It ? rangeRef(p, new It(p.c, p.i + n, p.snap), line) : rangeRef(p, new ElemPlace(p.arr, p.i + n), line);
}

function iterTypeOf(fc: FnCompiler, e: Call, i: number, r: { kind: "iter" | "ptr"; elem: Ty }): Ty {
  return r.kind === "ptr" ? { k: "ptr", to: r.elem } : strip(fc.typeOfExpr(e.args[i]));
}

export function moreAlgorithms(fc: FnCompiler, name: string, e: Call): CE | null {
  const line = e.line;
  switch (name) {
    case "set_intersection":
    case "set_union":
    case "set_difference":
    case "set_symmetric_difference":
    case "merge": {
      checkArgs(fc, e, name, 5, 6);
      const r1 = rangeArgs(fc, e, 0);
      const r2 = rangeArgs(fc, e, 2);
      const out = fc.expr(e.args[4]);
      const ov = out.ev;
      const less = lessOf(fc, e, 5, r1.elem);
      const clone = fc.cloner(r1.elem);
      const copy = (x: any) => (clone ? clone(x) : x);
      return val(out.ty, (fr) => {
        const a = r1.range(fr).read();
        const b = r2.range(fr).read();
        const lt = less(fr);
        const res: any[] = [];
        let i = 0;
        let j = 0;
        while (i < a.length && j < b.length) {
          if (name === "merge") {
            if (lt(b[j], a[i])) res.push(copy(b[j++]));
            else res.push(copy(a[i++]));
          } else if (lt(a[i], b[j])) {
            if (name !== "set_intersection") res.push(copy(a[i]));
            i++;
          } else if (lt(b[j], a[i])) {
            if (name === "set_union" || name === "set_symmetric_difference") res.push(copy(b[j]));
            j++;
          } else {
            if (name === "set_intersection" || name === "set_union") res.push(copy(a[i]));
            i++;
            j++;
          }
        }
        if (name !== "set_intersection") {
          while (i < a.length) res.push(copy(a[i++]));
          if (name === "set_union" || name === "set_symmetric_difference" || name === "merge") while (j < b.length) res.push(copy(b[j++]));
        }
        return emitTo(ov(fr), res, line);
      }, line);
    }
    case "make_heap":
    case "push_heap":
    case "pop_heap":
    case "sort_heap":
    case "is_heap": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const less = lessOf(fc, e, 2, r.elem);
      const ops = { make_heap: makeHeap, push_heap: pushHeap, pop_heap: popHeap, sort_heap: sortHeap } as const;
      if (name === "is_heap") {
        return val(T_BOOL, (fr) => {
          const a = r.range(fr).read();
          const lt = less(fr);
          for (let i = 1; i < a.length; i++) if (lt(a[(i - 1) >> 1], a[i])) return false;
          return true;
        }, line);
      }
      const op = ops[name];
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        op(a, 0, a.length, less(fr));
        range.write(a);
      }, line);
    }
    case "includes": {
      checkArgs(fc, e, name, 4, 5);
      const r1 = rangeArgs(fc, e, 0);
      const r2 = rangeArgs(fc, e, 2);
      const less = lessOf(fc, e, 4, r1.elem);
      return val(T_BOOL, (fr) => {
        const a = r1.range(fr).read();
        const b = r2.range(fr).read();
        const lt = less(fr);
        let i = 0;
        for (const x of b) {
          while (i < a.length && lt(a[i], x)) i++;
          if (i >= a.length || lt(x, a[i])) return false;
          i++;
        }
        return true;
      }, line);
    }
    case "partition":
    case "stable_partition": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const c = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_BOOL, params: [r.elem] }), e, r.elem, 1);
      return val(iterTypeOf(fc, e, 0, r), (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const f = c(fr);
        if (name === "stable_partition") {
          const yes = a.filter((x) => f(x));
          const no = a.filter((x) => !f(x));
          range.write([...yes, ...no]);
          return range.at(yes.length);
        }
        // the same two-pointer walk as libstdc++, so the order of the elements matches g++
        let first = 0;
        let last = a.length;
        for (;;) {
          for (;;) {
            if (first === last) {
              range.write(a);
              return range.at(first);
            }
            if (f(a[first])) first++;
            else break;
          }
          last--;
          for (;;) {
            if (first === last) {
              range.write(a);
              return range.at(first);
            }
            if (!f(a[last])) last--;
            else break;
          }
          [a[first], a[last]] = [a[last], a[first]];
          first++;
        }
      }, line);
    }
    case "equal_range": {
      checkArgs(fc, e, name, 3, 4);
      const r = rangeArgs(fc, e, 0);
      const v = fc.coerce(fc.expr(e.args[2]), noConst(decay(r.elem)), e, "init").ev;
      const less = lessOf(fc, e, 3, r.elem);
      const it = iterTypeOf(fc, e, 0, r);
      return val(pairOf(it, it), (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const lt = less(fr);
        const x = v(fr);
        let lo = 0;
        let hi = a.length;
        while (lo < hi) {
          const m = (lo + hi) >> 1;
          if (lt(a[m], x)) lo = m + 1;
          else hi = m;
        }
        let up = lo;
        let end = a.length;
        while (up < end) {
          const m = (up + end) >> 1;
          if (!lt(x, a[m])) up = m + 1;
          else end = m;
        }
        return new Pair(range.at(lo), range.at(up));
      }, line);
    }
    case "minmax_element": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const less = lessOf(fc, e, 2, r.elem);
      const it = iterTypeOf(fc, e, 0, r);
      return val(pairOf(it, it), (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const lt = less(fr);
        let mn = 0;
        let mx = 0;
        for (let i = 1; i < a.length; i++) {
          if (lt(a[i], a[mn])) mn = i;
          if (!lt(a[i], a[mx])) mx = i;
        }
        return new Pair(range.at(mn), range.at(mx));
      }, line);
    }
    case "swap_ranges": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const second = fc.expr(e.args[2]).ev;
      return val(strip(fc.typeOfExpr(e.args[2])), (fr) => {
        const range = r.range(fr);
        const p = second(fr);
        const other = followRange(p, range.length, line);
        const a = range.read();
        const b = other.read();
        range.write(b);
        other.write(a);
        return other.at(range.length);
      }, line);
    }
    case "reverse_copy":
    case "remove_copy":
    case "remove_copy_if":
    case "unique_copy":
    case "replace_copy": {
      const outIdx = 2;
      checkArgs(fc, e, name, 3, name === "remove_copy" || name === "remove_copy_if" || name === "unique_copy" ? 4 : name === "replace_copy" ? 5 : 3);
      const r = rangeArgs(fc, e, 0);
      const out = fc.expr(e.args[outIdx]);
      const ov = out.ev;
      const elem = r.elem;
      const clone = fc.cloner(elem);
      const copy = (x: any) => (clone ? clone(x) : x);
      let extra: ((fr: Frame) => (x: any) => boolean) | null = null;
      let replacement: ((fr: Frame) => any) | null = null;
      if (name === "remove_copy") {
        const eq = eqFn(fc.cc, elem, e);
        const v = fc.coerce(fc.expr(e.args[3]), noConst(decay(elem)), e, "init").ev;
        extra = (fr) => {
          const x = v(fr);
          return (y) => eq(y, x);
        };
      } else if (name === "remove_copy_if") {
        const c = callable(fc, fc.expr(e.args[3], { k: "fn", ret: T_BOOL, params: [elem] }), e, elem, 1);
        extra = (fr) => {
          const f = c(fr);
          return (y) => !!f(y);
        };
      } else if (name === "replace_copy") {
        const eq = eqFn(fc.cc, elem, e);
        const old = fc.coerce(fc.expr(e.args[3]), noConst(decay(elem)), e, "init").ev;
        const nv = fc.coerce(fc.expr(e.args[4]), noConst(decay(elem)), e, "init").ev;
        extra = (fr) => {
          const x = old(fr);
          return (y) => eq(y, x);
        };
        replacement = nv;
      }
      const eqU = name === "unique_copy" ? (e.args.length > 3 ? callable(fc, fc.expr(e.args[3]), e, elem, 2) : (() => { const q = eqFn(fc.cc, elem, e); return () => q; })()) : null;
      return val(out.ty, (fr) => {
        const a = r.range(fr).read();
        let res: any[];
        if (name === "reverse_copy") res = a.map(copy).reverse();
        else if (name === "unique_copy") {
          const same = eqU!(fr);
          res = [];
          for (const x of a) if (res.length === 0 || !same(res[res.length - 1], x)) res.push(copy(x));
        } else if (name === "replace_copy") {
          const t = extra!(fr);
          const nv = replacement!(fr);
          res = a.map((x) => (t(x) ? copy(nv) : copy(x)));
        } else {
          const t = extra!(fr);
          res = a.filter((x) => !t(x)).map(copy);
        }
        return emitTo(ov(fr), res, line);
      }, line);
    }
    case "rotate_copy": {
      checkArgs(fc, e, name, 4);
      const first = fc.expr(e.args[0]).ev;
      const mid = fc.expr(e.args[1]).ev;
      const last = fc.expr(e.args[2]).ev;
      const out = fc.expr(e.args[3]);
      const ov = out.ev;
      return val(out.ty, (fr) => {
        const f = first(fr);
        const m = mid(fr);
        const range = rangeRef(f, last(fr), line);
        const k = m instanceof It ? m.i - (f as It).i : (m as ElemPlace).i - (f as ElemPlace).i;
        const a = range.read();
        return emitTo(ov(fr), [...a.slice(k), ...a.slice(0, k)], line);
      }, line);
    }
    case "replace_if": {
      checkArgs(fc, e, name, 4);
      const r = rangeArgs(fc, e, 0);
      const c = callable(fc, fc.expr(e.args[2], { k: "fn", ret: T_BOOL, params: [r.elem] }), e, r.elem, 1);
      const nv = fc.coerce(fc.expr(e.args[3]), noConst(decay(r.elem)), e, "init").ev;
      const clone = fc.cloner(r.elem);
      return val(T_VOID, (fr) => {
        const range = r.range(fr);
        const f = c(fr);
        const v = nv(fr);
        range.write(range.read().map((x) => (f(x) ? (clone ? clone(v) : v) : x)));
      }, line);
    }
    case "generate":
    case "generate_n": {
      checkArgs(fc, e, name, 3);
      const gi = e.args.length - 1;
      const first = fc.expr(e.args[0]);
      const ft = strip(first.ty);
      const elem: Ty = ft.k === "iter" ? iterElemTy(ft.of) : ft.k === "ptr" ? ft.to : T_INT;
      const g = callable(fc, fc.expr(e.args[gi], { k: "fn", ret: elem, params: [] }), e, elem, 0);
      if (name === "generate") {
        const r = rangeArgs(fc, e, 0);
        return val(T_VOID, (fr) => {
          const range = r.range(fr);
          const f = g(fr);
          range.write(Array.from({ length: range.length }, () => f()));
        }, line);
      }
      const n = fc.coerce(fc.expr(e.args[1]), T_INT, e, "cast").ev;
      const fv = first.ev;
      return val(first.ty, (fr) => {
        const p = fv(fr);
        const f = g(fr);
        const k = n(fr);
        const range = followRange(p, k, line);
        range.write(Array.from({ length: k }, () => f()));
        return range.at(k);
      }, line);
    }
    case "inner_product": {
      checkArgs(fc, e, name, 4, 6);
      const r = rangeArgs(fc, e, 0);
      const second = fc.expr(e.args[2]).ev;
      const init = fc.expr(e.args[3]);
      const ty = noConst(decay(init.ty));
      const iv = fc.coerce(init, ty, e, "init").ev;
      const ct = strip(ty);
      if (!isArithmetic(ct)) return fc.err("bad-argument", `inner_product needs a numeric starting value, not ${tyStr(ty)}`, e);
      const add = arithFn("+", ct.k === "int" && ct.bits < 32 ? T_INT : ct)!;
      const mul = arithFn("*", ct.k === "int" && ct.bits < 32 ? T_INT : ct)!;
      return val(ty, (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const b = followRange(second(fr), range.length, line).read();
        let acc = iv(fr);
        for (let i = 0; i < a.length; i++) acc = add(acc, mul(a[i], b[i]));
        return acc;
      }, line);
    }
    case "inclusive_scan":
    case "exclusive_scan": {
      checkArgs(fc, e, name, 3, name === "exclusive_scan" ? 4 : 3);
      const r = rangeArgs(fc, e, 0);
      const out = fc.expr(e.args[2]);
      const ov = out.ev;
      const et = strip(r.elem);
      if (!isArithmetic(et)) return fc.err("bad-argument", `${name} needs numbers`, e);
      const add = arithFn("+", et.k === "int" && et.bits < 32 ? T_INT : et)!;
      const init = name === "exclusive_scan" && e.args.length === 4 ? fc.coerce(fc.expr(e.args[3]), noConst(decay(r.elem)), e, "init").ev : () => 0;
      return val(out.ty, (fr) => {
        const a = r.range(fr).read();
        const res: any[] = [];
        let acc: any = init(fr);
        if (name === "inclusive_scan") {
          a.forEach((x, i) => {
            acc = i === 0 ? x : add(acc, x);
            res.push(acc);
          });
        } else {
          for (const x of a) {
            res.push(acc);
            acc = add(acc, x);
          }
        }
        return emitTo(ov(fr), res, line);
      }, line);
    }
    case "adjacent_find": {
      checkArgs(fc, e, name, 2, 3);
      const r = rangeArgs(fc, e, 0);
      const eq = e.args.length > 2 ? callable(fc, fc.expr(e.args[2]), e, r.elem, 2) : (() => { const q = eqFn(fc.cc, r.elem, e); return () => q; })();
      return val(iterTypeOf(fc, e, 0, r), (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const same = eq(fr);
        for (let i = 0; i + 1 < a.length; i++) if (same(a[i], a[i + 1])) return range.at(i);
        return range.at(a.length);
      }, line);
    }
    case "mismatch": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const second = fc.expr(e.args[2]);
      const eq = eqFn(fc.cc, r.elem, e);
      const it1 = iterTypeOf(fc, e, 0, r);
      const sv = second.ev;
      return val(pairOf(it1, strip(second.ty)), (fr) => {
        const range = r.range(fr);
        const a = range.read();
        const p = sv(fr);
        const other = followRange(p, range.length, line);
        const b = other.read();
        let i = 0;
        while (i < a.length && eq(a[i], b[i])) i++;
        return new Pair(range.at(i), other.at(i));
      }, line);
    }
    case "search":
    case "find_first_of": {
      checkArgs(fc, e, name, 4, 5);
      const r1 = rangeArgs(fc, e, 0);
      const r2 = rangeArgs(fc, e, 2);
      const eq = e.args.length > 4 ? callable(fc, fc.expr(e.args[4]), e, r1.elem, 2) : (() => { const q = eqFn(fc.cc, r1.elem, e); return () => q; })();
      return val(iterTypeOf(fc, e, 0, r1), (fr) => {
        const range = r1.range(fr);
        const a = range.read();
        const b = r2.range(fr).read();
        const same = eq(fr);
        if (name === "search") {
          for (let i = 0; i + b.length <= a.length; i++) {
            let ok = true;
            for (let j = 0; j < b.length && ok; j++) ok = same(a[i + j], b[j]);
            if (ok) return range.at(i);
          }
        } else {
          for (let i = 0; i < a.length; i++) if (b.some((y) => same(a[i], y))) return range.at(i);
        }
        return range.at(a.length);
      }, line);
    }
    case "copy_backward": {
      checkArgs(fc, e, name, 3);
      const r = rangeArgs(fc, e, 0);
      const out = fc.expr(e.args[2]);
      const ov = out.ev;
      const clone = fc.cloner(r.elem);
      return val(out.ty, (fr) => {
        const a = r.range(fr).read();
        const dest = ov(fr);
        const start = dest instanceof It ? new It(dest.c, dest.i - a.length, dest.snap) : new ElemPlace(dest.arr, dest.i - a.length);
        emitTo(start, a.map((x) => (clone ? clone(x) : x)), line);
        return start;
      }, line);
    }
  }
  return null;
}
