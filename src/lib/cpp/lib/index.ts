import type { Expr, Loc } from "../ast";
import { moreAlgorithms } from "./algos2";
import { CppError, runtimeError } from "../errors";
import { classDestroys, deleteObject } from "../lifetime";
import type { CE, ClassInfo, FnInfo, Frame } from "../core";
import type { Compiler } from "../compiler";
import type { FnCompiler } from "../fncompiler";
import { cstringOf } from "../conv";
import * as I from "../int64";
import { BoxPlace, CStr, ElemPlace, ExitSignal, Func, ObjPlace, Pair, Tup } from "../values";
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
  T_STR,
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
  noConst,
  pairOf,
  promote,
  ptrTo,
  stdTy,
  strip,
  tyStr,
  type Ty,
} from "../types";
import { algorithmCall, backInserterCall } from "./algos";
import { arrowStd, binaryStd, compoundStd, construct, defaultStd, derefStd, elemValue, incIter, indexStd, listInit, rangeInfo } from "./containers";
import { checkArgs, numArg, val, type Call } from "./helpers";
import { containerMethod } from "./methods";
import { CTYPE, cStringCall, ctypeCall, NPOS, stoxCall, stringBinary, stringCompound, stringMethod, toStringCall } from "./strings";
import { getlineCall, manipulatorCall, printfCall, scanfCall, sprintfCall, streamIn, streamMethod, streamOut, streamValue } from "./streams";
import type { Lib } from "./types";

/** The standard library as the compiler sees it. */

const mathFns1: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  floor: Math.floor,
  ceil: Math.ceil,
  trunc: Math.trunc,
  round: (x) => (x < 0 ? -Math.floor(-x + 0.5) : Math.floor(x + 0.5)),
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  log: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  cbrt: Math.cbrt,
  fabs: Math.abs,
};

const CONSTANTS: Record<string, { ty: Ty; v: any }> = {
  INT_MAX: { ty: T_INT, v: 2147483647 },
  INT_MIN: { ty: T_INT, v: -2147483648 },
  UINT_MAX: { ty: T_UINT, v: 4294967295 },
  SHRT_MAX: { ty: { k: "int", bits: 16, signed: true, name: "short" }, v: 32767 },
  SHRT_MIN: { ty: { k: "int", bits: 16, signed: true, name: "short" }, v: -32768 },
  CHAR_BIT: { ty: T_INT, v: 8 },
  CHAR_MAX: { ty: T_INT, v: 127 },
  CHAR_MIN: { ty: T_INT, v: -128 },
  LONG_MAX: { ty: T_LONG, v: I.wrapS64(I.INT64_MAX) },
  LONG_MIN: { ty: T_LONG, v: I.wrapS64(I.INT64_MIN) },
  LLONG_MAX: { ty: T_LL, v: I.wrapS64(I.INT64_MAX) },
  LLONG_MIN: { ty: T_LL, v: I.wrapS64(I.INT64_MIN) },
  ULLONG_MAX: { ty: T_ULL, v: I.wrapU64(I.UINT64_MAX) },
  ULONG_MAX: { ty: T_ULONG, v: I.wrapU64(I.UINT64_MAX) },
  RAND_MAX: { ty: T_INT, v: 2147483647 },
  EOF: { ty: T_INT, v: -1 },
  M_PI: { ty: T_DOUBLE, v: Math.PI },
  M_E: { ty: T_DOUBLE, v: Math.E },
  M_SQRT2: { ty: T_DOUBLE, v: Math.SQRT2 },
  INFINITY: { ty: T_FLOAT, v: Infinity },
  HUGE_VAL: { ty: T_DOUBLE, v: Infinity },
  NAN: { ty: T_FLOAT, v: NaN },
  DBL_MAX: { ty: T_DOUBLE, v: Number.MAX_VALUE },
  DBL_MIN: { ty: T_DOUBLE, v: 2.2250738585072014e-308 },
  DBL_EPSILON: { ty: T_DOUBLE, v: Number.EPSILON },
  FLT_MAX: { ty: T_FLOAT, v: 3.4028234663852886e38 },
  FLT_EPSILON: { ty: T_FLOAT, v: 1.1920928955078125e-7 },
  CLOCKS_PER_SEC: { ty: T_LONG, v: 1000000 },
};

