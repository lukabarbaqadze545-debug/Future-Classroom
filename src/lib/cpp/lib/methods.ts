import type { Expr, Loc } from "../ast";
import { runtimeError } from "../errors";
import type { CE, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { Bits, CStr, Deq, ElemPlace, HMap, HSet, OMap, OSet, PQ, Pair, Tup, Vec } from "../values";
import { T_BOOL, T_INT, T_LONG, T_SIZE, T_STR, T_VOID, isIntegral, pairOf, sameType, strip, tyStr, withConst, type Ty } from "../types";
import { checkArgs, emptyError, numArg, outOfRange, val, type Call } from "./helpers";
import { It, iterElemTy, snapshotOf } from "./iter";
import { elemValue, hashInsert, heapPop, heapPush, lowerBound, lowerKey, mapInsert, rangeElements, setInsert, upperBound, upperKey, zeroOf } from "./containers";
import { textArg } from "./strings";

/** Member functions of the standard containers. */

const iterTy = (of: Ty, reverse = false): Ty => (reverse ? { k: "iter", of, reverse: true } : { k: "iter", of });

export function containerMethod(fc: FnCompiler, obj: CE, name: string, e: Call): CE | null {
  const t = strip(obj.ty);
  if (t.k === "iter") return null;
  if (t.k === "std") {
    switch (t.name) {
      case "vector":
      case "deque":
      case "array":
        return vectorMethod(fc, obj, t, name, e);
      case "stack":
      case "queue":
        return adaptorMethod(fc, obj, t, name, e);
      case "priority_queue":
        return pqMethod(fc, obj, t, name, e);
      case "set":
      case "multiset":
        return setMethod(fc, obj, t, name, e);
      case "map":
      case "multimap":
        return mapMethod(fc, obj, t, name, e);
      case "unordered_map":
      case "unordered_multimap":
      case "unordered_set":
      case "unordered_multiset":
        return hashMethod(fc, obj, t, name, e);
      case "pair":
        if (name === "swap") {
          checkArgs(fc, e, name, 1);
          const o = fc.expr(e.args[0]).ev;
          const a = obj.ev;
          return val(T_VOID, (fr) => {
            const x = a(fr) as Pair;
            const y = o(fr) as Pair;
            [x.first, y.first] = [y.first, x.first];
            [x.second, y.second] = [y.second, x.second];
          }, e.line);
        }
        return null;
      case "bitset":
        return bitsetMethod(fc, obj, t, name, e);
      case "function":
        return null;
    }
  }
  return null;
}

function guardConst(fc: FnCompiler, obj: CE, name: string, e: Call, readOnly: string[]): void {
  if (obj.ty.c && !readOnly.includes(name)) fc.err("const-method", `'${name}' changes the container, but it is const`, e, { name });
}

const VEC_READ = ["size", "empty", "back", "front", "at", "begin", "end", "rbegin", "rend", "cbegin", "cend", "crbegin", "crend", "capacity", "max_size", "data"];

function vectorMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const elem = t.args[0];
  const self = (fr: Frame) => ov(fr) as Vec;
  const rt = fc.rt;
  const kind = t.name === "array" ? "array" : t.name;
  guardConst(fc, obj, name, e, VEC_READ);
  if (t.name === "array" && ["push_back", "pop_back", "insert", "erase", "resize", "clear", "emplace_back", "assign"].includes(name)) return null;
  if ((t.name === "vector" || t.name === "array") && ["push_front", "pop_front", "emplace_front"].includes(name)) return null;
  const count = (n: number) => {
    rt.mem += n * 8;
    if (rt.mem > rt.memLimit) throw runtimeError("memory", "the program used too much memory", line);
  };
  switch (name) {
    case "size":
      checkArgs(fc, e, name, 0);
      return val(T_SIZE, (fr) => self(fr).a.length, line);
    case "max_size":
      return val(T_SIZE, () => 1152921504606846975n, line);
    case "capacity":
      return val(T_SIZE, (fr) => self(fr).a.length, line);
    case "empty":
      checkArgs(fc, e, name, 0);
      return val(T_BOOL, (fr) => self(fr).a.length === 0, line);
    case "clear":
      return val(T_VOID, (fr) => void (self(fr).a = []), line);
    case "reserve":
    case "shrink_to_fit":
      e.args.forEach((a) => fc.expr(a));
      return val(T_VOID, () => undefined, line);
    case "data":
      return val({ k: "ptr", to: elem }, (fr) => new ElemPlace(self(fr).a, 0), line);
    case "push_back":
    case "emplace_back": {
      if (name === "push_back") checkArgs(fc, e, name, 1);
      let value: (fr: Frame) => any;
      if (name === "emplace_back") {
        const made = fc.cc.lib.construct(fc, elem, e.args, e);
        value = made.ev;
      } else value = elemValue(fc, e.args[0], elem, e);
      return val(T_VOID, (fr) => {
        count(1);
        self(fr).a.push(value(fr));
      }, line);
    }
    case "push_front":
    case "emplace_front": {
      const value = name === "emplace_front" ? fc.cc.lib.construct(fc, elem, e.args, e).ev : elemValue(fc, e.args[0], elem, e);
      return val(T_VOID, (fr) => {
        count(1);
        self(fr).a.unshift(value(fr));
      }, line);
    }
    case "pop_back":
    case "pop_front": {
      checkArgs(fc, e, name, 0);
      const front = name === "pop_front";
      return val(T_VOID, (fr) => {
        const a = self(fr).a;
        if (a.length === 0) emptyError(name, line);
        if (front) a.shift();
        else a.pop();
      }, line);
    }
    case "front":
    case "back": {
      checkArgs(fc, e, name, 0);
      const front = name === "front";
      const eTy = obj.ty.c ? withConst(elem) : elem;
      const at = (fr: Frame): [any[], number] => {
        const a = self(fr).a;
        if (a.length === 0) emptyError(name, line);
        return [a, front ? 0 : a.length - 1];
      };
      if (strip(elem).k === "str" || strip(elem).k === "cls" || strip(elem).k === "std" || strip(elem).k === "arr") {
        const assign = fc.assigner(elem);
        return { ty: eTy, ev: (fr) => {
          const [a, i] = at(fr);
          return a[i];
        }, set: (fr, v) => {
          const [a, i] = at(fr);
          assign(a[i], v);
        }, lv: (fr) => {
          const [a, i] = at(fr);
          return new (fc.cc.lib as any).ObjPlaceCtor(a[i], assign);
        }, line };
      }
      return { ty: eTy, ev: (fr) => {
        const [a, i] = at(fr);
        return a[i];
      }, lv: (fr) => {
        const [a, i] = at(fr);
        return new ElemPlace(a, i);
      }, set: (fr, v) => {
        const [a, i] = at(fr);
        a[i] = v;
      }, line };
    }
    case "at": {
      checkArgs(fc, e, name, 1);
      const idx = fc.expr(e.args[0]);
      return fc.cc.lib.indexStd(fc, obj, idx, e);
    }
    case "begin":
    case "cbegin":
      return val(iterTy(obj.ty), (fr) => new It(self(fr), 0), line);
    case "end":
    case "cend":
      return val(iterTy(obj.ty), (fr) => new It(self(fr), self(fr).a.length), line);
    case "rbegin":
    case "crbegin":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), 0, null, true), line);
    case "rend":
    case "crend":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), self(fr).a.length, null, true), line);
    case "insert":
    case "emplace": {
      if (e.args.length < 2) fc.err("arg-count", `'${name}' needs a position and a value`, e);
      const pos = fc.expr(e.args[0]);
      if (strip(pos.ty).k !== "iter") fc.err("bad-argument", `the first argument of ${name} must be an iterator (v.begin() + i)`, e);
      const pe = pos.ev;
      const result = iterTy(obj.ty);
      if (name === "emplace" || e.args.length === 2) {
        // a single value, or a braced list
        const second = e.args[1];
        if (name === "insert" && second.k === "init" && !second.type) {
          const list = fc.cc.lib.listInit(fc, { k: "std", name: "vector", args: [elem] }, second.elems, e).ev;
          return val(result, (fr) => {
            const v = self(fr);
            const it = pe(fr) as It;
            const items = (list(fr) as Vec).a;
            count(items.length);
            v.a.splice(it.i, 0, ...items);
            return new It(v, it.i);
          }, line);
        }
        const value = name === "emplace" ? fc.cc.lib.construct(fc, elem, e.args.slice(1), e).ev : elemValue(fc, second, elem, e);
        return val(result, (fr) => {
          const v = self(fr);
          const it = pe(fr) as It;
          if (it.i < 0 || it.i > v.a.length) throw runtimeError("iterator-range", "insert at a position outside the vector", line);
          count(1);
          v.a.splice(it.i, 0, value(fr));
          return new It(v, it.i);
        }, line);
      }
      if (e.args.length === 3) {
        const second = fc.expr(e.args[1]);
        if (isIntegral(strip(second.ty))) {
          const n = numArg(fc, second, e);
          const value = elemValue(fc, e.args[2], elem, e);
          const clone = fc.cloner(elem);
          return val(result, (fr) => {
            const v = self(fr);
            const it = pe(fr) as It;
            const k = n(fr);
            const x = value(fr);
            count(k);
            v.a.splice(it.i, 0, ...Array.from({ length: k }, () => (clone ? clone(x) : x)));
            return new It(v, it.i);
          }, line);
        }
        const a = second.ev;
        const b = fc.expr(e.args[2]).ev;
        return val(result, (fr) => {
          const v = self(fr);
          const it = pe(fr) as It;
          const items = rangeElements(a(fr), b(fr), line);
          count(items.length);
          v.a.splice(it.i, 0, ...items);
          return new It(v, it.i);
        }, line);
      }
      return null;
    }
    case "erase": {
      checkArgs(fc, e, name, 1, 2);
      const a = fc.expr(e.args[0]).ev;
      const b = e.args.length > 1 ? fc.expr(e.args[1]).ev : null;
      return val(iterTy(obj.ty), (fr) => {
        const v = self(fr);
        const first = a(fr) as It;
        const last = b ? (b(fr) as It) : null;
        const from = first.i;
        const to = last ? last.i : from + 1;
        if (from < 0 || to > v.a.length || from > to) throw runtimeError("iterator-range", "erase with an iterator outside the vector", line);
        v.a.splice(from, to - from);
        return new It(v, from);
      }, line);
    }
    case "resize": {
      checkArgs(fc, e, name, 1, 2);
      const n = numArg(fc, fc.expr(e.args[0]), e);
      const zero = zeroOf(fc.cc, elem);
      const fill = e.args.length > 1 ? elemValue(fc, e.args[1], elem, e) : null;
      const clone = fc.cloner(elem);
      return val(T_VOID, (fr) => {
        const v = self(fr);
        const k = n(fr);
        if (k < 0) throw runtimeError("length-error", "negative size", line);
        if (k <= v.a.length) v.a.length = k;
        else {
          count(k - v.a.length);
          const x = fill ? fill(fr) : null;
          while (v.a.length < k) v.a.push(fill ? (clone ? clone(x) : x) : zero());
        }
      }, line);
    }
    case "assign": {
      checkArgs(fc, e, name, 2);
      const first = fc.expr(e.args[0]);
      if (isIntegral(strip(first.ty))) {
        const n = numArg(fc, first, e);
        const value = elemValue(fc, e.args[1], elem, e);
        const clone = fc.cloner(elem);
        return val(T_VOID, (fr) => {
          const v = self(fr);
          const k = n(fr);
          const x = value(fr);
          count(k);
          v.a = Array.from({ length: k }, () => (clone ? clone(x) : x));
        }, line);
      }
      const a = first.ev;
      const b = fc.expr(e.args[1]).ev;
      return val(T_VOID, (fr) => void (self(fr).a = rangeElements(a(fr), b(fr), line)), line);
    }
    case "swap": {
      checkArgs(fc, e, name, 1);
      const o = fc.expr(e.args[0]).ev;
      return val(T_VOID, (fr) => {
        const a = self(fr);
        const b = o(fr) as Vec;
        const t = a.a;
        a.a = b.a;
        b.a = t;
      }, line);
    }
    case "fill": {
      checkArgs(fc, e, name, 1);
      const value = elemValue(fc, e.args[0], elem, e);
      const clone = fc.cloner(elem);
      return val(T_VOID, (fr) => {
        const v = self(fr);
        const x = value(fr);
        for (let i = 0; i < v.a.length; i++) v.a[i] = clone ? clone(x) : x;
      }, line);
    }
  }
  void kind;
  return null;
}

