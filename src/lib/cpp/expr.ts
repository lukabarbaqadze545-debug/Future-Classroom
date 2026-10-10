import type { Expr, Loc } from "./ast";
import { semanticError } from "./errors";
import { runtimeError } from "./errors";
import { Op, type CE, type ClassInfo, type FnInfo, type Frame } from "./core";
import type { FnCompiler } from "./fncompiler";
import { arithFn, compareFn, convertFn, needsClone, unaryFn } from "./conv";
import * as I from "./int64";
import { moveOut } from "./lifetime";
import { ElemPlace, Func, ObjPlace, SlotPlace, type Place } from "./values";
import {
  T_BOOL,
  T_CHAR,
  T_DOUBLE,
  T_FLOAT,
  T_INT,
  T_LL,
  T_LONG,
  T_NULLPTR,
  T_SIZE,
  T_ULL,
  T_ULONG,
  T_UINT,
  T_VOID,
  commonType,
  decay,
  isArithmetic,
  isClassLike,
  isFloating,
  isIntegral,
  isScalar,
  noConst,
  promote,
  ptrTo,
  sameType,
  strip,
  tyStr,
  withConst,
  type Ty,
} from "./types";

/** Expressions: from syntax to closures. */

const lit = (ty: Ty, v: any, line: number): CE => ({ ty, ev: () => v, cst: v, line });

export function compileExpr(fc: FnCompiler, e: Expr, hint?: Ty): CE {
  switch (e.k) {
    case "int":
      return intLiteral(e);
    case "float":
      return lit(e.f32 ? T_FLOAT : T_DOUBLE, e.f32 ? Math.fround(e.value) : e.value, e.line);
    case "char":
      return lit(T_CHAR, e.value, e.line);
    case "bool":
      return lit(T_BOOL, e.value, e.line);
    case "null":
      return { ty: T_NULLPTR, ev: () => null, cst: undefined, line: e.line };
    case "str": {
      const bytes = [...e.value].map((c) => c.charCodeAt(0));
      bytes.push(0);
      const text = e.value;
      const ty: Ty = { k: "ptr", to: withConst(T_CHAR) };
      return { ty, ev: () => new ElemPlace(bytes.slice(), 0), lit: text, line: e.line };
    }
    case "this": {
      if (!fc.thisCls) fc.err("this-outside", "'this' can only be used inside a member function", e);
      return { ty: { k: "ptr", to: fc.thisCls.ty }, ev: (fr) => new ObjPlace(fr[1], fc.assigner(fc.thisCls!.ty)), line: e.line };
    }
    case "id":
      return compileId(fc, e);
    case "unary":
      return compileUnary(fc, e);
    case "postfix":
      return compileIncDec(fc, e.e, e.op, false, e);
    case "binary":
      return compileBinary(fc, e);
    case "assign":
      return compileAssign(fc, e);
    case "cond":
      return compileCond(fc, e, hint);
    case "call":
      return compileCall(fc, e, hint);
    case "index":
      return compileIndex(fc, e);
    case "member":
      return compileMember(fc, e);
    case "cast":
      return compileCast(fc, e);
    case "construct": {
      const ty = fc.cc.resolveType(e.type, fc);
      return fc.constructObject(ty, e.args, e.brace, e);
    }
    case "sizeof":
      return compileSizeof(fc, e);
    case "new":
      return fc.cc.lib.newExpr(fc, e);
    case "delete":
      return fc.cc.lib.deleteExpr(fc, e);
    case "lambda":
      return fc.compileLambda(e, hint);
    case "init": {
      if (!hint && !e.type) fc.err("init-list-type", "a list in braces needs a type to initialise", e);
      const ty = e.type ? fc.cc.resolveType(e.type, fc) : hint!;
      return fc.cc.lib.listInit(fc, strip(ty), e.elems, e);
    }
    case "comma": {
      const l = fc.expr(e.l);
      const r = fc.expr(e.r);
      const lev = l.ev;
      const rev = r.ev;
      return { ...r, ev: (fr) => (lev(fr), rev(fr)), lv: undefined, set: undefined, cst: undefined, line: e.line };
    }
  }
}

function intLiteral(e: Extract<Expr, { k: "int" }>): CE {
  const v = e.value;
  const big = typeof v === "bigint" ? v : BigInt(v);
  let ty: Ty;
  if (e.long === 0 && !e.unsigned && big <= 2147483647n) ty = T_INT;
  else if (e.long === 0 && e.unsigned && big <= 4294967295n) ty = T_UINT;
  else if (e.long >= 2) ty = e.unsigned || big > I.INT64_MAX ? T_ULL : T_LL;
  else if (e.unsigned || big > I.INT64_MAX) ty = T_ULONG;
  else ty = T_LONG;
  return lit(ty, v, e.line);
}

/* --------------------------------- identifiers --------------------------------- */

function compileId(fc: FnCompiler, e: Extract<Expr, { k: "id" }>): CE {
  const cc = fc.cc;
  let name = e.name;
  const qualified = name.startsWith("std::");
  if (qualified) name = name.slice(5);
  // Local, captured and global variables (including enumerators)
  if (!qualified) {
    // `::x` means the global x, even when a local x hides it
    const v = e.global ? cc.globals.get(name) : fc.lookupVar(name);
    if (v) return fc.varCE(v, e);
    // Members of the current class
    if (fc.thisCls) {
      const cls = fc.thisCls;
      const f = cls.fieldMap.get(name);
      if (f && !f.isStatic) return fc.fieldCE((fr) => fr[1], name, f.ty, e);
      const st = findStatic(cls, name);
      if (st) return fc.varCE(st, e);
    }
    const fns = cc.funcs.get(name) ?? cc.funcTemplates.get(name);
    if (fns) {
      const all = [...(cc.funcs.get(name) ?? []), ...(cc.funcTemplates.get(name) ?? [])];
      return { ty: all[0].ret.k === "void" ? T_VOID : { k: "fn", ret: all[0].ret, params: all[0].params.map((p) => p.ty) }, ev: () => undefined, fn: all, line: e.line };
    }
    // Qualified user names: Color::Red, Counter::count, Class::staticMethod
    if (name.includes("::")) {
      const [cn, member] = splitLast(name);
      const cls = cc.classes.get(cn);
      if (cls) {
        const st = findStatic(cls, member);
        if (st) return fc.varCE(st, e);
        const ms = cls.methods.get(member);
        if (ms) return { ty: T_VOID, ev: () => undefined, fn: ms, line: e.line };
      }
    }
  }
  // The standard library
  const std = cc.lib.builtinValue(fc, name, e, qualified);
  if (std) return std;
  // Static data members of the current class declared later, or a member function used as a value
  return fc.err("undeclared", `'${e.name}' was not declared in this scope`, e, { name: e.name });
}