/** glibc's rand(): the same numbers as g++ on Linux gives for the same seed. */
class GlibcRand {
  private r: number[] = [];
  private k = 0;
  constructor(seed = 1) {
    this.seed(seed);
  }
  seed(seed: number): void {
    const r: number[] = new Array(34);
    seed = seed >>> 0 || 1;
    r[0] = seed | 0;
    for (let i = 1; i < 31; i++) {
      const prev = BigInt(r[i - 1]);
      let v = (16807n * prev) % 2147483647n;
      if (v < 0n) v += 2147483647n;
      r[i] = Number(v);
    }
    for (let i = 31; i < 34; i++) r[i] = r[i - 31];
    const out: number[] = r.slice();
    for (let i = 34; i < 344; i++) out[i] = (out[i - 31] + out[i - 3]) >>> 0;
    this.r = out;
    this.k = 344;
  }
  next(): number {
    const i = this.k++;
    this.r[i] = (this.r[i - 31] + this.r[i - 3]) >>> 0;
    return this.r[i] >>> 1;
  }
}

export function installLibrary(cc: Compiler): Lib & {
  defaultStd: (ty: Ty) => () => any;
  cstring: (p: any) => string;
} {
  const rand = new GlibcRand(1);
  const lib: Lib & { defaultStd: (ty: Ty) => () => any; cstring: (p: any) => string } = {
    makeStr: (s: string) => new CStr(s),
    cstring: cstringOf,
    defaultStd: (ty) => defaultStd(cc, ty as Extract<Ty, { k: "std" }>),
    convert: () => null,
    construct: (fc, ty, args, at) => construct(fc, ty, args, at),
    listInit: (fc, ty, args, at) => listInit(fc, ty, args, at),
    rangeInfo,
    indexStd,
    binaryStd: (fc, op, l, r, at) => stringBinary(fc, op, l, r, at) ?? binaryStd(fc, op, l, r, at),
    compoundStd: (fc, op, l, r, at) => (strip(l.ty).k === "str" ? stringCompound(fc, op, l, r, at) : compoundStd(fc, op, l, r, at)),
    derefStd: (fc, x, at) => derefStd(fc, x, at),
    arrowStd: (fc, base, name, at) => arrowStd(fc, base, name, at),
    incIter,
    streamOut,
    streamIn,

    builtinValue(fc, name, at, qualified) {
      const s = streamValue(fc, name, at);
      if (s) {
        cc.checkStd(name, qualified, at);
        return s;
      }
      if (name === "ios::sync_with_stdio") return null;
      const c = CONSTANTS[name];
      if (c) {
        cc.checkStd(name, qualified, at);
        const v = c.v;
        return { ty: c.ty, ev: () => v, cst: v, line: at.line };
      }
      if (name === "NULL" || name === "nullptr") return { ty: T_NULLPTR, ev: () => null, line: at.line };
      if (name === "string::npos" || name === "npos") return { ty: T_SIZE, ev: () => NPOS, cst: NPOS, line: at.line };
      if (name === "numeric_limits") return null;
      // C library functions used as values: `transform(s.begin(), s.end(), s.begin(), ::toupper)`
      const nf = nativeValue(name);
      if (nf) {
        cc.checkStd(name, qualified, at);
        return { ty: nf.ty, ev: () => nf.func, line: at.line };
      }
      return null;
    },

    callBuiltin(fc, name, e, callee, qualified, hint) {
      void hint;
      const line = e.line;
      const std = (n = name) => cc.checkStd(n, qualified, e);
      // streams: manipulators with arguments, getline, printf family
      const m = manipulatorCall(fc, name, e);
      if (m) {
        std();
        return m;
      }
      switch (name) {
        case "getline":
          std();
          return getlineCall(fc, e);
        case "printf":
          std();
          return printfCall(fc, e);
        case "fprintf": {
          std("printf");
          const target = fc.expr(e.args[0]);
          return printfCall(fc, e, target.name === "cerr" || strip(target.ty).k === "ostream" && target.name !== "cout", 1);
        }
        case "sprintf":
          std("printf");
          return sprintfCall(fc, e, false);
        case "snprintf":
          std("printf");
          return sprintfCall(fc, e, true);
        case "scanf":
          std();
          return scanfCall(fc, e);
        case "puts": {
          std();
          checkArgs(fc, e, name, 1);
          const s = fc.expr(e.args[0]);
          const text = s.lit !== undefined ? () => s.lit! : (fr: Frame) => cstringOf(s.ev(fr));
          return val(T_INT, (fr) => {
            fc.rt.cout.write(`${text(fr)}\n`);
            return 1;
          }, line);
        }
        case "putchar": {
          std();
          const c = fc.coerce(fc.expr(e.args[0]), T_INT, e, "cast").ev;
          return val(T_INT, (fr) => {
            const v = c(fr);
            fc.rt.cout.write(String.fromCharCode(v & 255));
            return v;
          }, line);
        }
        case "getchar": {
          std();
          return val(T_INT, () => {
            const s = fc.rt.cin;
            if (s.pos >= s.data.length) return -1;
            return s.data.charCodeAt(s.pos++);
          }, line);
        }
        case "fflush":
        case "setvbuf":
          e.args.forEach((a) => fc.expr(a));
          return val(T_INT, () => 0, line);
        case "ios::sync_with_stdio":
        case "ios_base::sync_with_stdio":
          e.args.forEach((a) => fc.expr(a));
          return val(T_BOOL, () => true, line);
        case "to_string":
          std();
          return toStringCall(fc, e);
        case "stoi":
        case "stol":
        case "stoll":
        case "stoul":
        case "stoull":
        case "stod":
        case "stof":
        case "atoi":
        case "atol":
        case "atoll":
        case "atof":
          std();
          return stoxCall(fc, name, e);
        case "back_inserter":
          std();
          return backInserterCall(fc, e);
        case "exit":
        case "_Exit":
        case "quick_exit": {
          const c = e.args.length ? fc.coerce(fc.expr(e.args[0]), T_INT, e, "cast").ev : () => 0;
          return val(T_VOID, (fr) => {
            throw new ExitSignal(c(fr));
          }, line);
        }
        case "abort":
          return val(T_VOID, () => {
            throw runtimeError("abort", "the program called abort()", line);
          }, line);
        case "assert": {
          checkArgs(fc, e, name, 1);
          const c = fc.asBool(fc.expr(e.args[0]), e);
          return val(T_VOID, (fr) => {
            if (!c(fr)) throw runtimeError("assert", "assertion failed", line);
          }, line);
        }
        case "rand":
          checkArgs(fc, e, name, 0);
          return val(T_INT, () => rand.next(), line);
        case "srand": {
          checkArgs(fc, e, name, 1);
          const s = fc.coerce(fc.expr(e.args[0]), T_UINT, e, "cast").ev;
          return val(T_VOID, (fr) => rand.seed(s(fr)), line);
        }
        case "time":
        case "clock":
          e.args.forEach((a) => fc.expr(a));
          return val(T_LONG, () => 0, line);
        case "move":
        case "forward": {
          checkArgs(fc, e, name, 1);
          const x = fc.expr(e.args[0]);
          return { ...x, name: x.name ?? "moved", rv: true };
        }
        case "make_pair": {
          std();
          checkArgs(fc, e, name, 2);
          const a = fc.expr(e.args[0]);
          const b = fc.expr(e.args[1]);
          const ta = a.lit !== undefined ? T_STR : noConst(decay(a.ty));
          const tb = b.lit !== undefined ? T_STR : noConst(decay(b.ty));
          const av = fc.copyOf(fc.coerce(a, ta, e, "init"), ta);
          const bv = fc.copyOf(fc.coerce(b, tb, e, "init"), tb);
          return val(pairOf(ta, tb), (fr) => new Pair(av(fr), bv(fr)), line);
        }
        case "tie": {
          std();
          const parts = e.args.map((x) => fc.expr(x));
          parts.forEach((p) => {
            if (!p.set) fc.err("not-lvalue", "tie needs variables to unpack into", e);
          });
          const tys = parts.map((p) => noConst(decay(p.ty)));
          const clones = tys.map((t) => fc.cloner(t));
          return {
            ty: stdTy("tuple", tys),
            ev: () => undefined,
            set: (fr, v: Pair | Tup) => {
              const items = v instanceof Pair ? [v.first, v.second] : v.e;
              if (items.length !== parts.length) throw runtimeError("tie-size", `tie of ${parts.length} variables given ${items.length} values`, line);
              parts.forEach((p, i) => p.set!(fr, clones[i] ? clones[i]!(items[i]) : items[i]));
            },
            tied: true,
            line,
          };
        }
        case "make_tuple": {
          std();
          const parts = e.args.map((x) => fc.expr(x));
          const tys = parts.map((p) => (p.lit !== undefined ? T_STR : noConst(decay(p.ty))));
          const evs = parts.map((p, i) => fc.copyOf(fc.coerce(p, tys[i], e, "init"), tys[i]));
          return val(stdTy("tuple", tys), (fr) => new Tup(evs.map((f) => f(fr))), line);
        }
        case "get": {
          std();
          checkArgs(fc, e, name, 1);
          const idx = callee.targs?.[0];
          if (!idx || idx.k !== "named" || idx.lit === undefined) return fc.err("bad-argument", "write get<0>(x), get<1>(x)…", e);
          const x = fc.expr(e.args[0]);
          const t = strip(x.ty);
          const k = idx.lit;
          if (t.k === "std" && t.name === "pair") {
            if (k > 1) fc.err("bad-argument", "a pair has two parts", e);
            return fc.fieldCE(x.ev, k === 0 ? "first" : "second", t.args[k], e);
          }
          if (t.k === "std" && t.name === "tuple") {
            if (k >= t.args.length) fc.err("bad-argument", `this tuple has ${t.args.length} parts`, e);
            const ev = x.ev;
            const ty = t.args[k];
            if (isClassLike(ty)) return { ty, ev: (fr) => ev(fr).e[k], line };
            return { ty, ev: (fr) => ev(fr).e[k], lv: (fr) => new ElemPlace(ev(fr).e, k), set: (fr, v) => void (ev(fr).e[k] = v), line };
          }
          return fc.err("bad-argument", "get needs a pair or a tuple", e);
        }
        case "numeric_limits::max":
        case "numeric_limits::min":
        case "numeric_limits::lowest":
        case "numeric_limits::infinity":
        case "numeric_limits::epsilon":
        case "numeric_limits::quiet_NaN": {
          std("numeric_limits");
          const ty = cc.resolveType(callee.targs![0], fc);
          return numericLimit(fc, name.split("::")[1], ty, e);
        }
        case "memset": {
          std();
          return memsetCall(fc, e);
        }
        case "memcpy":
        case "memmove":
          return memcpyCall(fc, e);
        case "abs":
        case "labs":
        case "llabs":
        case "fabs":
        case "fabsl":
        case "fabsf": {
          std();
          checkArgs(fc, e, name, 1);
          const x = fc.expr(e.args[0]);
          const t = strip(x.ty);
          if (!isArithmetic(t)) return fc.err("bad-argument", `${name} needs a number, not ${tyStr(x.ty)}`, e, { name, type: tyStr(x.ty) });
          if (isFloating(t) || name.startsWith("fabs")) {
            const ct = t.k === "float" ? T_FLOAT : T_DOUBLE;
            const ev = fc.coerce(x, ct, e, "cast").ev;
            return val(ct, (fr) => Math.abs(ev(fr)), line);
          }
          const pt = promote(t);
          const ev = fc.coerce(x, pt, e, "cast").ev;
          if (strip(pt).k === "int" && (strip(pt) as { bits: number }).bits === 64) return val(pt, (fr) => I.toInt((ev(fr) as number) < 0 ? I.negS(ev(fr)) : ev(fr), 64, true), line);
          return val(pt, (fr) => {
            const v = ev(fr);
            return v < 0 ? -v | 0 : v;
          }, line);
        }
        case "__builtin_popcount":
        case "__builtin_popcountll":
        case "__builtin_clz":
        case "__builtin_clzll":
        case "__builtin_ctz":
        case "__builtin_ctzll":
        case "__builtin_parity":
        case "__builtin_parityll":
        case "__builtin_ffs":
        case "__builtin_ffsll":
        case "__lg": {
          checkArgs(fc, e, name, 1);
          const wide = name.endsWith("ll") || name === "__lg";
          const bitsN = wide ? 64 : 32;
          const x = fc.coerce(fc.expr(e.args[0]), wide ? T_ULL : T_UINT, e, "cast").ev;
          const kind = name.replace("__builtin_", "").replace(/ll$/, "");
          return val(T_INT, (fr) => {
            let b = BigInt(x(fr) as number | bigint);
            if (kind === "popcount" || kind === "parity") {
              let n = 0;
              for (; b > 0n; b >>= 1n) if (b & 1n) n++;
              return kind === "parity" ? n & 1 : n;
            }
            if (b === 0n) return kind === "ffs" ? 0 : kind === "__lg" ? -1 : bitsN;
            if (kind === "clz") return bitsN - b.toString(2).length;
            if (kind === "__lg") return b.toString(2).length - 1;
            let n = 0;
            while (!(b & 1n)) {
              b >>= 1n;
              n++;
            }
            return kind === "ffs" ? n + 1 : n;
          }, line);
        }
        case "pow":
        case "powl":
        case "powf": {
          std("pow");
          checkArgs(fc, e, name, 2);
          const a = fc.coerce(fc.expr(e.args[0]), T_DOUBLE, e, "cast").ev;
          const b = fc.coerce(fc.expr(e.args[1]), T_DOUBLE, e, "cast").ev;
          return val(T_DOUBLE, (fr) => Math.pow(a(fr), b(fr)), line);
        }
        case "atan2":
        case "fmod":
        case "hypot":
        case "fmax":
        case "fmin": {
          std("sqrt");
          checkArgs(fc, e, name, 2);
          const a = fc.coerce(fc.expr(e.args[0]), T_DOUBLE, e, "cast").ev;
          const b = fc.coerce(fc.expr(e.args[1]), T_DOUBLE, e, "cast").ev;
          const f: Record<string, (x: number, y: number) => number> = { atan2: Math.atan2, fmod: (x, y) => x % y, hypot: Math.hypot, fmax: Math.max, fmin: Math.min };
          const g = f[name];
          return val(T_DOUBLE, (fr) => g(a(fr), b(fr)), line);
        }
        case "isnan":
        case "isinf": {
          std("sqrt");
          const a = fc.coerce(fc.expr(e.args[0]), T_DOUBLE, e, "cast").ev;
          return val(T_BOOL, name === "isnan" ? (fr) => Number.isNaN(a(fr)) : (fr) => {
            const v = a(fr);
            return v === Infinity || v === -Infinity;
          }, line);
        }
        case "lround":
        case "llround": {
          std("sqrt");
          const a = fc.coerce(fc.expr(e.args[0]), T_DOUBLE, e, "cast").ev;
          return val(T_LONG, (fr) => I.fromDouble(mathFns1.round(a(fr)), 64, true), line);
        }
      }
      // sqrtl, floorf … : the long double / float spellings of the same functions
      const base = /^[a-z0-9]+[lf]$/.test(name) && !mathFns1[name] ? name.slice(0, -1) : name;
      if (mathFns1[base]) {
        std("sqrt");
        checkArgs(fc, e, name, 1);
        const x = fc.expr(e.args[0]);
        if (!isArithmetic(strip(x.ty))) return fc.err("bad-argument", `${name} needs a number, not ${tyStr(x.ty)}`, e, { name, type: tyStr(x.ty) });
        const ct = name !== base && name.endsWith("f") ? T_FLOAT : name !== base ? T_DOUBLE : strip(x.ty).k === "float" ? T_FLOAT : T_DOUBLE;
        const ev = fc.coerce(x, ct, e, "cast").ev;
        const f = mathFns1[base];
        return val(ct, ct.k === "float" ? (fr) => Math.fround(f(ev(fr))) : (fr) => f(ev(fr)), line);
      }
      // character and C string functions
      const ct = ctypeCall(fc, name, e);
      if (ct) {
        std();
        return ct;
      }
      const cs = cStringCall(fc, name, e);
      if (cs) {
        std();
        return cs;
      }
      // algorithms, min, max, swap, gcd …
      const alg = algorithmCall(fc, name, e) ?? moreAlgorithms(fc, name, e);
      if (alg) {
        std(["gcd", "lcm", "accumulate", "iota", "partial_sum", "inner_product", "inclusive_scan", "exclusive_scan", "adjacent_difference", "reduce"].includes(name) ? "accumulate" : name === "min" || name === "max" || name === "swap" || name === "move" || name === "distance" || name === "next" || name === "prev" || name === "advance" ? "cout" : "sort");
        return alg;
      }
      return null;
    },

    methodCall(fc, obj, name, e, arrow) {
      void arrow;
      const t = strip(obj.ty);
      if (t.k === "str") return stringMethod(fc, obj, name, e);
      if (t.k === "ostream" || t.k === "istream" || t.k === "sstream") return streamMethod(fc, obj, name, e);
      if (t.k === "std") return containerMethod(fc, obj, name, e);
      return null;
    },

    newExpr(fc, e) {
      const base = cc.resolveType(e.type, fc);
      const line = e.line;
      if (e.array) {
        const n = numArg(fc, fc.expr(e.array), e);
        const zero = e.args.length === 0 && e.brace ? true : false;
        const maker = cc.defaultMaker(base, zero || isClassLike(base));
        const rt = fc.rt;
        return val(ptrTo(base), (fr) => {
          const k = n(fr);
          if (k < 0) throw runtimeError("length-error", "negative array size", line);
          rt.mem += k * 8;
          if (rt.mem > rt.memLimit) throw runtimeError("memory", "the program used too much memory", line);
          const a = new Array(k);
          for (let i = 0; i < k; i++) a[i] = maker();
          return new ElemPlace(a, 0);
        }, line);
      }
      const t = strip(base);
      if (isClassLike(base) || t.k === "cls") {
        const made = fc.constructObject(base, e.args, e.brace, e);
        const assign = fc.assigner(base);
        const mev = made.ev;
        return val(ptrTo(base), (fr) => new ObjPlace(mev(fr), assign), line);
      }
      const init = e.args.length ? fc.coerce(fc.expr(e.args[0], base), base, e, "init").ev : null;
      const maker = cc.defaultMaker(base, true);
      return val(ptrTo(base), (fr) => new BoxPlace(init ? init(fr) : maker()), line);
    },

    deleteExpr(fc, e) {
      const p = fc.expr(e.e);
      const ev = p.ev;
      const pt = strip(p.ty);
      const to = pt.k === "ptr" ? strip(pt.to) : null;
      const rt = fc.rt;
      const line = e.line;
      if (to && to.k === "cls" && classDestroys(to.cls.info as ClassInfo)) {
        const info = to.cls.info as ClassInfo;
        if (e.array) {
          return val(T_VOID, (fr) => {
            const q = ev(fr);
            if (q instanceof ElemPlace) for (let i = q.arr.length - 1; i >= q.i; i--) if (q.arr[i] !== undefined) deleteObject(rt, info, q.arr[i], line);
          }, line);
        }
        return val(T_VOID, (fr) => {
          const q = ev(fr);
          if (q === null) return;
          deleteObject(rt, info, q instanceof ObjPlace ? q.o : q instanceof ElemPlace ? q.arr[q.i] : q, line);
        }, line);
      }
      // delete of a plain value: nothing runs, but deleting the same memory twice crashes real programs
      return val(T_VOID, (fr) => {
        const q = ev(fr);
        if (q === null || q === undefined) return;
        const owner: any = q instanceof ElemPlace ? q.arr : q;
        if (owner.__dead) throw runtimeError("double-delete", "this memory was already deleted", line);
        owner.__dead = true;
      }, line);
    },
  };
  return lib;
}