/* ------------------------------- stack and queue ------------------------------- */

function adaptorMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const elem = t.args[0];
  const self = (fr: Frame) => ov(fr) as Deq;
  const isStack = t.name === "stack";
  const eTy = obj.ty.c ? withConst(elem) : elem;
  const count = () => {
    fc.rt.mem += 8;
    if (fc.rt.mem > fc.rt.memLimit) throw runtimeError("memory", "the program used too much memory", line);
  };
  guardConst(fc, obj, name, e, ["size", "empty", "top", "front", "back"]);
  switch (name) {
    case "size":
      return val(T_SIZE, (fr) => self(fr).length, line);
    case "empty":
      return val(T_BOOL, (fr) => self(fr).length === 0, line);
    case "push":
    case "emplace": {
      const value = name === "push" ? (checkArgs(fc, e, name, 1), elemValue(fc, e.args[0], elem, e)) : fc.cc.lib.construct(fc, elem, e.args, e).ev;
      return val(T_VOID, (fr) => {
        count();
        self(fr).a.push(value(fr));
      }, line);
    }
    case "pop":
      return val(T_VOID, (fr) => {
        const d = self(fr);
        if (d.length === 0) emptyError("pop", line);
        if (isStack) d.a.pop();
        else {
          d.a[d.head] = undefined;
          d.head++;
          d.compact();
        }
      }, line);
    case "top":
    case "front":
    case "back": {
      if (isStack ? name !== "top" : name === "top") return null;
      const which = name;
      const at = (fr: Frame): [Deq, number] => {
        const d = self(fr);
        if (d.length === 0) emptyError(name, line);
        return [d, which === "front" ? d.head : d.a.length - 1];
      };
      if (strip(elem).k === "str" || strip(elem).k === "cls" || strip(elem).k === "std") {
        const assign = fc.assigner(elem);
        return { ty: eTy, ev: (fr) => {
          const [d, i] = at(fr);
          return d.a[i];
        }, set: (fr, v) => {
          const [d, i] = at(fr);
          assign(d.a[i], v);
        }, line };
      }
      return { ty: eTy, ev: (fr) => {
        const [d, i] = at(fr);
        return d.a[i];
      }, lv: (fr) => {
        const [d, i] = at(fr);
        return new ElemPlace(d.a, i);
      }, set: (fr, v) => {
        const [d, i] = at(fr);
        d.a[i] = v;
      }, line };
    }
    case "swap": {
      const o = fc.expr(e.args[0]).ev;
      return val(T_VOID, (fr) => {
        const a = self(fr);
        const b = o(fr) as Deq;
        [a.a, b.a] = [b.a, a.a];
        [a.head, b.head] = [b.head, a.head];
      }, line);
    }
  }
  return null;
}

function pqMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const elem = t.args[0];
  const self = (fr: Frame) => ov(fr) as PQ;
  guardConst(fc, obj, name, e, ["size", "empty", "top"]);
  switch (name) {
    case "size":
      return val(T_SIZE, (fr) => self(fr).a.length, line);
    case "empty":
      return val(T_BOOL, (fr) => self(fr).a.length === 0, line);
    case "push":
    case "emplace": {
      const value = name === "push" ? (checkArgs(fc, e, name, 1), elemValue(fc, e.args[0], elem, e)) : fc.cc.lib.construct(fc, elem, e.args, e).ev;
      return val(T_VOID, (fr) => heapPush(self(fr), value(fr)), line);
    }
    case "pop":
      return val(T_VOID, (fr) => {
        const q = self(fr);
        if (q.a.length === 0) emptyError("pop", line);
        heapPop(q);
      }, line);
    case "top":
      return val(withConst(elem), (fr) => {
        const q = self(fr);
        if (q.a.length === 0) emptyError("top", line);
        return q.a[0];
      }, line);
  }
  return null;
}

/* ------------------------------------ set ----------------------------------- */

function setMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const elem = t.args[0];
  const self = (fr: Frame) => ov(fr) as OSet;
  const itTy = iterTy(obj.ty);
  const multi = t.name === "multiset";
  guardConst(fc, obj, name, e, ["size", "empty", "find", "count", "contains", "begin", "end", "rbegin", "rend", "lower_bound", "upper_bound", "cbegin", "cend", "equal_range"]);
  const key = (i = 0) => fc.copyOf(fc.coerce(fc.expr(e.args[i], elem), elem, e, "init"), elem);
  const keyNoCopy = (i = 0) => fc.coerce(fc.expr(e.args[i], elem), elem, e, "init").ev;
  switch (name) {
    case "size":
      return val(T_SIZE, (fr) => self(fr).a.length, line);
    case "empty":
      return val(T_BOOL, (fr) => self(fr).a.length === 0, line);
    case "clear":
      return val(T_VOID, (fr) => void (self(fr).a = []), line);
    case "begin":
    case "cbegin":
      return val(itTy, (fr) => new It(self(fr), 0), line);
    case "end":
    case "cend":
      return val(itTy, (fr) => new It(self(fr), self(fr).a.length), line);
    case "rbegin":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), 0, null, true), line);
    case "rend":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), self(fr).a.length, null, true), line);
    case "insert":
    case "emplace": {
      if (e.args.length === 2 && strip(fc.typeOfExpr(e.args[0])).k === "iter") {
        const k = elemValue(fc, e.args[1], elem, e);
        return val(itTy, (fr) => {
          const s = self(fr);
          return new It(s, setInsert(s, k(fr)).index);
        }, line);
      }
      if (e.args.length === 2) {
        // insert(first, last)
        const a = fc.expr(e.args[0]).ev;
        const b = fc.expr(e.args[1]).ev;
        return val(T_VOID, (fr) => {
          const s = self(fr);
          for (const x of rangeElements(a(fr), b(fr), line)) setInsert(s, x);
        }, line);
      }
      checkArgs(fc, e, name, 1);
      const arg = e.args[0];
      if (name === "insert" && arg.k === "init" && !arg.type) {
        const list = fc.cc.lib.listInit(fc, { k: "std", name: "vector", args: [elem] }, arg.elems, e).ev;
        return val(T_VOID, (fr) => {
          const s = self(fr);
          for (const x of (list(fr) as Vec).a) setInsert(s, x);
        }, line);
      }
      const k = name === "emplace" ? fc.cc.lib.construct(fc, elem, e.args, e).ev : elemValue(fc, arg, elem, e);
      const resTy: Ty = multi ? itTy : pairOf(itTy, T_BOOL);
      return val(resTy, (fr) => {
        const s = self(fr);
        const r = setInsert(s, k(fr));
        return multi ? new It(s, r.index) : new Pair(new It(s, r.index), r.added);
      }, line);
    }
    case "erase": {
      checkArgs(fc, e, name, 1, 2);
      const first = fc.expr(e.args[0]);
      if (strip(first.ty).k === "iter") {
        const a = first.ev;
        const b = e.args.length > 1 ? fc.expr(e.args[1]).ev : null;
        return val(itTy, (fr) => {
          const s = self(fr);
          const i = (a(fr) as It).i;
          const j = b ? (b(fr) as It).i : i + 1;
          if (i < 0 || j > s.a.length) throw runtimeError("iterator-range", "erase with an iterator outside the set", line);
          s.a.splice(i, j - i);
          return new It(s, i);
        }, line);
      }
      const k = key();
      return val(T_SIZE, (fr) => {
        const s = self(fr);
        const x = k(fr);
        const lo = lowerBound(s.a, x, s.cmp);
        const hi = multi ? upperBound(s.a, x, s.cmp) : lo < s.a.length && s.cmp(s.a[lo], x) === 0 ? lo + 1 : lo;
        s.a.splice(lo, hi - lo);
        return hi - lo;
      }, line);
    }
    case "find": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(itTy, (fr) => {
        const s = self(fr);
        const x = k(fr);
        const i = lowerBound(s.a, x, s.cmp);
        return new It(s, i < s.a.length && s.cmp(s.a[i], x) === 0 ? i : s.a.length);
      }, line);
    }
    case "count": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(T_SIZE, (fr) => {
        const s = self(fr);
        const x = k(fr);
        return upperBound(s.a, x, s.cmp) - lowerBound(s.a, x, s.cmp);
      }, line);
    }
    case "contains": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(T_BOOL, (fr) => {
        const s = self(fr);
        const x = k(fr);
        const i = lowerBound(s.a, x, s.cmp);
        return i < s.a.length && s.cmp(s.a[i], x) === 0;
      }, line);
    }
    case "lower_bound":
    case "upper_bound": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      const lower = name === "lower_bound";
      return val(itTy, (fr) => {
        const s = self(fr);
        const x = k(fr);
        return new It(s, lower ? lowerBound(s.a, x, s.cmp) : upperBound(s.a, x, s.cmp));
      }, line);
    }
    case "equal_range": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(pairOf(itTy, itTy), (fr) => {
        const s = self(fr);
        const x = k(fr);
        return new Pair(new It(s, lowerBound(s.a, x, s.cmp)), new It(s, upperBound(s.a, x, s.cmp)));
      }, line);
    }
    case "swap": {
      const o = fc.expr(e.args[0]).ev;
      return val(T_VOID, (fr) => {
        const a = self(fr);
        const b = o(fr) as OSet;
        [a.a, b.a] = [b.a, a.a];
      }, line);
    }
  }
  return null;
}

