import type { Loc } from "../ast";
import { runtimeError } from "../errors";
import type { CE, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { cstringOf } from "../conv";
import { formatFixed } from "../format";
import * as I from "../int64";
import { CStr, ElemPlace } from "../values";
import { T_BOOL, T_CHAR, T_DOUBLE, T_INT, T_LL, T_LONG, T_ULONG, T_SIZE, T_STR, T_VOID, isFloating, isIntegral, strip, tyStr, type Ty } from "../types";
import { checkArgs, numArg, val, type Call } from "./helpers";
import { CharPlace, It, charAt } from "./iter";

/** std::string, C strings and character functions. */

/** `std::string::npos` */
export const NPOS: I.I64 = 18446744073709551615n;

const T_CHAR_CONST = T_CHAR;
const isChar = (t: Ty): boolean => t.k === "int" && !!t.ch;

/** What an argument means as text: a string, a literal, a char pointer or a single character. */
export function textArg(fc: FnCompiler, ce: CE, at: Loc): (fr: Frame) => string {
  const t = strip(ce.ty);
  const ev = ce.ev;
  if (ce.lit !== undefined) {
    const text = ce.lit;
    return () => text;
  }
  if (t.k === "str") return (fr) => (ev(fr) as CStr).s;
  if (t.k === "ptr" && isChar(strip(t.to))) return (fr) => cstringOf(ev(fr));
  if (t.k === "arr" && isChar(strip(t.of))) return (fr) => cstringOf(new ElemPlace(ev(fr), 0));
  if (isChar(t)) return (fr) => String.fromCharCode(ev(fr) & 255);
  return fc.err("bad-argument", `${tyStr(ce.ty)} cannot be used as text here`, at, { type: tyStr(ce.ty) });
}

function checkPos(pos: number, size: number, line: number): void {
  if (pos < 0 || pos > size) throw runtimeError("index-range", `position ${pos} is outside the string (size ${size})`, line, { index: pos, size, kind: "string" });
}

/** Methods of std::string. */
export function stringMethod(fc: FnCompiler, obj: CE, name: string, e: Call): CE | null {
  const ov = obj.ev;
  const line = e.line;
  const self = (fr: Frame) => ov(fr) as CStr;
  const mutating = !["size", "length", "empty", "substr", "find", "rfind", "find_first_of", "find_last_of", "find_first_not_of", "find_last_not_of", "compare", "c_str", "data", "front", "back", "at", "begin", "end", "rbegin", "rend", "cbegin", "cend", "capacity", "max_size", "starts_with", "ends_with", "contains", "copy"].includes(name);
  if (mutating && obj.ty.c) fc.err("const-method", `'${name}' changes the string, but the string is const`, e, { name });
  const noArgs = () => checkArgs(fc, e, name, 0);
  switch (name) {
    case "size":
    case "length":
      noArgs();
      return val(T_SIZE, (fr) => self(fr).s.length, line);
    case "max_size":
      noArgs();
      return val(T_SIZE, () => 4611686018427387903n, line);
    case "capacity":
      noArgs();
      return val(T_SIZE, (fr) => Math.max(15, self(fr).s.length), line);
    case "empty":
      noArgs();
      return val(T_BOOL, (fr) => self(fr).s.length === 0, line);
    case "clear":
      noArgs();
      return val(T_VOID, (fr) => void (self(fr).s = ""), line);
    case "reserve":
    case "shrink_to_fit":
      e.args.forEach((a) => fc.expr(a));
      return val(T_VOID, () => undefined, line);
    case "c_str":
    case "data": {
      noArgs();
      return val({ k: "ptr", to: T_CHAR_CONST }, (fr) => {
        const s = self(fr).s;
        const a = new Array(s.length + 1);
        for (let i = 0; i < s.length; i++) a[i] = charAt(s, i);
        a[s.length] = 0;
        return new ElemPlace(a, 0);
      }, line);
    }
    case "push_back": {
      checkArgs(fc, e, name, 1);
      const c = fc.coerce(fc.expr(e.args[0]), T_CHAR, e, "cast").ev;
      return val(T_VOID, (fr) => void (self(fr).s += String.fromCharCode(c(fr) & 255)), line);
    }
    case "pop_back":
      noArgs();
      return val(T_VOID, (fr) => {
        const s = self(fr);
        if (s.s.length === 0) throw runtimeError("empty", "pop_back on an empty string", line, { what: "pop_back" });
        s.s = s.s.slice(0, -1);
      }, line);
    case "front":
    case "back": {
      noArgs();
      const front = name === "front";
      return {
        ty: T_CHAR,
        ev: (fr) => {
          const s = self(fr).s;
          if (s.length === 0) throw runtimeError("empty", `${name} on an empty string`, line, { what: name });
          return charAt(s, front ? 0 : s.length - 1);
        },
        lv: (fr) => new CharPlace(self(fr), front ? 0 : self(fr).s.length - 1),
        set: (fr, v) => new CharPlace(self(fr), front ? 0 : self(fr).s.length - 1).set(v),
        line,
      };
    }
    case "at": {
      checkArgs(fc, e, name, 1);
      const i = numArg(fc, fc.expr(e.args[0]), e);
      return {
        ty: T_CHAR,
        ev: (fr) => {
          const s = self(fr).s;
          const k = i(fr);
          if (k < 0 || k >= s.length) throw runtimeError("index-range", `index ${k} is outside the string (size ${s.length})`, line, { index: k, size: s.length, kind: "string" });
          return charAt(s, k);
        },
        lv: (fr) => new CharPlace(self(fr), i(fr)),
        set: (fr, v) => new CharPlace(self(fr), i(fr)).set(v),
        line,
      };
    }
    case "append":
    case "assign": {
      checkArgs(fc, e, name, 1, 3);
      const set = name === "assign";
      if (e.args.length === 2 && isIntegral(strip(fc.typeOfExpr(e.args[0])))) {
        const n = numArg(fc, fc.expr(e.args[0]), e);
        const c = fc.coerce(fc.expr(e.args[1]), T_CHAR, e, "cast").ev;
        return val(T_STR, (fr) => {
          const s = self(fr);
          const add = String.fromCharCode(c(fr) & 255).repeat(Math.max(0, n(fr)));
          s.s = set ? add : s.s + add;
          return s;
        }, line);
      }
      const text = textArg(fc, fc.expr(e.args[0]), e);
      const pos = e.args.length > 1 ? numArg(fc, fc.expr(e.args[1]), e) : null;
      const len = e.args.length > 2 ? numArg(fc, fc.expr(e.args[2]), e) : null;
      return val(T_STR, (fr) => {
        const s = self(fr);
        let add = text(fr);
        if (pos) {
          const p = pos(fr);
          checkPos(p, add.length, line);
          add = add.slice(p, len ? p + len(fr) : undefined);
        }
        s.s = set ? add : s.s + add;
        return s;
      }, line);
    }
    case "insert": {
      checkArgs(fc, e, name, 2, 3);
      const first = fc.expr(e.args[0]);
      if (strip(first.ty).k === "iter") {
        const ev = first.ev;
        const second = fc.expr(e.args[1]);
        const c = textArg(fc, second, e);
        return val(T_STR, (fr) => {
          const s = self(fr);
          const it = ev(fr) as It;
          s.s = s.s.slice(0, it.i) + c(fr) + s.s.slice(it.i);
          return s;
        }, line);
      }
      const pos = numArg(fc, first, e);
      if (e.args.length === 3) {
        const n = numArg(fc, fc.expr(e.args[1]), e);
        const c = fc.coerce(fc.expr(e.args[2]), T_CHAR, e, "cast").ev;
        return val(T_STR, (fr) => {
          const s = self(fr);
          const p = pos(fr);
          checkPos(p, s.s.length, line);
          s.s = s.s.slice(0, p) + String.fromCharCode(c(fr) & 255).repeat(n(fr)) + s.s.slice(p);
          return s;
        }, line);
      }
      const text = textArg(fc, fc.expr(e.args[1]), e);
      return val(T_STR, (fr) => {
        const s = self(fr);
        const p = pos(fr);
        checkPos(p, s.s.length, line);
        s.s = s.s.slice(0, p) + text(fr) + s.s.slice(p);
        return s;
      }, line);
    }
    case "erase": {
      checkArgs(fc, e, name, 0, 2);
      if (e.args.length >= 1) {
        const first = fc.expr(e.args[0]);
        if (strip(first.ty).k === "iter") {
          const a = first.ev;
          const b = e.args.length > 1 ? fc.expr(e.args[1]).ev : null;
          return val({ k: "iter", of: T_STR }, (fr) => {
            const s = self(fr);
            const i = (a(fr) as It).i;
            const j = b ? (b(fr) as It).i : i + 1;
            s.s = s.s.slice(0, i) + s.s.slice(j);
            return new It(s, i);
          }, line);
        }
      }
      const pos = e.args.length > 0 ? numArg(fc, fc.expr(e.args[0]), e) : () => 0;
      const len = e.args.length > 1 ? numArg(fc, fc.expr(e.args[1]), e) : null;
      return val(T_STR, (fr) => {
        const s = self(fr);
        const p = pos(fr);
        checkPos(p, s.s.length, line);
        s.s = s.s.slice(0, p) + (len ? s.s.slice(p + len(fr)) : "");
        return s;
      }, line);
    }
    case "replace": {
      checkArgs(fc, e, name, 3, 3);
      const pos = numArg(fc, fc.expr(e.args[0]), e);
      const len = numArg(fc, fc.expr(e.args[1]), e);
      const text = textArg(fc, fc.expr(e.args[2]), e);
      return val(T_STR, (fr) => {
        const s = self(fr);
        const p = pos(fr);
        checkPos(p, s.s.length, line);
        s.s = s.s.slice(0, p) + text(fr) + s.s.slice(p + len(fr));
        return s;
      }, line);
    }
    case "substr": {
      checkArgs(fc, e, name, 0, 2);
      const pos = e.args.length > 0 ? numArg(fc, fc.expr(e.args[0]), e) : () => 0;
      const len = e.args.length > 1 ? numArg(fc, fc.expr(e.args[1]), e) : null;
      return val(T_STR, (fr) => {
        const s = self(fr).s;
        const p = pos(fr);
        if (p < 0 || p > s.length) throw runtimeError("index-range", `substr: position ${p} is outside the string (size ${s.length})`, line, { index: p, size: s.length, kind: "string" });
        return new CStr(len ? s.slice(p, p + Math.max(0, len(fr))) : s.slice(p));
      }, line);
    }
    case "resize": {
      checkArgs(fc, e, name, 1, 2);
      const n = numArg(fc, fc.expr(e.args[0]), e);
      const c = e.args.length > 1 ? fc.coerce(fc.expr(e.args[1]), T_CHAR, e, "cast").ev : () => 0;
      return val(T_VOID, (fr) => {
        const s = self(fr);
        const k = n(fr);
        s.s = k <= s.s.length ? s.s.slice(0, k) : s.s + String.fromCharCode(c(fr) & 255).repeat(k - s.s.length);
      }, line);
    }
    case "swap": {
      checkArgs(fc, e, name, 1);
      const other = fc.expr(e.args[0]).ev;
      return val(T_VOID, (fr) => {
        const a = self(fr);
        const b = other(fr) as CStr;
        const t = a.s;
        a.s = b.s;
        b.s = t;
      }, line);
    }
    case "compare": {
      checkArgs(fc, e, name, 1);
      const t = textArg(fc, fc.expr(e.args[0]), e);
      return val(T_INT, (fr) => {
        const a = self(fr).s;
        const b = t(fr);
        return a < b ? -1 : a > b ? 1 : 0;
      }, line);
    }
    case "starts_with":
    case "ends_with":
    case "contains": {
      checkArgs(fc, e, name, 1);
      const t = textArg(fc, fc.expr(e.args[0]), e);
      return val(T_BOOL, (fr) => {
        const a = self(fr).s;
        const b = t(fr);
        return name === "starts_with" ? a.startsWith(b) : name === "ends_with" ? a.endsWith(b) : a.includes(b);
      }, line);
    }
    case "find":
    case "rfind":
    case "find_first_of":
    case "find_last_of":
    case "find_first_not_of":
    case "find_last_not_of": {
      checkArgs(fc, e, name, 1, 3);
      const t = textArg(fc, fc.expr(e.args[0]), e);
      const pos = e.args.length > 1 ? numArg(fc, fc.expr(e.args[1]), e) : null;
      const count = e.args.length > 2 ? numArg(fc, fc.expr(e.args[2]), e) : null;
      return val(T_SIZE, (fr) => {
        const s = self(fr).s;
        let needle = t(fr);
        if (count) needle = needle.slice(0, count(fr));
        const p = pos ? pos(fr) : null;
        let r = -1;
        switch (name) {
          case "find":
            r = s.indexOf(needle, p ?? 0);
            break;
          case "rfind":
            r = s.lastIndexOf(needle, p ?? Infinity);
            break;
          case "find_first_of":
            for (let i = p ?? 0; i < s.length; i++) if (needle.includes(s[i])) {
              r = i;
              break;
            }
            break;
          case "find_last_of":
            for (let i = Math.min(p ?? s.length - 1, s.length - 1); i >= 0; i--) if (needle.includes(s[i])) {
              r = i;
              break;
            }
            break;
          case "find_first_not_of":
            for (let i = p ?? 0; i < s.length; i++) if (!needle.includes(s[i])) {
              r = i;
              break;
            }
            break;
          case "find_last_not_of":
            for (let i = Math.min(p ?? s.length - 1, s.length - 1); i >= 0; i--) if (!needle.includes(s[i])) {
              r = i;
              break;
            }
            break;
        }
        return r < 0 ? NPOS : r;
      }, line);
    }
    case "begin":
    case "cbegin":
      noArgs();
      return val({ k: "iter", of: T_STR }, (fr) => new It(self(fr), 0), line);
    case "end":
    case "cend":
      noArgs();
      return val({ k: "iter", of: T_STR }, (fr) => new It(self(fr), self(fr).s.length), line);
    case "rbegin":
    case "crbegin":
      noArgs();
      return val({ k: "iter", of: T_STR, reverse: true }, (fr) => new It(self(fr), 0, null, true), line);
    case "rend":
    case "crend":
      noArgs();
      return val({ k: "iter", of: T_STR, reverse: true }, (fr) => new It(self(fr), self(fr).s.length, null, true), line);
  }
  return null;
}

/** `+`, comparisons and `+=` on strings. */
export function stringBinary(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  const lt = strip(l.ty);
  const rt = strip(r.ty);
  const textual = (t: Ty, c: CE) => t.k === "str" || c.lit !== undefined || (t.k === "ptr" && isChar(strip(t.to))) || (t.k === "arr" && isChar(strip(t.of)));
  if (op === "+") {
    if (!(lt.k === "str" || rt.k === "str")) return null;
    const lOk = textual(lt, l) || isChar(lt);
    const rOk = textual(rt, r) || isChar(rt);
    if (!lOk || !rOk) return null;
    const a = textArg(fc, l, at);
    const b = textArg(fc, r, at);
    return val(T_STR, (fr) => new CStr(a(fr) + b(fr)), at.line);
  }
  if (["==", "!=", "<", ">", "<=", ">="].includes(op)) {
    if (!(lt.k === "str" || rt.k === "str")) return null;
    if (!textual(lt, l) || !textual(rt, r)) return null;
    const a = textArg(fc, l, at);
    const b = textArg(fc, r, at);
    switch (op) {
      case "==":
        return val(T_BOOL, (fr) => a(fr) === b(fr), at.line);
      case "!=":
        return val(T_BOOL, (fr) => a(fr) !== b(fr), at.line);
      case "<":
        return val(T_BOOL, (fr) => a(fr) < b(fr), at.line);
      case ">":
        return val(T_BOOL, (fr) => a(fr) > b(fr), at.line);
      case "<=":
        return val(T_BOOL, (fr) => a(fr) <= b(fr), at.line);
      default:
        return val(T_BOOL, (fr) => a(fr) >= b(fr), at.line);
    }
  }
  return null;
}

export function stringCompound(fc: FnCompiler, op: string, l: CE, r: CE, at: Loc): CE | null {
  if (op !== "+") return null;
  const t = strip(r.ty);
  const ok = t.k === "str" || r.lit !== undefined || (t.k === "ptr" && isChar(strip(t.to))) || isChar(t);
  if (!ok) return fc.err("bad-operands", `cannot add ${tyStr(r.ty)} to a string`, at, { type: tyStr(r.ty) });
  const b = textArg(fc, r, at);
  const lv = l.ev;
  return { ty: l.ty, ev: (fr) => {
    const s = lv(fr) as CStr;
    s.s += b(fr);
    return s;
  }, lv: l.lv, line: at.line };
}

/* -------------------------- numbers to and from text -------------------------- */

export function toStringCall(fc: FnCompiler, e: Call): CE {
  checkArgs(fc, e, "to_string", 1);
  const x = fc.expr(e.args[0]);
  const t = strip(x.ty);
  const ev = x.ev;
  if (isFloating(t)) return val(T_STR, (fr) => new CStr(formatFixed(ev(fr), 6)), e.line);
  if (t.k === "bool") return val(T_STR, (fr) => new CStr(ev(fr) ? "1" : "0"), e.line);
  if (isIntegral(t)) return val(T_STR, (fr) => new CStr(String(ev(fr))), e.line);
  return fc.err("bad-argument", `to_string needs a number, not ${tyStr(x.ty)}`, e, { type: tyStr(x.ty) });
}

function parseIntegral(text: string, base: number, line: number, name: string): I.I64 {
  const m = base === 10 ? /^\s*([+-]?\d+)/.exec(text) : /^\s*([+-]?[0-9a-zA-Z]+)/.exec(text);
  if (!m) throw runtimeError("invalid-argument", `${name}: no conversion could be done on "${text}"`, line, { name, text });
  if (base === 10) return I.wrapS64(BigInt(m[1]));
  const n = parseInt(m[1], base);
  if (Number.isNaN(n)) throw runtimeError("invalid-argument", `${name}: no conversion could be done on "${text}"`, line, { name, text });
  return n;
}

export function stoxCall(fc: FnCompiler, name: string, e: Call): CE {
  checkArgs(fc, e, name, 1, 3);
  const s = textArg(fc, fc.expr(e.args[0]), e);
  const base = e.args.length > 2 ? numArg(fc, fc.expr(e.args[2]), e) : () => 10;
  const line = e.line;
  if (name === "stod" || name === "stof" || name === "atof") {
    const f = (fr: Frame) => {
      const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(s(fr));
      if (!m) {
        if (name === "atof") return 0;
        throw runtimeError("invalid-argument", `${name}: no conversion could be done`, line, { name, text: s(fr) });
      }
      return Number(m[1]);
    };
    return val(name === "stof" ? { k: "float" } : T_DOUBLE, name === "stof" ? (fr) => Math.fround(f(fr)) : f, line);
  }
  const bits: 32 | 64 = name === "stoi" || name === "atoi" ? 32 : 64;
  const signed = name !== "stoul" && name !== "stoull";
  const ty = bits === 32 ? T_INT : name === "stoul" ? T_ULONG : name === "stoull" ? ({ k: "int", bits: 64, signed: false, name: "unsigned long long" } as Ty) : name === "stoll" || name === "atoll" ? T_LL : T_LONG;
  return val(ty, (fr) => {
    const text = s(fr);
    if (name.startsWith("ato")) {
      const m = /^\s*([+-]?\d+)/.exec(text);
      return m ? I.toInt(I.wrapS64(BigInt(m[1])), bits, true) : 0;
    }
    const v = parseIntegral(text, base(fr), line, name);
    if (bits === 32 && (v < -2147483648 || v > 2147483647)) throw runtimeError("out-of-range", `${name}: the value does not fit in an int`, line, { name });
    return signed ? v : I.toInt(v, 64, false);
  }, line);
}

/* ------------------------------- C strings -------------------------------- */

function cstr(fc: FnCompiler, e: Call, i: number): (fr: Frame) => string {
  return textArg(fc, fc.expr(e.args[i]), e);
}

export function cStringCall(fc: FnCompiler, name: string, e: Call): CE | null {
  const line = e.line;
  switch (name) {
    case "strlen": {
      checkArgs(fc, e, name, 1);
      const s = cstr(fc, e, 0);
      return val(T_ULONG, (fr) => s(fr).length, line);
    }
    case "strcmp":
    case "strncmp": {
      checkArgs(fc, e, name, name === "strcmp" ? 2 : 3);
      const a = cstr(fc, e, 0);
      const b = cstr(fc, e, 1);
      const n = name === "strncmp" ? numArg(fc, fc.expr(e.args[2]), e) : null;
      return val(T_INT, (fr) => {
        let x = a(fr);
        let y = b(fr);
        if (n) {
          x = x.slice(0, n(fr));
          y = y.slice(0, n(fr));
        }
        return x < y ? -1 : x > y ? 1 : 0;
      }, line);
    }
    case "strcpy":
    case "strncpy":
    case "strcat": {
      checkArgs(fc, e, name, name === "strncpy" ? 3 : 2);
      const dest = fc.expr(e.args[0]);
      const dv = dest.ev;
      const dt = strip(dest.ty);
      const src = cstr(fc, e, 1);
      const n = name === "strncpy" ? numArg(fc, fc.expr(e.args[2]), e) : null;
      return val(dest.ty, (fr) => {
        const p = dt.k === "arr" ? new ElemPlace(dv(fr), 0) : (dv(fr) as ElemPlace);
        let text = src(fr);
        let start = p.i;
        if (name === "strcat") start += cstringOf(p).length;
        if (n) text = text.slice(0, n(fr));
        if (start + text.length >= p.arr.length) throw runtimeError("buffer-overflow", `the text does not fit in the character array`, line);
        for (let i = 0; i < text.length; i++) p.arr[start + i] = charAt(text, i);
        p.arr[start + text.length] = 0;
        return dt.k === "arr" ? new ElemPlace(dv(fr), 0) : p;
      }, line);
    }
    case "strchr": {
      checkArgs(fc, e, name, 2);
      const p0 = fc.expr(e.args[0]);
      const c = fc.coerce(fc.expr(e.args[1]), T_INT, e, "cast").ev;
      const pv = p0.ev;
      const dt = strip(p0.ty);
      return val({ k: "ptr", to: T_CHAR }, (fr) => {
        const p = dt.k === "arr" ? new ElemPlace(pv(fr), 0) : (pv(fr) as ElemPlace);
        const text = cstringOf(p);
        const k = text.indexOf(String.fromCharCode(c(fr) & 255));
        return k < 0 ? null : new ElemPlace(p.arr, p.i + k);
      }, line);
    }
    case "strstr": {
      checkArgs(fc, e, name, 2);
      const p0 = fc.expr(e.args[0]);
      const needle = cstr(fc, e, 1);
      const pv = p0.ev;
      const dt = strip(p0.ty);
      return val({ k: "ptr", to: T_CHAR }, (fr) => {
        const p = dt.k === "arr" ? new ElemPlace(pv(fr), 0) : (pv(fr) as ElemPlace);
        const k = cstringOf(p).indexOf(needle(fr));
        return k < 0 ? null : new ElemPlace(p.arr, p.i + k);
      }, line);
    }
  }
  return null;
}

/* ---------------------------------- ctype ---------------------------------- */

// Like g++ on Linux (glibc): the classification functions return a bit mask, not 1 — so printing
// isdigit(c) shows 2048, and only "zero or not zero" is portable.
export const CTYPE: Record<string, [(c: number) => boolean, number]> = {
  isdigit: [(c) => c >= 48 && c <= 57, 2048],
  isalpha: [(c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122), 1024],
  isalnum: [(c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122), 8],
  isupper: [(c) => c >= 65 && c <= 90, 256],
  islower: [(c) => c >= 97 && c <= 122, 512],
  isspace: [(c) => c === 32 || (c >= 9 && c <= 13), 8192],
  ispunct: [(c) => (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126), 4],
  isxdigit: [(c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102), 4096],
  isprint: [(c) => c >= 32 && c <= 126, 16384],
  isgraph: [(c) => c >= 33 && c <= 126, 32768],
  isblank: [(c) => c === 32 || c === 9, 1],
  iscntrl: [(c) => c < 32 || c === 127, 2],
};

export function ctypeCall(fc: FnCompiler, name: string, e: Call): CE | null {
  const test = CTYPE;
  if (test[name]) {
    checkArgs(fc, e, name, 1);
    const [f, mask] = test[name];
    const x = fc.coerce(fc.expr(e.args[0]), T_INT, e, "cast").ev;
    return val(T_INT, (fr) => (f(x(fr) & 255) ? mask : 0), e.line);
  }
  if (name === "toupper" || name === "tolower") {
    checkArgs(fc, e, name, 1);
    const x = fc.coerce(fc.expr(e.args[0]), T_INT, e, "cast").ev;
    const up = name === "toupper";
    return val(T_INT, (fr) => {
      const c = x(fr);
      if (up) return c >= 97 && c <= 122 ? c - 32 : c;
      return c >= 65 && c <= 90 ? c + 32 : c;
    }, e.line);
  }
  return null;
}

export { T_LONG };
