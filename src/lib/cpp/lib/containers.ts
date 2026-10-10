import type { Expr, Loc } from "../ast";
import { runtimeError } from "../errors";
import type { CE, ClassInfo, Frame } from "../core";
import type { Compiler } from "../compiler";
import type { FnCompiler } from "../fncompiler";
import { needsClone } from "../conv";
import { makeHeap, popHeap, pushHeap } from "./stdsort";
import { Bits, CStr, Deq, ElemPlace, Func, HMap, HSet, ObjPlace, OMap, OSet, PQ, Pair, SStream, Tup, Vec, type Place } from "../values";
import { T_BOOL, T_CHAR, T_INT, T_LONG, T_SIZE, T_STR, T_VOID, decay, isClassLike, isIntegral, noConst, pairOf, sameType, stdTy, strip, tyStr, withConst, type Ty } from "../types";
import { eqFn, keyFn, lessFn, three, type Cmp3 } from "./order";
import { CharPlace, It, backingOf, charAt, iterElemTy, lengthOf, snapshotOf } from "./iter";
import { numArg, outOfRange, val } from "./helpers";
import type { RangeInfo } from "./types";
import { textArg } from "./strings";

/** Containers: how they are made, indexed, compared and iterated. */

export const zeroOf = (cc: Compiler, ty: Ty): (() => any) => cc.defaultMaker(ty, true);

/** The three-way comparison a sorted container uses, from its type (`greater<int>`, a functor class, or the natural order). */
export function cmpFor(cc: Compiler, elem: Ty, cmpTy: Ty | undefined, at: Loc, value?: (fr: Frame) => any): { cmp: Cmp3; runtime?: (fr: Frame) => Cmp3 } {
  if (!cmpTy) return { cmp: three(lessFn(cc, elem, at)) };
  const c = strip(cmpTy);
  if (c.k === "std") {
    const base = lessFn(cc, elem, at);
    switch (c.name) {
      case "less":
        return { cmp: three(base) };
      case "greater":
        return { cmp: three((a, b) => base(b, a)) };
      case "less_equal":
      case "greater_equal":
        return { cmp: three(base) };
    }
  }
  if (c.k === "cls") {
    // A functor class: call its operator().
    const info = c.cls.info as ClassInfo;
    const op = info.methods.get("operator()")?.[0];
    if (!op) return cc.err("bad-comparator", `${info.name} needs an operator() to be used for ordering`, at);
    const func = new Func(op, null);
    const obj = info.create!();
    const less = (a: any, b: any) => !!cc.rt.invoke(func, [obj, a, b]);
    return { cmp: three(less) };
  }
  if (c.k === "fn") {
    // A function or lambda given when the container is made.
    if (!value) return cc.err("bad-comparator", "a container ordered by a function needs that function when it is created", at);
    return { cmp: () => 0, runtime: (fr) => {
      const f = value(fr) as Func;
      const less = (a: any, b: any) => !!cc.rt.invoke(f, [a, b]);
      return three(less);
    } };
  }
  return cc.err("bad-comparator", `${tyStr(cmpTy)} cannot be used for ordering`, at);
}

/** Binary search: the first position whose element is not less than x. */
export function lowerBound(a: any[], x: any, cmp: Cmp3): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cmp(a[mid], x) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The first position whose element is greater than x. */
export function upperBound(a: any[], x: any, cmp: Cmp3): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cmp(a[mid], x) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/* ---------------------------------- defaults ---------------------------------- */

export function defaultStd(cc: Compiler, ty: Extract<Ty, { k: "std" }>): () => any {
  const at = { line: 0, col: 0 };
  switch (ty.name) {
    case "vector":
    case "deque":
      return () => new Vec([]);
    case "array": {
      const zero = zeroOf(cc, ty.args[0]);
      const n = ty.n ?? 0;
      return () => {
        const a = new Array(n);
        for (let i = 0; i < n; i++) a[i] = zero();
        return new Vec(a);
      };
    }
    case "stack":
    case "queue":
      return () => new Deq([]);
    case "priority_queue": {
      const { cmp } = cmpFor(cc, ty.args[0], ty.cmp, at);
      return () => new PQ([], cmp);
    }
    case "set":
    case "multiset": {
      const { cmp } = cmpFor(cc, ty.args[0], ty.cmp, at);
      return () => new OSet([], cmp, ty.name === "multiset");
    }
    case "map":
    case "multimap": {
      const { cmp } = cmpFor(cc, ty.args[0], ty.cmp, at);
      const c: Cmp3 = (x: any, y: any) => cmp(x, y);
      return () => new OMap([], c, ty.name === "multimap");
    }
    case "unordered_map":
    case "unordered_multimap": {
      const key = keyFn(cc, ty.args[0], at);
      return () => new HMap(new Map(), key, ty.name === "unordered_multimap");
    }
    case "unordered_set":
    case "unordered_multiset": {
      const key = keyFn(cc, ty.args[0], at);
      return () => new HSet(new Map(), key);
    }
    case "pair": {
      const a = zeroOf(cc, ty.args[0]);
      const b = zeroOf(cc, ty.args[1]);
      return () => new Pair(a(), b());
    }
    case "tuple": {
      const zs = ty.args.map((t) => zeroOf(cc, t));
      return () => new Tup(zs.map((z) => z()));
    }
    case "bitset": {
      const n = ty.n ?? 0;
      return () => new Bits(n, new Array(n).fill(false));
    }
    case "initializer_list":
      return () => new Vec([]);
    case "less":
    case "greater":
    case "less_equal":
    case "greater_equal":
    case "equal_to":
    case "not_equal_to":
    case "plus":
    case "minus":
    case "multiplies":
      return () => null;
  }
  return () => undefined;
}

