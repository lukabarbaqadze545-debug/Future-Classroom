import type { Expr, Loc } from "../ast";
import { runtimeError } from "../errors";
import type { CE, Frame } from "../core";
import type { FnCompiler } from "../fncompiler";
import { cstringOf, emit, formatDouble, printFn, readChar, readDouble, readInteger, readLine, readWord, skipSpace } from "../conv";
import { formatExp, formatFixed, formatGeneral, pad } from "../format";
import * as I from "../int64";
import { CStr, ElemPlace, IStream, OStream, SStream, type Place } from "../values";
import { T_BOOL, T_INT, T_ISTREAM, T_MANIP, T_OSTREAM, T_STR, T_VOID, isArithmetic, isFloating, isIntegral, strip, tyStr, type Ty } from "../types";
import { checkArgs, numArg, val, type Call } from "./helpers";

/** Streams: cout, cin, formatting manipulators, printf and scanf. */

export type Manip = (os: OStream) => void;

/* --------------------------------- output ---------------------------------- */

export function streamOut(fc: FnCompiler, os: CE, rhs: Expr, at: Loc): CE {
  const { value: r, code } = fc.capture(() => fc.expr(rhs));
  const rt = strip(r.ty);
  let print: (o: OStream, v: any) => void;
  let userCall: CE | null = null;
  if (rt.k === "manip") {
    print = (o, v: Manip) => v(o);
  } else if (r.lit !== undefined) {
    const text = r.lit;
    print = (o) => emit(o, text, false);
  } else if (rt.k === "cls") {
    // operator<<(ostream&, const T&) written by the user
    const frees = fc.cc.funcs.get("operator<<");
    if (!frees) return fc.err("cannot-print", `no operator<< is defined for ${tyStr(r.ty)}`, at, { type: tyStr(r.ty) });
    for (const ins of code) fc.out.push(ins);
    const picked = fc.pickOverload(frees, [os, r], [], at, "operator<<");
    userCall = fc.callResult(picked.fn, picked.args, at);
    // The function hands back the stream it was given (`return os << …;`), so the chain continues from its result.
    const rk = strip(userCall.ty).k;
    if (rk !== "ostream" && rk !== "sstream") return fc.err("bad-operator", "operator<< must return the stream (std::ostream&) so that << can be chained", at);
    const uev = userCall.ev;
    return { ty: T_OSTREAM, ev: uev, line: at.line };
  } else {
    const p = printFn(rt);
    if (!p) return fc.err("cannot-print", `${tyStr(r.ty)} cannot be printed with <<`, at, { type: tyStr(r.ty) });
    print = p;
  }
  const rv = r.ev;
  const ov = os.ev;
  if (code.length === 0) {
    return { ty: T_OSTREAM, ev: (fr) => {
      const o: OStream = ov(fr);
      print(o, rv(fr));
      return o;
    }, line: at.line };
  }
  // The right side calls user functions: everything printed before it must happen first.
  const t = fc.tmp();
  fc.exec((fr) => void (fr[t] = ov(fr)), at);
  for (const ins of code) fc.out.push(ins);
  return { ty: T_OSTREAM, ev: (fr) => {
    const o: OStream = fr[t];
    print(o, rv(fr));
    return o;
  }, line: at.line };
}

/* ---------------------------------- input ----------------------------------- */