/* ------------------------------------ map ------------------------------------ */

function mapMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const [kTy, vTy] = t.args;
  const pTy = pairOf(kTy, vTy);
  const self = (fr: Frame) => ov(fr) as OMap;
  const itTy = iterTy(obj.ty);
  const multi = t.name === "multimap";
  guardConst(fc, obj, name, e, ["size", "empty", "find", "count", "contains", "begin", "end", "rbegin", "rend", "lower_bound", "upper_bound", "at", "cbegin", "cend", "equal_range"]);
  const key = () => fc.copyOf(fc.coerce(fc.expr(e.args[0], kTy), kTy, e, "init"), kTy);
  const keyNoCopy = () => fc.coerce(fc.expr(e.args[0], kTy), kTy, e, "init").ev;
  switch (name) {
    case "size":
      return val(T_SIZE, (fr) => self(fr).a.length, line);
    case "empty":
      return val(T_BOOL, (fr) => self(fr).a.length === 0, line);
    case "clear":
      return val(T_VOID, (fr) => void (self(fr).a = []), line);
    case "begin":
    case "cbegin":
      return val(itTy, (fr) => new It(self(fr), 0), line);
    case "end":
    case "cend":
      return val(itTy, (fr) => new It(self(fr), self(fr).a.length), line);
    case "rbegin":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), 0, null, true), line);
    case "rend":
      return val(iterTy(obj.ty, true), (fr) => new It(self(fr), self(fr).a.length, null, true), line);
    case "at": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      const resTy = obj.ty.c ? withConst(vTy) : vTy;
      const find = (fr: Frame): Pair => {
        const m = self(fr);
        const x = k(fr);
        const i = lowerKey(m, x);
        if (i >= m.a.length || m.cmp(m.a[i].first, x) !== 0) throw runtimeError("out-of-range", "map::at: the key is not in the map", line);
        return m.a[i];
      };
      return { ty: resTy, ev: (fr) => find(fr).second, set: (fr, v) => void (find(fr).second = v), lv: (fr) => ({ get: () => find(fr).second, set: (v: any) => void (find(fr).second = v) }), line };
    }
    case "insert":
    case "emplace":
    case "try_emplace":
    case "insert_or_assign": {
      if (name === "insert" && e.args.length === 2) {
        const a = fc.expr(e.args[0]).ev;
        const b = fc.expr(e.args[1]).ev;
        return val(T_VOID, (fr) => {
          const m = self(fr);
          for (const p of rangeElements(a(fr), b(fr), line) as Pair[]) mapInsert(m, p.first, new Pair(p.first, p.second));
        }, line);
      }
      let make: (fr: Frame) => Pair;
      if (name === "emplace" || name === "try_emplace" || name === "insert_or_assign") {
        if (e.args.length < 1) fc.err("arg-count", `'${name}' needs a key`, e);
        const k = fc.copyOf(fc.coerce(fc.expr(e.args[0], kTy), kTy, e, "init"), kTy);
        const rest = e.args.slice(1);
        const v = name === "emplace" && rest.length === 1 ? elemValue(fc, rest[0], vTy, e) : name === "insert_or_assign" ? elemValue(fc, rest[0], vTy, e) : fc.cc.lib.construct(fc, vTy, rest, e).ev;
        make = (fr) => new Pair(k(fr), v(fr));
      } else {
        checkArgs(fc, e, name, 1);
        const arg = e.args[0];
        make = (() => {
          const value = elemValue(fc, arg, pTy, e);
          return (fr: Frame) => {
            const p = value(fr) as Pair;
            return new Pair(p.first, p.second);
          };
        })();
      }
      const overwrite = name === "insert_or_assign";
      const resTy: Ty = multi ? itTy : pairOf(itTy, T_BOOL);
      return val(resTy, (fr) => {
        const m = self(fr);
        const p = make(fr);
        const r = mapInsert(m, p.first, p);
        if (overwrite && !r.added) m.a[r.index].second = p.second;
        return multi ? new It(m, r.index) : new Pair(new It(m, r.index), r.added);
      }, line);
    }
    case "erase": {
      checkArgs(fc, e, name, 1, 2);
      const first = fc.expr(e.args[0]);
      if (strip(first.ty).k === "iter") {
        const a = first.ev;
        const b = e.args.length > 1 ? fc.expr(e.args[1]).ev : null;
        return val(itTy, (fr) => {
          const m = self(fr);
          const i = (a(fr) as It).i;
          const j = b ? (b(fr) as It).i : i + 1;
          if (i < 0 || j > m.a.length) throw runtimeError("iterator-range", "erase with an iterator outside the map", line);
          m.a.splice(i, j - i);
          return new It(m, i);
        }, line);
      }
      const k = key();
      return val(T_SIZE, (fr) => {
        const m = self(fr);
        const x = k(fr);
        const lo = lowerKey(m, x);
        const hi = multi ? upperKey(m, x) : lo < m.a.length && m.cmp(m.a[lo].first, x) === 0 ? lo + 1 : lo;
        m.a.splice(lo, hi - lo);
        return hi - lo;
      }, line);
    }
    case "find": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(itTy, (fr) => {
        const m = self(fr);
        const x = k(fr);
        const i = lowerKey(m, x);
        return new It(m, i < m.a.length && m.cmp(m.a[i].first, x) === 0 ? i : m.a.length);
      }, line);
    }
    case "count": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(T_SIZE, (fr) => {
        const m = self(fr);
        const x = k(fr);
        return upperKey(m, x) - lowerKey(m, x);
      }, line);
    }
    case "contains": {
      const k = keyNoCopy();
      return val(T_BOOL, (fr) => {
        const m = self(fr);
        const x = k(fr);
        const i = lowerKey(m, x);
        return i < m.a.length && m.cmp(m.a[i].first, x) === 0;
      }, line);
    }
    case "lower_bound":
    case "upper_bound": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      const lower = name === "lower_bound";
      return val(itTy, (fr) => {
        const m = self(fr);
        const x = k(fr);
        return new It(m, lower ? lowerKey(m, x) : upperKey(m, x));
      }, line);
    }
    case "swap": {
      const o = fc.expr(e.args[0]).ev;
      return val(T_VOID, (fr) => {
        const a = self(fr);
        const b = o(fr) as OMap;
        [a.a, b.a] = [b.a, a.a];
      }, line);
    }
  }
  return null;
}