/* ------------------------------- construction -------------------------------- */

export function elemTypeOf(t: Ty): Ty | null {
  const s = strip(t);
  if (s.k === "std" && ["vector", "deque", "array", "stack", "queue", "priority_queue", "set", "multiset", "unordered_set", "unordered_multiset", "initializer_list"].includes(s.name)) return s.args[0];
  return null;
}

/** An element expression converted to the element type, ready to be stored (copied if it must be). */
export function elemValue(fc: FnCompiler, e: Expr, elem: Ty, at: Loc): (fr: Frame) => any {
  const ce = fc.expr(e, elem);
  const conv = fc.coerce(ce, elem, at, "init");
  return fc.copyOf(conv, elem);
}

/** Pulls the elements out of a container for range constructors (`vector<int> v(a.begin(), a.end())`). */
export function rangeElements(first: any, last: any, line: number): any[] {
  if (first instanceof It) {
    const c = first.c;
    const to = (last as It).i;
    if (c instanceof CStr) {
      const n = c.s.length;
      return Array.from({ length: Math.max(0, to - first.i) }, (_, k) => charAt(c.s, first.rev ? n - 1 - (first.i + k) : first.i + k));
    }
    const arr = first.snap ?? backingArray(c);
    if (first.rev) {
      const out: any[] = [];
      for (let i = first.i; i < to; i++) out.push(arr[arr.length - 1 - i]);
      return out;
    }
    return arr.slice(first.i, to);
  }
  if (first instanceof ElemPlace) return first.arr.slice(first.i, (last as ElemPlace).i);
  throw runtimeError("bad-range", "the range is not made of iterators or pointers into one array", line);
}

export function backingArray(c: any): any[] {
  if (c instanceof Vec || c instanceof OSet || c instanceof OMap) return c.a;
  if (c instanceof HMap || c instanceof HSet) return snapshotOf(c);
  throw runtimeError("bad-range", "this container cannot be used with iterators", 0);
}

