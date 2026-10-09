import { CppError, semanticError, unsupported } from "./errors";
import type { ClassDecl, EnumDecl, Expr, FuncDecl, Loc, Program, TypeSpec } from "./ast";
import { Op, type ClassInfo, type FieldInfo, type FnInfo, type Frame, type Instr, type Label, type ParamInfo, type VarInfo } from "./core";
import { cloneFn, needsClone, type Conv } from "./conv";
import { abstractMethods, destroyerOf, vtable } from "./lifetime";
import { FnCompiler } from "./fncompiler";
import { installLibrary } from "./lib";
import { CStr, Func, SStream, type Rt } from "./values";
import {
  BUILTIN_TYPE_NAMES,
  GLOBAL_TYPE_ALIASES,
  T_BOOL,
  T_DOUBLE,
  T_INT,
  T_ISTREAM,
  T_SSTREAM,
  T_OSTREAM,
  T_STR,
  T_VOID,
  decay,
  noConst,
  stdTy,
  strip,
  sameType,
  tyStr,
  withConst,
  type Ty,
} from "./types";

/**
 * The program as a whole: which names mean what, and the compiled form of every function.
 */

/** Names of the standard library and the headers that provide them; `bits/stdc++.h` provides all. */
// <iostream> and <string> include <cctype> in libstdc++, so g++ accepts isdigit/toupper without it
const CTYPE_HEADERS = ["cctype", "ctype.h", "iostream", "string", "sstream", "istream", "ostream", "iomanip"];

const NEEDS_HEADER: Record<string, string[]> = {
  cout: ["iostream"],
  cin: ["iostream"],
  cerr: ["iostream"],
  endl: ["iostream", "ostream"],
  // libstdc++ pulls some headers in through others (<queue> includes <vector> and <deque>, C++17 <functional> includes <vector> and <algorithm>); g++ accepts programs that rely on it
  vector: ["vector", "queue", "functional"],
  map: ["map"],
  multimap: ["map"],
  set: ["set"],
  multiset: ["set"],
  unordered_map: ["unordered_map"],
  unordered_set: ["unordered_set"],
  queue: ["queue"],
  priority_queue: ["queue"],
  stack: ["stack"],
  deque: ["deque", "queue", "stack"],
  array: ["array"],
  bitset: ["bitset"],
  tuple: ["tuple", "map", "functional", "unordered_map"],
  function: ["functional"],
  setw: ["iomanip"],
  setprecision: ["iomanip"],
  setfill: ["iomanip"],
  sort: ["algorithm", "functional"],
  reverse: ["algorithm", "functional"],
  unique: ["algorithm", "functional"],
  lower_bound: ["algorithm", "functional"],
  upper_bound: ["algorithm", "functional"],
  binary_search: ["algorithm", "functional"],
  next_permutation: ["algorithm", "functional"],
  prev_permutation: ["algorithm", "functional"],
  accumulate: ["numeric"],
  iota: ["numeric"],
  gcd: ["numeric"],
  lcm: ["numeric"],
  sqrt: ["cmath", "math.h"],
  pow: ["cmath", "math.h"],
  floor: ["cmath", "math.h"],
  ceil: ["cmath", "math.h"],
  fabs: ["cmath", "math.h"],
  INT_MAX: ["climits", "limits.h"],
  INT_MIN: ["climits", "limits.h"],
  LLONG_MAX: ["climits", "limits.h"],
  LLONG_MIN: ["climits", "limits.h"],
  printf: ["cstdio", "stdio.h"],
  scanf: ["cstdio", "stdio.h"],
  puts: ["cstdio", "stdio.h"],
  getchar: ["cstdio", "stdio.h"],
  memset: ["cstring", "string.h"],
  strlen: ["cstring", "string.h"],
  toupper: CTYPE_HEADERS,
  tolower: CTYPE_HEADERS,
  isdigit: CTYPE_HEADERS,
  isalpha: CTYPE_HEADERS,
  isalnum: CTYPE_HEADERS,
  isspace: CTYPE_HEADERS,
  isupper: CTYPE_HEADERS,
  islower: CTYPE_HEADERS,
  isxdigit: CTYPE_HEADERS,
  isprint: CTYPE_HEADERS,
  ispunct: CTYPE_HEADERS,
  isgraph: CTYPE_HEADERS,
  isblank: CTYPE_HEADERS,
  iscntrl: CTYPE_HEADERS,
  numeric_limits: ["limits"],
  stringstream: ["sstream"],
  istringstream: ["sstream"],
  ostringstream: ["sstream"],
};