export function streamIn(fc: FnCompiler, is: CE, rhs: Expr, at: Loc): CE {
  const target = fc.expr(rhs);
  const tt = strip(target.ty);
  if (target.ty.c) fc.err("assign-const", "cannot read into a const variable", at);
  const iv = is.ev;
  if (tt.k === "cls") {
    const frees = fc.cc.funcs.get("operator>>");
    if (!frees) return fc.err("cannot-read", `no operator>> is defined for ${tyStr(target.ty)}`, at, { type: tyStr(target.ty) });
    const picked = fc.pickOverload(frees, [is, target], [], at, "operator>>");
    const call = fc.callResult(picked.fn, picked.args, at);
    const rk = strip(call.ty).k;
    if (rk !== "istream" && rk !== "sstream") return fc.err("bad-operator", "operator>> must return the stream (std::istream&) so that >> can be chained", at);
    return { ty: T_ISTREAM, ev: call.ev, line: at.line };
  }
  if (!target.set) return fc.err("not-lvalue", "'>>' needs a variable to read into", at);
  const set = target.set;
  let read: (s: IStream) => any;
  if (tt.k === "int" && tt.ch) read = readChar;
  else if (tt.k === "int") read = (s) => readInteger(s, tt.bits, tt.signed);
  else if (tt.k === "bool") {
    read = (s) => {
      const v = readInteger(s, 32, true);
      return v === undefined ? undefined : v !== 0;
    };
  } else if (tt.k === "float" || tt.k === "double") {
    const round = tt.k === "float" ? Math.fround : (x: number) => x;
    read = (s) => {
      const v = readDouble(s);
      return v === undefined ? undefined : round(v);
    };
  } else if (tt.k === "str") {
    read = (s) => {
      const w = readWord(s);
      return w === undefined ? undefined : new CStr(w);
    };
  } else if (tt.k === "arr" && tt.of.k === "int" && tt.of.ch) {
    const ev = target.ev;
    return { ty: T_ISTREAM, ev: (fr) => {
      const s: IStream = iv(fr);
      const w = readWord(s);
      if (w !== undefined) {
        const a: any[] = ev(fr);
        if (w.length >= a.length) throw runtimeError("buffer-overflow", "the word does not fit in the character array", at.line);
        for (let i = 0; i < w.length; i++) a[i] = (w.charCodeAt(i) << 24) >> 24;
        a[w.length] = 0;
      }
      return s;
    }, line: at.line };
  } else return fc.err("cannot-read", `${tyStr(target.ty)} cannot be read with >>`, at, { type: tyStr(target.ty) });
  const assign = tt.k === "str" ? (fr: Frame, v: CStr) => set(fr, v) : set;
  return { ty: T_ISTREAM, ev: (fr) => {
    const s: IStream = iv(fr);
    const v = read(s);
    if (v !== undefined) assign(fr, v);
    return s;
  }, line: at.line };
}

/* ----------------------------- stream members ------------------------------ */