export function construct(fc: FnCompiler, ty: Ty, args: Expr[], at: Loc): CE {
  const cc = fc.cc;
  const t = strip(ty);
  const line = at.line;
  if (t.k === "str") return constructString(fc, args, at);
  if (t.k === "sstream") {
    const limit = fc.rt.cout.limit();
    if (args.length === 0) return val(ty, () => new SStream(limit), line);
    const a = fc.expr(args[0]);
    const av = a.ev;
    const isStr = strip(a.ty).k === "str";
    const text = cc.lib.cstring;
    return val(ty, (fr) => new SStream(limit, isStr ? (av(fr) as CStr).s : text(av(fr))), line);
  }
  // emplace_back(3.5) on a vector<double>: a number "constructed" from a number
  if (t.k === "int" || t.k === "bool" || t.k === "float" || t.k === "double" || t.k === "enum" || t.k === "ptr") {
    if (args.length === 0) {
      const z = cc.defaultMaker(ty, true);
      return val(ty, () => z(), line);
    }
    if (args.length === 1) return val(ty, fc.coerce(fc.expr(args[0], ty), ty, at, "cast").ev, line);
  }
  if (t.k !== "std") return fc.err("cannot-construct", `cannot create ${tyStr(ty)} from these arguments`, at);
  const maker = cc.defaultMaker(ty, true);
  const clone = fc.cloner(ty);
  if (args.length === 0) return val(ty, () => maker(), line);
  const first = fc.expr(args[0], undefined);
  const ft = strip(first.ty);
  // copy construction
  if (args.length === 1 && sameType(ft, t)) {
    const ev = first.ev;
    if (first.rv) return val(ty, fc.copyOf({ ...first, alias: true }, ty), line);
    return val(ty, clone ? (fr) => clone(ev(fr)) : ev, line);
  }
  switch (t.name) {
    case "vector":
    case "deque": {
      const elem = t.args[0];
      const zero = zeroOf(cc, elem);
      if (isIntegral(ft) && args.length <= 2) {
        const n = numArg(fc, first, at);
        const fill = args.length > 1 ? elemValue(fc, args[1], elem, at) : null;
        const cl = fc.cloner(elem);
        return val(ty, (fr) => {
          const count = n(fr);
          if (count < 0) throw runtimeError("length-error", "vector: negative size", line);
          fc.rt.mem += count * 8;
          if (fc.rt.mem > fc.rt.memLimit) throw runtimeError("memory", "the program used too much memory", line);
          const a = new Array(count);
          if (fill) {
            const v = fill(fr);
            for (let i = 0; i < count; i++) a[i] = cl ? cl(v) : v;
          } else for (let i = 0; i < count; i++) a[i] = zero();
          return new Vec(a);
        }, line);
      }
      if ((ft.k === "iter" || ft.k === "ptr") && args.length === 2) {
        const second = fc.expr(args[1]);
        const a = first.ev;
        const b = second.ev;
        const conv = elementConv(fc, iterOrPtrElem(ft), elem, at);
        return val(ty, (fr) => new Vec(rangeElements(a(fr), b(fr), line).map(conv)), line);
      }
      break;
    }
    case "stack":
    case "queue":
    case "priority_queue": {
      if (t.name === "priority_queue") {
        const { cmp, runtime } = cmpFor(cc, t.args[0], t.cmp, at, first.ev);
        if (args.length === 1 && strip(first.ty).k === "fn") return val(ty, (fr) => new PQ([], runtime ? runtime(fr) : cmp), line);
        if (args.length === 1 && strip(first.ty).k === "cls") return val(ty, () => new PQ([], cmp), line);
        if (args.length === 2 && (ft.k === "iter" || ft.k === "ptr")) {
          const b = fc.expr(args[1]).ev;
          const a = first.ev;
          return val(ty, (fr) => {
            // priority_queue(first, last) copies the elements and makes a heap of them
            const pq = new PQ(rangeElements(a(fr), b(fr), line), cmp);
            heapify(pq);
            return pq;
          }, line);
        }
      }
      break;
    }
    case "set":
    case "multiset": {
      const { cmp, runtime } = cmpFor(cc, t.args[0], t.cmp, at, first.ev);
      if (args.length === 1 && (ft.k === "fn" || ft.k === "cls" || ft.k === "std") && !sameType(ft, t) && strip(first.ty).k !== "iter") {
        if (ft.k === "fn") return val(ty, (fr) => new OSet([], runtime ? runtime(fr) : cmp, t.name === "multiset"), line);
        return val(ty, () => new OSet([], cmp, t.name === "multiset"), line);
      }
      if (args.length >= 2 && (ft.k === "iter" || ft.k === "ptr")) {
        const b = fc.expr(args[1]).ev;
        const a = first.ev;
        const elem = t.args[0];
        const conv = elementConv(fc, iterOrPtrElem(ft), elem, at);
        return val(ty, (fr) => {
          const s = new OSet([], cmp, t.name === "multiset");
          for (const x of rangeElements(a(fr), b(fr), line)) setInsert(s, conv(x));
          return s;
        }, line);
      }
      break;
    }
    case "map":
    case "multimap": {
      const { cmp, runtime } = cmpFor(cc, t.args[0], t.cmp, at, first.ev);
      if (args.length === 1 && (ft.k === "fn" || ft.k === "cls") && strip(first.ty).k !== "iter") {
        if (ft.k === "fn") return val(ty, (fr) => new OMap([], runtime ? runtime(fr) : cmp, t.name === "multimap"), line);
        return val(ty, () => new OMap([], cmp, t.name === "multimap"), line);
      }
      if (args.length >= 2 && (ft.k === "iter" || ft.k === "ptr")) {
        const b = fc.expr(args[1]).ev;
        const a = first.ev;
        return val(ty, (fr) => {
          const m = new OMap([], cmp, t.name === "multimap");
          for (const p of rangeElements(a(fr), b(fr), line) as Pair[]) mapInsert(m, p.first, new Pair(p.first, p.second));
          return m;
        }, line);
      }
      break;
    }
    case "unordered_map":
    case "unordered_set":
    case "unordered_multimap":
    case "unordered_multiset": {
      if (args.length >= 1 && (ft.k === "iter" || ft.k === "ptr") && args.length === 2) {
        const b = fc.expr(args[1]).ev;
        const a = first.ev;
        return val(ty, (fr) => {
          const c = maker();
          for (const x of rangeElements(a(fr), b(fr), line)) hashInsert(c, x);
          return c;
        }, line);
      }
      // a bucket count is accepted and ignored
      if (args.length === 1 && isIntegral(ft)) return val(ty, () => maker(), line);
      break;
    }
    case "pair": {
      if (args.length === 2) {
        const a = elemValue(fc, args[0], t.args[0], at);
        const b = elemValue(fc, args[1], t.args[1], at);
        return val(ty, (fr) => new Pair(a(fr), b(fr)), line);
      }
      break;
    }
    case "tuple": {
      if (args.length === t.args.length) {
        const es = args.map((x, i) => elemValue(fc, x, t.args[i], at));
        return val(ty, (fr) => new Tup(es.map((f) => f(fr))), line);
      }
      break;
    }
    case "bitset": {
      if (args.length === 1) {
        const n = t.n ?? 0;
        if (ft.k === "str" || first.lit !== undefined) {
          const text = textArg(fc, first, at);
          return val(ty, (fr) => {
            const s = text(fr);
            const b = new Array(n).fill(false);
            for (let i = 0; i < s.length && i < n; i++) b[i] = s[s.length - 1 - i] === "1";
            return new Bits(n, b);
          }, line);
        }
        if (isIntegral(ft)) {
          const v = fc.coerce(first, { k: "int", bits: 64, signed: false, name: "unsigned long long" }, at, "cast").ev;
          return val(ty, (fr) => {
            const x = BigInt(v(fr));
            const b = new Array(n).fill(false);
            for (let i = 0; i < n && i < 64; i++) b[i] = ((x >> BigInt(i)) & 1n) === 1n;
            return new Bits(n, b);
          }, line);
        }
      }
      break;
    }
  }
  return fc.err("cannot-construct", `no constructor of ${tyStr(ty)} takes these arguments`, at, { type: tyStr(ty) });
}