/** Standard names that need no `std::` and no using-declaration (the C library). */
const C_LIBRARY = new Set([
  "printf", "scanf", "puts", "getchar", "putchar", "sqrt", "pow", "floor", "ceil", "fabs", "sin", "cos", "tan", "atan", "atan2", "exp", "log", "log10", "log2", "round", "trunc", "fmod", "cbrt", "hypot",
  "abs", "labs", "llabs", "rand", "srand", "exit", "memset", "memcpy", "strlen", "strcmp", "strcpy", "strcat", "toupper", "tolower", "isdigit", "isalpha", "isalnum", "isspace", "isupper", "islower", "isxdigit", "isprint", "ispunct", "isgraph", "isblank", "iscntrl",
  "INT_MAX", "INT_MIN", "LLONG_MAX", "LLONG_MIN", "UINT_MAX", "ULLONG_MAX", "LONG_MAX", "LONG_MIN", "SHRT_MAX", "SHRT_MIN", "CHAR_BIT", "RAND_MAX", "M_PI", "M_E", "EOF", "NULL", "DBL_MAX", "DBL_MIN", "FLT_MAX", "DBL_EPSILON",
  "assert", "atoi", "atol", "atoll", "atof", "fflush", "stdout", "stdin", "stderr", "puts", "getchar", "strncmp", "strchr", "strstr", "memcmp", "clock", "time", "CLOCKS_PER_SEC", "ceill", "floorl", "sqrtl", "fabsl", "powl", "isinf", "isnan",
  "clamp", "__builtin_popcount", "__builtin_popcountll", "__builtin_clz", "__builtin_clzll", "__builtin_ctz", "__builtin_ctzll", "__builtin_parity", "__builtin_parityll", "__builtin_ffs", "__builtin_ffsll", "__lg", "__gcd",
]);

export interface ProgramCode {
  main: FnInfo;
  init: FnInfo | null;
  /** Names the program defined, for tests. */
  fns: FnInfo[];
}

export class Compiler {
  readonly G: Frame = [];
  readonly aliases = new Map<string, Ty>();
  readonly classes = new Map<string, ClassInfo>();
  readonly classTemplates = new Map<string, ClassDecl>();
  readonly classInstances = new Map<string, ClassInfo>();
  readonly enums = new Map<string, Ty>();
  readonly globals = new Map<string, VarInfo>();
  readonly funcs = new Map<string, FnInfo[]>();
  readonly funcTemplates = new Map<string, FnInfo[]>();
  readonly allFns: FnInfo[] = [];
  readonly includes: Set<string>;
  readonly usingNames: Set<string>;
  usingStd: boolean;
  private nextId = 1;
  private lambdaCount = 0;
  /** Template parameters bound while an instance is compiled. */
  tsubst: Map<string, Ty> | null = null;
  /** Compile-time work queued while registering (bodies are compiled after all signatures are known). */
  private pending: (() => void)[] = [];
  lib: ReturnType<typeof installLibrary>;
  private initFc: FnCompiler | null = null;

  constructor(
    readonly rt: Rt,
    private readonly program: Program,
  ) {
    this.includes = new Set(program.includes);
    this.usingNames = new Set();
    this.usingStd = program.usingStd;
    this.lib = installLibrary(this);
  }

  /* ----------------------------------- errors ------------------------------------ */

  err(code: string, message: string, at: Loc, args: Record<string, string | number> = {}): never {
    throw semanticError(code, message, at.line, at.col, args);
  }
  unsupported(feature: string, at: Loc): never {
    throw unsupported(feature, at.line, at.col);
  }

  /* --------------------------------- visibility ---------------------------------- */

  /** Is this standard name usable here? `std::name` always is; a bare name needs `using namespace std`. */
  checkStd(name: string, qualified: boolean, at: Loc): void {
    if (!qualified && !this.usingStd && !this.usingNames.has(name) && !C_LIBRARY.has(name) && !(name in GLOBAL_TYPE_ALIASES)) {
      this.err("missing-std", `'${name}' was not declared: write std::${name}, or put "using namespace std;" after the #include lines`, at, { name });
    }
    const headers = NEEDS_HEADER[name];
    if (headers && !this.includes.has("bits/stdc++.h") && !headers.some((h) => this.includes.has(h)) && !(name === "endl" && this.includes.has("iomanip"))) {
      this.err("missing-include", `'${name}' needs #include <${headers[0]}>`, at, { name, header: headers[0] });
    }
  }

  /* ------------------------------------ types ------------------------------------ */

  resolveType(spec: TypeSpec, fc: FnCompiler | null = null): Ty {
    switch (spec.k) {
      case "auto":
        return { k: "tparam", name: "auto", c: spec.const };
      case "decltype": {
        if (!fc) this.err("bad-decltype", "decltype is only supported inside functions", spec);
        return fc.typeOfExpr(spec.expr);
      }
      case "ptr": {
        const to = this.resolveType(spec.to, fc);
        return { k: "ptr", to, c: spec.const || undefined };
      }
      case "ref": {
        const to = this.resolveType(spec.to, fc);
        // `T&&` on a concrete type only binds to temporaries and std::move(x)
        return spec.rvalue && to.k !== "tparam" ? { k: "ref", to, rv: true } : { k: "ref", to };
      }
      case "named":
        return this.resolveNamed(spec, fc);
    }
  }

