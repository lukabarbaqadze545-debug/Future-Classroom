import { runtimeError } from "./errors";
import * as I from "./int64";
import { formatExp, formatFixed, formatGeneral, pad } from "./format";
import type { ClassInfo } from "./core";
import { commonType, isArithmetic, isFloating, isIntegral, promote, strip, type Ty } from "./types";
import { Bits, CStr, Deq, ElemPlace, HMap, HSet, IStream, OMap, OSet, OStream, PQ, Pair, Tup, Vec, type Fmt, type Rt } from "./values";

/** Converting values between types, arithmetic by type, copying and printing. */

export type Conv = (v: any) => any;

/* ------------------------------- conversions ------------------------------ */

type IntTy = Extract<Ty, { k: "int" }>;

/** The int type underlying an integral type (bool and enums count as int for arithmetic). */

/**
 * How to turn a value of type `from` into `to`; null means "nothing to do",
 * undefined means there is no such conversion.
 */
export function convertFn(from: Ty, to: Ty): Conv | null | undefined {
  from = strip(from);
  to = strip(to);
  if (to.k === "bool") {
    if (from.k === "bool") return null;
    if (isIntegral(from) || isFloating(from)) return (v) => v !== 0;
    if (from.k === "ptr" || from.k === "fn") return (v) => v !== null;
    if (from.k === "nullptr") return () => false;
    if (from.k === "arr") return () => true;
    return undefined;
  }
  if (to.k === "int") {
    if (from.k === "bool") return (v) => I.toInt(v ? 1 : 0, to.bits, to.signed);
    if (from.k === "enum") return intToInt({ k: "int", bits: 32, signed: true, name: "int" }, to);
    if (from.k === "int") return intToInt(from, to);
    if (from.k === "float" || from.k === "double") return (v) => I.fromDouble(v, to.bits, to.signed);
    return undefined;
  }
  if (to.k === "enum") {
    if (from.k === "enum" && from.name === to.name) return null;
    return undefined;
  }
  if (to.k === "double" || to.k === "float") {
    const round = to.k === "float" ? Math.fround : null;
    if (from.k === "double" || from.k === "float") {
      if (to.k === from.k) return null;
      return round;
    }
    if (from.k === "bool") return (v) => (v ? 1 : 0);
    if (from.k === "int" || from.k === "enum") {
      const wide = from.k === "int" && from.bits === 64;
      if (round) return wide ? (v) => Math.fround(I.toDouble(v)) : (v) => Math.fround(v);
      return wide ? (v) => I.toDouble(v) : null;
    }
    return undefined;
  }
  if (to.k === "ptr") {
    if (from.k === "nullptr") return () => null;
    if (from.k === "ptr") return null;
    if (from.k === "arr") return (v) => new ElemPlace(v, 0);
    if (from.k === "int" && false) return null;
    return undefined;
  }
  if (to.k === "fn") {
    if (from.k === "fn" || from.k === "nullptr") return from.k === "nullptr" ? () => null : null;
    return undefined;
  }
  return undefined;
}

function intToInt(from: IntTy, to: IntTy): Conv | null {
  if (from.bits === to.bits && from.signed === to.signed) return null;
  if (to.bits === 64) {
    if (from.bits < 64) {
      // Every smaller value is exactly representable, except a negative one in an unsigned 64-bit type.
      if (to.signed || !from.signed) return null;
      return (v) => (v >= 0 ? v : I.wrapU64(BigInt(v)));
    }
    return (v) => I.toInt(v, 64, to.signed);
  }
  if (from.bits <= to.bits && (from.signed === to.signed || (!from.signed && to.bits > from.bits))) return null;
  return (v) => I.toInt(v, to.bits, to.signed);
}

/* ------------------------------ arithmetic ------------------------------- */

export type BinFn = (a: any, b: any) => any;

const divZero = () => runtimeError("div-zero", "division by zero", 0);