function iterOrPtrElem(t: Ty): Ty {
  const s = strip(t);
  if (s.k === "iter") return iterElemTy(s.of);
  if (s.k === "ptr") return s.to;
  return T_INT;
}

/** A conversion of one element value from one type to another (identity when they are the same). */
function elementConv(fc: FnCompiler, from: Ty, to: Ty, at: Loc): (x: any) => any {
  if (sameType(from, to)) {
    const clone = needsClone(to) ? fc.cloner(to) : null;
    return clone ?? ((x) => x);
  }
  const probe = fc.coerce({ ty: from, ev: (fr) => fr[0], line: at.line }, to, at, "cast");
  return (x) => probe.ev([x]);
}

function constructString(fc: FnCompiler, args: Expr[], at: Loc): CE {
  const line = at.line;
  if (args.length === 0) return val(T_STR, () => new CStr(""), line);
  const first = fc.expr(args[0]);
  const ft = strip(first.ty);
  if (args.length === 1 && ft.k === "str" && first.rv) return val(T_STR, fc.copyOf({ ...first, alias: true }, T_STR), line);
  if (args.length === 1) {
    const text = textArg(fc, first, at);
    if (ft.k === "int" && !ft.ch) return fc.err("cannot-construct", "a string cannot be made from a single number (use std::to_string)", at);
    return val(T_STR, (fr) => new CStr(text(fr)), line);
  }
  if (isIntegral(ft) && args.length === 2) {
    const n = numArg(fc, first, at);
    const c = fc.coerce(fc.expr(args[1]), T_CHAR, at, "cast").ev;
    return val(T_STR, (fr) => new CStr(String.fromCharCode(c(fr) & 255).repeat(Math.max(0, n(fr)))), line);
  }
  if (ft.k === "iter" && args.length === 2) {
    const a = first.ev;
    const b = fc.expr(args[1]).ev;
    return val(T_STR, (fr) => {
      return new CStr(rangeElements(a(fr), b(fr), line).map((ch: number) => String.fromCharCode(ch & 255)).join(""));
    }, line);
  }
  const text = textArg(fc, first, at);
  const pos = numArg(fc, fc.expr(args[1]), at);
  const len = args.length > 2 ? numArg(fc, fc.expr(args[2]), at) : null;
  // string(const char *s, n): the first n characters of a C string
  if (ft.k !== "str" && args.length === 2) return val(T_STR, (fr) => new CStr(text(fr).slice(0, pos(fr))), line);
  return val(T_STR, (fr) => {
    const s = text(fr);
    const p = pos(fr);
    if (p > s.length) throw runtimeError("index-range", `position ${p} is outside the string (size ${s.length})`, line, { index: p, size: s.length, kind: "string" });
    return new CStr(len ? s.slice(p, p + len(fr)) : s.slice(p));
  }, line);
}

/* --------------------------------- list initialisation -------------------------------- */