  private resolveNamed(spec: Extract<TypeSpec, { k: "named" }>, fc: FnCompiler | null): Ty {
    const apply = (t: Ty) => (spec.const ? withConst(t) : t);
    const raw = spec.name;
    if (raw === "#const") return { k: "tparam", name: `#${spec.lit ?? "?"}` };
    if (raw === "#array") {
      const inner = this.resolveType(spec.args[0], fc);
      const n = spec.expr && fc ? fc.constantInt(spec.expr) : -1;
      return { k: "arr", of: inner, n };
    }
    const sub = this.tsubst?.get(raw);
    if (sub) return apply(sub);
    const qualified = raw.startsWith("std::");
    const name = qualified ? raw.slice(5) : raw;
    if (name.includes("::")) {
      const nested = this.classes.get(name.replace(/::/g, "_"));
      if (nested) return apply(nested.ty);
      this.err("unknown-type", `unknown type '${raw}'`, spec, { name: raw });
    }
    const builtin = BUILTIN_TYPE_NAMES[name];
    if (builtin && !qualified) return apply(builtin);
    const alias = this.aliases.get(name);
    if (alias && !qualified) return apply(alias);
    const cls = this.classes.get(name);
    if (cls && !qualified) return apply(cls.ty);
    if (this.classTemplates.has(name) && !qualified) {
      const targs = spec.args.map((a) => this.resolveType(a, fc));
      return apply(this.instantiateClass(name, targs, spec).ty);
    }
    const en = this.enums.get(name);
    if (en && !qualified) return apply(en);
    if (GLOBAL_TYPE_ALIASES[name] && !qualified) return apply(GLOBAL_TYPE_ALIASES[name]);
    // The standard library
    const std = this.stdType(name, spec, fc);
    if (std) {
      this.checkStd(name, qualified, spec);
      return apply(std);
    }
    this.err("unknown-type", `unknown type '${raw}'`, spec, { name: raw });
  }

  /** A standard type by name, or null if there is none of that name. */
  private stdType(name: string, spec: Extract<TypeSpec, { k: "named" }>, fc: FnCompiler | null): Ty | null {
    const args = (): Ty[] => spec.args.map((a) => this.resolveType(a, fc));
    const need = (n: number, max = n) => {
      if (spec.args.length < n || spec.args.length > max) this.err("template-args", `wrong number of template arguments for '${name}'`, spec, { name });
    };
    const constArg = (i: number): number => {
      const a = spec.args[i];
      if (a?.k === "named" && a.name === "#const") {
        if (a.lit !== undefined) return a.lit;
        if (a.expr && fc) return fc.constantInt(a.expr);
        if (a.expr) {
          const v = this.constantOf(a.expr);
          if (v !== undefined) return v;
        }
      }
      return this.err("template-args", `'${name}' needs a constant size`, spec, { name });
    };
    switch (name) {
      case "string":
      case "wstring":
        return T_STR;
      case "ostream":
        return T_OSTREAM;
      case "istream":
        return T_ISTREAM;
      case "stringstream":
      case "istringstream":
      case "ostringstream":
        return T_SSTREAM;
      case "vector":
      case "deque":
      case "list": {
        if (name === "list") this.unsupported("std::list (use vector or deque)", spec);
        need(1, 2);
        return stdTy(name, [args()[0]]);
      }
      case "stack":
      case "queue": {
        need(1, 2);
        return stdTy(name, [args()[0]]);
      }
      case "priority_queue": {
        need(1, 3);
        const a = args();
        return stdTy(name, [a[0]], a[2] ? { cmp: a[2] } : {});
      }
      case "set":
      case "multiset": {
        need(1, 2);
        const a = args();
        return stdTy(name, [a[0]], a[1] ? { cmp: a[1] } : {});
      }
      case "map":
      case "multimap": {
        need(2, 3);
        const a = args();
        return stdTy(name, [a[0], a[1]], a[2] ? { cmp: a[2] } : {});
      }
      case "unordered_map":
      case "unordered_multimap": {
        need(2, 4);
        const a = args();
        return stdTy(name, [a[0], a[1]]);
      }
      case "unordered_set":
      case "unordered_multiset": {
        need(1, 3);
        return stdTy(name, [args()[0]]);
      }
      case "pair": {
        need(2);
        const a = args();
        return stdTy("pair", a);
      }
      case "tuple": {
        if (spec.args.length < 1) this.err("template-args", "tuple needs element types", spec);
        return stdTy("tuple", args());
      }
      case "array": {
        need(2);
        return stdTy("array", [this.resolveType(spec.args[0], fc)], { n: constArg(1) });
      }
      case "bitset": {
        need(1);
        return stdTy("bitset", [], { n: constArg(0) });
      }
      case "function": {
        const a = spec.args[0];
        if (a?.k === "named" && a.name === "#fn") {
          const parts = a.args.map((x) => this.resolveType(x, fc));
          return { k: "fn", ret: parts[0], params: parts.slice(1) };
        }
        return this.err("template-args", "write function<return(arguments)>", spec);
      }
      case "less":
      case "greater":
      case "less_equal":
      case "greater_equal":
      case "equal_to":
      case "not_equal_to":
      case "plus":
      case "minus":
      case "multiplies": {
        const a = spec.args.length ? args() : [];
        return stdTy(name, a);
      }
      case "initializer_list":
        return stdTy("initializer_list", args());
      case "size_type":
        return GLOBAL_TYPE_ALIASES.size_t;
      case "streamsize":
        return GLOBAL_TYPE_ALIASES.ptrdiff_t;
      case "nullptr_t":
        return { k: "nullptr" };
      case "string_view":
        return T_STR;
      case "optional":
      case "unique_ptr":
      case "shared_ptr":
        return this.unsupported(`std::${name}`, spec);
      case "ifstream":
      case "ofstream":
      case "stringstream":
      case "istringstream":
      case "ostringstream":
        return this.unsupported(`std::${name}`, spec);
    }
    return null;
  }

  /** A compile-time integer from a constant expression that needs no function context. */
  constantOf(e: Expr): number | undefined {
    if (e.k === "int" && typeof e.value === "number") return e.value;
    if (e.k === "id") {
      const g = this.globals.get(e.name);
      if (g && typeof g.cst === "number") return g.cst;
    }
    return undefined;
  }