/* ---------------------------- unordered containers ---------------------------- */

function hashMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const isMap = t.name.endsWith("map") || t.name.endsWith("multimap");
  const [kTy, vTy] = t.args;
  const elem: Ty = isMap ? pairOf(kTy, vTy) : kTy;
  const self = (fr: Frame) => ov(fr) as HMap | HSet;
  const itTy = iterTy(obj.ty);
  const endIt = (c: HMap | HSet) => new It(c, c.m.size, snapshotOf(c));
  guardConst(fc, obj, name, e, ["size", "empty", "find", "count", "contains", "begin", "end", "at", "cbegin", "cend"]);
  const keyNoCopy = () => fc.coerce(fc.expr(e.args[0], kTy), kTy, e, "init").ev;
  switch (name) {
    case "size":
      return val(T_SIZE, (fr) => self(fr).m.size, line);
    case "empty":
      return val(T_BOOL, (fr) => self(fr).m.size === 0, line);
    case "clear":
      return val(T_VOID, (fr) => self(fr).m.clear(), line);
    case "reserve":
    case "rehash":
      e.args.forEach((a) => fc.expr(a));
      return val(T_VOID, () => undefined, line);
    case "begin":
    case "cbegin":
      return val(itTy, (fr) => new It(self(fr), 0, snapshotOf(self(fr))), line);
    case "end":
    case "cend":
      return val(itTy, (fr) => endIt(self(fr)), line);
    case "at": {
      if (!isMap) return null;
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return { ty: obj.ty.c ? withConst(vTy) : vTy, ev: (fr) => {
        const h = self(fr) as HMap;
        const p = h.m.get(h.key(k(fr)));
        if (!p) throw runtimeError("out-of-range", "unordered_map::at: the key is not in the map", line);
        return p.second;
      }, line };
    }
    case "insert":
    case "emplace":
    case "try_emplace": {
      let make: (fr: Frame) => any;
      if (isMap && (name === "emplace" || name === "try_emplace")) {
        const k = fc.copyOf(fc.coerce(fc.expr(e.args[0], kTy), kTy, e, "init"), kTy);
        const rest = e.args.slice(1);
        const v = rest.length === 1 && name === "emplace" ? elemValue(fc, rest[0], vTy, e) : fc.cc.lib.construct(fc, vTy, rest, e).ev;
        make = (fr) => new Pair(k(fr), v(fr));
      } else if (name === "emplace") make = fc.cc.lib.construct(fc, elem, e.args, e).ev;
      else {
        checkArgs(fc, e, name, 1);
        make = elemValue(fc, e.args[0], elem, e);
      }
      const resTy: Ty = pairOf(itTy, T_BOOL);
      return val(resTy, (fr) => {
        const c = self(fr);
        const x = make(fr);
        const added = hashInsert(c, x);
        return new Pair(endIt(c), added);
      }, line);
    }
    case "erase": {
      checkArgs(fc, e, name, 1);
      const first = fc.expr(e.args[0]);
      if (strip(first.ty).k === "iter") {
        const a = first.ev;
        return val(itTy, (fr) => {
          const c = self(fr);
          const it = a(fr) as It;
          const item = it.snap![it.i];
          for (const [k, v] of c.m) if (v === item) {
            c.m.delete(k);
            break;
          }
          return new It(c, it.i, snapshotOf(c));
        }, line);
      }
      const k = keyNoCopy();
      return val(T_SIZE, (fr) => {
        const c = self(fr);
        const hk = c.key(k(fr));
        if (c instanceof HMap && c.multi) {
          let n = 0;
          for (const key of [...c.m.keys()]) if (key === hk || String(key).startsWith(`${String(hk)}\u0000`)) {
            c.m.delete(key);
            n++;
          }
          return n;
        }
        return c.m.delete(hk) ? 1 : 0;
      }, line);
    }
    case "find": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(itTy, (fr) => {
        const c = self(fr);
        const hk = c.key(k(fr));
        const snap = snapshotOf(c);
        const target = c.m.get(hk);
        if (target === undefined) return new It(c, snap.length, snap);
        return new It(c, snap.indexOf(target), snap);
      }, line);
    }
    case "count": {
      checkArgs(fc, e, name, 1);
      const k = keyNoCopy();
      return val(T_SIZE, (fr) => {
        const c = self(fr);
        const hk = c.key(k(fr));
        if (c instanceof HMap && c.multi) return [...c.m.keys()].filter((key) => key === hk || String(key).startsWith(`${String(hk)}\u0000`)).length;
        return c.m.has(hk) ? 1 : 0;
      }, line);
    }
    case "contains": {
      const k = keyNoCopy();
      return val(T_BOOL, (fr) => {
        const c = self(fr);
        return c.m.has(c.key(k(fr)));
      }, line);
    }
  }
  return null;
}