export function listInit(fc: FnCompiler, ty: Ty, args: Expr[], at: Loc): CE {
  const cc = fc.cc;
  const t = strip(ty);
  const line = at.line;
  if (t.k === "cls") {
    const info = t.cls.info as ClassInfo;
    return fc.constructObject(ty, args, true, at);
    void info;
  }
  if (t.k === "str") {
    if (args.length === 0) return val(ty, () => new CStr(""), line);
    const chars = args.map((a) => fc.coerce(fc.expr(a), T_CHAR, at, "cast").ev);
    if (args.length === 1 && strip(fc.typeOfExpr(args[0])).k !== "int") return construct(fc, ty, args, at);
    return val(ty, (fr) => new CStr(chars.map((c) => String.fromCharCode(c(fr) & 255)).join("")), line);
  }
  if (t.k === "arr") {
    const elem = t.of;
    const vals = args.map((a) => elemValue(fc, a, elem, at));
    const zero = zeroOf(cc, elem);
    const n = t.n;
    return val(ty, (fr) => {
      const a = new Array(n);
      for (let i = 0; i < n; i++) a[i] = i < vals.length ? vals[i](fr) : zero();
      return a;
    }, line);
  }
  if (t.k !== "std") return fc.err("bad-initializer", `${tyStr(ty)} cannot be initialised with { }`, at, { type: tyStr(ty) });
  const maker = cc.defaultMaker(ty, true);
  if (args.length === 0) return val(ty, () => maker(), line);
  switch (t.name) {
    case "vector":
    case "deque":
    case "array":
    case "initializer_list": {
      const elem = t.args[0];
      const vals = args.map((a) => elemValue(fc, a, elem, at));
      if (t.name === "array") {
        const zero = zeroOf(cc, elem);
        const n = t.n ?? 0;
        if (vals.length > n) fc.err("too-many-initializers", `too many initialisers for ${tyStr(ty)}`, at);
        return val(ty, (fr) => {
          const a = new Array(n);
          for (let i = 0; i < n; i++) a[i] = i < vals.length ? vals[i](fr) : zero();
          return new Vec(a);
        }, line);
      }
      return val(ty, (fr) => {
        const a = new Array(vals.length);
        for (let i = 0; i < vals.length; i++) a[i] = vals[i](fr);
        return new Vec(a);
      }, line);
    }
    case "set":
    case "multiset":
    case "unordered_set":
    case "unordered_multiset": {
      const elem = t.args[0];
      const vals = args.map((a) => elemValue(fc, a, elem, at));
      return val(ty, (fr) => {
        const c = maker();
        for (const v of vals) {
          if (c instanceof OSet) setInsert(c, v(fr));
          else hashInsert(c, v(fr));
        }
        return c;
      }, line);
    }
    case "map":
    case "multimap":
    case "unordered_map":
    case "unordered_multimap": {
      const pty = pairOf(t.args[0], t.args[1]);
      const vals = args.map((a) => elemValue(fc, a, pty, at));
      return val(ty, (fr) => {
        const c = maker();
        for (const v of vals) {
          const p = v(fr) as Pair;
          if (c instanceof OMap) mapInsert(c, p.first, p);
          else hashInsert(c, p);
        }
        return c;
      }, line);
    }
    case "pair": {
      if (args.length !== 2) fc.err("too-many-initializers", "a pair has two values", at);
      const a = elemValue(fc, args[0], t.args[0], at);
      const b = elemValue(fc, args[1], t.args[1], at);
      return val(ty, (fr) => new Pair(a(fr), b(fr)), line);
    }
    case "tuple": {
      if (args.length !== t.args.length) fc.err("too-many-initializers", `this tuple has ${t.args.length} values`, at);
      const es = args.map((x, i) => elemValue(fc, x, t.args[i], at));
      return val(ty, (fr) => new Tup(es.map((f) => f(fr))), line);
    }
    case "stack":
    case "queue":
    case "priority_queue":
      return construct(fc, ty, args, at);
  }
  return fc.err("bad-initializer", `${tyStr(ty)} cannot be initialised with { }`, at, { type: tyStr(ty) });
}

/* ------------------------------- element insertion ------------------------------- */

export function setInsert(s: OSet, x: any): { index: number; added: boolean } {
  const a = s.a;
  if (a.length === 0 || s.cmp(a[a.length - 1], x) < 0) {
    a.push(x);
    return { index: a.length - 1, added: true };
  }
  const i = lowerBound(a, x, s.cmp);
  if (!s.multi && i < a.length && s.cmp(a[i], x) === 0) return { index: i, added: false };
  const at = s.multi ? upperBound(a, x, s.cmp) : i;
  a.splice(at, 0, x);
  return { index: at, added: true };
}

export function mapInsert(m: OMap, key: any, pair: Pair): { index: number; added: boolean } {
  const a = m.a;
  if (a.length === 0 || m.cmp(a[a.length - 1].first, key) < 0) {
    a.push(pair);
    return { index: a.length - 1, added: true };
  }
  const lo = lowerKey(m, key);
  if (!m.multi && lo < a.length && m.cmp(a[lo].first, key) === 0) return { index: lo, added: false };
  const at = m.multi ? upperKey(m, key) : lo;
  a.splice(at, 0, pair);
  return { index: at, added: true };
}

