/** The types of the C++ the runner understands, after names have been resolved. */

export interface ClassRef {
  name: string;
  /** Filled in by the compiler; opaque here. */
  info: unknown;
}

export type Ty = (
  | { k: "void" }
  | { k: "bool" }
  | { k: "int"; bits: 8 | 16 | 32 | 64; signed: boolean; name: string; ch?: boolean }
  | { k: "float" }
  | { k: "double" }
  | { k: "ptr"; to: Ty }
  | { k: "ref"; to: Ty; rv?: boolean }
  | { k: "arr"; of: Ty; n: number }
  | { k: "str" }
  | { k: "nullptr" }
  | { k: "enum"; name: string; scoped: boolean }
  | { k: "cls"; cls: ClassRef }
  /** An instance of a standard class template: vector<int>, map<string,int>, pair<int,int> … */
  | { k: "std"; name: string; args: Ty[]; n?: number; cmp?: Ty }
  | { k: "fn"; ret: Ty; params: Ty[] }
  | { k: "ostream" }
  | { k: "istream" }
  /** std::stringstream, istringstream, ostringstream: one object that reads and writes. */
  | { k: "sstream" }
  /** A stream manipulator (endl, setw(5)…). */
  | { k: "manip" }
  /** An iterator into a container of this type. */
  | { k: "iter"; of: Ty; reverse?: boolean }
  | { k: "tparam"; name: string }
) & { c?: boolean };

const mk = <T extends Ty>(t: T): T => t;

export const T_VOID: Ty = mk({ k: "void" });
export const T_BOOL: Ty = mk({ k: "bool" });
export const T_CHAR: Ty = mk({ k: "int", bits: 8, signed: true, name: "char", ch: true });
export const T_SCHAR: Ty = mk({ k: "int", bits: 8, signed: true, name: "signed char", ch: true });
export const T_UCHAR: Ty = mk({ k: "int", bits: 8, signed: false, name: "unsigned char", ch: true });
export const T_SHORT: Ty = mk({ k: "int", bits: 16, signed: true, name: "short" });
export const T_USHORT: Ty = mk({ k: "int", bits: 16, signed: false, name: "unsigned short" });
export const T_INT: Ty = mk({ k: "int", bits: 32, signed: true, name: "int" });
export const T_UINT: Ty = mk({ k: "int", bits: 32, signed: false, name: "unsigned int" });
export const T_LONG: Ty = mk({ k: "int", bits: 64, signed: true, name: "long" });
export const T_ULONG: Ty = mk({ k: "int", bits: 64, signed: false, name: "unsigned long" });
export const T_LL: Ty = mk({ k: "int", bits: 64, signed: true, name: "long long" });
export const T_ULL: Ty = mk({ k: "int", bits: 64, signed: false, name: "unsigned long long" });
export const T_FLOAT: Ty = mk({ k: "float" });
export const T_DOUBLE: Ty = mk({ k: "double" });
export const T_STR: Ty = mk({ k: "str" });
export const T_NULLPTR: Ty = mk({ k: "nullptr" });
export const T_OSTREAM: Ty = mk({ k: "ostream" });
export const T_ISTREAM: Ty = mk({ k: "istream" });
export const T_SSTREAM: Ty = mk({ k: "sstream" });
export const T_MANIP: Ty = mk({ k: "manip" });
/** `size_t`, the type of `.size()` and `sizeof`. */
export const T_SIZE = T_ULONG;

export const BUILTIN_TYPE_NAMES: Record<string, Ty> = {
  void: T_VOID,
  bool: T_BOOL,
  char: T_CHAR,
  "signed char": T_SCHAR,
  "unsigned char": T_UCHAR,
  short: T_SHORT,
  "unsigned short": T_USHORT,
  int: T_INT,
  "unsigned int": T_UINT,
  long: T_LONG,
  "unsigned long": T_ULONG,
  "long long": T_LL,
  "unsigned long long": T_ULL,
  float: T_FLOAT,
  double: T_DOUBLE,
  "long double": T_DOUBLE,
};

/** Type names that live in the global namespace (stdint and friends). */
export const GLOBAL_TYPE_ALIASES: Record<string, Ty> = {
  size_t: T_ULONG,
  ptrdiff_t: T_LONG,
  int8_t: T_SCHAR,
  uint8_t: T_UCHAR,
  int16_t: T_SHORT,
  uint16_t: T_USHORT,
  int32_t: T_INT,
  uint32_t: T_UINT,
  int64_t: T_LONG,
  uint64_t: T_ULONG,
  intptr_t: T_LONG,
  uintptr_t: T_ULONG,
  time_t: T_LONG,
  clock_t: T_LONG,
  wchar_t: T_INT,
};

export const withConst = (t: Ty, c = true): Ty => (!!t.c === c ? t : { ...t, c });
export const noConst = (t: Ty): Ty => (t.c ? { ...t, c: false } : t);