/* ---------------------------------- bitset ---------------------------------- */

function bitsetMethod(fc: FnCompiler, obj: CE, t: Extract<Ty, { k: "std" }>, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const self = (fr: Frame) => ov(fr) as Bits;
  const idx = () => numArg(fc, fc.expr(e.args[0]), e);
  const bound = (i: number, b: Bits): number => {
    if (i < 0 || i >= b.n) outOfRange("bitset", i, b.n, line);
    return i;
  };
  switch (name) {
    case "size":
      return val(T_SIZE, () => t.n ?? 0, line);
    case "count":
      return val(T_SIZE, (fr) => self(fr).b.filter(Boolean).length, line);
    case "any":
      return val(T_BOOL, (fr) => self(fr).b.some(Boolean), line);
    case "none":
      return val(T_BOOL, (fr) => !self(fr).b.some(Boolean), line);
    case "all":
      return val(T_BOOL, (fr) => self(fr).b.every(Boolean), line);
    case "test": {
      const i = idx();
      return val(T_BOOL, (fr) => {
        const b = self(fr);
        return b.b[bound(i(fr), b)];
      }, line);
    }
    case "set":
    case "reset":
    case "flip": {
      if (e.args.length === 0) {
        return val(obj.ty, (fr) => {
          const b = self(fr);
          for (let i = 0; i < b.n; i++) b.b[i] = name === "set" ? true : name === "reset" ? false : !b.b[i];
          return b;
        }, line);
      }
      const i = idx();
      const v = name === "set" && e.args.length > 1 ? fc.coerce(fc.expr(e.args[1]), T_BOOL, e, "cast").ev : null;
      return val(obj.ty, (fr) => {
        const b = self(fr);
        const k = bound(i(fr), b);
        b.b[k] = name === "set" ? (v ? v(fr) : true) : name === "reset" ? false : !b.b[k];
        return b;
      }, line);
    }
    case "to_string":
      return val(T_STR, (fr) => new CStr(self(fr).b.map((x) => (x ? "1" : "0")).reverse().join("")), line);
    case "to_ulong":
    case "to_ullong":
      return val({ k: "int", bits: 64, signed: false, name: "unsigned long" }, (fr) => {
        let x = 0n;
        const b = self(fr).b;
        for (let i = 0; i < b.length && i < 64; i++) if (b[i]) x |= 1n << BigInt(i);
        return x <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(x) : x;
      }, line);
  }
  return null;
}

export { It, T_INT, T_LONG, Tup, iterElemTy, sameType, tyStr, textArg, pairOf };
export type { Expr, Loc };