const nativeCache = new Map<string, { ty: Ty; func: Func }>();

/** A few C functions as callable values (an `int(int)` or `double(double)`). */
function nativeValue(name: string): { ty: Ty; func: Func } | null {
  const hit = nativeCache.get(name);
  if (hit) return hit;
  let impl: ((...a: any[]) => any) | null = null;
  let ty: Ty | null = null;
  const ii: Ty = { k: "fn", ret: T_INT, params: [T_INT] };
  const dd: Ty = { k: "fn", ret: T_DOUBLE, params: [T_DOUBLE] };
  if (CTYPE[name]) {
    const [test, mask] = CTYPE[name];
    impl = (c: number) => (test(c & 255) ? mask : 0);
    ty = ii;
  } else if (name === "toupper") {
    impl = (c: number) => (c >= 97 && c <= 122 ? c - 32 : c);
    ty = ii;
  } else if (name === "tolower") {
    impl = (c: number) => (c >= 65 && c <= 90 ? c + 32 : c);
    ty = ii;
  } else if (name === "abs") {
    impl = (c: number) => Math.abs(c) | 0;
    ty = ii;
  } else if (mathFns1[name]) {
    impl = mathFns1[name];
    ty = dd;
  }
  if (!impl || !ty) return null;
  const native = impl;
  const info = { id: -1, name, qname: name, ret: (ty as { ret: Ty }).ret, retRef: false, params: [], cls: null, isMethod: false, isStatic: false, isCtor: false, isDtor: false, isVirtual: false, isPure: false, isConst: false, access: "public", decl: null, tparams: [], instances: new Map(), nslots: 0, code: null, fast: null, compiled: true, compiling: false, native, captures: [], line: 0 } as unknown as FnInfo;
  const out = { ty, func: new Func(info, []) };
  nativeCache.set(name, out);
  return out;
}