const splitLast = (s: string): [string, string] => {
  const i = s.lastIndexOf("::");
  return [s.slice(0, i), s.slice(i + 2)];
};

function findStatic(cls: ClassInfo, name: string) {
  for (let c: ClassInfo | undefined = cls; c; c = c.bases[0]) {
    const v = c.statics.get(name);
    if (v) return v;
  }
  return null;
}

/* ----------------------------------- unary ------------------------------------ */

function noteConst(fc: FnCompiler, ce: CE, at: Loc, what = "modify"): void {
  if (ce.ty.c) fc.err("assign-const", `cannot ${what} a const value`, at);
}

function compileUnary(fc: FnCompiler, e: Extract<Expr, { k: "unary" }>): CE {
  switch (e.op) {
    case "++":
    case "--":
      return compileIncDec(fc, e.e, e.op, true, e);
    case "&":
      return addressOf(fc, e);
    case "*":
      return deref(fc, e);
  }
  const x = fc.expr(e.e);
  const t = strip(x.ty);
  if (e.op === "!") {
    const b = fc.asBool(x, e);
    return fold({ ty: T_BOOL, ev: (fr) => !b(fr), line: e.line }, x.cst !== undefined);
  }
  // user-defined operator
  if (t.k === "cls") return userOperator(fc, `operator${e.op}`, [x], e);
  if (!isArithmetic(t)) return fc.err("bad-operand", `cannot apply '${e.op}' to ${tyStr(x.ty)}`, e, { op: e.op, type: tyStr(x.ty) });
  const pt = promote(t);
  const xc = fc.coerce(x, pt, e);
  if (e.op === "~" && !isIntegral(pt)) fc.err("bad-operand", `'~' needs an integer`, e);
  const f = unaryFn(e.op as "-" | "~" | "+", pt);
  const ev = xc.ev;
  if (!f) return fold({ ty: pt, ev, line: e.line }, xc.cst !== undefined);
  return fold({ ty: pt, ev: (fr) => f(ev(fr)), line: e.line }, xc.cst !== undefined);
}

/** Constants stay constants: evaluate the closure once at compile time. */
function fold(ce: CE, constant: boolean): CE {
  if (!constant) return ce;
  try {
    ce.cst = ce.ev([]);
  } catch {
    /* division by zero in a constant: leave it for run time */
  }
  return ce;
}

function addressOf(fc: FnCompiler, e: Extract<Expr, { k: "unary" }>): CE {
  if (e.e.k === "id") {
    // &function
    const maybe = fc.expr(e.e);
    if (maybe.fn && maybe.fn.length) return maybe;
  }
  const x = fc.expr(e.e);
  if (!x.lv) return fc.err("not-lvalue", "cannot take the address of a temporary value", e);
  const ty = ptrTo(x.ty);
  return { ty, ev: x.lv, line: e.line };
}

function deref(fc: FnCompiler, e: Extract<Expr, { k: "unary" }>): CE {
  const x = fc.expr(e.e);
  const t = strip(x.ty);
  if (t.k === "std" || t.k === "iter") {
    const r = fc.cc.lib.derefStd(fc, x, e);
    if (r) return r;
  }
  if (t.k !== "ptr" && t.k !== "arr") return fc.err("bad-deref", `cannot dereference ${tyStr(x.ty)}`, e, { type: tyStr(x.ty) });
  const to = t.k === "ptr" ? t.to : t.of;
  const ev = x.ev;
  const getPlace = t.k === "arr" ? (fr: Frame): Place => new ElemPlace(ev(fr), 0) : (fr: Frame): Place => {
    const p = ev(fr);
    if (p === null) throw runtimeError("null-deref", "dereferencing a null pointer", e.line);
    return p;
  };
  if (isClassLike(to)) {
    const assign = fc.assigner(to);
    return { ty: to, ev: (fr) => getPlace(fr).get(), lv: (fr) => getPlace(fr), set: (fr, v) => assign(getPlace(fr).get(), v), line: e.line };
  }
  return { ty: to, ev: (fr) => getPlace(fr).get(), lv: getPlace, set: (fr, v) => getPlace(fr).set(v), line: e.line };
}

/* ------------------------- increment and decrement ------------------------- */

const effectful = (e: Expr): boolean => {
  switch (e.k) {
    case "int":
    case "float":
    case "char":
    case "str":
    case "bool":
    case "id":
    case "this":
    case "null":
      return false;
    case "unary":
      return e.op === "++" || e.op === "--" || effectful(e.e);
    case "postfix":
    case "assign":
    case "call":
    case "new":
    case "delete":
      return true;
    case "binary":
      return effectful(e.l) || effectful(e.r);
    case "index":
      return effectful(e.e) || effectful(e.i);
    case "member":
      return effectful(e.e);
    case "cast":
      return effectful(e.e);
    case "cond":
      return effectful(e.c) || effectful(e.a) || effectful(e.b);
    case "comma":
      return true;
    default:
      return true;
  }
};