  /* ----------------------------------- classes ----------------------------------- */

  newClassInfo(name: string, decl: ClassDecl | null, isStruct: boolean): ClassInfo {
    const info: ClassInfo = {
      name,
      isStruct,
      decl,
      fields: [],
      fieldMap: new Map(),
      methods: new Map(),
      ctors: [],
      dtor: null,
      ownFields: [],
      copyCtor: null,
      moveCtor: null,
      copyAssign: null,
      simpleCopy: true,
      copyConstruct: null,
      destroys: undefined,
      bases: [],
      statics: new Map(),
      create: null,
      targs: [],
      ty: { k: "cls", cls: { name, info: null } },
      copyInto: null,
      clone: null,
      hasVirtual: false,
    };
    (info.ty as { k: "cls"; cls: { name: string; info: unknown } }).cls.info = info;
    return info;
  }

  instantiateClass(name: string, targs: Ty[], at: Loc): ClassInfo {
    const decl = this.classTemplates.get(name)!;
    const key = `${name}<${targs.map(tyStr).join(",")}>`;
    const existing = this.classInstances.get(key);
    if (existing) return existing;
    if (targs.length !== decl.tparams.length) this.err("template-args", `'${name}' takes ${decl.tparams.length} template arguments`, at, { name });
    const info = this.newClassInfo(key, decl, decl.isStruct);
    info.targs = targs;
    this.classInstances.set(key, info);
    const saved = this.tsubst;
    this.tsubst = new Map(decl.tparams.map((p, i) => [p, targs[i]]));
    try {
      this.fillClass(info, decl);
    } finally {
      this.tsubst = saved;
    }
    return info;
  }

  /** Resolves the members of a class and queues its function bodies. */
  fillClass(info: ClassInfo, decl: ClassDecl): void {
    const subst = this.tsubst;
    for (const b of decl.bases) {
      const base = this.classes.get(b.name) ?? this.classInstances.get(b.name);
      if (!base) this.err("unknown-type", `unknown base class '${b.name}'`, decl, { name: b.name });
      info.bases.push(base);
      for (const f of base.fields) {
        info.fields.push(f);
        info.fieldMap.set(f.name, f);
      }
      if (base.hasVirtual) info.hasVirtual = true;
    }
    for (const f of decl.fields) {
      let ty = this.resolveType(f.type);
      if (f.dims.length) {
        for (let i = f.dims.length - 1; i >= 0; i--) {
          const n = f.dims[i] ? this.constantOf(f.dims[i]!) : undefined;
          if (n === undefined) this.err("array-size", "the size of an array member must be a constant", f);
          ty = { k: "arr", of: ty, n };
        }
      }
      const field = { name: f.name, ty, init: f.init?.k === "assign" ? f.init.expr : null, initBrace: f.init?.k === "brace" ? f.init.args : null, isStatic: f.isStatic, access: f.access, line: f.line };
      if (info.fieldMap.has(f.name) && !f.isStatic) this.err("redeclared", `'${f.name}' is already a member of ${info.name}`, f, { name: f.name });
      info.fields.push(field);
      info.ownFields.push(field);
      info.fieldMap.set(f.name, field);
    }
    for (const m of decl.methods) {
      const fn = this.makeFunction(m, info, subst);
      if (m.isCtor) info.ctors.push(fn);
      else if (m.isDtor) info.dtor = fn;
      else {
        const list = info.methods.get(m.name) ?? [];
        list.push(fn);
        info.methods.set(m.name, list);
        if (fn.isVirtual) info.hasVirtual = true;
      }
      if (fn.body_decl_with_body) this.queueBody(fn, subst);
    }
    // Methods of a base class are found through it.
    for (const b of info.bases) {
      for (const [n, list] of b.methods) if (!info.methods.has(n)) info.methods.set(n, list);
    }
    this.finishClass(info);
  }