function numericLimit(fc: FnCompiler, which: string, ty: Ty, e: Loc): CE {
  const t = strip(ty);
  const line = e.line;
  const lit = (v: any): CE => ({ ty, ev: () => v, cst: v, line });
  if (t.k === "int") {
    const bits = BigInt(t.bits);
    const max = t.signed ? (1n << (bits - 1n)) - 1n : (1n << bits) - 1n;
    const min = t.signed ? -(1n << (bits - 1n)) : 0n;
    const norm = (b: bigint): any => (t.bits === 64 ? (b >= -9007199254740991n && b <= 9007199254740991n ? Number(b) : b) : Number(b));
    if (which === "max") return lit(norm(max));
    if (which === "min" || which === "lowest") return lit(norm(min));
    return lit(0);
  }
  if (t.k === "bool") return lit(which === "max");
  if (t.k === "double" || t.k === "float") {
    const f32 = t.k === "float";
    switch (which) {
      case "max":
        return lit(f32 ? 3.4028234663852886e38 : Number.MAX_VALUE);
      case "min":
        return lit(f32 ? 1.1754943508222875e-38 : 2.2250738585072014e-308);
      case "lowest":
        return lit(f32 ? -3.4028234663852886e38 : -Number.MAX_VALUE);
      case "infinity":
        return lit(Infinity);
      case "epsilon":
        return lit(f32 ? 1.1920928955078125e-7 : Number.EPSILON);
      case "quiet_NaN":
        return lit(NaN);
    }
  }
  return fc.err("bad-argument", `numeric_limits<${tyStr(ty)}> is not supported`, e, { type: tyStr(ty) });
}