export function streamMethod(fc: FnCompiler, obj: CE, name: string, e: Call): CE | null {
  const t = strip(obj.ty);
  const ov = obj.ev;
  const line = e.line;
  if (t.k === "sstream" && name === "str") {
    checkArgs(fc, e, name, 0, 1);
    if (e.args.length === 0) return val(T_STR, (fr) => new CStr((ov(fr) as SStream).data), line);
    const text = fc.cc.lib.cstring;
    const a = fc.expr(e.args[0]);
    const av = a.ev;
    const isStr = strip(a.ty).k === "str";
    return val(T_VOID, (fr) => {
      const s: SStream = ov(fr);
      const v = av(fr);
      s.data = isStr ? (v as CStr).s : text(v);
      s.pos = 0;
    }, line);
  }
  if (t.k === "ostream" || t.k === "sstream") {
    switch (name) {
      case "flush":
        checkArgs(fc, e, name, 0);
        return val(T_OSTREAM, ov, line);
      case "put": {
        checkArgs(fc, e, name, 1);
        const c = fc.coerce(fc.expr(e.args[0]), { k: "int", bits: 8, signed: true, name: "char", ch: true }, e, "cast").ev;
        return val(T_OSTREAM, (fr) => {
          const o: OStream = ov(fr);
          o.write(String.fromCharCode(c(fr) & 255));
          return o;
        }, line);
      }
      case "write": {
        checkArgs(fc, e, name, 2);
        const s = fc.expr(e.args[0]);
        const n = numArg(fc, fc.expr(e.args[1]), e);
        const text = fc.cc.lib.cstring;
        const sev = s.ev;
        return val(T_OSTREAM, (fr) => {
          const o: OStream = ov(fr);
          o.write(text(sev(fr)).slice(0, n(fr)));
          return o;
        }, line);
      }
      case "precision": {
        checkArgs(fc, e, name, 0, 1);
        if (e.args.length === 0) return val(T_INT, (fr) => (ov(fr) as OStream).fmt.precision, line);
        const n = numArg(fc, fc.expr(e.args[0]), e);
        return val(T_INT, (fr) => {
          const o: OStream = ov(fr);
          const old = o.fmt.precision;
          o.fmt.precision = n(fr);
          return old;
        }, line);
      }
      case "width": {
        checkArgs(fc, e, name, 0, 1);
        if (e.args.length === 0) return val(T_INT, (fr) => (ov(fr) as OStream).fmt.width, line);
        const n = numArg(fc, fc.expr(e.args[0]), e);
        return val(T_INT, (fr) => {
          const o: OStream = ov(fr);
          const old = o.fmt.width;
          o.fmt.width = n(fr);
          return old;
        }, line);
      }
      case "fill": {
        checkArgs(fc, e, name, 1);
        const c = fc.coerce(fc.expr(e.args[0]), { k: "int", bits: 8, signed: true, name: "char", ch: true }, e, "cast").ev;
        return val(T_VOID, (fr) => void ((ov(fr) as OStream).fmt.fill = String.fromCharCode(c(fr) & 255)), line);
      }
      case "setf":
      case "unsetf": {
        checkArgs(fc, e, name, 1, 2);
        const flags = fc.coerce(fc.expr(e.args[0]), T_INT, e, "cast").ev;
        const on = name === "setf";
        return val(T_VOID, (fr) => {
          const o: OStream = ov(fr);
          const f = flags(fr);
          if (f & FLAG_FIXED) {
            o.fmt.fixed = on;
            if (on) o.fmt.scientific = false;
          }
          if (f & FLAG_SCI) {
            o.fmt.scientific = on;
            if (on) o.fmt.fixed = false;
          }
          if (f & FLAG_SHOWPOINT) o.fmt.showpoint = on;
          if (f & FLAG_LEFT) o.fmt.left = on;
        }, line);
      }
    }
    if (t.k === "ostream") return null;
  }
  if (t.k === "istream" || t.k === "sstream") {
    switch (name) {
      case "get": {
        checkArgs(fc, e, name, 0, 1);
        if (e.args.length === 0) {
          return val(T_INT, (fr) => {
            const s: IStream = ov(fr);
            if (s.pos >= s.data.length) {
              s.failed = true;
              return -1;
            }
            return s.data.charCodeAt(s.pos++);
          }, line);
        }
        const target = fc.expr(e.args[0]);
        if (!target.set) fc.err("not-lvalue", "get needs a variable", e);
        const set = target.set!;
        return val(T_ISTREAM, (fr) => {
          const s: IStream = ov(fr);
          if (s.pos >= s.data.length) s.failed = true;
          else set(fr, (s.data.charCodeAt(s.pos++) << 24) >> 24);
          return s;
        }, line);
      }
      case "peek":
        checkArgs(fc, e, name, 0);
        return val(T_INT, (fr) => {
          const s: IStream = ov(fr);
          return s.pos >= s.data.length ? -1 : s.data.charCodeAt(s.pos);
        }, line);
      case "eof":
        checkArgs(fc, e, name, 0);
        return val(T_BOOL, (fr) => {
          const s: IStream = ov(fr);
          return s.failed && s.pos >= s.data.length;
        }, line);
      case "fail":
        checkArgs(fc, e, name, 0);
        return val(T_BOOL, (fr) => (ov(fr) as IStream).failed, line);
      case "good":
        checkArgs(fc, e, name, 0);
        return val(T_BOOL, (fr) => !(ov(fr) as IStream).failed, line);
      case "bad":
        checkArgs(fc, e, name, 0);
        return val(T_BOOL, () => false, line);
      case "clear":
        checkArgs(fc, e, name, 0, 1);
        return val(T_VOID, (fr) => void ((ov(fr) as IStream).failed = false), line);
      case "ignore": {
        checkArgs(fc, e, name, 0, 2);
        const n = e.args.length > 0 ? numArg(fc, fc.expr(e.args[0]), e) : () => 1;
        const d = e.args.length > 1 ? fc.coerce(fc.expr(e.args[1]), T_INT, e, "cast").ev : () => -1;
        return val(T_ISTREAM, (fr) => {
          const s: IStream = ov(fr);
          let count = n(fr);
          const delim = d(fr);
          while (count-- > 0 && s.pos < s.data.length) {
            const c = s.data.charCodeAt(s.pos++);
            if (c === delim) break;
          }
          return s;
        }, line);
      }
      case "getline": {
        checkArgs(fc, e, name, 2, 3);
        const buf = fc.expr(e.args[0]);
        const n = numArg(fc, fc.expr(e.args[1]), e);
        const bev = buf.ev;
        return val(T_ISTREAM, (fr) => {
          const s: IStream = ov(fr);
          const line = readLine(s);
          if (line !== undefined) {
            const a: any[] = bev(fr);
            const limit = Math.min(n(fr) - 1, a.length - 1);
            for (let i = 0; i < line.length && i < limit; i++) a[i] = (line.charCodeAt(i) << 24) >> 24;
            a[Math.min(line.length, limit)] = 0;
          }
          return s;
        }, line);
      }
      case "tie":
      case "sync_with_stdio":
        e.args.forEach((a) => fc.expr(a));
        return val(T_VOID, () => undefined, line);
    }
  }
  return null;
}