/** The function for `a OP b` where both operands already have type `t` (an arithmetic type after the usual conversions). */
export function arithFn(op: string, t: Ty): BinFn | null {
  if (t.k === "double" || t.k === "float") {
    const r = t.k === "float" ? Math.fround : (x: number) => x;
    switch (op) {
      case "+":
        return t.k === "float" ? (a, b) => r(a + b) : (a, b) => a + b;
      case "-":
        return t.k === "float" ? (a, b) => r(a - b) : (a, b) => a - b;
      case "*":
        return t.k === "float" ? (a, b) => r(a * b) : (a, b) => a * b;
      case "/":
        return t.k === "float" ? (a, b) => r(a / b) : (a, b) => a / b;
    }
    return null;
  }
  if (t.k !== "int") return null;
  if (t.bits === 32) {
    if (t.signed) {
      switch (op) {
        case "+":
          return (a, b) => (a + b) | 0;
        case "-":
          return (a, b) => (a - b) | 0;
        case "*":
          return (a, b) => Math.imul(a, b);
        case "/":
          return (a, b) => {
            if (b === 0) throw divZero();
            return (a / b) | 0;
          };
        case "%":
          return (a, b) => {
            if (b === 0) throw divZero();
            return (a % b) | 0;
          };
        case "&":
          return (a, b) => a & b;
        case "|":
          return (a, b) => a | b;
        case "^":
          return (a, b) => a ^ b;
        case "<<":
          return (a, b) => a << b;
        case ">>":
          return (a, b) => a >> b;
      }
    } else {
      switch (op) {
        case "+":
          return (a, b) => (a + b) >>> 0;
        case "-":
          return (a, b) => (a - b) >>> 0;
        case "*":
          return (a, b) => Math.imul(a, b) >>> 0;
        case "/":
          return (a, b) => {
            if (b === 0) throw divZero();
            return Math.floor(a / b);
          };
        case "%":
          return (a, b) => {
            if (b === 0) throw divZero();
            return a % b;
          };
        case "&":
          return (a, b) => (a & b) >>> 0;
        case "|":
          return (a, b) => (a | b) >>> 0;
        case "^":
          return (a, b) => (a ^ b) >>> 0;
        case "<<":
          return (a, b) => (a << b) >>> 0;
        case ">>":
          return (a, b) => a >>> b;
      }
    }
    return null;
  }
  // 64-bit
  if (t.signed) {
    switch (op) {
      case "+":
        return I.addS;
      case "-":
        return I.subS;
      case "*":
        return I.mulS;
      case "/":
        return (a, b) => {
          if (b === 0) throw divZero();
          return I.divS(a, b);
        };
      case "%":
        return (a, b) => {
          if (b === 0) throw divZero();
          return I.modS(a, b);
        };
      case "&":
      case "|":
      case "^":
      case "<<":
      case ">>":
        return (a, b) => I.bitS(op, a, b);
    }
  } else {
    switch (op) {
      case "+":
        return I.addU;
      case "-":
        return I.subU;
      case "*":
        return I.mulU;
      case "/":
        return (a, b) => {
          if (b === 0) throw divZero();
          return I.divU(a, b);
        };
      case "%":
        return (a, b) => {
          if (b === 0) throw divZero();
          return I.modU(a, b);
        };
      case "&":
      case "|":
      case "^":
      case "<<":
      case ">>":
        return (a, b) => I.bitU(op, a, b);
    }
  }
  return null;
}

/** `-a`, `~a` for a promoted type. */
export function unaryFn(op: "-" | "~" | "+", t: Ty): Conv | null {
  if (op === "+") return null;
  if (t.k === "double" || t.k === "float") return op === "-" ? (a) => -a : null;
  if (t.k !== "int") return null;
  if (t.bits === 32) {
    if (op === "-") return t.signed ? (a) => -a | 0 : (a) => -a >>> 0;
    return t.signed ? (a) => ~a : (a) => ~a >>> 0;
  }
  if (op === "-") return t.signed ? I.negS : (a) => I.wrapU64(-I.big(a));
  return t.signed ? I.notS : I.notU;
}