  private finishClass(info: ClassInfo): void {
    const cc = this;
    const fieldInits: { name: string; make: () => any }[] = [];
    for (const f of info.fields) {
      if (f.isStatic) continue;
      fieldInits.push({ name: f.name, make: this.defaultMaker(f.ty, true) });
    }
    info.create = () => {
      const o: any = { __c: info };
      for (let i = 0; i < fieldInits.length; i++) o[fieldInits[i].name] = fieldInits[i].make();
      return o;
    };
    const classes = { clone: (c: { info: unknown }) => ((c.info as ClassInfo).clone ?? ((v: any) => v)) as Conv };
    const cloneOf = (f: FieldInfo) => cloneFn(f.ty, classes);
    const allCloners = info.fields.filter((f) => !f.isStatic).map((f) => ({ name: f.name, clone: cloneOf(f) }));
    const ownCloners = info.ownFields.filter((f) => !f.isStatic).map((f) => ({ name: f.name, clone: cloneOf(f) }));
    // User-written copy / move constructors and copy assignment.
    for (const c of info.ctors) {
      const p = c.params[0];
      if (!p || (c.params.length > 1 && !c.params[1].def)) continue;
      const pt = strip(p.ty);
      if (p.declared.k === "ref" && pt.k === "cls" && pt.cls.info === info) {
        if (p.declared.rv) info.moveCtor = c;
        else info.copyCtor = c;
      }
    }
    for (const m of info.methods.get("operator=") ?? []) {
      const p = m.params[0];
      if (m.cls === info && p && m.params.length === 1 && p.declared.k === "ref" && !p.declared.rv && strip(p.ty).k === "cls" && (strip(p.ty) as { cls: { info: unknown } }).cls.info === info) info.copyAssign = m;
    }
    info.simpleCopy = !info.copyCtor && info.bases.every((b) => b.simpleCopy);
    const rt = this.rt;
    // Copying an object that has no copy constructor of its own copies the parts (calling the base's copy constructor if it has one).
    info.copyConstruct = (o: any, src: any) => {
      if (info.copyCtor) {
        rt.invoke(new Func(info.copyCtor, null), [o, src]);
        return;
      }
      for (const b of info.bases) b.copyConstruct!(o, src);
      for (const { name, clone } of ownCloners) {
        const v = src[name];
        o[name] = clone && v !== undefined ? clone(v) : v;
      }
    };
    if (info.simpleCopy) {
      info.clone = (src: any) => {
        const o: any = { __c: info };
        for (let i = 0; i < allCloners.length; i++) {
          const { name, clone } = allCloners[i];
          const v = src[name];
          o[name] = clone && v !== undefined ? clone(v) : v;
        }
        return o;
      };
    } else {
      info.clone = (src: any) => {
        const o = info.create!();
        info.copyConstruct!(o, src);
        return o;
      };
    }
    info.copyInto = info.copyAssign
      ? (dst: any, src: any) => {
          if (dst === src) return;
          rt.invoke(new Func(info.copyAssign, null), [dst, src]);
        }
      : (dst: any, src: any) => {
          if (dst === src) return;
          const staged: [string, any][] = [];
          for (const { name, clone } of allCloners) {
            const v = src[name];
            staged.push([name, clone && v !== undefined ? clone(v) : v]);
          }
          for (const [name, v] of staged) dst[name] = v;
        };
    // Override-without-`virtual` is still virtual; this also records the final overriders.
    vtable(info);
    void cc;
  }

  /** The function that destroys a value of this type (null when nothing needs to happen). */
  destroyerOf(ty: Ty): ((v: any) => void) | null {
    return destroyerOf(this.rt, ty);
  }

  /** Objects of an abstract class (one with a pure virtual function left unimplemented) cannot be created. */
  assertConcrete(info: ClassInfo, at: Loc): void {
    const missing = abstractMethods(info);
    if (missing.length) this.err("abstract-class", `cannot create an object of the abstract class '${info.name}': ${missing[0].qname} has no body`, at, { name: info.name, method: missing[0].qname });
  }

  /** A function producing the default value of a type (`zero` is value-initialisation; otherwise numbers are left unset). */
  defaultMaker(ty: Ty, zero: boolean): () => any {
    ty = strip(ty);
    switch (ty.k) {
      case "bool":
        return zero ? () => false : () => undefined;
      case "int":
      case "float":
      case "double":
      case "enum":
        return zero ? () => 0 : () => undefined;
      case "ptr":
      case "nullptr":
      case "fn":
        return zero ? () => null : () => undefined;
      case "str":
        return () => new CStr("");
      case "sstream":
        return () => new SStream(this.rt.cout.limit());
      case "arr": {
        const inner = this.defaultMaker(ty.of, zero);
        const n = ty.n;
        return () => {
          const a = new Array(n);
          for (let i = 0; i < n; i++) a[i] = inner();
          this.rt.mem += n * 8;
          return a;
        };
      }
      case "cls": {
        const info = ty.cls.info as ClassInfo;
        return () => info.create!();
      }
      case "std":
        return this.lib.defaultStd(ty);
    }
    return () => undefined;
  }

  /* ---------------------------------- functions ---------------------------------- */

  /** Creates the FnInfo for a declaration; the body is compiled later. */
  makeFunction(decl: FuncDecl, cls: ClassInfo | null, subst: Map<string, Ty> | null): FnInfo & { body_decl_with_body?: boolean } {
    const saved = this.tsubst;
    if (subst) this.tsubst = subst;
    try {
      const isMethod = cls !== null && !decl.isStatic;
      const params: ParamInfo[] = [];
      let slot = isMethod ? 2 : 1;
      for (const p of decl.params) {
        let ty = this.resolveType(p.type);
        const declared = ty;
        let pass: ParamInfo["pass"] = "value";
        if (ty.k === "ref") {
          const to = ty.to;
          if (needsClone(to) || to.k === "cls" || to.k === "ostream" || to.k === "istream" || to.k === "sstream") pass = "obj";
          else if (to.c) pass = "value";
          else pass = "ref";
          ty = to;
        } else if (ty.k === "arr") {
          ty = { k: "ptr", to: ty.of };
        }
        params.push({ name: p.name, ty, declared, def: p.def, slot: slot++, pass });
      }
      let ret = this.resolveType(decl.ret);
      let retRef = false;
      if (ret.k === "ref") {
        retRef = !ret.to.c || needsClone(ret.to);
        ret = ret.to;
      }
      const fn: FnInfo & { body_decl_with_body?: boolean } = {
        id: this.nextId++,
        name: decl.name,
        qname: cls ? `${cls.name}::${decl.name}` : decl.name,
        ret,
        retRef,
        params,
        cls,
        isMethod,
        isStatic: decl.isStatic,
        isCtor: decl.isCtor,
        isDtor: decl.isDtor,
        isVirtual: decl.isVirtual || decl.isOverride,
        isPure: decl.pure,
        isConst: decl.isConst,
        access: decl.access,
        decl,
        tparams: decl.tparams,
        instances: new Map(),
        nslots: slot,
        code: null,
        fast: null,
        compiled: false,
        compiling: false,
        native: null,
        captures: [],
        line: decl.line,
      };
      fn.body_decl_with_body = decl.body !== null;
      this.allFns.push(fn);
      return fn;
    } finally {
      this.tsubst = saved;
    }
  }