const FLAG_FIXED = 1 << 0;
const FLAG_SCI = 1 << 1;
const FLAG_SHOWPOINT = 1 << 2;
const FLAG_LEFT = 1 << 3;

/** `cout`, `cin`, `endl`, manipulators and `ios::` flags as names. */
export function streamValue(fc: FnCompiler, name: string, at: Loc): CE | null {
  const rt = fc.rt;
  const manip = (f: Manip): CE => ({ ty: T_MANIP, ev: () => f, line: at.line });
  switch (name) {
    case "cout":
      return { ty: T_OSTREAM, ev: () => rt.cout, line: at.line, name: "cout" };
    case "cerr":
    case "clog":
      return { ty: T_OSTREAM, ev: () => rt.cerr, line: at.line, name: "cerr" };
    case "cin":
      return { ty: T_ISTREAM, ev: () => rt.cin, line: at.line, name: "cin" };
    case "endl":
      return manip((o) => o.write("\n"));
    case "ends":
      return manip((o) => o.write("\0"));
    case "flush":
    case "unitbuf":
    case "nounitbuf":
      return manip(() => undefined);
    case "fixed":
      return manip((o) => {
        o.fmt.fixed = true;
        o.fmt.scientific = false;
      });
    case "scientific":
      return manip((o) => {
        o.fmt.scientific = true;
        o.fmt.fixed = false;
      });
    case "defaultfloat":
      return manip((o) => {
        o.fmt.fixed = false;
        o.fmt.scientific = false;
      });
    case "boolalpha":
      return manip((o) => void (o.fmt.boolalpha = true));
    case "noboolalpha":
      return manip((o) => void (o.fmt.boolalpha = false));
    case "left":
      return manip((o) => void (o.fmt.left = true));
    case "right":
      return manip((o) => void (o.fmt.left = false));
    case "internal":
      return manip(() => undefined);
    case "dec":
      return manip((o) => void (o.fmt.base = 10));
    case "hex":
      return manip((o) => void (o.fmt.base = 16));
    case "oct":
      return manip((o) => void (o.fmt.base = 8));
    case "showpos":
      return manip((o) => void (o.fmt.showpos = true));
    case "noshowpos":
      return manip((o) => void (o.fmt.showpos = false));
    case "showpoint":
      return manip((o) => void (o.fmt.showpoint = true));
    case "noshowpoint":
      return manip((o) => void (o.fmt.showpoint = false));
    case "uppercase":
      return manip((o) => void (o.fmt.uppercase = true));
    case "nouppercase":
      return manip((o) => void (o.fmt.uppercase = false));
    case "showbase":
      return manip((o) => void (o.fmt.showbase = true));
    case "noshowbase":
      return manip((o) => void (o.fmt.showbase = false));
    case "skipws":
    case "noskipws":
      return manip(() => undefined);
    case "ws":
      return manip(() => undefined);
    case "ios::fixed":
    case "ios_base::fixed":
      return { ty: T_INT, ev: () => FLAG_FIXED, cst: FLAG_FIXED, line: at.line };
    case "ios::scientific":
    case "ios_base::scientific":
      return { ty: T_INT, ev: () => FLAG_SCI, cst: FLAG_SCI, line: at.line };
    case "ios::showpoint":
    case "ios_base::showpoint":
      return { ty: T_INT, ev: () => FLAG_SHOWPOINT, cst: FLAG_SHOWPOINT, line: at.line };
    case "ios::left":
    case "ios_base::left":
      return { ty: T_INT, ev: () => FLAG_LEFT, cst: FLAG_LEFT, line: at.line };
    case "ios::floatfield":
    case "ios_base::floatfield":
      return { ty: T_INT, ev: () => FLAG_FIXED | FLAG_SCI, cst: FLAG_FIXED | FLAG_SCI, line: at.line };
    case "ios::sync_with_stdio":
      return null;
  }
  return null;
}