export const isInt = (t: Ty): t is Extract<Ty, { k: "int" }> => t.k === "int";
export const isIntegral = (t: Ty): boolean => t.k === "int" || t.k === "bool" || t.k === "enum";
export const isFloating = (t: Ty): boolean => t.k === "float" || t.k === "double";
export const isArithmetic = (t: Ty): boolean => isIntegral(t) || isFloating(t);
export const isScalar = (t: Ty): boolean => isArithmetic(t) || t.k === "ptr" || t.k === "nullptr" || t.k === "fn";
/** Types whose values are heap objects with identity: references to them are the objects themselves. */
export const isClassLike = (t: Ty): boolean => t.k === "str" || t.k === "cls" || t.k === "std" || t.k === "arr";

export function strip(t: Ty): Ty {
  return t.k === "ref" ? strip(t.to) : t;
}

/** The type with references and top-level const removed (what `auto` deduces). */
export function decay(t: Ty): Ty {
  const s = strip(t);
  if (s.k === "arr") return { k: "ptr", to: s.of };
  return noConst(s);
}

export function tyStr(t: Ty): string {
  const c = t.c ? "const " : "";
  switch (t.k) {
    case "void":
    case "bool":
    case "float":
    case "double":
      return c + t.k;
    case "int":
      return c + t.name;
    case "ptr":
      return `${tyStr(t.to)}*${t.c ? " const" : ""}`;
    case "ref":
      return `${tyStr(t.to)}&`;
    case "arr":
      return `${tyStr(t.of)}[${t.n}]`;
    case "str":
      return `${c}std::string`;
    case "nullptr":
      return "std::nullptr_t";
    case "enum":
      return c + t.name;
    case "cls":
      return c + t.cls.name;
    case "std": {
      const a = t.args.map(tyStr);
      if (t.n !== undefined) a.push(String(t.n));
      return `${c}std::${t.name}<${a.join(", ")}>`;
    }
    case "fn":
      return `${tyStr(t.ret)}(${t.params.map(tyStr).join(", ")})`;
    case "ostream":
      return "std::ostream";
    case "istream":
      return "std::istream";
    case "sstream":
      return "std::stringstream";
    case "manip":
      return "manipulator";
    case "iter":
      return `${tyStr(t.of)}::iterator`;
    case "tparam":
      return t.name;
  }
}

/** Same type, ignoring const and references. */
export function sameType(a: Ty, b: Ty): boolean {
  a = strip(a);
  b = strip(b);
  if (a.k !== b.k) return false;
  switch (a.k) {
    case "int": {
      const y = b as typeof a;
      return a.bits === y.bits && a.signed === y.signed && !!a.ch === !!y.ch;
    }
    case "ptr":
      return sameType(a.to, (b as typeof a).to);
    case "arr": {
      const y = b as typeof a;
      return a.n === y.n && sameType(a.of, y.of);
    }
    case "enum":
      return a.name === (b as typeof a).name;
    case "cls":
      return a.cls === (b as typeof a).cls;
    case "std": {
      const y = b as typeof a;
      return a.name === y.name && a.n === y.n && a.args.length === y.args.length && a.args.every((x, i) => sameType(x, y.args[i])) && (!a.cmp && !y.cmp ? true : !!a.cmp && !!y.cmp && sameType(a.cmp, y.cmp));
    }
    case "fn": {
      const y = b as typeof a;
      return sameType(a.ret, y.ret) && a.params.length === y.params.length && a.params.every((x, i) => sameType(x, y.params[i]));
    }
    case "iter":
      return sameType(a.of, (b as typeof a).of) && !!a.reverse === !!(b as typeof a).reverse;
    case "tparam":
      return a.name === (b as typeof a).name;
    default:
      return true;
  }
}

/** Integral promotion: anything smaller than int becomes int. */
export function promote(t: Ty): Ty {
  if (t.k === "bool") return T_INT;
  if (t.k === "enum") return T_INT;
  if (t.k === "int" && t.bits < 32) return T_INT;
  return noConst(t);
}

/** The usual arithmetic conversions: the type both operands of `a + b` are converted to. */
export function commonType(a: Ty, b: Ty): Ty {
  a = promote(strip(a));
  b = promote(strip(b));
  if (a.k === "double" || b.k === "double") return T_DOUBLE;
  if (a.k === "float" || b.k === "float") return T_FLOAT;
  if (a.k !== "int" || b.k !== "int") return T_INT;
  if (a.bits === b.bits && a.signed === b.signed) return a.name === "long long" || a.name === "unsigned long long" ? a : b.name === "long long" || b.name === "unsigned long long" ? b : a;
  if (a.signed === b.signed) return a.bits > b.bits ? a : b;
  const [u, s] = a.signed ? [b, a] : [a, b];
  if (u.bits >= s.bits) return u;
  return s;
}

export const ptrTo = (t: Ty): Ty => ({ k: "ptr", to: t });
export const refTo = (t: Ty): Ty => ({ k: "ref", to: t });
export const stdTy = (name: string, args: Ty[], extra: { n?: number; cmp?: Ty } = {}): Ty => ({ k: "std", name, args, ...extra });
export const vectorOf = (t: Ty): Ty => stdTy("vector", [t]);
export const pairOf = (a: Ty, b: Ty): Ty => stdTy("pair", [a, b]);
export const fnTy = (ret: Ty, params: Ty[]): Ty => ({ k: "fn", ret, params });