  queueBody(fn: FnInfo, subst: Map<string, Ty> | null): void {
    this.pending.push(() => this.compileBody(fn, subst));
  }

  compileBody(fn: FnInfo, subst: Map<string, Ty> | null): void {
    if (fn.compiled || fn.compiling || !fn.decl?.body) return;
    fn.compiling = true;
    const saved = this.tsubst;
    this.tsubst = subst;
    try {
      new FnCompiler(this, fn, null).compileFunction();
    } finally {
      this.tsubst = saved;
      fn.compiling = false;
      fn.compiled = true;
    }
  }

  /** The instance of a template function for these argument types. */
  instantiateFunction(template: FnInfo, targs: Ty[], at: Loc): FnInfo {
    const key = targs.map(tyStr).join(",");
    let inst = template.instances.get(key);
    if (inst) return inst;
    const subst = new Map(template.tparams.map((p, i) => [p, targs[i]]));
    inst = this.makeFunction(template.decl!, template.cls, subst);
    inst.tparams = [];
    inst.qname = `${template.qname}<${key}>`;
    template.instances.set(key, inst);
    this.compileBody(inst, subst);
    void at;
    return inst;
  }

  /* ---------------------------------- the program ---------------------------------- */

  compile(): ProgramCode {
    // Types first: names of classes and enums, then aliases, then members.
    for (const d of this.program.decls) {
      if (d.k === "class") {
        if (d.tparams.length) this.classTemplates.set(d.name, d);
        else if (this.classes.has(d.name)) this.err("redeclared", `'${d.name}' is already defined`, d, { name: d.name });
        else this.classes.set(d.name, this.newClassInfo(d.name, d, d.isStruct));
      }
    }
    for (const d of this.program.decls) {
      if (d.k === "enum") this.declareEnum(d);
      else if (d.k === "alias") this.aliases.set(d.name, this.resolveType(d.type));
    }
    for (const d of this.program.decls) {
      if (d.k === "class" && !d.tparams.length) this.fillClass(this.classes.get(d.name)!, d);
    }
    // Function signatures, then globals (in order), then bodies.
    const bodies: [FnInfo, FuncDecl][] = [];
    const methodDefs: FuncDecl[] = [];
    for (const d of this.program.decls) {
      if (d.k !== "func") continue;
      if (d.cls) {
        methodDefs.push(d);
        continue;
      }
      if (d.tparams.length) {
        const fn = this.makeTemplateFunction(d);
        this.addFunction(this.funcTemplates, d.name, fn, d);
        continue;
      }
      const fn = this.makeFunction(d, null, null);
      this.addFunction(this.funcs, d.name, fn, d);
      if (d.body) bodies.push([fn, d]);
    }
    for (const d of methodDefs) this.attachMethodDefinition(d);
    // Globals
    this.initFc = this.makeInitCompiler();
    for (const d of this.program.decls) {
      if (d.k === "global") this.initFc!.globalDecl(d.stmt);
    }
    for (const [fn] of bodies) this.queueBody(fn, null);
    // Bodies of everything registered, including methods and anything queued while compiling bodies.
    while (this.pending.length) this.pending.shift()!();
    const mains = this.funcs.get("main");
    if (!mains?.length) throw semanticError("no-main", "the program has no main function", 1, 1);
    const main = mains[0];
    if (!main.decl?.body) this.err("no-main", "main has no body", main.decl ?? { line: 1, col: 1 });
    const init = this.initFc!.finishInit();
    for (const fn of this.allFns) if (fn.code) fn.code = this.link(fn.code, fn);
    if (init && init.code) init.code = this.link(init.code, init);
    return { main, init, fns: this.allFns };
  }

  private makeInitCompiler(): FnCompiler {
    const fn: FnInfo = {
      id: this.nextId++,
      name: "<init>",
      qname: "<init>",
      ret: T_VOID,
      retRef: false,
      params: [],
      cls: null,
      isMethod: false,
      isStatic: false,
      isCtor: false,
      isDtor: false,
      isVirtual: false,
      isPure: false,
      isConst: false,
      access: "public",
      decl: null,
      tparams: [],
      instances: new Map(),
      nslots: 1,
      code: null,
      fast: null,
      compiled: true,
      compiling: false,
      native: null,
      captures: [],
      line: 1,
    };
    return new FnCompiler(this, fn, null);
  }

  private makeTemplateFunction(d: FuncDecl): FnInfo {
    const fn = this.makeTemplateShell(d);
    return fn;
  }

  /** A template's signature cannot be resolved until its arguments are known; keep the declaration. */
  private makeTemplateShell(d: FuncDecl): FnInfo {
    return {
      id: this.nextId++,
      name: d.name,
      qname: d.name,
      ret: T_VOID,
      retRef: false,
      params: [],
      cls: null,
      isMethod: false,
      isStatic: false,
      isCtor: false,
      isDtor: false,
      isVirtual: false,
      isPure: false,
      isConst: false,
      access: "public",
      decl: d,
      tparams: d.tparams,
      instances: new Map(),
      nslots: 1,
      code: null,
      fast: null,
      compiled: false,
      compiling: false,
      native: null,
      captures: [],
      line: d.line,
    };
  }