function compileIncDec(fc: FnCompiler, target: Expr, op: "++" | "--", prefix: boolean, at: Loc): CE {
  const x = fc.expr(target);
  if (!x.lv && !x.set) {
    // `--m.end()`: an iterator is an object, so even a temporary one can be stepped.
    const it = strip(x.ty);
    if (it.k === "iter") {
      const stepIt = fc.cc.lib.incIter(it, op === "++" ? 1 : -1);
      const ev = x.ev;
      return { ty: noConst(x.ty), ev: prefix ? (fr) => stepIt(ev(fr)) : ev, line: at.line };
    }
    return fc.err("not-lvalue", `'${op}' needs a variable`, at);
  }
  noteConst(fc, x, at, "change");
  const t = strip(x.ty);
  const dir = op === "++" ? 1 : -1;
  let step: (v: any) => any;
  if (t.k === "int" || t.k === "bool") {
    if (t.k === "bool") step = () => true;
    else {
      const ar = arithFn(dir === 1 ? "+" : "-", t.bits === 64 ? t : t.bits === 32 ? t : T_INT)!;
      const narrow = t.bits < 32 ? convertFn(T_INT, t) : null;
      step = narrow ? (v) => narrow(ar(v, 1)) : (v) => ar(v, 1);
    }
  } else if (t.k === "double" || t.k === "float") {
    step = t.k === "float" ? (v) => Math.fround(v + dir) : (v) => v + dir;
  } else if (t.k === "ptr") {
    step = (v: Place) => {
      if (!(v instanceof ElemPlace)) throw runtimeError("pointer-arith", "pointer arithmetic outside an array", at.line);
      return new ElemPlace(v.arr, v.i + dir);
    };
  } else if (t.k === "iter") {
    const r = fc.cc.lib.incIter(t, dir);
    step = r;
  } else if (t.k === "enum") {
    step = (v) => v + dir;
  } else return fc.err("bad-operand", `cannot apply '${op}' to ${tyStr(x.ty)}`, at, { op, type: tyStr(x.ty) });
  const ty = noConst(x.ty);
  // A target without side effects can be evaluated twice; otherwise go through its address once.
  if (!effectful(target) && x.set) {
    const ev = x.ev;
    const set = x.set;
    if (prefix) return { ty, ev: (fr) => {
      const n = step(ev(fr));
      set(fr, n);
      return n;
    }, lv: x.lv, set: x.set, line: at.line };
    return {
      ty,
      ev: (fr) => {
        const old = ev(fr);
        set(fr, step(old));
        return old;
      },
      line: at.line,
    };
  }
  const lv = x.lv!;
  if (prefix) return { ty, ev: (fr) => {
    const p = lv(fr);
    const n = step(p.get());
    p.set(n);
    return n;
  }, line: at.line };
  return {
    ty,
    ev: (fr) => {
      const p = lv(fr);
      const old = p.get();
      p.set(step(old));
      return old;
    },
    line: at.line,
  };
}

/* ----------------------------------- binary ----------------------------------- */

const ARITH_OPS = new Set(["+", "-", "*", "/", "%"]);
const BIT_OPS = new Set(["&", "|", "^", "<<", ">>"]);
const REL_OPS = new Set(["<", ">", "<=", ">="]);
const EQ_OPS = new Set(["==", "!="]);

function compileBinary(fc: FnCompiler, e: Extract<Expr, { k: "binary" }>): CE {
  if (e.op === "&&" || e.op === "||") return compileLogical(fc, e);
  const l = fc.expr(e.l);
  const lt = strip(l.ty);
  // Streams
  if (e.op === "<<" && (lt.k === "ostream" || lt.k === "sstream")) return fc.cc.lib.streamOut(fc, l, e.r, e);
  if (e.op === ">>" && (lt.k === "istream" || lt.k === "sstream")) return fc.cc.lib.streamIn(fc, l, e.r, e);
  const r = fc.expr(e.r);
  return binaryOp(fc, e.op, l, r, e);
}