/** `a OP b` for comparisons, both operands already converted to the same arithmetic type. */
export function compareFn(op: string): (a: any, b: any) => boolean {
  switch (op) {
    case "<":
      return (a, b) => a < b;
    case ">":
      return (a, b) => a > b;
    case "<=":
      return (a, b) => a <= b;
    case ">=":
      return (a, b) => a >= b;
    case "==":
      return (a, b) => a === b;
    default:
      return (a, b) => a !== b;
  }
}

/** The common type of two arithmetic operands, or null if they are not both arithmetic. */
export function arithCommon(a: Ty, b: Ty): Ty | null {
  a = strip(a);
  b = strip(b);
  if (!isArithmetic(a) || !isArithmetic(b)) return null;
  return commonType(a, b);
}

export const promoted = promote;

/* ---------------------------- copying and defaults --------------------------- */

/** Does a value of this type need copying on assignment? (Numbers and pointers do not.) */
export function needsClone(t: Ty): boolean {
  t = strip(t);
  return t.k === "str" || t.k === "arr" || t.k === "cls" || (t.k === "std" && !["function", "less", "greater"].includes(t.name));
}

export function cloneFn(t: Ty, classes?: { clone: (c: any) => Conv }): Conv | null {
  t = strip(t);
  switch (t.k) {
    case "str":
      return (v: CStr) => new CStr(v.s);
    case "arr": {
      const inner = cloneFn(t.of, classes);
      return inner ? (v: any[]) => v.map(inner) : (v: any[]) => v.slice();
    }
    case "cls":
      return classes ? classes.clone(t.cls) : null;
    case "std": {
      const [a, b] = t.args;
      switch (t.name) {
        case "vector":
        case "array":
        case "deque": {
          const ca = cloneFn(a, classes);
          return ca ? (v: Vec) => new Vec(v.a.map(ca)) : (v: Vec) => new Vec(v.a.slice());
        }
        case "stack":
        case "queue": {
          const ca = cloneFn(a, classes);
          return (v: Deq) => new Deq(ca ? v.a.slice(v.head).map(ca) : v.a.slice(v.head), 0);
        }
        case "priority_queue": {
          const ca = cloneFn(a, classes);
          return (v: PQ) => new PQ(ca ? v.a.map(ca) : v.a.slice(), v.cmp);
        }
        case "pair": {
          const c1 = cloneFn(a, classes);
          const c2 = cloneFn(b, classes);
          return (v: Pair) => new Pair(c1 ? c1(v.first) : v.first, c2 ? c2(v.second) : v.second);
        }
        case "tuple": {
          const cs = t.args.map((x) => cloneFn(x, classes));
          return (v: Tup) => new Tup(v.e.map((x, i) => (cs[i] ? cs[i]!(x) : x)));
        }
        case "set":
        case "multiset": {
          const ca = cloneFn(a, classes);
          return (v: OSet) => new OSet(ca ? v.a.map(ca) : v.a.slice(), v.cmp, v.multi);
        }
        case "map":
        case "multimap": {
          const ck = cloneFn(a, classes);
          const cv = cloneFn(b, classes);
          return (v: OMap) => new OMap(v.a.map((p) => new Pair(ck ? ck(p.first) : p.first, cv ? cv(p.second) : p.second)), v.cmp, v.multi);
        }
        case "unordered_map":
        case "unordered_multimap": {
          const ck = cloneFn(a, classes);
          const cv = cloneFn(b, classes);
          return (v: HMap) => new HMap(new Map([...v.m].map(([k, p]) => [k, new Pair(ck ? ck(p.first) : p.first, cv ? cv(p.second) : p.second)])), v.key, v.multi);
        }
        case "unordered_set":
        case "unordered_multiset": {
          const ca = cloneFn(a, classes);
          return (v: HSet) => new HSet(new Map([...v.m].map(([k, x]) => [k, ca ? ca(x) : x])), v.key);
        }
        case "bitset":
          return (v: Bits) => new Bits(v.n, v.b.slice());
      }
      return null;
    }
  }
  return null;
}