/** Manipulators that take an argument: setw(5), setprecision(2), setfill('0'). */
export function manipulatorCall(fc: FnCompiler, name: string, e: Call): CE | null {
  switch (name) {
    case "setw": {
      checkArgs(fc, e, name, 1);
      const n = numArg(fc, fc.expr(e.args[0]), e);
      return val(T_MANIP, (fr) => {
        const w = n(fr);
        return (o: OStream) => void (o.fmt.width = w);
      }, e.line);
    }
    case "setprecision": {
      checkArgs(fc, e, name, 1);
      const n = numArg(fc, fc.expr(e.args[0]), e);
      return val(T_MANIP, (fr) => {
        const p = n(fr);
        return (o: OStream) => void (o.fmt.precision = p);
      }, e.line);
    }
    case "setfill": {
      checkArgs(fc, e, name, 1);
      const c = fc.coerce(fc.expr(e.args[0]), { k: "int", bits: 8, signed: true, name: "char", ch: true }, e, "cast").ev;
      return val(T_MANIP, (fr) => {
        const ch = String.fromCharCode(c(fr) & 255);
        return (o: OStream) => void (o.fmt.fill = ch);
      }, e.line);
    }
    case "setbase": {
      checkArgs(fc, e, name, 1);
      const n = numArg(fc, fc.expr(e.args[0]), e);
      return val(T_MANIP, (fr) => {
        const b = n(fr);
        return (o: OStream) => void (o.fmt.base = b === 16 ? 16 : b === 8 ? 8 : 10);
      }, e.line);
    }
  }
  return null;
}

/* ----------------------------- getline and the C I/O ----------------------------- */

/** `getline(cin, s)` and `getline(cin, s, delim)`. */
export function getlineCall(fc: FnCompiler, e: Call): CE {
  checkArgs(fc, e, "getline", 2, 3);
  const is = fc.expr(e.args[0]);
  if (strip(is.ty).k !== "istream" && strip(is.ty).k !== "sstream") fc.err("bad-argument", "getline reads from cin", e);
  const target = fc.expr(e.args[1]);
  if (strip(target.ty).k !== "str") fc.err("bad-argument", "getline reads into a std::string", e);
  const delim = e.args.length > 2 ? fc.coerce(fc.expr(e.args[2]), { k: "int", bits: 8, signed: true, name: "char", ch: true }, e, "cast").ev : () => 10;
  const iv = is.ev;
  const tv = target.ev;
  return { ty: T_ISTREAM, ev: (fr) => {
    const s: IStream = iv(fr);
    const line = readLine(s, String.fromCharCode(delim(fr) & 255));
    if (line !== undefined) (tv(fr) as CStr).s = line;
    return s;
  }, line: e.line };
}

interface Spec {
  kind: "lit" | "conv";
  text?: string;
  flags?: string;
  width?: number | "*";
  prec?: number | "*" | null;
  len?: string;
  conv?: string;
}