export function binaryOp(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE {
  const lt = strip(l.ty);
  const rt = strip(r.ty);
  // User-defined operators on classes
  if (lt.k === "cls" || rt.k === "cls") {
    return userOperator(fc, `operator${op}`, [l, r], at);
  }
  // Library types: strings, containers, iterators, pairs…
  if (lt.k === "str" || rt.k === "str" || lt.k === "std" || rt.k === "std" || lt.k === "iter" || rt.k === "iter") {
    const viaLib = fc.cc.lib.binaryStd(fc, op, l, r, at);
    if (viaLib) return viaLib;
  }
  // Pointers
  if (lt.k === "ptr" || rt.k === "ptr" || lt.k === "arr" || rt.k === "arr" || lt.k === "nullptr" || rt.k === "nullptr") {
    const p = pointerOp(fc, op, l, r, at);
    if (p) return p;
  }
  // Function values compare with nullptr
  if ((lt.k === "fn" || rt.k === "fn") && EQ_OPS.has(op)) {
    const lev = l.ev;
    const rev = r.ev;
    const isNull = (c: CE) => strip(c.ty).k === "nullptr";
    if (isNull(l) || isNull(r)) {
      const f = lt.k === "fn" ? lev : rev;
      return { ty: T_BOOL, ev: op === "==" ? (fr) => f(fr) === null : (fr) => f(fr) !== null, line: at.line };
    }
  }
  if (!isArithmetic(lt) || !isArithmetic(rt)) {
    return fc.err("bad-operands", `invalid operands to '${op}' (${tyStr(l.ty)} and ${tyStr(r.ty)})`, at, { op, left: tyStr(l.ty), right: tyStr(r.ty) });
  }
  // Comparisons
  if (REL_OPS.has(op) || EQ_OPS.has(op)) {
    const ct = commonType(lt, rt);
    const lc = fc.coerce(l, ct, at, "cast");
    const rc = fc.coerce(r, ct, at, "cast");
    const cmp = compareFn(op);
    const a = lc.ev;
    const b = rc.ev;
    const ce: CE = { ty: T_BOOL, ev: smallCompare(op, a, b, cmp), line: at.line };
    return fold(ce, l.cst !== undefined && r.cst !== undefined);
  }
  if (op === "<<" || op === ">>") {
    if (!isIntegral(lt) || !isIntegral(rt)) return fc.err("bad-operands", `shifts need integers`, at);
    // The result has the (promoted) type of the left operand.
    const pt = promote(lt);
    const lc = fc.coerce(l, pt, at, "cast");
    const rc = fc.coerce(r, T_INT, at, "cast");
    const f = arithFn(op, pt)!;
    const a = lc.ev;
    const b = rc.ev;
    return fold({ ty: pt, ev: (fr) => f(a(fr), b(fr)), line: at.line }, l.cst !== undefined && r.cst !== undefined);
  }
  if (!ARITH_OPS.has(op) && !BIT_OPS.has(op)) return fc.err("bad-operands", `unknown operator '${op}'`, at);
  const ct = commonType(lt, rt);
  if ((op === "%" || BIT_OPS.has(op)) && isFloating(ct)) return fc.err("bad-operands", `invalid operands to '${op}' (${tyStr(l.ty)} and ${tyStr(r.ty)}): this operator needs integers`, at, { op, left: tyStr(l.ty), right: tyStr(r.ty) });
  const lc = fc.coerce(l, ct, at, "cast");
  const rc = fc.coerce(r, ct, at, "cast");
  const f = arithFn(op, ct)!;
  const a = lc.ev;
  const b = rc.ev;
  const ce: CE = { ty: ct, ev: fastArith(op, ct, a, b, f), line: at.line };
  return fold(ce, l.cst !== undefined && r.cst !== undefined);
}

/** Specialised closures for the hottest operations (int arithmetic on two operands). */
function fastArith(op: string, ct: Ty, a: (fr: Frame) => any, b: (fr: Frame) => any, f: (x: any, y: any) => any): (fr: Frame) => any {
  if (ct.k === "int" && ct.bits === 32 && ct.signed) {
    switch (op) {
      case "+":
        return (fr) => (a(fr) + b(fr)) | 0;
      case "-":
        return (fr) => (a(fr) - b(fr)) | 0;
      case "*":
        return (fr) => Math.imul(a(fr), b(fr));
    }
  }
  if (ct.k === "double") {
    switch (op) {
      case "+":
        return (fr) => a(fr) + b(fr);
      case "-":
        return (fr) => a(fr) - b(fr);
      case "*":
        return (fr) => a(fr) * b(fr);
      case "/":
        return (fr) => a(fr) / b(fr);
    }
  }
  return (fr) => f(a(fr), b(fr));
}

function smallCompare(op: string, a: (fr: Frame) => any, b: (fr: Frame) => any, cmp: (x: any, y: any) => boolean): (fr: Frame) => boolean {
  switch (op) {
    case "<":
      return (fr) => a(fr) < b(fr);
    case ">":
      return (fr) => a(fr) > b(fr);
    case "<=":
      return (fr) => a(fr) <= b(fr);
    case ">=":
      return (fr) => a(fr) >= b(fr);
    case "==":
      return (fr) => a(fr) === b(fr);
    case "!=":
      return (fr) => a(fr) !== b(fr);
  }
  return (fr) => cmp(a(fr), b(fr));
}

function pointerOp(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  const lt = strip(l.ty);
  const rt = strip(r.ty);
  const isPtr = (t: Ty) => t.k === "ptr" || t.k === "arr";
  const decayed = (c: CE): CE => (strip(c.ty).k === "arr" ? fc.coerce(c, ptrTo((strip(c.ty) as { of: Ty }).of), at, "cast") : c);
  if (EQ_OPS.has(op) || REL_OPS.has(op)) {
    if ((isPtr(lt) || lt.k === "nullptr") && (isPtr(rt) || rt.k === "nullptr")) {
      const a = decayed(l).ev;
      const b = decayed(r).ev;
      if (EQ_OPS.has(op)) {
        const same = samePlaceOrNull;
        return { ty: T_BOOL, ev: op === "==" ? (fr) => same(a(fr), b(fr)) : (fr) => !same(a(fr), b(fr)), line: at.line };
      }
      const cmp = compareFn(op);
      return { ty: T_BOOL, ev: (fr) => cmp(placeIndex(a(fr)), placeIndex(b(fr))), line: at.line };
    }
    return null;
  }
  if (op === "+" && ((isPtr(lt) && isIntegral(rt)) || (isIntegral(lt) && isPtr(rt)))) {
    const p = decayed(isPtr(lt) ? l : r);
    const n = fc.coerce(isPtr(lt) ? r : l, T_LONG, at, "cast").ev;
    const pe = p.ev;
    return { ty: p.ty, ev: (fr) => movePtr(pe(fr), I.toDouble(n(fr)), at.line), line: at.line };
  }
  if (op === "-" && isPtr(lt) && isIntegral(rt)) {
    const p = decayed(l);
    const n = fc.coerce(r, T_LONG, at, "cast").ev;
    const pe = p.ev;
    return { ty: p.ty, ev: (fr) => movePtr(pe(fr), -I.toDouble(n(fr)), at.line), line: at.line };
  }
  if (op === "-" && isPtr(lt) && isPtr(rt)) {
    const a = decayed(l).ev;
    const b = decayed(r).ev;
    return { ty: T_LONG, ev: (fr) => placeIndex(a(fr)) - placeIndex(b(fr)), line: at.line };
  }
  return null;
}

const samePlaceOrNull = (a: any, b: any): boolean => {
  if (a === null || b === null) return a === b;
  return samePlaceFn(a, b);
};

import { samePlace } from "./values";
const samePlaceFn = samePlace;

function placeIndex(p: any): number {
  if (p instanceof ElemPlace) return p.i;
  if (p === null) return 0;
  return 0;
}

function movePtr(p: any, n: number, line: number): any {
  if (p instanceof ElemPlace) return new ElemPlace(p.arr, p.i + n);
  if (p === null) throw runtimeError("null-deref", "pointer arithmetic on a null pointer", line);
  if (n === 0) return p;
  throw runtimeError("pointer-arith", "pointer arithmetic outside an array", line);
}

/** Short-circuit `&&` and `||`: when the right side needs calls, they must only run when it is evaluated. */
function compileLogical(fc: FnCompiler, e: Extract<Expr, { k: "binary" }>): CE {
  const l = fc.expr(e.l);
  const lb = fc.asBool(l, e);
  const { value: r, code } = fc.capture(() => fc.expr(e.r));
  const rb = fc.asBool(r, e);
  const isAnd = e.op === "&&";
  if (code.length === 0) {
    const ce: CE = { ty: T_BOOL, ev: isAnd ? (fr) => lb(fr) && rb(fr) : (fr) => lb(fr) || rb(fr), line: e.line };
    return fold(ce, l.cst !== undefined && r.cst !== undefined);
  }
  // The right side has hoisted calls: branch around them.
  const t = fc.tmp();
  const end = fc.label();
  fc.exec((fr) => void (fr[t] = lb(fr)), e);
  if (isAnd) fc.jf((fr) => fr[t], end);
  else fc.jt((fr) => fr[t], end);
  for (const ins of code) fc.out.push(ins);
  fc.exec((fr) => void (fr[t] = rb(fr)), e);
  fc.place(end);
  return { ty: T_BOOL, ev: (fr) => fr[t], line: e.line };
}

function compileCond(fc: FnCompiler, e: Extract<Expr, { k: "cond" }>, hint?: Ty): CE {
  const c = fc.expr(e.c);
  const cb = fc.asBool(c, e);
  const A = fc.capture(() => fc.expr(e.a, hint));
  const B = fc.capture(() => fc.expr(e.b, hint));
  const a = A.value;
  const b = B.value;
  const at = strip(a.ty);
  const bt = strip(b.ty);
  let ty: Ty;
  if (sameType(at, bt)) ty = noConst(at);
  else if (isArithmetic(at) && isArithmetic(bt)) ty = commonType(at, bt);
  else if (at.k === "nullptr" && bt.k === "ptr") ty = bt;
  else if (bt.k === "nullptr" && at.k === "ptr") ty = at;
  else if (at.k === "ptr" && bt.k === "ptr") ty = at;
  else if ((at.k === "str" && b.lit !== undefined) || (bt.k === "str" && a.lit !== undefined)) ty = { k: "str" };
  else if (a.lit !== undefined && b.lit !== undefined) ty = a.ty;
  else return fc.err("cond-types", `the two sides of '?:' have different types (${tyStr(a.ty)} and ${tyStr(b.ty)})`, e, { left: tyStr(a.ty), right: tyStr(b.ty) });
  const ac = fc.coerce(a, ty, e, "cast");
  const bc = fc.coerce(b, ty, e, "cast");
  const clone = needsClone(ty);
  const ae = clone ? fc.copyOf(ac, ty) : ac.ev;
  const be = clone ? fc.copyOf(bc, ty) : bc.ev;
  if (A.code.length === 0 && B.code.length === 0) {
    const ce: CE = { ty, ev: (fr) => (cb(fr) ? ae(fr) : be(fr)), line: e.line };
    if (a.lit !== undefined && b.lit !== undefined) ce.lit = undefined;
    // `cond ? a : b` where both are lvalues of the same type is an lvalue too.
    if (a.lv && b.lv && sameType(a.ty, b.ty)) {
      const al = a.lv;
      const bl = b.lv;
      ce.lv = (fr) => (cb(fr) ? al(fr) : bl(fr));
      const as = a.set;
      const bs = b.set;
      if (as && bs) ce.set = (fr, v) => (cb(fr) ? as(fr, v) : bs(fr, v));
    }
    return fold(ce, c.cst !== undefined && a.cst !== undefined && b.cst !== undefined);
  }
  const t = fc.tmp();
  const elseL = fc.label();
  const end = fc.label();
  fc.jf(cb, elseL);
  for (const ins of A.code) fc.out.push(ins);
  fc.exec((fr) => void (fr[t] = ae(fr)), e);
  fc.jmp(end);
  fc.place(elseL);
  for (const ins of B.code) fc.out.push(ins);
  fc.exec((fr) => void (fr[t] = be(fr)), e);
  fc.place(end);
  return { ty, ev: (fr) => fr[t], line: e.line };
}

/* ---------------------------------- assignment --------------------------------- */

function compileAssign(fc: FnCompiler, e: Extract<Expr, { k: "assign" }>): CE {
  const l = fc.expr(e.l);
  if (!l.lv && !l.set) return fc.err("not-lvalue", "the left side of '=' must be a variable, element or field", e);
  const lt = strip(l.ty);
  if (l.ty.c && !isClassLike(lt)) return fc.err("assign-const", "cannot assign to a const variable", e);
  if (l.ty.c) return fc.err("assign-const", "cannot assign to a const object", e);
  if (lt.k === "arr") return fc.err("assign-array", "an array cannot be assigned as a whole (use a loop, or a vector)", e);
  const ty = noConst(l.ty);
  if (e.op === "=" && l.tied) {
    // tie(a, b) = pair-or-tuple
    const rev = fc.expr(e.r).ev;
    const set = l.set!;
    return { ty, ev: (fr) => set(fr, rev(fr)), line: e.line };
  }
  if (e.op === "=") {
    const r = fc.expr(e.r, ty);
    // User-defined assignment operator
    if (lt.k === "cls") {
      const info = lt.cls.info as ClassInfo;
      const ops = info.methods.get("operator=");
      if (ops) return userOperator(fc, "operator=", [l, r], e);
    }
    const rc = fc.coerce(r, ty, e, "assign");
    if (lt.k === "cls") {
      // Member-wise assignment (a move empties the source afterwards).
      const info = lt.cls.info as ClassInfo;
      const rvalue = !!r.rv;
      const rev = rc.ev;
      const lev = l.ev;
      return { ty, ev: (fr) => {
        const src = rev(fr);
        const dst = lev(fr);
        info.copyInto!(dst, src);
        if (rvalue) moveOut(src, ty);
        return dst;
      }, lv: l.lv, set: l.set, line: e.line };
    }
    const value = fc.copyOf(rc, ty);
    const set = l.set!;
    if (isClassLike(lt)) {
      const ev = l.ev;
      return { ty, ev: (fr) => {
        const v = value(fr);
        set(fr, v);
        return ev(fr);
      }, lv: l.lv, set: l.set, line: e.line };
    }
    if (!effectful(e.l)) {
      return { ty, ev: (fr) => {
        const v = value(fr);
        set(fr, v);
        return v;
      }, lv: l.lv, set: l.set, line: e.line };
    }
    const lv = l.lv!;
    return { ty, ev: (fr) => {
      const p = lv(fr);
      const v = value(fr);
      p.set(v);
      return v;
    }, line: e.line };
  }
  // compound: a OP= b
  const op = e.op.slice(0, -1);
  const r = fc.expr(e.r);
  if (lt.k === "cls") return userOperator(fc, `operator${e.op}`, [l, r], e);
  if (lt.k === "str" || lt.k === "std" || lt.k === "iter") {
    const viaLib = fc.cc.lib.compoundStd(fc, op, l, r, e);
    if (viaLib) return viaLib;
  }
  if (lt.k === "ptr") {
    const p = pointerOp(fc, op, { ...l, lv: undefined }, r, e);
    if (!p) return fc.err("bad-operands", `invalid operands to '${e.op}'`, e);
    const set = l.set!;
    const pev = p.ev;
    return { ty, ev: (fr) => {
      const v = pev(fr);
      set(fr, v);
      return v;
    }, line: e.line };
  }
  if (!isArithmetic(lt)) return fc.err("bad-operands", `invalid operands to '${e.op}' (${tyStr(l.ty)} and ${tyStr(r.ty)})`, e);
  const rt = strip(r.ty);
  if (!isArithmetic(rt)) return fc.err("bad-operands", `invalid operands to '${e.op}' (${tyStr(l.ty)} and ${tyStr(r.ty)})`, e);
  const isShift = op === "<<" || op === ">>";
  const ct = isShift ? promote(lt) : commonType(lt, rt);
  if ((op === "%" || BIT_OPS.has(op)) && isFloating(ct)) return fc.err("bad-operands", `invalid operands to '${e.op}': this operator needs integers`, e);
  const f = arithFn(op, ct)!;
  const toC = convertFn(lt, ct);
  const fromC = convertFn(ct, ty);
  const rEv = fc.coerce(r, isShift ? T_INT : ct, e, "cast").ev;
  const step = (old: any, fr: Frame) => {
    const a = toC ? toC(old) : old;
    const v = f(a, rEv(fr));
    return fromC ? fromC(v) : v;
  };
  if (!effectful(e.l) && l.set) {
    const ev = l.ev;
    const set = l.set;
    // The commonest cases (`sum += x`, `i += 2` on ints) without the generic conversion layers.
    if (!toC && !fromC) {
      return { ty, ev: (fr) => {
        const v = f(ev(fr), rEv(fr));
        set(fr, v);
        return v;
      }, lv: l.lv, set: l.set, line: e.line };
    }
    return { ty, ev: (fr) => {
      const v = step(ev(fr), fr);
      set(fr, v);
      return v;
    }, lv: l.lv, set: l.set, line: e.line };
  }
  const lv = l.lv!;
  return { ty, ev: (fr) => {
    const p = lv(fr);
    const v = step(p.get(), fr);
    p.set(v);
    return v;
  }, line: e.line };
}

/* ------------------------------ operators on classes ------------------------------ */

/** `a OP b` for a class: a member operator of the left operand or a free function. */
export function userOperator(fc: FnCompiler, name: string, args: CE[], at: Loc): CE {
  const cc = fc.cc;
  const first = strip(args[0].ty);
  // member
  if (first.k === "cls") {
    const info = first.cls.info as ClassInfo;
    const ms = info.methods.get(name);
    if (ms) {
      const picked = fc.pickOverload(ms, args.slice(1), [], at, name);
      return fc.callResult(picked.fn, [args[0].ev, ...picked.args], at, picked.fn.isVirtual);
    }
  }
  const frees = cc.funcs.get(name);
  if (frees) {
    const picked = fc.pickOverload(frees, args, [], at, name);
    return fc.callResult(picked.fn, picked.args, at);
  }
  return fc.err("no-operator", `no '${name.replace("operator", "operator ")}' for ${args.map((a) => tyStr(a.ty)).join(" and ")}`, at, { op: name, types: args.map((a) => tyStr(a.ty)).join(", ") });
}

/* ------------------------------------- index ------------------------------------ */

function compileIndex(fc: FnCompiler, e: Extract<Expr, { k: "index" }>): CE {
  const base = fc.expr(e.e);
  const idx = fc.expr(e.i);
  const bt = strip(base.ty);
  if (bt.k === "cls") return userOperator(fc, "operator[]", [base, idx], e);
  if (bt.k === "std" || bt.k === "str") {
    const r = fc.cc.lib.indexStd(fc, base, idx, e);
    if (r) return r;
  }
  if (bt.k !== "arr" && bt.k !== "ptr") return fc.err("bad-index", `${tyStr(base.ty)} cannot be indexed with []`, e, { type: tyStr(base.ty) });
  const it = strip(idx.ty);
  if (!isIntegral(it)) return fc.err("bad-index", "an array index must be an integer", e);
  const ie = fc.coerce(idx, T_LONG, e, "cast").ev;
  const elem = bt.k === "arr" ? bt.of : bt.to;
  const line = e.line;
  const be = base.ev;
  const outOfRange = (i: number, n: number): never => {
    throw runtimeError("index-range", `index ${i} is outside the array (size ${n})`, line, { index: i, size: n });
  };
  const named = describe(e.e);
  if (bt.k === "arr") {
    const at = (fr: Frame): [any[], number] => {
      const a = be(fr);
      const i = ie(fr);
      const n = typeof i === "number" ? i : Number(i);
      if (n < 0 || n >= a.length) outOfRange(n, a.length);
      return [a, n];
    };
    void at;
    if (isClassLike(elem)) {
      const assign = fc.assigner(elem);
      return {
        ty: withConstIfElem(elem, base.ty),
        ev: (fr) => {
          const a = be(fr);
          const i = ie(fr) as number;
          if (i < 0 || i >= a.length) outOfRange(i, a.length);
          return a[i];
        },
        lv: (fr) => {
          const a = be(fr);
          const i = ie(fr) as number;
          if (i < 0 || i >= a.length) outOfRange(i, a.length);
          return new ObjPlace(a[i], assign);
        },
        set: (fr, v) => {
          const a = be(fr);
          const i = ie(fr) as number;
          if (i < 0 || i >= a.length) outOfRange(i, a.length);
          assign(a[i], v);
        },
        line,
      };
    }
    return {
      ty: withConstIfElem(elem, base.ty),
      ev: (fr) => {
        const a = be(fr);
        const i = ie(fr) as number;
        if (i < 0 || i >= a.length) outOfRange(i, a.length);
        const v = a[i];
        if (v === undefined) throw runtimeError("uninitialized", `'${named}[${i}]' was used before it was given a value`, line, { name: `${named}[${i}]` });
        return v;
      },
      lv: (fr) => {
        const a = be(fr);
        const i = ie(fr) as number;
        if (i < 0 || i >= a.length) outOfRange(i, a.length);
        return new ElemPlace(a, i);
      },
      set: (fr, v) => {
        const a = be(fr);
        const i = ie(fr) as number;
        if (i < 0 || i >= a.length) outOfRange(i, a.length);
        a[i] = v;
      },
      line,
    };
  }
  // pointer[i] = *(p + i)
  const place = (fr: Frame): ElemPlace => {
    const p = be(fr);
    const i = Number(ie(fr));
    if (p === null) throw runtimeError("null-deref", "indexing a null pointer", line);
    if (!(p instanceof ElemPlace)) throw runtimeError("pointer-arith", "indexing a pointer that does not point into an array", line);
    return new ElemPlace(p.arr, p.i + i);
  };
  if (isClassLike(elem)) {
    const assign = fc.assigner(elem);
    return { ty: elem, ev: (fr) => place(fr).get(), lv: (fr) => new ObjPlace(place(fr).get(), assign), set: (fr, v) => assign(place(fr).get(), v), line };
  }
  return { ty: elem, ev: (fr) => place(fr).get(), lv: place, set: (fr, v) => place(fr).set(v), line };
}

const withConstIfElem = (elem: Ty, container: Ty): Ty => (container.c ? withConst(elem) : elem);

function describe(e: Expr): string {
  if (e.k === "id") return e.name;
  if (e.k === "index") return `${describe(e.e)}[…]`;
  if (e.k === "member") return `${describe(e.e)}.${e.name}`;
  return "the array";
}

/* ------------------------------------ members ---------------------------------- */

function compileMember(fc: FnCompiler, e: Extract<Expr, { k: "member" }>): CE {
  const base = fc.expr(e.e);
  let bt = strip(base.ty);
  let obj = base.ev;
  if (e.arrow) {
    if (bt.k === "std" || bt.k === "iter") {
      const r = fc.cc.lib.arrowStd(fc, base, e.name, e);
      if (r) return r;
    }
    if (bt.k !== "ptr") return fc.err("bad-arrow", `'->' needs a pointer, not ${tyStr(base.ty)}`, e, { type: tyStr(base.ty) });
    const pe = base.ev;
    const line = e.line;
    obj = (fr) => {
      const p = pe(fr);
      if (p === null) throw runtimeError("null-deref", "using a null pointer", line);
      return p.get();
    };
    bt = strip(bt.to);
  } else if (bt.k === "ptr") {
    return fc.err("bad-dot", `'${e.name}' is accessed through a pointer: use -> instead of .`, e, { name: e.name });
  }
  if (bt.k === "cls") {
    const info = bt.cls.info as ClassInfo;
    const f = info.fieldMap.get(e.name);
    if (f && !f.isStatic) {
      if (f.access === "private" && fc.thisCls !== info && !(fc.thisCls && fc.isDerived(fc.thisCls, info))) fc.err("private", `'${e.name}' is private in ${info.name}`, e, { name: e.name, cls: info.name });
      const ty = base.ty.c ? withConst(f.ty) : f.ty;
      return fc.fieldCE(obj, e.name, ty, e);
    }
    const st = findStatic(info, e.name);
    if (st) return fc.varCE(st, e);
    if (info.methods.has(e.name)) return fc.err("method-value", `'${e.name}' is a function: call it with ()`, e, { name: e.name });
    return fc.err("no-member", `${info.name} has no member '${e.name}'`, e, { name: e.name, cls: info.name });
  }
  if (bt.k === "std" && bt.name === "pair" && (e.name === "first" || e.name === "second")) {
    const ty = bt.args[e.name === "first" ? 0 : 1];
    return fc.fieldCE(obj, e.name, base.ty.c ? withConst(ty) : ty, e);
  }
  return fc.err("no-member", `${tyStr(base.ty)} has no member '${e.name}'`, e, { name: e.name, cls: tyStr(base.ty) });
}

/* ------------------------------------- casts ------------------------------------ */

function compileCast(fc: FnCompiler, e: Extract<Expr, { k: "cast" }>): CE {
  const to = fc.cc.resolveType(e.type, fc);
  const x = fc.expr(e.e);
  const from = strip(x.ty);
  const target = strip(to);
  if (e.style === "reinterpret" || e.style === "const") {
    if (e.style === "reinterpret") return fc.err("unsupported-cast", "reinterpret_cast is not supported", e);
    return { ...x, ty: to };
  }
  if (target.k === "ptr" && from.k === "ptr") return { ...x, ty: to };
  if (target.k === "enum" && isIntegral(from)) {
    const c = fc.coerce(x, T_INT, e, "cast");
    return { ty: target, ev: c.ev, cst: c.cst, line: e.line };
  }
  if (target.k === "int" && from.k === "enum") return fc.coerce({ ...x, ty: T_INT }, target, e, "cast");
  if (target.k === "void") return { ty: T_VOID, ev: x.ev, line: e.line };
  const conv = fc.coerce(x, to, e, "cast");
  return { ...conv, ty: noConst(to) };
}

function compileSizeof(fc: FnCompiler, e: Extract<Expr, { k: "sizeof" }>): CE {
  let ty: Ty;
  if (e.type) ty = fc.cc.resolveType(e.type, fc);
  else ty = fc.typeOfExpr(e.e!);
  const n = sizeOfType(ty);
  if (n === null) {
    // sizeof an array whose size is known only at run time, or a library type
    return fc.err("sizeof", `sizeof(${tyStr(ty)}) is not supported`, e, { type: tyStr(ty) });
  }
  return lit(T_SIZE, n, e.line);
}

export function sizeOfType(ty: Ty): number | null {
  const t = strip(ty);
  switch (t.k) {
    case "bool":
      return 1;
    case "int":
      return t.bits / 8;
    case "enum":
      return 4;
    case "float":
      return 4;
    case "double":
      return 8;
    case "ptr":
    case "fn":
    case "nullptr":
      return 8;
    case "arr": {
      const n = sizeOfType(t.of);
      return n === null || t.n < 0 ? null : n * t.n;
    }
    case "str":
      return 32;
    case "std":
      if (t.name === "vector" || t.name === "deque") return t.name === "vector" ? 24 : 80;
      if (t.name === "pair") {
        const a = sizeOfType(t.args[0]);
        const b = sizeOfType(t.args[1]);
        if (a === null || b === null) return null;
        const al = Math.max(Math.min(a, 8), Math.min(b, 8));
        const sum = alignUp(a, Math.min(b, 8)) + b;
        return alignUp(sum, al);
      }
      if (t.name === "array") {
        const n = sizeOfType(t.args[0]);
        return n === null ? null : n * (t.n ?? 0);
      }
      return null;
    case "cls": {
      const info = t.cls.info as ClassInfo;
      let off = 0;
      let align = 1;
      for (const f of info.fields) {
        if (f.isStatic) continue;
        const s = sizeOfType(f.ty);
        if (s === null) return null;
        const a = Math.min(8, alignOf(f.ty));
        off = alignUp(off, a) + s;
        align = Math.max(align, a);
      }
      return Math.max(1, alignUp(off, align));
    }
  }
  return null;
}

function alignOf(ty: Ty): number {
  const t = strip(ty);
  if (t.k === "arr") return alignOf(t.of);
  if (t.k === "cls") return Math.max(1, ...(t.cls.info as ClassInfo).fields.filter((f) => !f.isStatic).map((f) => alignOf(f.ty)));
  const s = sizeOfType(t);
  return s === null ? 8 : Math.min(8, s);
}

const alignUp = (n: number, a: number) => Math.ceil(n / a) * a;

/* ------------------------------------- calls ------------------------------------ */

function compileCall(fc: FnCompiler, e: Extract<Expr, { k: "call" }>, hint?: Ty): CE {
  const callee = e.callee;
  if (callee.k === "member") return memberCall(fc, e, callee);
  if (callee.k === "id") return namedCall(fc, e, callee, hint);
  // (expr)(args): a lambda, a function pointer, a call that returns a function
  const f = fc.expr(callee);
  const args = e.args.map((a, i) => fc.expr(a, strip(f.ty).k === "fn" ? (strip(f.ty) as { params: Ty[] }).params[i] : undefined));
  if (strip(f.ty).k === "cls") return userOperator(fc, "operator()", [f, ...args], e);
  return fc.callValue(f, args, e);
}

function argHints(cands: FnInfo[], nargs: number): (Ty | undefined)[] {
  const out: (Ty | undefined)[] = [];
  for (let i = 0; i < nargs; i++) {
    const tys = cands.filter((c) => c.params.length > i).map((c) => c.params[i].ty);
    out.push(tys.length && tys.every((t) => sameType(t, tys[0])) ? tys[0] : undefined);
  }
  return out;
}

function compileArgs(fc: FnCompiler, exprs: Expr[], cands: FnInfo[]): CE[] {
  const hints = argHints(cands.filter((c) => c.params.length >= exprs.length || c.tparams.length), exprs.length);
  return exprs.map((a, i) => fc.expr(a, hints[i] && hints[i]!.k !== "tparam" ? hints[i] : undefined));
}

function namedCall(fc: FnCompiler, e: Extract<Expr, { k: "call" }>, callee: Extract<Expr, { k: "id" }>, hint?: Ty): CE {
  const cc = fc.cc;
  let name = callee.name;
  const qualified = name.startsWith("std::");
  if (qualified) name = name.slice(5);
  // A variable holding a function (lambda, pointer, std::function) shadows everything else.
  if (!qualified) {
    const v = fc.lookupVar(name);
    if (v) {
      const ce = fc.varCE(v, callee);
      const t = strip(ce.ty);
      if (t.k === "fn") {
        const args = e.args.map((a, i) => fc.expr(a, t.params[i]));
        return fc.callValue(ce, args, e);
      }
      if (t.k === "cls") {
        const args = e.args.map((a) => fc.expr(a));
        return userOperator(fc, "operator()", [ce, ...args], e);
      }
      return fc.err("not-callable", `'${name}' is not a function`, e, { name });
    }
    // Methods of the current class called without an object
    if (fc.thisCls) {
      const ms = findMethods(fc.thisCls, name);
      if (ms.length) {
        const argCEs = compileArgs(fc, e.args, ms);
        const picked = fc.pickOverload(ms, argCEs, e.args, e, name);
        if (picked.fn.isStatic) return fc.callResult(picked.fn, picked.args, e);
        return fc.callResult(picked.fn, [(fr) => fr[1], ...picked.args], e, picked.fn.isVirtual);
      }
    }
  }
  // User-defined functions
  const direct = cc.funcs.get(name);
  const templates = cc.funcTemplates.get(name);
  if ((direct || templates) && !(qualified && !direct && !templates)) {
    const cands = [...(direct ?? []), ...(templates ?? [])];
    const argCEs = compileArgs(fc, e.args, cands);
    fc.explicitTargs = callee.targs ? callee.targs.map((t) => cc.resolveType(t, fc)) : null;
    try {
      const picked = fc.pickOverload(cands, argCEs, e.args, e, name);
      return fc.callResult(picked.fn, picked.args, e);
    } finally {
      fc.explicitTargs = null;
    }
  }
  // Class::method(...) for static methods
  if (name.includes("::")) {
    const [cn, member] = splitLast(name);
    const cls = cc.classes.get(cn);
    const ms = cls?.methods.get(member);
    if (cls && ms) {
      const argCEs = compileArgs(fc, e.args, ms);
      const picked = fc.pickOverload(ms, argCEs, e.args, e, name);
      if (picked.fn.isStatic) return fc.callResult(picked.fn, picked.args, e);
      if (fc.thisCls) return fc.callResult(picked.fn, [(fr) => fr[1], ...picked.args], e);
      return fc.err("needs-object", `'${name}' needs an object`, e, { name });
    }
  }
  // The standard library
  const r = cc.lib.callBuiltin(fc, name, e, callee, qualified, hint);
  if (r) return r;
  return fc.err("undeclared", `'${callee.name}' was not declared in this scope`, e, { name: callee.name });
}

function findMethods(cls: ClassInfo, name: string): FnInfo[] {
  return cls.methods.get(name) ?? [];
}

function memberCall(fc: FnCompiler, e: Extract<Expr, { k: "call" }>, callee: Extract<Expr, { k: "member" }>): CE {
  // Class::staticMethod through an object is rare; handle objects, pointers and library types.
  const obj = fc.expr(callee.e);
  let t = strip(obj.ty);
  let objEv = obj.ev;
  if (callee.arrow) {
    if (t.k === "std" || t.k === "iter") {
      const r = fc.cc.lib.methodCall(fc, obj, callee.name, e, true);
      if (r) return r;
    }
    if (t.k !== "ptr") return fc.err("bad-arrow", `'->' needs a pointer, not ${tyStr(obj.ty)}`, e, { type: tyStr(obj.ty) });
    const pe = obj.ev;
    const line = e.line;
    objEv = (fr) => {
      const p = pe(fr);
      if (p === null) throw runtimeError("null-deref", "calling a function through a null pointer", line);
      return p.get();
    };
    t = strip(t.to);
  }
  if (t.k === "cls") {
    const info = t.cls.info as ClassInfo;
    const ms = findMethods(info, callee.name);
    if (!ms.length) {
      // a field holding a function: obj.f(x)
      const f = info.fieldMap.get(callee.name);
      if (f && strip(f.ty).k === "fn") {
        const fce = fc.fieldCE(objEv, callee.name, f.ty, e);
        return fc.callValue(fce, e.args.map((a) => fc.expr(a)), e);
      }
      return fc.err("no-member", `${info.name} has no member function '${callee.name}'`, e, { name: callee.name, cls: info.name });
    }
    const argCEs = compileArgs(fc, e.args, ms);
    const picked = fc.pickOverload(ms, argCEs, e.args, e, callee.name);
    if (obj.ty.c && !picked.fn.isConst && !picked.fn.isStatic) fc.err("const-method", `'${callee.name}' changes the object, but the object is const`, e, { name: callee.name });
    const fn = picked.fn;
    if (fn.access === "private" && fc.thisCls !== info && !(fc.thisCls && fc.isDerived(fc.thisCls, info))) fc.err("private", `'${callee.name}' is private in ${info.name}`, e, { name: callee.name, cls: info.name });
    if (fn.isStatic) return fc.callResult(fn, picked.args, e);
    return fc.callResult(fn, [objEv, ...picked.args], e, fn.isVirtual && info.hasVirtual);
  }
  const lib = fc.cc.lib.methodCall(fc, obj, callee.name, e, false);
  if (lib) return lib;
  return fc.err("no-member", `${tyStr(obj.ty)} has no member function '${callee.name}'`, e, { name: callee.name, cls: tyStr(obj.ty) });
}

export { Func, SlotPlace, T_CHAR, T_ULL, T_UINT, isScalar, decay, ptrTo, semanticError, Op };