/** Replaces the contents of `dst` with a copy of `src` (assignment of class-like values). */
export function assignInto(dst: any, src: any): void {
  if (dst === src) return;
  if (Array.isArray(dst)) {
    for (let i = 0; i < dst.length; i++) dst[i] = src[i];
    return;
  }
  Object.assign(dst, src);
}

/* --------------------------------- printing -------------------------------- */

const byteChar = (v: number) => String.fromCharCode(v & 255);

function intText(v: any, t: IntTy | { k: "bool" } | { k: "enum" }, f: Fmt): string {
  const n = typeof v === "boolean" ? (v ? 1 : 0) : v;
  let text: string;
  const neg = n < 0;
  const mag = neg ? (typeof n === "bigint" ? -n : -n) : n;
  if (f.base === 10) text = String(mag);
  else {
    // Hex and octal show the bit pattern of negative numbers (as an unsigned value of the type's width).
    let u: bigint = BigInt(n);
    if (neg) u = BigInt.asUintN(t.k === "int" ? t.bits : 32, u);
    text = u.toString(f.base === 16 ? 16 : 8);
    if (f.showbase && u !== 0n) text = (f.base === 16 ? "0x" : "0") + text;
    if (f.uppercase) text = text.toUpperCase();
    return text;
  }
  if (neg) return `-${text}`;
  return f.showpos ? `+${text}` : text;
}

export function formatDouble(x: number, f: Fmt): string {
  if (f.fixed && !f.scientific) return formatFixed(x, f.precision, f.showpoint) + (f.showpos && x >= 0 ? "" : "");
  if (f.scientific && !f.fixed) return formatExp(x, f.precision, f.uppercase, f.showpoint);
  return formatGeneral(x, f.precision, f.uppercase, f.showpoint);
}

/** Writes `text` honouring width and fill, then resets the width (as streams do). */
export function emit(os: OStream, text: string, numeric: boolean): void {
  const f = os.fmt;
  if (f.width > 0 && text.length < f.width) {
    if (f.left) text = pad(text, f.width, true, f.fill);
    else if (numeric && f.fill === "0" && /^[+-]/.test(text)) text = text[0] + pad(text.slice(1), f.width - 1, false, "0");
    else text = pad(text, f.width, false, f.fill);
  }
  f.width = 0;
  os.write(text);
}

/** Text of a value of type `t` as `cout << v` prints it. */
export function printFn(t: Ty): ((os: OStream, v: any) => void) | null {
  t = strip(t);
  switch (t.k) {
    case "bool":
      return (os, v) => emit(os, os.fmt.boolalpha ? (v ? "true" : "false") : intText(v, t, os.fmt), true);
    case "int":
      if (t.ch) return (os, v) => emit(os, byteChar(v), false);
      return (os, v) => emit(os, intText(v, t, os.fmt), true);
    case "enum":
      return (os, v) => emit(os, intText(v, t, os.fmt), true);
    case "float":
    case "double":
      return (os, v) => {
        let text = formatDouble(v, os.fmt);
        if (os.fmt.showpos && v >= 0 && !text.startsWith("-")) text = `+${text}`;
        emit(os, text, true);
      };
    case "str":
      return (os, v: CStr) => emit(os, v.s, false);
    case "ptr":
      if (t.to.k === "int" && t.to.ch) return (os, v) => emit(os, cstringOf(v), false);
      return (os, v) => emit(os, v === null ? "0" : "0x7ffd1000", false);
    case "nullptr":
      return (os) => emit(os, "0", false);
    case "std":
      if (t.name === "bitset") return (os, v: Bits) => emit(os, v.b.map((x) => (x ? "1" : "0")).reverse().join(""), false);
      return null;
    case "arr":
      // a char array prints as text up to its terminating zero; any other array prints as an address
      if (t.of.k === "int" && t.of.ch) return (os, v: any[]) => emit(os, cstringOf(new ElemPlace(v, 0)), false);
      return (os) => emit(os, "0x7ffd1000", false);
  }
  return null;
}