function parseFormat(fmt: string, at: Loc, fc: FnCompiler): Spec[] {
  const out: Spec[] = [];
  let i = 0;
  let lit = "";
  while (i < fmt.length) {
    const c = fmt[i];
    if (c !== "%") {
      lit += c;
      i++;
      continue;
    }
    if (fmt[i + 1] === "%") {
      lit += "%";
      i += 2;
      continue;
    }
    const m = /^%([-+ #0]*)(\d+|\*)?(?:\.(\d+|\*)?)?(hh|h|ll|l|z|j|t|L)?([diuoxXfFeEgGcsp])/.exec(fmt.slice(i));
    if (!m) fc.err("bad-format", `the format string has a conversion that is not understood near '${fmt.slice(i, i + 4)}'`, at, { near: fmt.slice(i, i + 4) });
    if (lit) out.push({ kind: "lit", text: lit });
    lit = "";
    out.push({ kind: "conv", flags: m![1], width: m![2] === "*" ? "*" : m![2] ? Number(m![2]) : undefined, prec: m![3] === "*" ? "*" : m![3] !== undefined ? Number(m![3]) : m![0].includes(".") ? 0 : null, len: m![4] ?? "", conv: m![5] });
    i += m![0].length;
  }
  if (lit) out.push({ kind: "lit", text: lit });
  return out;
}

/** Formats one conversion of printf. */
function formatOne(spec: Spec, v: any, width: number | undefined, prec: number | null): string {
  const flags = spec.flags ?? "";
  const left = flags.includes("-") || (width !== undefined && width < 0);
  const w = width === undefined ? 0 : Math.abs(width);
  const zero = flags.includes("0") && !left;
  let body: string;
  let sign = "";
  const conv = spec.conv!;
  const long = spec.len === "l" || spec.len === "ll" || spec.len === "z" || spec.len === "j" || spec.len === "t";
  switch (conv) {
    case "d":
    case "i": {
      let n: I.I64 = typeof v === "boolean" ? (v ? 1 : 0) : v;
      if (!long) n = I.toInt(n, spec.len === "hh" ? 8 : spec.len === "h" ? 16 : 32, true);
      const neg = n < 0;
      body = neg ? String(-BigInt(n)) : String(n);
      if (prec !== null && prec !== undefined) body = body.padStart(prec, "0");
      sign = neg ? "-" : flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
      return finish(sign, body, w, left, zero && prec === null);
    }
    case "u":
    case "o":
    case "x":
    case "X": {
      let n: I.I64 = typeof v === "boolean" ? (v ? 1 : 0) : v;
      n = I.toInt(n, long ? 64 : spec.len === "hh" ? 8 : spec.len === "h" ? 16 : 32, false);
      const base = conv === "u" ? 10 : conv === "o" ? 8 : 16;
      body = BigInt(n).toString(base);
      if (conv === "X") body = body.toUpperCase();
      if (prec !== null && prec !== undefined) body = body.padStart(prec, "0");
      if (flags.includes("#") && n !== 0) body = (conv === "o" ? "0" : conv === "x" ? "0x" : conv === "X" ? "0X" : "") + body;
      return finish("", body, w, left, zero && prec === null);
    }
    case "f":
    case "F":
    case "e":
    case "E":
    case "g":
    case "G": {
      const x: number = typeof v === "number" ? v : Number(v);
      const p = prec === null || prec === undefined ? 6 : prec;
      const alt = flags.includes("#");
      const neg = x < 0 || Object.is(x, -0);
      const mag = Math.abs(x);
      body = conv === "f" || conv === "F" ? formatFixed(mag, p, alt) : conv === "e" || conv === "E" ? formatExp(mag, p, conv === "E", alt) : formatGeneral(mag, p, conv === "G", alt);
      if (Number.isNaN(x)) body = conv === "F" || conv === "E" || conv === "G" ? "NAN" : "nan";
      sign = neg && !Number.isNaN(x) ? "-" : flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
      return finish(sign, body, w, left, zero && Number.isFinite(x));
    }
    case "c":
      return finish("", String.fromCharCode(Number(v) & 255), w, left, false);
    case "s": {
      let s: string = v;
      if (prec !== null && prec !== undefined) s = s.slice(0, prec);
      return finish("", s, w, left, false);
    }
    case "p":
      return finish("", v === null ? "(nil)" : "0x7ffd1000", w, left, false);
  }
  return "";
}

function finish(sign: string, body: string, width: number, left: boolean, zeroPad: boolean): string {
  const total = sign.length + body.length;
  if (total >= width) return sign + body;
  if (left) return sign + body + " ".repeat(width - total);
  if (zeroPad) return sign + "0".repeat(width - total) + body;
  return " ".repeat(width - total) + sign + body;
}

/** The text of a format string argument, if it is a literal. */
function literalFormat(fc: FnCompiler, ce: CE, at: Loc): string {
  if (ce.lit === undefined) fc.err("bad-format", "the format of printf must be a text written in the program", at);
  return ce.lit!;
}

function argValue(fc: FnCompiler, spec: Spec, ce: CE, at: Loc): (fr: Frame) => any {
  const t = strip(ce.ty);
  const conv = spec.conv!;
  const ev = ce.ev;
  if (conv === "s") {
    if (t.k === "str") return fc.err("bad-format", "printf cannot print a std::string: use .c_str(), or use cout", at);
    if (ce.lit !== undefined) {
      const text = ce.lit;
      return () => text;
    }
    if (t.k === "ptr" || t.k === "arr") {
      if (t.k === "arr") return (fr) => cstringOf(new ElemPlace(ev(fr), 0));
      return (fr) => cstringOf(ev(fr));
    }
    return fc.err("bad-format", `%s needs a text, not ${tyStr(ce.ty)}`, at, { type: tyStr(ce.ty) });
  }
  if ("fFeEgG".includes(conv)) {
    if (!isArithmetic(t)) return fc.err("bad-format", `%${conv} needs a number, not ${tyStr(ce.ty)}`, at);
    if (isIntegral(t)) fc.err("bad-format", `%${conv} needs a double, but the argument is ${tyStr(ce.ty)} (it would print nonsense)`, at, { conv, type: tyStr(ce.ty) });
    return ev;
  }
  if ("diuoxXc".includes(conv)) {
    if (isFloating(t)) fc.err("bad-format", `%${conv} needs an integer, but the argument is ${tyStr(ce.ty)} (it would print nonsense)`, at, { conv, type: tyStr(ce.ty) });
    if (!isIntegral(t) && t.k !== "ptr") fc.err("bad-format", `%${conv} needs an integer, not ${tyStr(ce.ty)}`, at);
    return ev;
  }
  return ev;
}

export function printfCall(fc: FnCompiler, e: Call, toStderr = false, skip = 0): CE {
  if (e.args.length <= skip) fc.err("arg-count", "printf needs a format string", e);
  const fmtCE = fc.expr(e.args[skip]);
  const specs = parseFormat(literalFormat(fc, fmtCE, e), e, fc);
  const args = e.args.slice(skip + 1).map((a) => fc.expr(a));
  let ai = 0;
  type Part = { lit?: string; width?: (fr: Frame) => number; prec?: (fr: Frame) => number; arg?: (fr: Frame) => any; spec?: Spec };
  const parts: Part[] = specs.map((s) => {
    if (s.kind === "lit") return { lit: s.text };
    const p: Part = { spec: s };
    if (s.width === "*") p.width = fc.coerce(args[ai++] ?? fc.err("bad-format", "printf is missing an argument for '*'", e), T_INT, e, "cast").ev;
    if (s.prec === "*") p.prec = fc.coerce(args[ai++] ?? fc.err("bad-format", "printf is missing an argument for '*'", e), T_INT, e, "cast").ev;
    const a = args[ai++];
    if (!a) fc.err("bad-format", "printf has fewer arguments than the format needs", e);
    p.arg = argValue(fc, s, a, e);
    return p;
  });
  if (ai < args.length) fc.err("bad-format", "printf has more arguments than the format uses", e);
  const out = toStderr ? () => fc.rt.cerr : () => fc.rt.cout;
  return val(T_INT, (fr) => {
    let text = "";
    for (const p of parts) {
      if (p.lit !== undefined) text += p.lit;
      else {
        const spec = p.spec!;
        const width = p.width ? p.width(fr) : (spec.width as number | undefined);
        const prec = p.prec ? p.prec(fr) : (spec.prec as number | null);
        text += formatOne(spec, p.arg!(fr), width, prec);
      }
    }
    out().write(text);
    return text.length;
  }, e.line);
}

/** snprintf / sprintf into a character array. */
export function sprintfCall(fc: FnCompiler, e: Call, sized: boolean): CE {
  const skip = sized ? 2 : 1;
  const dest = fc.expr(e.args[0]);
  const inner: Call = { ...e, args: e.args.slice(skip) };
  const fmtCE = fc.expr(inner.args[0]);
  const specs = parseFormat(literalFormat(fc, fmtCE, e), e, fc);
  const args = inner.args.slice(1).map((a) => fc.expr(a));
  let ai = 0;
  const parts = specs.map((s) => {
    if (s.kind === "lit") return { lit: s.text } as { lit?: string; arg?: (fr: Frame) => any; spec?: Spec };
    const a = args[ai++];
    if (!a) fc.err("bad-format", "sprintf has fewer arguments than the format needs", e);
    return { spec: s, arg: argValue(fc, s, a, e) };
  });
  const dv = dest.ev;
  const dt = strip(dest.ty);
  const limit = sized ? numArg(fc, fc.expr(e.args[1]), e) : null;
  return val(T_INT, (fr) => {
    let text = "";
    for (const p of parts) text += p.lit !== undefined ? p.lit : formatOne(p.spec!, p.arg!(fr), p.spec!.width as number | undefined, p.spec!.prec as number | null);
    const target = dt.k === "arr" ? new ElemPlace(dv(fr), 0) : (dv(fr) as ElemPlace);
    const cap = limit ? limit(fr) - 1 : target.arr.length - target.i - 1;
    const n = Math.min(text.length, cap);
    for (let i = 0; i < n; i++) target.arr[target.i + i] = (text.charCodeAt(i) << 24) >> 24;
    target.arr[target.i + n] = 0;
    return text.length;
  }, e.line);
}

export function scanfCall(fc: FnCompiler, e: Call): CE {
  if (e.args.length < 1) fc.err("arg-count", "scanf needs a format string", e);
  const fmtCE = fc.expr(e.args[0]);
  const fmt = literalFormat(fc, fmtCE, e);
  const targets = e.args.slice(1).map((a) => fc.expr(a));
  type Step = { ws?: true; lit?: string; conv?: string; len?: string; skip?: boolean; target?: (fr: Frame) => Place; ty?: Ty };
  const steps: Step[] = [];
  let ti = 0;
  for (let i = 0; i < fmt.length; ) {
    const c = fmt[i];
    if (/\s/.test(c)) {
      steps.push({ ws: true });
      while (i < fmt.length && /\s/.test(fmt[i])) i++;
      continue;
    }
    if (c !== "%") {
      steps.push({ lit: c });
      i++;
      continue;
    }
    const m = /^%(\*)?(\d+)?(hh|h|ll|l|L|z)?([diuoxXfeEgGcs%])/.exec(fmt.slice(i));
    if (!m) fc.err("bad-format", `scanf has a conversion that is not understood near '${fmt.slice(i, i + 4)}'`, e);
    i += m![0].length;
    if (m![4] === "%") {
      steps.push({ lit: "%" });
      continue;
    }
    const skip = !!m![1];
    const step: Step = { conv: m![4], len: m![3] ?? "", skip };
    if (!skip) {
      const t = targets[ti++];
      if (!t) fc.err("bad-format", "scanf has fewer arguments than the format needs", e);
      const tt = strip(t!.ty);
      if (tt.k !== "ptr" && tt.k !== "arr") fc.err("bad-format", "scanf needs the address of a variable (put & before the name)", e);
      step.target = t!.ev as (fr: Frame) => Place;
      step.ty = tt.k === "ptr" ? tt.to : tt.of;
    }
    steps.push(step);
  }
  if (ti < targets.length) fc.err("bad-format", "scanf has more arguments than the format uses", e);
  return val(T_INT, (fr) => {
    const s = fc.rt.cin;
    let count = 0;
    for (const st of steps) {
      if (st.ws) {
        skipSpace(s);
        continue;
      }
      if (st.lit !== undefined) {
        if (s.data[s.pos] === st.lit) s.pos++;
        else break;
        continue;
      }
      let value: any;
      const conv = st.conv!;
      if (conv === "c") {
        if (s.pos >= s.data.length) break;
        value = (s.data.charCodeAt(s.pos++) << 24) >> 24;
      } else if (conv === "s") {
        const w = readWord(s);
        if (w === undefined) break;
        if (!st.skip) {
          const p = st.target!(fr) as unknown as ElemPlace;
          for (let k = 0; k < w.length; k++) p.arr[p.i + k] = (w.charCodeAt(k) << 24) >> 24;
          p.arr[p.i + w.length] = 0;
          count++;
        }
        continue;
      } else if ("fFeEgG".includes(conv)) {
        const x = readDouble(s);
        if (x === undefined || s.failed) {
          s.failed = false;
          break;
        }
        value = st.len === "" ? Math.fround(x) : x;
        if (st.len === "") value = Math.fround(x);
      } else {
        const longer = st.len === "l" || st.len === "ll" || st.len === "z";
        const signed = conv === "d" || conv === "i";
        const x = readInteger(s, longer ? 64 : 32, signed);
        if (x === undefined || s.failed) {
          s.failed = false;
          break;
        }
        value = x;
      }
      if (!st.skip) {
        (st.target!(fr) as Place).set(value);
        count++;
      }
    }
    return count === 0 && s.pos >= s.data.length ? -1 : count;
  }, e.line);
}

export { pad, formatDouble };