function elemSize(t: Ty): number {
  const s = strip(t);
  if (s.k === "int") return s.bits / 8;
  if (s.k === "bool") return 1;
  if (s.k === "double") return 8;
  if (s.k === "float") return 4;
  return 8;
}

function memsetCall(fc: FnCompiler, e: Call): CE {
  checkArgs(fc, e, "memset", 3);
  const dest = fc.expr(e.args[0]);
  const c = fc.coerce(fc.expr(e.args[1]), T_INT, e, "cast").ev;
  const n = numArg(fc, fc.expr(e.args[2]), e);
  const dt = strip(dest.ty);
  // The element type decides what the repeated byte means.
  let leaf: Ty = dt.k === "arr" ? dt.of : dt.k === "ptr" ? dt.to : T_CHAR;
  while (strip(leaf).k === "arr") leaf = (strip(leaf) as { of: Ty }).of;
  const size = elemSize(leaf);
  const lt = strip(leaf);
  const dv = dest.ev;
  return val(dest.ty, (fr) => {
    const b = c(fr) & 255;
    const bytes = n(fr);
    let fillValue: any;
    if (lt.k === "double" || lt.k === "float") {
      if (b !== 0) throw runtimeError("memset-float", "memset can only zero floating-point numbers here", e.line);
      fillValue = 0;
    } else if (lt.k === "bool") fillValue = b !== 0;
    else if (lt.k === "int") {
      let v = 0n;
      for (let i = 0; i < size; i++) v = (v << 8n) | BigInt(b);
      fillValue = lt.signed ? BigInt.asIntN(lt.bits, v) : BigInt.asUintN(lt.bits, v);
      fillValue = lt.bits === 64 ? (fillValue >= -9007199254740991n && fillValue <= 9007199254740991n ? Number(fillValue) : fillValue) : Number(fillValue);
    } else fillValue = b === 0 ? null : undefined;
    const target = dv(fr);
    const flat = (arr: any[], from: number, count: number) => {
      let left = count;
      const walk = (a: any[], start: number) => {
        for (let i = start; i < a.length && left > 0; i++) {
          if (Array.isArray(a[i])) walk(a[i], 0);
          else {
            a[i] = fillValue;
            left--;
          }
        }
      };
      walk(arr, from);
    };
    const count = Math.floor(bytes / size);
    if (Array.isArray(target)) flat(target, 0, count);
    else if (target instanceof ElemPlace) flat(target.arr, target.i, count);
    return target;
  }, e.line);
}

function memcpyCall(fc: FnCompiler, e: Call): CE {
  checkArgs(fc, e, "memcpy", 3);
  const dest = fc.expr(e.args[0]);
  const src = fc.expr(e.args[1]);
  const n = numArg(fc, fc.expr(e.args[2]), e);
  const dt = strip(dest.ty);
  const leaf: Ty = dt.k === "arr" ? dt.of : dt.k === "ptr" ? dt.to : T_CHAR;
  const size = elemSize(leaf);
  const dv = dest.ev;
  const sv = src.ev;
  const place = (v: any) => (Array.isArray(v) ? new ElemPlace(v, 0) : (v as ElemPlace));
  return val(dest.ty, (fr) => {
    const d = place(dv(fr));
    const s = place(sv(fr));
    const count = Math.floor(n(fr) / size);
    const copy = s.arr.slice(s.i, s.i + count);
    for (let i = 0; i < copy.length; i++) d.arr[d.i + i] = copy[i];
    return dv(fr);
  }, e.line);
}

export { CppError, T_VOID, commonType, isIntegral, elemValue };
export type { ClassInfo, Expr };