export function lowerKey(m: OMap, key: any): number {
  const a = m.a;
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (m.cmp(a[mid].first, key) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperKey(m: OMap, key: any): number {
  const a = m.a;
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (m.cmp(a[mid].first, key) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function hashInsert(c: any, x: any): boolean {
  if (c instanceof HSet) {
    const k = c.key(x);
    if (c.m.has(k)) return false;
    c.m.set(k, x);
    return true;
  }
  const m = c as HMap;
  const p = x as Pair;
  const k = m.key(p.first);
  if (m.m.has(k) && !m.multi) return false;
  if (m.multi) {
    // Equal keys are kept side by side under distinct internal keys.
    let n = 0;
    while (m.m.has(`${String(k)}\u0000${n}`)) n++;
    m.m.set(`${String(k)}\u0000${n}`, p);
    return true;
  }
  m.m.set(k, p);
  return true;
}

/* ----------------------------------- heap ----------------------------------- */

export function heapPush(pq: PQ, x: any): void {
  pq.a.push(x);
  pushHeap(pq.a, 0, pq.a.length, (p, q) => pq.cmp(p, q) < 0);
}

export function heapPop(pq: PQ): any {
  const a = pq.a;
  const top = a[0];
  popHeap(a, 0, a.length, (p, q) => pq.cmp(p, q) < 0);
  a.pop();
  return top;
}

/** The heap of a priority_queue built from existing elements (std::make_heap). */
export function heapify(pq: PQ): void {
  makeHeap(pq.a, 0, pq.a.length, (p, q) => pq.cmp(p, q) < 0);
}

/* ------------------------------------ range-for ------------------------------------ */

export function rangeInfo(ty: Ty): RangeInfo | null {
  const t = strip(ty);
  if (t.k === "arr") return { elemTy: t.of, length: (c: any[]) => c.length, at: (c: any[], i) => c[i], place: (c: any[], i) => new ElemPlace(c, i), live: false };
  if (t.k === "str") return { elemTy: T_CHAR, length: (c: CStr) => c.s.length, at: (c: CStr, i) => charAt(c.s, i), place: (c: CStr, i) => new CharPlace(c, i), live: true };
  if (t.k === "std") {
    switch (t.name) {
      case "vector":
      case "array":
      case "deque":
      case "initializer_list":
        return { elemTy: t.args[0], length: (c: Vec) => c.a.length, at: (c: Vec, i) => c.a[i], place: (c: Vec, i) => new ElemPlace(c.a, i), live: true };
      case "set":
      case "multiset":
        return { elemTy: withConst(t.args[0]), length: (c: OSet) => c.a.length, at: (c: OSet, i) => c.a[i], live: true };
      case "map":
      case "multimap":
        return { elemTy: pairOf(t.args[0], t.args[1]), length: (c: OMap) => c.a.length, at: (c: OMap, i) => c.a[i], live: true };
      case "unordered_set":
      case "unordered_multiset":
        return { elemTy: withConst(t.args[0]), prepare: (c: HSet) => snapshotOf(c), length: (c: any[]) => c.length, at: (c: any[], i) => c[i], live: false };
      case "unordered_map":
      case "unordered_multimap":
        return { elemTy: pairOf(t.args[0], t.args[1]), prepare: (c: HMap) => snapshotOf(c), length: (c: any[]) => c.length, at: (c: any[], i) => c[i], live: false };
    }
  }
  return null;
}

/* ------------------------------------ indexing ------------------------------------ */

export function indexStd(fc: FnCompiler, base: CE, idx: CE, at: Loc): CE | null {
  const t = strip(base.ty);
  const line = at.line;
  const be = base.ev;
  if (t.k === "str") {
    if (!isIntegral(strip(idx.ty))) return fc.err("bad-index", "a string index must be an integer", at);
    const ie = numArg(fc, idx, at);
    return {
      ty: base.ty.c ? withConst(T_CHAR) : T_CHAR,
      ev: (fr) => {
        const s = (be(fr) as CStr).s;
        const i = ie(fr);
        if (i < 0 || i >= s.length) {
          // s[s.size()] is the terminating zero in C++
          if (i === s.length) return 0;
          return outOfRange("string", i, s.length, line);
        }
        return charAt(s, i);
      },
      lv: (fr) => new CharPlace(be(fr), ie(fr)),
      set: (fr, v) => new CharPlace(be(fr), ie(fr)).set(v),
      line,
    };
  }
  if (t.k !== "std") return null;
  switch (t.name) {
    case "vector":
    case "array":
    case "deque": {
      if (!isIntegral(strip(idx.ty))) return fc.err("bad-index", "an index must be an integer", at);
      const ie = numArg(fc, idx, at);
      const elem = base.ty.c ? withConst(t.args[0]) : t.args[0];
      const kind = t.name === "array" ? "array" : "vector";
      if (isClassLike(elem)) {
        const assign = fc.assigner(elem);
        return {
          ty: elem,
          ev: (fr) => {
            const a = (be(fr) as Vec).a;
            const i = ie(fr);
            if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
            return a[i];
          },
          lv: (fr) => {
            const a = (be(fr) as Vec).a;
            const i = ie(fr);
            if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
            return new ObjPlace(a[i], assign);
          },
          set: (fr, v) => {
            const a = (be(fr) as Vec).a;
            const i = ie(fr);
            if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
            assign(a[i], v);
          },
          line,
        };
      }
      return {
        ty: elem,
        ev: (fr) => {
          const a = (be(fr) as Vec).a;
          const i = ie(fr);
          if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
          const v = a[i];
          if (v === undefined) throw runtimeError("uninitialized", `element ${i} was used before it was given a value`, line);
          return v;
        },
        lv: (fr) => {
          const a = (be(fr) as Vec).a;
          const i = ie(fr);
          if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
          return new ElemPlace(a, i);
        },
        set: (fr, v) => {
          const a = (be(fr) as Vec).a;
          const i = ie(fr);
          if (i < 0 || i >= a.length) outOfRange(kind, i, a.length, line);
          a[i] = v;
        },
        line,
      };
    }
    case "map":
    case "unordered_map": {
      const keyTy = t.args[0];
      const valTy = t.args[1];
      const key = fc.coerce(idx, keyTy, at, "init");
      const kev = fc.copyOf(key, keyTy);
      const zero = zeroOf(fc.cc, valTy);
      const ordered = t.name === "map";
      const get = (fr: Frame): Pair => {
        const c = be(fr);
        const k = kev(fr);
        if (ordered) {
          const m = c as OMap;
          const lo = lowerKey(m, k);
          if (lo < m.a.length && m.cmp(m.a[lo].first, k) === 0) return m.a[lo];
          const p = new Pair(k, zero());
          m.a.splice(lo, 0, p);
          return p;
        }
        const h = c as HMap;
        const hk = h.key(k);
        let p = h.m.get(hk);
        if (!p) {
          p = new Pair(k, zero());
          h.m.set(hk, p);
        }
        return p;
      };
      if (isClassLike(valTy)) {
        const assign = fc.assigner(valTy);
        return { ty: valTy, ev: (fr) => get(fr).second, lv: (fr) => new ObjPlace(get(fr).second, assign), set: (fr, v) => assign(get(fr).second, v), line };
      }
      return { ty: valTy, ev: (fr) => get(fr).second, lv: (fr) => new PairSecond(get(fr)), set: (fr, v) => void (get(fr).second = v), line };
    }
    case "bitset": {
      const ie = numArg(fc, idx, at);
      return {
        ty: T_BOOL,
        ev: (fr) => {
          const b = be(fr) as Bits;
          const i = ie(fr);
          if (i < 0 || i >= b.n) outOfRange("bitset", i, b.n, line);
          return b.b[i];
        },
        lv: (fr) => new ElemPlace((be(fr) as Bits).b, ie(fr)),
        set: (fr, v) => {
          const b = be(fr) as Bits;
          const i = ie(fr);
          if (i < 0 || i >= b.n) outOfRange("bitset", i, b.n, line);
          b.b[i] = v;
        },
        line,
      };
    }
  }
  return null;
}

class PairSecond implements Place {
  constructor(private p: Pair) {}
  get() {
    return this.p.second;
  }
  set(v: any) {
    this.p.second = v;
  }
}

/* ------------------------------------ iterators ------------------------------------ */

/** `*it` and `it->member`. */
export function derefStd(fc: FnCompiler, x: CE, at: Loc): CE | null {
  const t = strip(x.ty);
  if (t.k !== "iter") return null;
  const of = strip(t.of);
  const elem = iterElemTy(of);
  const ev = x.ev;
  const line = at.line;
  const rev = !!t.reverse;
  const len = lengthOf(of);
  const back = backingOf(of);
  const pos = (it: It): number => (rev ? len(it.c) - 1 - it.i : it.i);
  const arrOf = (it: It): any[] => it.snap ?? back!(it.c);
  const check = (it: It, i: number, n: number): void => {
    if (i < 0 || i >= n) throw runtimeError("iterator-range", "dereferencing an iterator that is past the end (or before the start) of the container", line);
  };
  if (of.k === "str") {
    return {
      ty: T_CHAR,
      ev: (fr) => {
        const it = ev(fr) as It;
        const s = (it.c as CStr).s;
        const i = pos(it);
        check(it, i, s.length);
        return charAt(s, i);
      },
      lv: (fr) => {
        const it = ev(fr) as It;
        return new CharPlace(it.c, pos(it));
      },
      set: (fr, v) => {
        const it = ev(fr) as It;
        new CharPlace(it.c, pos(it)).set(v);
      },
      line,
    };
  }
  if (isClassLike(elem)) {
    const assign = fc.assigner(elem);
    const get = (fr: Frame) => {
      const it = ev(fr) as It;
      const a = arrOf(it);
      const i = pos(it);
      check(it, i, a.length);
      return a[i];
    };
    return { ty: elem, ev: get, lv: (fr) => new ObjPlace(get(fr), assign), set: (fr, v) => assign(get(fr), v), line };
  }
  const place = (fr: Frame): ElemPlace => {
    const it = ev(fr) as It;
    const a = arrOf(it);
    const i = pos(it);
    check(it, i, a.length);
    return new ElemPlace(a, i);
  };
  return { ty: elem, ev: (fr) => place(fr).get(), lv: place, set: (fr, v) => place(fr).set(v), line };
}

export function arrowStd(fc: FnCompiler, base: CE, name: string, at: Loc): CE | null {
  const t = strip(base.ty);
  if (t.k !== "iter") return null;
  const target = derefStd(fc, base, at)!;
  const et = strip(target.ty);
  const tev = target.ev;
  if (et.k === "std" && et.name === "pair" && (name === "first" || name === "second")) {
    return fc.fieldCE(tev, name, et.args[name === "first" ? 0 : 1], at);
  }
  if (et.k === "cls") {
    const info = et.cls.info as ClassInfo;
    const f = info.fieldMap.get(name);
    if (f) return fc.fieldCE(tev, name, f.ty, at);
    return fc.err("no-member", `${info.name} has no member '${name}'`, at, { name, cls: info.name });
  }
  return fc.err("no-member", `${tyStr(target.ty)} has no member '${name}'`, at, { name, cls: tyStr(target.ty) });
}

export function incIter(t: Extract<Ty, { k: "iter" }>, dir: number): (v: any) => any {
  return (it: It) => new It(it.c, it.i + dir, it.snap);
}

/* ------------------------------------ operators ------------------------------------ */

export function binaryStd(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  const lt = strip(l.ty);
  const rt = strip(r.ty);
  const line = at.line;
  // iterator arithmetic and comparison
  if (lt.k === "iter" || rt.k === "iter") {
    const a = l.ev;
    const b = r.ev;
    if (lt.k === "iter" && rt.k === "iter") {
      if (op === "-") return val(T_LONG, (fr) => (a(fr) as It).i - (b(fr) as It).i, line);
      const cmp: Record<string, (x: number, y: number) => boolean> = { "==": (x, y) => x === y, "!=": (x, y) => x !== y, "<": (x, y) => x < y, ">": (x, y) => x > y, "<=": (x, y) => x <= y, ">=": (x, y) => x >= y };
      const f = cmp[op];
      if (f) return val(T_BOOL, (fr) => f((a(fr) as It).i, (b(fr) as It).i), line);
      return null;
    }
    if ((op === "+" || op === "-") && lt.k === "iter" && isIntegral(rt)) {
      const n = numArg(fc, r, at);
      const sign = op === "+" ? 1 : -1;
      return val(l.ty, (fr) => {
        const it = a(fr) as It;
        return new It(it.c, it.i + sign * n(fr), it.snap);
      }, line);
    }
    if (op === "+" && rt.k === "iter" && isIntegral(lt)) {
      const n = numArg(fc, l, at);
      return val(r.ty, (fr) => {
        const it = b(fr) as It;
        return new It(it.c, it.i + n(fr), it.snap);
      }, line);
    }
    return null;
  }
  if (lt.k !== "std" || rt.k !== "std") return null;
  if (!sameType(lt, rt)) return null;
  const a = l.ev;
  const b = r.ev;
  if (lt.name === "bitset") return bitsetBinary(fc, op, l, r, at);
  if (op === "==" || op === "!=") {
    let eq: (x: any, y: any) => boolean;
    if (["vector", "deque", "array", "pair", "tuple"].includes(lt.name)) eq = eqFn(fc.cc, lt, at);
    else if (lt.name === "set" || lt.name === "multiset") {
      const e = eqFn(fc.cc, lt.args[0], at);
      eq = (x: OSet, y: OSet) => x.a.length === y.a.length && x.a.every((v, i) => e(v, y.a[i]));
    } else if (lt.name === "map" || lt.name === "multimap") {
      const ek = eqFn(fc.cc, lt.args[0], at);
      const ev = eqFn(fc.cc, lt.args[1], at);
      eq = (x: OMap, y: OMap) => x.a.length === y.a.length && x.a.every((p, i) => ek(p.first, y.a[i].first) && ev(p.second, y.a[i].second));
    } else return null;
    return val(T_BOOL, op === "==" ? (fr) => eq(a(fr), b(fr)) : (fr) => !eq(a(fr), b(fr)), line);
  }
  if (["<", ">", "<=", ">="].includes(op) && ["vector", "deque", "array", "pair", "tuple"].includes(lt.name)) {
    const less = lessFn(fc.cc, lt, at);
    switch (op) {
      case "<":
        return val(T_BOOL, (fr) => less(a(fr), b(fr)), line);
      case ">":
        return val(T_BOOL, (fr) => less(b(fr), a(fr)), line);
      case "<=":
        return val(T_BOOL, (fr) => !less(b(fr), a(fr)), line);
      default:
        return val(T_BOOL, (fr) => !less(a(fr), b(fr)), line);
    }
  }
  return null;
}

function bitsetBinary(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  const a = l.ev;
  const b = r.ev;
  const line = at.line;
  const f: Record<string, (x: boolean, y: boolean) => boolean> = { "&": (x, y) => x && y, "|": (x, y) => x || y, "^": (x, y) => x !== y };
  if (f[op]) {
    const g = f[op];
    return val(l.ty, (fr) => {
      const x = a(fr) as Bits;
      const y = b(fr) as Bits;
      return new Bits(x.n, x.b.map((v, i) => g(v, y.b[i])));
    }, line);
  }
  if (op === "==" || op === "!=") return val(T_BOOL, (fr) => ((a(fr) as Bits).b.every((v, i) => v === (b(fr) as Bits).b[i])) === (op === "=="), line);
  return null;
}

export function compoundStd(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  const lt = strip(l.ty);
  const line = at.line;
  if (lt.k === "iter" && (op === "+" || op === "-")) {
    const n = numArg(fc, r, at);
    const sign = op === "+" ? 1 : -1;
    const lv = l.lv!;
    return { ty: l.ty, ev: (fr) => {
      const p = lv(fr);
      const it = p.get() as It;
      const next = new It(it.c, it.i + sign * n(fr), it.snap);
      p.set(next);
      return next;
    }, line };
  }
  if (lt.k === "std" && lt.name === "bitset") {
    const g: Record<string, (x: boolean, y: boolean) => boolean> = { "&": (x, y) => x && y, "|": (x, y) => x || y, "^": (x, y) => x !== y };
    if (g[op]) {
      const f = g[op];
      const a = l.ev;
      const b = r.ev;
      return { ty: l.ty, ev: (fr) => {
        const x = a(fr) as Bits;
        const y = b(fr) as Bits;
        for (let i = 0; i < x.n; i++) x.b[i] = f(x.b[i], y.b[i]);
        return x;
      }, line };
    }
  }
  return null;
}

export { T_SIZE, T_VOID, decay, noConst, stdTy };