  private addFunction(table: Map<string, FnInfo[]>, name: string, fn: FnInfo, at: Loc): void {
    const list = table.get(name) ?? [];
    // A declaration followed by its definition is one function.
    const same = list.find((f) => f.decl && sameSignature(f, fn));
    if (same) {
      if (same.decl!.body && fn.decl!.body) this.err("redefined", `'${name}' is defined twice`, at, { name });
      if (fn.decl!.body && !same.decl!.body) {
        same.decl = fn.decl;
        same.params = fn.params;
        this.allFns.splice(this.allFns.indexOf(fn), 1);
        this.pending.push(() => this.compileBody(same, null));
      }
      return;
    }
    list.push(fn);
    table.set(name, list);
  }

  /** `Type Class::method(...) { ... }` written outside the class. */
  private attachMethodDefinition(d: FuncDecl): void {
    const clsName = d.cls!;
    const cls = this.classes.get(clsName);
    if (!cls) this.err("unknown-type", `'${clsName}' is not a class`, d, { name: clsName });
    const list = d.isCtor ? cls.ctors : cls.methods.get(d.name) ?? [];
    const probe = this.makeFunction(d, cls, null);
    const existing = list.find((f) => sameSignature(f, probe));
    this.allFns.splice(this.allFns.indexOf(probe), 1);
    if (!existing) this.err("no-such-member", `'${d.name}' is not declared in ${cls.name}`, d, { name: d.name });
    existing.decl = d;
    existing.params = probe.params;
    existing.ret = probe.ret;
    this.pending.push(() => this.compileBody(existing, null));
  }

  private declareEnum(d: EnumDecl): void {
    const name = d.name ?? `<anon-enum-${this.enums.size}>`;
    const ty: Ty = { k: "enum", name, scoped: d.scoped };
    if (d.name) this.enums.set(name, ty);
    let next = 0;
    for (const item of d.items) {
      if (item.value) {
        const v = this.constantOf(item.value) ?? this.evalNegative(item.value);
        if (v === undefined) this.err("not-constant", "an enumerator needs a constant value", item.value);
        next = v;
      }
      const vname = d.scoped ? `${name}::${item.name}` : item.name;
      this.globals.set(vname, { name: vname, ty: d.scoped ? ty : withConst(ty), slot: -1, global: true, placeRef: false, isConst: true, check: false, line: d.line, cst: next });
      if (!d.scoped) this.aliases.set(`#enumerator:${item.name}`, ty);
      next++;
    }
  }

  private evalNegative(e: Expr): number | undefined {
    if (e.k === "unary" && e.op === "-") {
      const v = this.constantOf(e.e);
      return v === undefined ? undefined : -v;
    }
    return undefined;
  }

  newLambdaId(): number {
    return ++this.lambdaCount;
  }

  newFnId(): number {
    return this.nextId++;
  }

  addGlobalSlot(): number {
    this.G.push(undefined);
    return this.G.length - 1;
  }

  /* ----------------------------------- linking ------------------------------------ */

  /**
   * Resolves labels to positions and merges runs of straight-line closures into
   * one, so a function made only of straight-line code becomes one closure.
   */
  link(code: Instr[], fn: FnInfo): Instr[] {
    // Which labels are jumped to (a label that nothing jumps to does not split a run).
    const targets = new Set<Label>();
    for (const ins of code) {
      if (ins.op === Op.Jmp || ins.op === Op.Jf || ins.op === Op.Jt) targets.add(ins.to);
      else if (ins.op === Op.Switch) {
        for (const l of ins.table.values()) targets.add(l);
        if (ins.dflt) targets.add(ins.dflt);
        targets.add(ins.end);
      }
    }
    const merged: Instr[] = [];
    const lines: number[] = [];
    let run: { fs: ((fr: Frame) => any)[]; line: number } | null = null;
    const flush = () => {
      if (!run) return;
      const fs = run.fs;
      if (fs.length === 1) merged.push({ op: Op.Exec, f: fs[0], line: run.line });
      else if (fs.length === 2) {
        const [a, b] = fs;
        merged.push({ op: Op.Exec, f: (fr) => (a(fr), b(fr)), line: run.line });
      } else {
        merged.push({
          op: Op.Exec,
          f: (fr) => {
            for (let i = 0; i < fs.length; i++) fs[i](fr);
          },
          line: run.line,
        });
      }
      lines.push(run.line);
      run = null;
    };
    // Anything after a return (or an unconditional jump) that nothing jumps to can never run.
    let dead = false;
    for (const ins of code) {
      if (ins.op === Op.Label) {
        if (targets.has(ins.l)) {
          flush();
          merged.push(ins);
          dead = false;
        }
        continue;
      }
      if (dead) continue;
      if (ins.op === Op.Exec) {
        if (!run) run = { fs: [], line: ins.line };
        run.fs.push(ins.f);
        continue;
      }
      flush();
      merged.push(ins);
      if (ins.op === Op.Ret || ins.op === Op.Jmp || ins.op === Op.Switch) dead = true;
    }
    flush();
    const fused = this.fuse(merged);
    // Positions (labels are kept as no-op instructions only where something jumps to them: give each its pc, then drop them)
    const out: Instr[] = [];
    for (const ins of fused) {
      if (ins.op === Op.Label) {
        ins.l.pc = out.length;
        continue;
      }
      out.push(ins);
    }
    // A function that is one straight run of closures can be called directly.
    if (!fn.isCtor && out.length <= 2 && out.every((i) => i.op === Op.Exec || i.op === Op.Ret) && out.filter((i) => i.op === Op.Ret).length <= 1 && out.length > 0 && out[out.length - 1].op === Op.Ret) {
      const first = out[0];
      const last = out[out.length - 1];
      if (out.length === 1 && last.op === Op.Ret) {
        const v = last.v;
        fn.fast = v ? (fr) => v(fr) : () => undefined;
        fn.fastLine = last.line ?? fn.line;
      } else if (first.op === Op.Exec && last.op === Op.Ret) {
        fn.fastLine = first.line;
        const f = first.f;
        const v = last.v;
        fn.fast = (fr) => {
          f(fr);
          return v ? v(fr) : undefined;
        };
      }
    }
    return out;
  }