/** The text of a C string held in a char array (up to the terminating zero). */
export function cstringOf(p: any): string {
  if (p === null) throw runtimeError("null-deref", "printing a null pointer as text", 0);
  if (typeof p === "string") return p;
  if (p instanceof ElemPlace) {
    let s = "";
    for (let i = p.i; i < p.arr.length; i++) {
      const c = p.arr[i];
      if (c === 0 || c === undefined) break;
      s += byteChar(c);
    }
    return s;
  }
  return "";
}

/* ---------------------------------- reading --------------------------------- */

const isSpace = (c: number) => c === 32 || (c >= 9 && c <= 13);

export function skipSpace(is: IStream): void {
  const d = is.data;
  while (is.pos < d.length && isSpace(d.charCodeAt(is.pos))) is.pos++;
}

/** `cin >> integer`: sets failbit and gives 0 when there is no number (as C++11 does). */
export function readInteger(is: IStream, bits: 8 | 16 | 32 | 64, signed: boolean): any {
  if (is.failed) return undefined;
  skipSpace(is);
  const d = is.data;
  const start = is.pos;
  let i = start;
  if (i < d.length && (d[i] === "+" || d[i] === "-")) i++;
  const digits = i;
  while (i < d.length && d[i] >= "0" && d[i] <= "9") i++;
  if (i === digits) {
    is.failed = true;
    if (is.pos >= d.length) return undefined;
    return 0;
  }
  is.pos = i;
  const text = d.slice(start, i);
  const b = BigInt(text);
  const lo = signed ? -(1n << BigInt(bits - 1)) : 0n;
  const hi = signed ? (1n << BigInt(bits - 1)) - 1n : (1n << BigInt(bits)) - 1n;
  if (b < lo || b > hi) {
    is.failed = true;
    return signed ? (b < lo ? I.toInt(Number(lo), bits, signed) : bits === 64 ? I.wrapS64(hi) : Number(hi)) : bits === 64 ? I.wrapU64(hi) : Number(hi);
  }
  return bits === 64 ? (b >= -9007199254740991n && b <= 9007199254740991n ? Number(b) : b) : Number(b);
}

export function readDouble(is: IStream): any {
  if (is.failed) return undefined;
  skipSpace(is);
  const d = is.data;
  const m = /^[+-]?(?:inf(?:inity)?|nan|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/i.exec(d.slice(is.pos, is.pos + 64));
  if (!m) {
    is.failed = true;
    return is.pos >= d.length ? undefined : 0;
  }
  is.pos += m[0].length;
  return Number(m[0].replace(/^\+/, "").replace(/^(-?)inf(inity)?$/i, "$1Infinity").replace(/nan/i, "NaN"));
}

/** `cin >> string`: one word. */
export function readWord(is: IStream): string | undefined {
  if (is.failed) return undefined;
  skipSpace(is);
  const d = is.data;
  if (is.pos >= d.length) {
    is.failed = true;
    return undefined;
  }
  const start = is.pos;
  while (is.pos < d.length && !isSpace(d.charCodeAt(is.pos))) is.pos++;
  return d.slice(start, is.pos);
}

export function readChar(is: IStream): number | undefined {
  if (is.failed) return undefined;
  skipSpace(is);
  if (is.pos >= is.data.length) {
    is.failed = true;
    return undefined;
  }
  return (is.data.charCodeAt(is.pos++) << 24) >> 24;
}

/** `getline(cin, s)`: up to the newline, which is consumed; fails at the end of the input. */
export function readLine(is: IStream, delim = "\n"): string | undefined {
  if (is.pos >= is.data.length) {
    is.failed = true;
    return undefined;
  }
  const d = is.data;
  const end = d.indexOf(delim, is.pos);
  let line: string;
  if (end === -1) {
    line = d.slice(is.pos);
    is.pos = d.length;
  } else {
    line = d.slice(is.pos, end);
    is.pos = end + 1;
  }
  return line;
}

export type { ClassInfo, Rt };