  /**
   * Peephole pass: the most common little shapes become one instruction each, so a tight loop
   * takes one step per round instead of four or five. Behaviour is unchanged.
   */
  private fuse(code: Instr[]): Instr[] {
    // How often each label is jumped to, and where each label sits.
    const jumps = new Map<Label, number>();
    const bump = (l: Label | null) => l && jumps.set(l, (jumps.get(l) ?? 0) + 1);
    for (const ins of code) {
      if (ins.op === Op.Jmp || ins.op === Op.Jf || ins.op === Op.Jt) bump(ins.to);
      else if (ins.op === Op.Switch) {
        for (const l of ins.table.values()) bump(l);
        bump(ins.dflt);
        bump(ins.end);
      }
    }
    const indexOf = new Map<Label, number>();
    code.forEach((ins, i) => {
      if (ins.op === Op.Label) indexOf.set(ins.l, i);
    });
    // The loop test a `Jmp` goes back to: the Jf right after its label, plus a fresh label just past that Jf.
    const afterTest = new Map<Instr, Label>();
    const testAt = (l: Label): Instr | null => {
      let i = indexOf.get(l);
      if (i === undefined) return null;
      while (code[i] && code[i].op === Op.Label) i++;
      const t = code[i];
      return t && t.op === Op.Jf ? t : null;
    };
    for (const ins of code) {
      if (ins.op === Op.Jmp) {
        const t = testAt(ins.to);
        if (t && !afterTest.has(t)) afterTest.set(t, { pc: -1 });
      }
    }
    const out: Instr[] = [];
    for (let i = 0; i < code.length; i++) {
      const ins = code[i];
      const next = code[i + 1];
      // if (c) stmt;
      if (ins.op === Op.Jf && next && next.op === Op.Exec && !afterTest.has(ins)) {
        const l1 = code[i + 2];
        if (l1 && l1.op === Op.Label && l1.l === ins.to && jumps.get(ins.to) === 1) {
          out.push({ op: Op.CondExec, c: ins.c, f: next.f, line: next.line });
          i += 1;
          continue;
        }
        // if (c) a; else b;
        const jmp = code[i + 2];
        const l1b = code[i + 3];
        const elseExec = code[i + 4];
        const l2 = code[i + 5];
        if (jmp && jmp.op === Op.Jmp && l1b && l1b.op === Op.Label && l1b.l === ins.to && elseExec && elseExec.op === Op.Exec && l2 && l2.op === Op.Label && l2.l === jmp.to && jumps.get(ins.to) === 1 && jumps.get(jmp.to) === 1) {
          out.push({ op: Op.IfElse, c: ins.c, a: next.f, b: elseExec.f, line: next.line });
          i += 4; // the labels are not targets of anything else
          out.push(l2);
          continue;
        }
      }
      // end of a loop: [body tail and step], then back to the test
      if (ins.op === Op.Exec && next && next.op === Op.Jmp) {
        const t = testAt(next.to);
        if (t && t.op === Op.Jf) {
          out.push({ op: Op.ExecBr, f: ins.f, c: t.c, t: afterTest.get(t)!, e: t.to, line: ins.line });
          i += 1;
          continue;
        }
      }
      if (ins.op === Op.Jmp) {
        const t = testAt(ins.to);
        if (t && t.op === Op.Jf) {
          out.push({ op: Op.Br, c: t.c, t: afterTest.get(t)!, e: t.to });
          continue;
        }
      }
      out.push(ins);
      if (afterTest.has(ins)) out.push({ op: Op.Label, l: afterTest.get(ins)! });
    }
    return out;
  }

  /* -------------------------------- shared helpers --------------------------------- */

  /** Whether `a` can be used where `b` is expected without conversion: same type ignoring const. */
  same(a: Ty, b: Ty): boolean {
    return sameType(a, b);
  }

  decayed(t: Ty): Ty {
    return decay(t);
  }
  noConst(t: Ty): Ty {
    return noConst(t);
  }
  readonly types = { T_INT, T_BOOL, T_DOUBLE, T_STR };
}

function sameSignature(a: FnInfo, b: FnInfo): boolean {
  if (a.params.length !== b.params.length) return false;
  return a.params.every((p, i) => sameType(p.ty, b.params[i].ty) && (p.pass === b.params[i].pass || true));
}

export { CppError, Func };
