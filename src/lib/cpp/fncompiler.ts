import { semanticError, unsupported, limitError } from "./errors";
import type { Declarator, Expr, FuncDecl, Loc, Stmt, TypeSpec } from "./ast";
import { Op, type CE, type ClassInfo, type FnInfo, type Frame, type Instr, type Label, type ParamInfo, type VarInfo } from "./core";
import type { Compiler } from "./compiler";
import { assignInto, cloneFn, convertFn, needsClone } from "./conv";
import { moveOut } from "./lifetime";
import { compileExpr } from "./expr";
import { BoxPlace, ElemPlace, Func, ObjPlace, SlotPlace, type Place, type Rt } from "./values";
import {
  T_STR,
  commonType,
  stdTy,
  T_INT,
  T_VOID,
  decay,
  isArithmetic,
  isClassLike,
  isFloating,
  isIntegral,
  noConst,
  sameType,
  strip,
  tyStr,
  withConst,
  type Ty,
} from "./types";

/**
 * Compiles one function (or lambda) body.
 *
 * Statements become a list of instructions; each expression becomes a closure
 * over the frame. A call to a user function inside an expression cannot be a
 * closure (it would use the JS stack), so it is hoisted out into a `Call`
 * instruction placed before the statement that needs its result.
 */

type Opts = { check?: boolean; placeRef?: boolean; isConst?: boolean; cst?: number | boolean | bigint };

interface Loop {
  brk: Label;
  cont: Label | null;
  /** How many scopes were open outside this loop (or switch): `break` and `continue` destroy the ones inside. */
  depth: number;
}

interface DestroyEntry {
  v: VarInfo;
  destroy: (o: any) => void;
}

export class FnCompiler {
  readonly rt: Rt;
  scopes: Map<string, VarInfo>[] = [new Map()];
  private nslots: number;
  /** Where instructions go. */
  out: Instr[] = [];
  private loops: Loop[] = [];
  /** The declared return type; null while it is being deduced (lambdas without `-> T`). */
  retTy: Ty | null;
  thisCls: ClassInfo | null;
  /** Enclosing function, for lambdas. */
  readonly parent: FnCompiler | null;
  private lambdaDefault: "" | "=" | "&" = "";
  private lambdaMutable = false;
  private lambdaCaptures: Map<string, VarInfo> = new Map();
  /** Names of locals that are references to numbers (so a lambda captures the place, not a copy). */
  private deduced: Ty[] = [];
  private tempOwners = new Set<number>();

  constructor(
    readonly cc: Compiler,
    readonly fn: FnInfo,
    parent: FnCompiler | null,
  ) {
    this.rt = cc.rt;
    this.parent = parent;
    this.nslots = fn.nslots;
    this.thisCls = fn.cls;
    // `auto f(...)`: the return type is whatever the first `return` gives
    this.retTy = fn.ret.k === "tparam" && fn.ret.name === "auto" && !parent ? null : fn.ret;
  }

  /* --------------------------------- diagnostics -------------------------------- */

  err(code: string, message: string, at: Loc, args: Record<string, string | number> = {}): never {
    throw semanticError(code, message, at.line, at.col, args);
  }
  unsupported(feature: string, at: Loc): never {
    throw unsupported(feature, at.line, at.col);
  }

  /* ----------------------------------- emission ---------------------------------- */

  newSlot(): number {
    return this.nslots++;
  }
  /** A fresh temporary slot (never reused, so values from hoisted calls cannot be overwritten). */
  tmp(): number {
    return this.newSlot();
  }
  label(): Label {
    return { pc: -1 };
  }
  place(l: Label): void {
    this.out.push({ op: Op.Label, l });
  }
  exec(f: (fr: Frame) => any, at: Loc): void {
    this.out.push({ op: Op.Exec, f, line: at.line });
  }
  jmp(to: Label): void {
    this.out.push({ op: Op.Jmp, to });
  }
  jf(c: (fr: Frame) => boolean, to: Label): void {
    this.out.push({ op: Op.Jf, c, to });
  }
  jt(c: (fr: Frame) => boolean, to: Label): void {
    this.out.push({ op: Op.Jt, c, to });
  }

  /** Runs `f` with a fresh instruction buffer and returns what it emitted. */
  capture<T>(f: () => T): { value: T; code: Instr[] } {
    const saved = this.out;
    this.out = [];
    try {
      const value = f();
      return { value, code: this.out };
    } finally {
      this.out = saved;
    }
  }

  /* ----------------------------------- scopes ------------------------------------ */

  /** Variables to destroy when each scope ends (parallel to `scopes`). */
  private destroyLists: DestroyEntry[][] = [[]];

  pushScope(): void {
    this.scopes.push(new Map());
    this.destroyLists.push([]);
  }
  popScope(): void {
    // Falling out of the end of the scope destroys what it declared, last first.
    this.emitDestroys(this.destroyLists[this.destroyLists.length - 1], null);
    this.destroyLists.pop();
    this.scopes.pop();
  }

  /** Emits the destruction of `entries` (last declared first); `except` is a variable that must survive (the one being returned). */
  private emitDestroys(entries: DestroyEntry[], except: VarInfo | null): void {
    for (let i = entries.length - 1; i >= 0; i--) {
      const { v, destroy } = entries[i];
      if (v === except) continue;
      const slot = v.slot;
      this.exec((fr) => {
        const o = fr[slot];
        if (o !== undefined && o !== null) destroy(o);
      }, { line: this.curLine, col: 0 });
    }
  }

  /** The destruction `break`/`continue` (down to `depth` scopes) and `return` (depth 0) must do before they jump. */
  private emitDestroysFrom(depth: number, except: VarInfo | null): void {
    for (let i = this.destroyLists.length - 1; i >= depth; i--) this.emitDestroys(this.destroyLists[i], except);
  }

  /** Registers a just-initialised local for destruction at the end of its scope. */
  private registerDestroy(v: VarInfo): void {
    const destroy = this.cc.destroyerOf(v.ty);
    if (!destroy || v.placeRef) return;
    this.destroyLists[this.destroyLists.length - 1].push({ v, destroy });
  }

  declare(name: string, ty: Ty, at: Loc, opts: Opts = {}): VarInfo {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name)) this.err("redeclared", `'${name}' is already declared in this scope`, at, { name });
    const v: VarInfo = {
      name,
      ty,
      slot: this.newSlot(),
      global: false,
      placeRef: opts.placeRef ?? false,
      isConst: opts.isConst ?? false,
      check: opts.check ?? false,
      line: at.line,
      cst: opts.cst,
    };
    scope.set(name, v);
    return v;
  }

  /** A local (or captured, or global) variable by name. */
  lookupVar(name: string): VarInfo | null {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const v = this.scopes[i].get(name);
      if (v) return v;
    }
    const cap = this.lambdaCaptures.get(name);
    if (cap) return cap;
    if (this.parent) {
      const outer = this.parent.lookupVar(name);
      if (outer && !outer.global && outer.cst === undefined) return this.capture_(name, outer);
      if (outer) return outer;
    }
    const g = this.cc.globals.get(name);
    return g ?? null;
  }

  private capture_(name: string, outer: VarInfo): VarInfo {
    const byRef = this.captureIsByRef(name);
    const scalar = !isClassLike(outer.ty);
    // A `mutable` lambda keeps changes to its by-value captures between calls: they live in the closure itself.
    const viaEnv = !byRef && scalar && this.lambdaMutable;
    const slot = this.newSlot();
    const v: VarInfo = {
      name,
      ty: outer.ty,
      slot,
      global: false,
      placeRef: (byRef && scalar) || viaEnv,
      isConst: outer.isConst && !byRef,
      check: false,
      line: outer.line,
    };
    this.lambdaCaptures.set(name, v);
    this.fn.captures.push({ slot, byRef, name, viaEnv });
    return v;
  }

  private explicitCaptures: Map<string, boolean> = new Map();
  private captureIsByRef(name: string): boolean {
    const explicit = this.explicitCaptures.get(name);
    if (explicit !== undefined) return explicit;
    return this.lambdaDefault === "&";
  }

  /* ----------------------------- variables as expressions ------------------------- */

  varCE(v: VarInfo, at: Loc): CE {
    const G = this.cc.G;
    const slot = v.slot;
    const name = v.name;
    const ty = v.ty;
    const uninit = () => semanticError("uninit", "", 0, 0);
    void uninit;
    const check = v.check;
    const readCheck = (x: any) => {
      if (x === undefined) throw runtimeUninit(name, at.line);
      return x;
    };
    if (v.cst !== undefined && v.slot < 0) {
      const c = v.cst;
      return { ty, ev: () => c, cst: c, line: at.line };
    }
    const classLike = isClassLike(ty);
    if (classLike) {
      const assign = this.assigner(ty);
      if (v.global) return { ty, ev: () => G[slot], lv: () => new ObjPlace(G[slot], assign), set: (_fr, x) => assign(G[slot], x), line: at.line };
      return { ty, ev: (fr) => fr[slot], lv: (fr) => new ObjPlace(fr[slot], assign), set: (fr, x) => assign(fr[slot], x), line: at.line };
    }
    if (v.placeRef) {
      return { ty, ev: (fr) => fr[slot].get(), lv: (fr) => fr[slot], set: (fr, x) => fr[slot].set(x), line: at.line };
    }
    if (v.global) {
      if (check) return { ty, ev: () => readCheck(G[slot]), lv: () => new SlotPlace(G, slot), set: (_fr, x) => void (G[slot] = x), line: at.line };
      return { ty, ev: () => G[slot], lv: () => new SlotPlace(G, slot), set: (_fr, x) => void (G[slot] = x), line: at.line };
    }
    if (check) return { ty, ev: (fr) => readCheck(fr[slot]), lv: (fr) => new SlotPlace(fr, slot), set: (fr, x) => void (fr[slot] = x), line: at.line };
    return { ty, ev: (fr) => fr[slot], lv: (fr) => new SlotPlace(fr, slot), set: (fr, x) => void (fr[slot] = x), line: at.line };
  }

  /** The function that copies one value of this class-like type into another (for `a = b`). */
  assigner(ty: Ty): (dst: any, src: any) => void {
    const t = strip(ty);
    // Assigning a class object copies its parts (it does not run the copy constructor).
    if (t.k === "cls") {
      const info = t.cls.info as ClassInfo;
      return (dst, src) => info.copyInto!(dst, src);
    }
    const clone = this.cloner(ty);
    return (dst, src) => {
      if (dst === src) return;
      const c = clone ? clone(src) : src;
      assignInto(dst, c);
    };
  }

  cloner(ty: Ty): ((v: any) => any) | null {
    return cloneFn(ty, { clone: (cls) => ((cls.info as ClassInfo).clone ?? ((v: any) => v)) as (v: any) => any });
  }

  /* ----------------------------- compile entry points ----------------------------- */

  expr(e: Expr, hint?: Ty): CE {
    return compileExpr(this, e, hint);
  }

  /** The static type of an expression, without keeping any of its code. */
  typeOfExpr(e: Expr): Ty {
    const { value } = this.capture(() => this.expr(e));
    return value.ty;
  }

  /** A compile-time integer (array sizes, case labels, template arguments). */
  constantInt(e: Expr): number {
    const { value } = this.capture(() => this.expr(e));
    if (value.cst === undefined || typeof value.cst === "boolean") {
      const v = typeof value.cst === "boolean" ? (value.cst ? 1 : 0) : undefined;
      if (v !== undefined) return v;
      this.err("not-constant", "this needs a constant value", e);
    }
    return Number(value.cst);
  }

  /** Whether the expression could be a constant (array sizes may be variable in g++, so they are checked at run time). */
  tryConstantInt(e: Expr): number | null {
    try {
      return this.constantInt(e);
    } catch {
      return null;
    }
  }

  asBool(ce: CE, at: Loc): (fr: Frame) => boolean {
    const t = strip(ce.ty);
    const ev = ce.ev;
    if (t.k === "bool") return ev;
    if (isIntegral(t) || isFloating(t)) return (fr) => ev(fr) !== 0;
    if (t.k === "ptr" || t.k === "fn") return (fr) => ev(fr) !== null;
    if (t.k === "nullptr") return () => false;
    if (t.k === "istream" || t.k === "sstream") return (fr) => !ev(fr).failed;
    if (t.k === "arr") return () => true;
    return this.err("not-boolean", `a value of type ${tyStr(ce.ty)} cannot be used as a condition`, at, { type: tyStr(ce.ty) });
  }

  /**
   * Converts a compiled expression to a type (as an assignment, argument or
   * initialiser would). The result is a prvalue of that type.
   */
  coerce(ce: CE, to: Ty, at: Loc, what = "convert"): CE {
    const from = strip(ce.ty);
    const target = strip(to);
    if (target.k === "tparam") return ce;
    if (sameType(from, target) && !(from.k === "ptr" && target.k === "ptr" && from.to.c && !target.to.c && what !== "cast")) {
      return { ...ce, ty: noConst(target), lv: undefined, set: undefined, alias: ce.alias || ce.lv !== undefined };
    }
    // a stringstream is both an istream and an ostream (it is the same object)
    if (from.k === "sstream" && (target.k === "ostream" || target.k === "istream")) return { ...ce, ty: target, lv: undefined, set: undefined };
    // string literal and char* to std::string
    if (target.k === "str") {
      if (ce.lit !== undefined) {
        const s = ce.lit;
        return { ty: target, ev: () => this.newStr(s), line: at.line };
      }
      if (from.k === "ptr" && from.to.k === "int" && from.to.ch) {
        const ev = ce.ev;
        const cstr = this.cc.lib.cstring;
        return { ty: target, ev: (fr) => this.newStr(cstr(ev(fr))), line: at.line };
      }
      if (from.k === "int" && from.ch && what === "cast") {
        const ev = ce.ev;
        return { ty: target, ev: (fr) => this.newStr(String.fromCharCode(ev(fr) & 255)), line: at.line };
      }
    }
    // numbers
    const conv = convertFn(from, target);
    if (conv !== undefined) {
      if (what !== "cast" && what !== "init-list-ok" && target.k === "enum") this.badConversion(from, target, at);
      const ev = ce.ev;
      const cst = ce.cst;
      if (conv === null) return { ty: noConst(target), ev, cst, line: at.line };
      const out: CE = { ty: noConst(target), ev: (fr) => conv(ev(fr)), line: at.line };
      if (cst !== undefined) {
        try {
          out.cst = conv(cst);
        } catch {
          /* leave it non-constant */
        }
      }
      return out;
    }
    // function values
    if (target.k === "fn" && from.k === "fn") return { ...ce, ty: target, lv: undefined, set: undefined };
    if (target.k === "fn" && ce.fn && ce.fn.length) {
      const f = ce.fn[0];
      const func = new Func(f, null);
      return { ty: target, ev: () => func, line: at.line };
    }
    if (target.k === "ptr" && ce.fn && ce.fn.length) return this.badConversion(from, target, at);
    // 0 → null pointer
    if (target.k === "ptr" && ce.cst === 0 && isIntegral(from)) return { ty: target, ev: () => null, line: at.line };
    // derived* to base*
    if (target.k === "ptr" && from.k === "ptr" && from.to.k === "cls" && target.to.k === "cls") {
      const f = from.to.cls.info as ClassInfo;
      const t = target.to.cls.info as ClassInfo;
      if (this.isDerived(f, t)) return { ...ce, ty: target };
    }
    // class types: the same class, or a derived one
    if (from.k === "cls" && target.k === "cls" && this.isDerived(from.cls.info as ClassInfo, target.cls.info as ClassInfo)) return { ...ce, ty: target };
    // anything else is handled by the library (containers, initialiser lists…)
    const viaLib = this.cc.lib.convert(this, ce, target, at);
    if (viaLib) return viaLib;
    return this.badConversion(from, target, at);
  }

  badConversion(from: Ty, to: Ty, at: Loc): never {
    return this.err("bad-conversion", `cannot convert ${tyStr(from)} to ${tyStr(to)}`, at, { from: tyStr(from), to: tyStr(to) });
  }

  isDerived(d: ClassInfo, b: ClassInfo): boolean {
    if (d === b) return true;
    return d.bases.some((x) => this.isDerived(x, b));
  }

  newStr(s: string): any {
    return this.cc.lib.makeStr(s);
  }

  /** A closure producing a *copy* of the value, ready to be stored in a variable. */
  copyOf(ce: CE, ty: Ty): (fr: Frame) => any {
    const ev = ce.ev;
    if (!needsClone(ty)) return ev;
    // A temporary can be used as it is; an lvalue (or a reference) must be copied.
    const clone = this.cloner(ty);
    if (!clone) return ev;
    if (ce.lv === undefined && !ce.name && !ce.alias) return ev;
    // std::move(x): take the contents (with the class's move constructor, if it has one) and leave x empty.
    if (ce.rv) {
      const t = strip(ty);
      const info = t.k === "cls" ? (t.cls.info as ClassInfo) : null;
      const rt = this.rt;
      if (info && info.moveCtor) {
        const ctor = new Func(info.moveCtor, null);
        return (fr) => {
          const src = ev(fr);
          const o = info.create!();
          rt.invoke(ctor, [o, src]);
          return o;
        };
      }
      if (!info || (info.simpleCopy && !info.dtor)) {
        return (fr) => {
          const src = ev(fr);
          const o = clone(src);
          moveOut(src, ty);
          return o;
        };
      }
    }
    return (fr) => clone(ev(fr));
  }

  /* ----------------------------------- function body ------------------------------ */

  compileFunction(): void {
    const fn = this.fn;
    const decl = fn.decl!;
    // Parameters
    if (fn.isMethod) this.scopes[0].set("this", { name: "this", ty: { k: "ptr", to: fn.cls!.ty }, slot: 1, global: false, placeRef: false, isConst: false, check: false, line: fn.line });
    for (const p of fn.params) {
      const v: VarInfo = { name: p.name, ty: p.ty, slot: p.slot, global: false, placeRef: p.pass === "ref", isConst: !!p.declared.c || (p.declared.k === "ref" && !!p.declared.to.c), check: false, line: decl.line };
      if (p.name) this.scopes[0].set(p.name, v);
      // A parameter taken by value is a copy that dies with the call.
      if (p.pass === "value") this.registerDestroy(v);
    }
    this.pushScope();
    const body = decl.body!;
    if (fn.isCtor) this.constructorPrologue(decl);
    if (body.k === "block") for (const s of body.body) this.stmt(s);
    else this.stmt(body);
    this.checkLabels();
    this.popScope();
    this.emitDestroys(this.destroyLists[0], null);
    if (this.retTy === null) fn.ret = T_VOID;
    const end = this.fn.name === "main" && !this.fn.cls ? { op: Op.Ret as const, v: () => 0 } : { op: Op.Ret as const, v: null };
    this.out.push(end);
    fn.code = this.out;
    fn.nslots = this.nslots;
  }

  /** Member initialiser list and default member initialisers, run before a constructor's body. */
  private constructorPrologue(decl: FuncDecl): void {
    const cls = this.fn.cls!;
    const thisSlot = 1;
    // Base class constructors first.
    for (const base of cls.bases) {
      const init = decl.inits.find((i) => i.name === base.name);
      if (init) this.callConstructor(base, init.args, init.brace, decl, (fr) => fr[thisSlot]);
      else if (base.ctors.length) this.callConstructor(base, [], false, decl, (fr) => fr[thisSlot]);
    }
    for (const f of cls.fields) {
      if (f.isStatic) continue;
      if (cls.bases.some((b) => b.fieldMap.has(f.name))) continue;
      const init = decl.inits.find((i) => i.name === f.name);
      if (init) {
        const target: CE = this.fieldCE((fr) => fr[thisSlot], f.name, f.ty, decl);
        this.initInPlace(target, f.ty, init.args, init.brace, decl);
      } else if (f.init) {
        const target: CE = this.fieldCE((fr) => fr[thisSlot], f.name, f.ty, decl);
        const value = this.coerce(this.expr(f.init, f.ty), f.ty, decl);
        const copy = this.copyOf(value, f.ty);
        this.exec((fr) => target.set!(fr, copy(fr)), decl);
      } else if (f.initBrace) {
        const target: CE = this.fieldCE((fr) => fr[thisSlot], f.name, f.ty, decl);
        this.initInPlace(target, f.ty, f.initBrace, true, decl);
      }
    }
  }

  /** A field of the object `obj(fr)` as an lvalue. */
  fieldCE(obj: (fr: Frame) => any, name: string, ty: Ty, at: Loc): CE {
    if (isClassLike(ty)) {
      const assign = this.assigner(ty);
      return { ty, ev: (fr) => obj(fr)[name], lv: (fr) => new ObjPlace(obj(fr)[name], assign), set: (fr, x) => assign(obj(fr)[name], x), line: at.line };
    }
    const check = true;
    void check;
    return {
      ty,
      ev: (fr) => {
        const v = obj(fr)[name];
        if (v === undefined) throw runtimeUninit(name, at.line);
        return v;
      },
      lv: (fr) => new FieldPlaceLazy(obj(fr), name),
      set: (fr, x) => void (obj(fr)[name] = x),
      line: at.line,
    };
  }

  /** Assigns `args` to the field `target` as an initialiser would (`: x(1)`, `{1,2}`). */
  private initInPlace(target: CE, ty: Ty, args: Expr[], brace: boolean, at: Loc): void {
    const t = strip(ty);
    if (t.k === "cls" && (t.cls.info as ClassInfo).ctors.length) {
      this.callConstructor(t.cls.info as ClassInfo, args, brace, at, target.ev);
      return;
    }
    const ce = this.initializerValue(ty, { k: brace ? "brace" : "paren", args } as any, at);
    this.exec((fr) => target.set!(fr, ce.ev(fr)), at);
  }

  /** The first compile of globals: declares them and emits their initialisers into this compiler (the `<init>` function). */
  globalDecl(stmt: Extract<Stmt, { k: "decl" }>): void {
    for (const d of stmt.decls) this.declareVariable(stmt.type, d, "global", stmt.constexpr || false);
  }

  finishInit(): FnInfo | null {
    if (this.out.length === 0) return null;
    this.out.push({ op: Op.Ret, v: null });
    this.fn.code = this.out;
    this.fn.nslots = this.nslots;
    return this.fn;
  }

  /* ----------------------------------- statements ---------------------------------- */

  private curLine = 0;

  /** Temporary objects created by the statement being compiled, destroyed when it ends. */
  private stmtTemps: { slot: number; destroy: (o: any) => void }[] = [];

  /** An argument or object that is a temporary: remember it so it dies at the end of the full expression. */
  bindTemp(ce: CE): (fr: Frame) => any {
    if (ce.lv !== undefined || ce.name) return ce.ev;
    const destroy = this.cc.destroyerOf(ce.ty);
    if (!destroy) return ce.ev;
    const slot = this.tmp();
    const ev = ce.ev;
    this.stmtTemps.push({ slot, destroy });
    return (fr) => (fr[slot] = ev(fr));
  }

  private flushTemps(): void {
    const temps = this.stmtTemps;
    this.stmtTemps = [];
    for (let i = temps.length - 1; i >= 0; i--) {
      const { slot, destroy } = temps[i];
      this.exec((fr) => {
        const o = fr[slot];
        if (o !== undefined) {
          fr[slot] = undefined;
          destroy(o);
        }
      }, { line: this.curLine, col: 0 });
    }
  }

  /** Compiles one statement that is a full expression: its temporaries are destroyed at its end. */
  private withTemps(f: () => void): void {
    const saved = this.stmtTemps;
    this.stmtTemps = [];
    try {
      f();
      this.flushTemps();
    } finally {
      this.stmtTemps = saved;
    }
  }

  stmt(s: Stmt): void {
    this.curLine = s.line;
    switch (s.k) {
      case "block": {
        this.pushScope();
        for (const x of s.body) this.stmt(x);
        this.popScope();
        return;
      }
      case "empty":
      case "typedef":
        return;
      case "expr": {
        this.withTemps(() => {
          const ce = this.expr(s.e);
          // A discarded temporary object dies right away.
          const destroy = ce.lv === undefined && !ce.name ? this.cc.destroyerOf(ce.ty) : null;
          if (destroy) {
            const ev = ce.ev;
            this.exec((fr) => destroy(ev(fr)), s);
          } else {
            // Pure side-effect statements need no wrapper: the closure's value is ignored.
            this.exec(ce.ev, s);
          }
        });
        return;
      }
      case "decl": {
        for (const d of s.decls) this.withTemps(() => this.declareVariable(s.type, d, s.storage === "static" ? "static" : "local", s.constexpr));
        return;
      }
      case "bind":
        return this.bindStatement(s);
      case "if":
        return this.ifStatement(s);
      case "while": {
        const top = this.label();
        const end = this.label();
        this.place(top);
        const c = this.condition(s.c, s);
        this.jf(c, end);
        this.loops.push({ brk: end, cont: top, depth: this.scopes.length });
        this.scopedStmt(s.body);
        this.loops.pop();
        this.jmp(top);
        this.place(end);
        return;
      }
      case "do": {
        const top = this.label();
        const cont = this.label();
        const end = this.label();
        this.place(top);
        this.loops.push({ brk: end, cont, depth: this.scopes.length });
        this.scopedStmt(s.body);
        this.loops.pop();
        this.place(cont);
        const c = this.condition(s.c, s);
        this.jt(c, top);
        this.place(end);
        return;
      }
      case "for": {
        this.pushScope();
        if (s.init) this.stmt(s.init);
        const top = this.label();
        const cont = this.label();
        const end = this.label();
        this.place(top);
        if (s.c) this.jf(this.condition(s.c, s), end);
        this.loops.push({ brk: end, cont, depth: this.scopes.length });
        this.scopedStmt(s.body);
        this.loops.pop();
        this.place(cont);
        if (s.step) this.exec(this.expr(s.step).ev, s);
        this.jmp(top);
        this.place(end);
        this.popScope();
        return;
      }
      case "rangefor":
        return this.rangeFor(s);
      case "switch":
        return this.switchStatement(s);
      case "break": {
        // 'break' leaves the innermost loop or switch, whichever was entered last.
        const l = this.loops[this.loops.length - 1];
        if (!l) this.err("break-outside", "'break' is only allowed inside a loop or a switch", s);
        this.emitDestroysFrom(l.depth, null);
        this.jmp(l.brk);
        return;
      }
      case "continue": {
        // 'continue' skips the rest of the innermost *loop* (a switch around it does not count).
        let l: Loop | undefined;
        for (let i = this.loops.length - 1; i >= 0 && !l; i--) if (this.loops[i].cont) l = this.loops[i];
        if (!l || !l.cont) this.err("continue-outside", "'continue' is only allowed inside a loop", s);
        this.emitDestroysFrom(l.depth, null);
        this.jmp(l.cont);
        return;
      }
      case "return":
        return this.withTemps(() => this.returnStatement(s));
      case "goto": {
        const l = this.userLabel(s.name, s);
        l.used = true;
        this.jmp(l.label);
        return;
      }
      case "label": {
        const l = this.userLabel(s.name, s);
        if (l.defined) this.err("duplicate-label", `the label '${s.name}' is defined twice`, s, { name: s.name });
        l.defined = true;
        this.place(l.label);
        this.stmt(s.stmt);
        return;
      }
    }
  }

  /** Labels written by the program (for `goto`), by name. */
  private userLabels = new Map<string, { label: Label; defined: boolean; used: boolean; line: number; col: number }>();
  private userLabel(name: string, at: Loc) {
    let l = this.userLabels.get(name);
    if (!l) {
      l = { label: this.label(), defined: false, used: false, line: at.line, col: at.col };
      this.userLabels.set(name, l);
    }
    return l;
  }
  /** After the body: every `goto` needs its label. */
  checkLabels(): void {
    for (const [name, l] of this.userLabels) {
      if (l.used && !l.defined) this.err("unknown-label", `there is no label '${name}' in this function`, l, { name });
    }
  }

  /** A loop body or branch gets its own scope, even when it is a single statement. */
  private scopedStmt(s: Stmt): void {
    this.pushScope();
    this.stmt(s);
    this.popScope();
  }

  private condition(c: Expr, at: Loc): (fr: Frame) => boolean {
    const saved = this.stmtTemps;
    this.stmtTemps = [];
    try {
      const b = this.asBool(this.expr(c), at);
      if (!this.stmtTemps.length) return b;
      // Temporaries of the condition die before the branch is taken.
      const t = this.tmp();
      this.exec((fr) => void (fr[t] = b(fr)), at);
      this.flushTemps();
      return (fr) => fr[t];
    } finally {
      this.stmtTemps = saved;
    }
  }

  private ifStatement(s: Extract<Stmt, { k: "if" }>): void {
    this.pushScope();
    if (s.init) this.stmt(s.init);
    let cond: (fr: Frame) => boolean;
    if (s.condDecl) {
      // if (int x = f()) ...
      const d = s.condDecl as Extract<Stmt, { k: "decl" }>;
      this.stmt(s.condDecl);
      const v = this.lookupVar(d.decls[0].name)!;
      cond = this.asBool(this.varCE(v, s), s);
    } else cond = this.condition(s.c!, s);
    const elseL = this.label();
    const endL = this.label();
    this.jf(cond, s.else ? elseL : endL);
    this.scopedStmt(s.then);
    if (s.else) {
      this.jmp(endL);
      this.place(elseL);
      this.scopedStmt(s.else);
    }
    this.place(endL);
    this.popScope();
  }

  /** Ends the function with `value` (null: no value). Locals die after the value is computed and before the function leaves. */
  private emitReturn(value: ((fr: Frame) => any) | null, keep: VarInfo | null = null): void {
    const pending = this.destroyLists.some((l) => l.some((e) => e.v !== keep));
    if (!pending) {
      this.out.push({ op: Op.Ret, v: value });
      return;
    }
    let result: ((fr: Frame) => any) | null = null;
    if (value) {
      const t = this.tmp();
      this.exec((fr) => void (fr[t] = value(fr)), { line: this.curLine, col: 0 });
      result = (fr) => fr[t];
    }
    this.emitDestroysFrom(0, keep);
    this.out.push({ op: Op.Ret, v: result });
  }

  private returnStatement(s: Extract<Stmt, { k: "return" }>): void {
    const fn = this.fn;
    if (s.e === null) {
      if (this.retTy && this.retTy.k !== "void" && !fn.isCtor) this.err("return-missing", "this function must return a value", s);
      this.emitReturn(null);
      return;
    }
    if (fn.isCtor || (this.retTy && this.retTy.k === "void")) {
      this.err("return-void", "a void function cannot return a value", s);
    }
    if (this.retTy === null) {
      // Deducing a lambda's return type from its first return.
      const ce = this.expr(s.e);
      this.retTy = decay(ce.ty);
      this.fn.ret = this.retTy;
      this.emitReturn(this.copyOf(this.coerce(ce, this.retTy, s), this.retTy));
      return;
    }
    const ret = this.retTy;
    let ce = this.expr(s.e, ret);
    if (fn.retRef) {
      // Returns a reference: the object itself, or a Place for a number.
      if (isClassLike(ret)) {
        const conv = this.coerce(ce, ret, s);
        this.emitReturn(ce.lv ? ce.ev : conv.ev);
        return;
      }
      // A stream is its own place: `return os << x;` hands back the same stream.
      const rs = strip(ret).k;
      if (rs === "ostream" || rs === "istream" || rs === "sstream") {
        this.emitReturn(ce.ev);
        return;
      }
      if (!ce.lv) this.err("return-ref", "cannot return a reference to a temporary value", s);
      this.emitReturn(ce.lv);
      return;
    }
    ce = this.coerce(ce, ret, s);
    const { value, keep } = this.returnValue(s.e, ce, ret);
    this.emitReturn(this.holdTemps(value, s), keep);
  }

  /** If the statement made temporaries, compute `value` now and destroy them before the function leaves. */
  private holdTemps(value: (fr: Frame) => any, at: Loc): (fr: Frame) => any {
    if (!this.stmtTemps.length) return value;
    const t = this.tmp();
    this.exec((fr) => void (fr[t] = value(fr)), at);
    this.flushTemps();
    return (fr) => fr[t];
  }

  /** The closure that produces the returned value: a local being returned is not copied (and not destroyed). */
  private returnValue(e: Expr, ce: CE, ret: Ty): { value: (fr: Frame) => any; keep: VarInfo | null } {
    if (!needsClone(ret)) return { value: ce.ev, keep: null };
    if (e.k === "id") {
      const v = this.lookupVar(e.name);
      if (v && !v.global && !v.placeRef && !this.isParamByRef(v) && !this.lambdaCaptures.has(e.name)) return { value: ce.ev, keep: v };
    }
    return { value: this.copyOf(ce, ret), keep: null };
  }

  private isParamByRef(v: VarInfo): boolean {
    const p = this.fn.params.find((x) => x.slot === v.slot);
    return !!p && p.pass !== "value";
  }

  /* ------------------------------------ switch ------------------------------------ */

  private switchStatement(s: Extract<Stmt, { k: "switch" }>): void {
    const sel = this.expr(s.e);
    if (!isIntegral(strip(sel.ty))) this.err("switch-type", "a switch needs an integer, character or enum value", s);
    const end = this.label();
    const table = new Map<any, Label>();
    let dflt: Label | null = null;
    const labels: Label[] = [];
    for (const c of s.cases) {
      const l = this.label();
      labels.push(l);
      if (c.value === null) {
        if (dflt) this.err("duplicate-default", "more than one 'default' in a switch", c.loc);
        dflt = l;
      } else {
        const k = this.expr(c.value);
        if (k.cst === undefined) this.err("case-constant", "a case label must be a constant", c.loc);
        const key = typeof k.cst === "boolean" ? (k.cst ? 1 : 0) : k.cst;
        if (table.has(key)) this.err("duplicate-case", `duplicate case value ${String(key)}`, c.loc, { value: String(key) });
        table.set(key, l);
      }
    }
    const selEv = sel.ev;
    const st = strip(sel.ty);
    const conv = st.k === "bool" ? (x: any) => (x ? 1 : 0) : null;
    this.out.push({ op: Op.Switch, sel: conv ? (fr) => conv(selEv(fr)) : selEv, table, dflt, end });
    this.pushScope();
    this.loops.push({ brk: end, cont: null, depth: this.scopes.length - 1 });
    s.cases.forEach((c, i) => {
      this.place(labels[i]);
      for (const x of c.body) this.stmt(x);
    });
    this.loops.pop();
    this.popScope();
    this.place(end);
  }

  /* ---------------------------------- range for ----------------------------------- */

  private rangeFor(s: Extract<Stmt, { k: "rangefor" }>): void {
    this.pushScope();
    const range = this.rangeExpr(s.range);
    const rt = strip(range.ty);
    const info = this.cc.lib.rangeInfo(rt);
    if (!info) this.err("not-iterable", `${tyStr(range.ty)} cannot be used in a range-based for loop`, s.range, { type: tyStr(range.ty) });
    // Hold the container (or a copy of a temporary) in a slot.
    const cslot = this.tmp();
    const islot = this.tmp();
    const nslot = this.tmp();
    const rev = range.ev;
    this.exec((fr) => {
      const c = rev(fr);
      fr[cslot] = info.prepare ? info.prepare(c) : c;
      fr[islot] = 0;
      fr[nslot] = info.length(fr[cslot]);
    }, s);
    const top = this.label();
    const cont = this.label();
    const end = this.label();
    this.place(top);
    this.jf((fr) => fr[islot] < fr[nslot], end);
    // Bind the loop variable(s)
    this.pushScope();
    const declared = this.resolveForType(s.type, s);
    const isRef = declared.k === "ref";
    const base = isRef ? (declared as { to: Ty }).to : declared;
    if (s.bindings) {
      const elemTy = info.elemTy;
      const st = strip(elemTy);
      if (st.k !== "std" || (st.name !== "pair" && st.name !== "tuple")) this.err("bad-binding", "structured bindings need a pair or a tuple", s);
      const fields = st.name === "pair" ? ["first", "second"] : null;
      if (fields && s.names.length !== 2) this.err("bad-binding", "a pair has two parts", s);
      s.names.forEach((n, k) => {
        const fty = st.args[k];
        const v = this.declare(n, withConstIf(fty, base.c), s, { placeRef: isRef && !isClassLike(fty) && !base.c });
        const get = info.at;
        if (st.name === "pair") {
          const f = k === 0 ? "first" : "second";
          if (v.placeRef) this.exec((fr) => (fr[v.slot] = new FieldPlaceLazy(get(fr[cslot], fr[islot]), f)), s);
          else if (isClassLike(fty) && isRef) this.exec((fr) => (fr[v.slot] = get(fr[cslot], fr[islot])[f]), s);
          else {
            const clone = isClassLike(fty) ? this.cloner(fty) : null;
            this.exec((fr) => (fr[v.slot] = clone ? clone(get(fr[cslot], fr[islot])[f]) : get(fr[cslot], fr[islot])[f]), s);
          }
        } else {
          this.exec((fr) => (fr[v.slot] = get(fr[cslot], fr[islot]).e[k]), s);
        }
      });
    } else {
      const name = s.names[0];
      let vty = base;
      // `auto x` copies (an array row decays to a pointer); `auto &x` binds the element itself, array and all.
      if (base.k === "tparam") vty = withConstIf(isRef ? strip(info.elemTy) : decay(info.elemTy), base.c);
      // `auto *p`: the element is a pointer
      else if (base.k === "ptr" && base.to.k === "tparam") vty = decay(info.elemTy);
      const ety = info.elemTy;
      if (!isRef && !sameType(vty, ety) && !(isArithmetic(strip(vty)) && isArithmetic(strip(ety)))) {
        // allow conversions through the usual rules (e.g. string from char*)
        this.coerce({ ty: ety, ev: () => undefined, line: s.line }, vty, s);
      }
      const v = this.declare(name, vty, s, { placeRef: isRef && !isClassLike(vty) && !!info.place, isConst: !!vty.c });
      const conv = !isRef ? convertFn(ety, vty) : null;
      if (v.placeRef) {
        const place = info.place!;
        this.exec((fr) => (fr[v.slot] = place(fr[cslot], fr[islot])), s);
      } else if (isRef) {
        this.exec((fr) => (fr[v.slot] = info.at(fr[cslot], fr[islot])), s);
      } else {
        const clone = isClassLike(vty) ? this.cloner(vty) : null;
        this.exec((fr) => {
          const x = info.at(fr[cslot], fr[islot]);
          fr[v.slot] = clone ? clone(x) : conv ? conv(x) : x;
        }, s);
      }
    }
    this.loops.push({ brk: end, cont, depth: this.scopes.length });
    this.scopedStmt(s.body);
    this.loops.pop();
    this.popScope();
    this.place(cont);
    this.exec((fr) => {
      fr[islot]++;
      // The container may have changed during the loop.
      if (info.live) fr[nslot] = info.length(fr[cslot]);
    }, s);
    this.jmp(top);
    this.place(end);
    this.popScope();
  }

  /** The thing a range-for loops over; a bare `{1, 2, 3}` is a std::initializer_list of the common type. */
  private rangeExpr(e: Expr): CE {
    if (e.k !== "init" || e.type) return this.expr(e);
    if (!e.elems.length) this.err("init-list-type", "a list in braces needs a type to initialise", e);
    const tys = e.elems.map((x) => (x.k === "str" ? T_STR : noConst(decay(this.typeOfExpr(x)))));
    const elem = tys.reduce((a, b) => (sameType(a, b) ? a : isArithmetic(a) && isArithmetic(b) ? commonType(a, b) : this.err("init-list-type", `the values in the braces have different types (${tyStr(a)} and ${tyStr(b)})`, e, { left: tyStr(a), right: tyStr(b) })));
    return this.cc.lib.listInit(this, stdTy("initializer_list", [elem]), e.elems, e);
  }

  private resolveForType(spec: TypeSpec, at: Loc): Ty {
    return this.cc.resolveType(spec, this);
    void at;
  }

  /* ------------------------------ structured bindings ------------------------------ */

  private bindStatement(s: Extract<Stmt, { k: "bind" }>): void {
    const init = this.expr(s.init);
    const t = strip(init.ty);
    const isRef = s.type.k === "ref";
    if (t.k !== "std" || (t.name !== "pair" && t.name !== "tuple")) {
      if (t.k === "cls") this.unsupported("structured bindings of structs", s);
      this.err("bad-binding", "structured bindings need a pair or a tuple", s);
    }
    const slot = this.tmp();
    const cl = isRef ? null : this.cloner(t);
    const ev = init.ev;
    this.exec((fr) => (fr[slot] = cl ? cl(ev(fr)) : ev(fr)), s);
    if (t.name === "pair" && s.names.length !== 2) this.err("bad-binding", "a pair has two parts", s);
    if (t.name === "tuple" && s.names.length !== t.args.length) this.err("bad-binding", `this tuple has ${t.args.length} parts`, s);
    s.names.forEach((n, k) => {
      const fty = t.args[k];
      const v = this.declare(n, fty, s, { placeRef: isRef && !isClassLike(fty) });
      const f = t.name === "pair" ? (k === 0 ? "first" : "second") : null;
      if (v.placeRef) this.exec((fr) => (fr[v.slot] = f ? new FieldPlaceLazy(fr[slot], f) : new ElemPlace(fr[slot].e, k)), s);
      else this.exec((fr) => (fr[v.slot] = f ? fr[slot][f] : fr[slot].e[k]), s);
    });
  }

  /* --------------------------------- declarations ---------------------------------- */

  /** A variable declaration with its initialiser. */
  declareVariable(typeSpec: TypeSpec, d: Declarator, where: "local" | "global" | "static", isConstexpr: boolean): void {
    this.lastDeclared = null;
    this.declareVariableInner(typeSpec, d, where, isConstexpr);
    const v = this.lastDeclared as VarInfo | null;
    if (!v || v.placeRef) return;
    // A variable of an abstract class type cannot exist (a reference or pointer to one is fine).
    const declared = this.cc.resolveType(d.type, this);
    if (declared.k === "cls") this.cc.assertConcrete(declared.cls.info as ClassInfo, d.loc);
    const destroy = this.cc.destroyerOf(v.ty);
    if (!destroy) return;
    if (where === "local") this.registerDestroy(v);
    else {
      // Globals and statics live until the program ends and then die, last constructed first.
      const rt = this.rt;
      const G = this.cc.G;
      const slot = v.slot;
      let registered = false;
      this.exec(() => {
        if (registered) return;
        registered = true;
        rt.atExit.push(() => {
          if (G[slot] !== undefined) destroy(G[slot]);
        });
      }, d.loc);
    }
  }

  private lastDeclared: VarInfo | null = null;

  private declareVariableInner(typeSpec: TypeSpec, d: Declarator, where: "local" | "global" | "static", isConstexpr: boolean): void {
    let ty = this.cc.resolveType(d.type, this);
    const at = d.loc;
    const isAuto = ty.k === "tparam" && ty.name === "auto";
    const isRefAuto = ty.k === "ref" && ty.to.k === "tparam" && ty.to.name === "auto";
    // Arrays
    let sizeEvs: ((fr: Frame) => number)[] | null = null;
    let dims: number[] = [];
    if (d.dims.length) {
      if (isAuto) this.err("bad-auto", "'auto' cannot be an array", at);
      const base = ty;
      const dimCEs = d.dims.map((x) => (x ? this.expr(x) : null));
      const consts = dimCEs.map((c) => (c && c.cst !== undefined ? Number(c.cst) : null));
      if (consts.every((c, i) => c !== null || d.dims[i] === null)) {
        dims = consts.map((c) => (c === null ? -1 : c));
        let t: Ty = base;
        for (let i = dims.length - 1; i >= 0; i--) t = { k: "arr", of: t, n: dims[i] };
        ty = t;
      } else {
        // A size known only at run time (g++ allows it): evaluate when the declaration runs.
        sizeEvs = dimCEs.map((c) => {
          if (!c) this.err("array-size", "an array needs a size", at);
          const ev = this.coerce(c, T_INT, at).ev;
          return ev as (fr: Frame) => number;
        });
        let t: Ty = base;
        for (let i = dims.length || sizeEvs.length - 1; i >= 0; i--) t = { k: "arr", of: t, n: -1 };
        ty = t;
      }
    }
    if (ty.k === "void") this.err("void-variable", `variable '${d.name}' has type void`, at, { name: d.name });
    void typeSpecOf;
    void isRefAuto;
    const init = d.init;
    const constLike = (ty.c || isConstexpr) && !d.dims.length;

    // Where the variable lives
    const declareHere = (t: Ty, opts: Opts): VarInfo => {
      if (where === "local") return (this.lastDeclared = this.declare(d.name, t, at, opts));
      // Globals and statics live in the global frame
      const slot = this.cc.addGlobalSlot();
      const v: VarInfo = { name: d.name, ty: t, slot, global: true, placeRef: opts.placeRef ?? false, isConst: opts.isConst ?? false, check: opts.check ?? false, line: at.line, cst: opts.cst };
      if (where === "global") {
        if (this.cc.globals.has(d.name) || this.cc.funcs.has(d.name)) this.err("redeclared", `'${d.name}' is already declared`, at, { name: d.name });
        this.cc.globals.set(d.name, v);
      } else {
        const scope = this.scopes[this.scopes.length - 1];
        if (scope.has(d.name)) this.err("redeclared", `'${d.name}' is already declared in this scope`, at, { name: d.name });
        scope.set(d.name, v);
      }
      this.lastDeclared = v;
      return v;
    };

    // `static` locals initialise once.
    let skip: Label | null = null;
    let flagSlot = -1;
    if (where === "static") {
      flagSlot = this.cc.addGlobalSlot();
      this.cc.G[flagSlot] = false;
      skip = this.label();
      const G = this.cc.G;
      this.jt(() => G[flagSlot] === true, skip);
    }

    // Reference variables: `T& r = x;`
    if (ty.k === "ref" || isRefAuto) {
      if (!init || init.k !== "assign") this.err("ref-uninit", `reference '${d.name}' needs an initialiser`, at, { name: d.name });
      const target = ty.k === "ref" ? ty.to : ty;
      const ce = this.expr(init.expr, target.k === "tparam" ? undefined : target);
      const refTo = target.k === "tparam" ? withConstIf(ce.ty, target.c) : target;
      const classLike = isClassLike(refTo);
      if (classLike) {
        const conv = this.coerce(ce, refTo, at);
        const v = declareHere(refTo, { isConst: !!refTo.c });
        const ev = ce.lv || sameType(ce.ty, refTo) ? ce.ev : conv.ev;
        if (!ce.lv && !refTo.c && !ce.name) this.err("ref-bind", `cannot bind a non-const reference to a temporary`, at);
        this.storeVar(v, ev, at);
      } else {
        const conv = this.coerce(ce, refTo, at);
        if (ce.lv && sameType(ce.ty, refTo)) {
          const v = declareHere(refTo, { placeRef: true, isConst: !!refTo.c });
          this.storeVar(v, ce.lv, at);
        } else {
          if (!refTo.c) this.err("ref-bind", `cannot bind a non-const reference to ${ce.lv ? "a different type" : "a temporary"}`, at);
          const v = declareHere(refTo, { placeRef: true, isConst: true });
          const ev = conv.ev;
          this.storeVar(v, (fr) => new BoxPlace(ev(fr)), at);
        }
      }
      if (skip) this.finishStatic(skip, flagSlot, at);
      return;
    }

    // `auto x = e;` deduces from the initialiser
    if (isAuto) {
      if (!init) this.err("auto-uninit", `'${d.name}' is declared auto but has no initialiser`, at, { name: d.name });
      if (init.k === "brace" && init.args.length !== 1) this.err("auto-brace", "auto with several values in braces cannot be deduced", at);
      const e = init.k === "assign" ? init.expr : init.args[0];
      const ce = this.expr(e);
      const deduced = withConstIf(decay(ce.ty), ty.c || constLike);
      const coerced = this.coerce(ce, deduced, at);
      const v = declareHere(deduced, { isConst: !!deduced.c, cst: constLike ? coerced.cst : undefined });
      this.storeVar(v, this.copyOf(coerced, deduced), at);
      if (skip) this.finishStatic(skip, flagSlot, at);
      return;
    }

    // Arrays
    if (ty.k === "arr") {
      const v = declareHere(ty, { isConst: !!ty.c });
      this.arrayInit(v, ty, d, sizeEvs, where !== "local");
      if (skip) this.finishStatic(skip, flagSlot, at);
      return;
    }

    // Everything else: scalars, strings, containers, structs
    const classLike = isClassLike(ty);
    const zeroInit = where !== "local" || !!(init && init.k !== "assign" && init.k !== "brace" && false);
    const v = declareHere(ty, { check: !classLike && !init && where === "local", isConst: !!ty.c });
    if (init === null) {
      // default-initialisation
      const maker = this.cc.defaultMaker(ty, zeroInit);
      const t = strip(ty);
      if (t.k === "cls" && (t.cls.info as ClassInfo).ctors.length) {
        this.storeVar(v, maker, at);
        this.callConstructor(t.cls.info as ClassInfo, [], false, at, this.varCE(v, at).ev);
      } else if (t.k === "cls" && constLike) {
        this.err("const-uninit", `const variable '${d.name}' needs an initialiser`, at, { name: d.name });
      } else this.storeVar(v, maker, at);
      if (skip) this.finishStatic(skip, flagSlot, at);
      return;
    }
    if (strip(ty).k === "cls" && (init.k === "paren" || init.k === "brace" || (init.k === "assign" && this.isCtorCall(init.expr, ty)))) {
      const info = strip(ty).k === "cls" ? ((strip(ty) as { cls: { info: unknown } }).cls.info as ClassInfo) : null;
      if (info && (init.k !== "assign" || info.ctors.length)) {
        const args = init.k === "assign" ? [init.expr] : init.args;
        this.storeVar(v, this.cc.defaultMaker(ty, false), at);
        if (info.ctors.length) {
          this.callConstructor(info, args, init.k === "brace", at, this.varCE(v, at).ev);
        } else {
          this.aggregateInit(info, this.varCE(v, at), args, at);
        }
        if (skip) this.finishStatic(skip, flagSlot, at);
        return;
      }
    }
    const ce = this.initializerValue(ty, init, at);
    v.cst = constLike && ce.cst !== undefined && isArithmetic(strip(ty)) ? ce.cst : undefined;
    if (v.cst !== undefined && where === "global") {
      // constants known at compile time can be used for array sizes
    }
    this.storeVar(v, this.copyOf(ce, ty), at);
    if (skip) this.finishStatic(skip, flagSlot, at);
  }

  private isCtorCall(e: Expr, ty: Ty): boolean {
    void e;
    void ty;
    return false;
  }

  private finishStatic(skip: Label, flagSlot: number, at: Loc): void {
    const G = this.cc.G;
    this.exec(() => void (G[flagSlot] = true), at);
    this.place(skip);
  }

  /** Stores the value of `ev` in the variable (its slot, global or local). */
  private storeVar(v: VarInfo, ev: (fr: Frame) => any, at: Loc): void {
    const slot = v.slot;
    if (v.global) {
      const G = this.cc.G;
      this.exec((fr) => void (G[slot] = ev(fr)), at);
    } else this.exec((fr) => void (fr[slot] = ev(fr)), at);
  }

  /** The value an initialiser produces for a variable of type `ty`. */
  initializerValue(ty: Ty, init: { k: "assign"; expr: Expr } | { k: "paren"; args: Expr[] } | { k: "brace"; args: Expr[] }, at: Loc): CE {
    const t = strip(ty);
    if (init.k === "assign") {
      const ce = this.expr(init.expr, ty);
      return this.coerceInit(ce, ty, at);
    }
    // direct / list initialisation
    if (init.k === "brace") {
      const listType = t.k === "std" || t.k === "cls";
      if (!listType) {
        if (init.args.length === 0) {
          const maker = this.cc.defaultMaker(ty, true);
          return { ty, ev: () => maker(), line: at.line };
        }
        if (init.args.length > 1) this.err("too-many-initializers", "too many initialisers for a single value", at);
        const ce = this.expr(init.args[0], ty);
        // Narrowing is an error in list-initialisation.
        this.checkNarrowing(ce, ty, at);
        return this.coerceInit(ce, ty, at);
      }
      return this.cc.lib.listInit(this, ty, init.args, at);
    }
    // parenthesised
    if (!isClassLike(ty) && t.k !== "cls" && t.k !== "sstream") {
      if (init.args.length === 0) {
        const maker = this.cc.defaultMaker(ty, true);
        return { ty, ev: () => maker(), line: at.line };
      }
      if (init.args.length !== 1) this.err("too-many-initializers", "too many initialisers for a single value", at);
      return this.coerceInit(this.expr(init.args[0], ty), ty, at);
    }
    return this.cc.lib.construct(this, ty, init.args, at);
  }

  private checkNarrowing(ce: CE, to: Ty, at: Loc): void {
    const f = strip(ce.ty);
    const t = strip(to);
    if (ce.cst !== undefined && typeof ce.cst !== "boolean") return;
    const narrowing = (isFloating(f) && isIntegral(t)) || (f.k === "double" && t.k === "float") || (f.k === "int" && t.k === "int" && (f.bits > t.bits || (f.signed !== t.signed && f.bits >= t.bits)));
    if (narrowing) this.err("narrowing", `narrowing conversion of ${tyStr(ce.ty)} to ${tyStr(to)} inside { }`, at, { from: tyStr(ce.ty), to: tyStr(to) });
  }

  private coerceInit(ce: CE, ty: Ty, at: Loc): CE {
    const t = strip(ty);
    if (t.k === "cls") {
      const from = strip(ce.ty);
      if (from.k === "cls" && this.isDerived(from.cls.info as ClassInfo, t.cls.info as ClassInfo)) return ce;
      const viaCtor = this.cc.lib.constructFromOne?.(this, t.cls.info as ClassInfo, ce, at);
      if (viaCtor) return viaCtor;
    }
    return this.coerce(ce, ty, at, "init");
  }

  /** `int a[5] = {1, 2}`, `char s[] = "hi"`, `int g[3][3] = {{...}}`, and variable-length arrays. */
  private arrayInit(v: VarInfo, ty: Extract<Ty, { k: "arr" }>, d: Declarator, sizeEvs: ((fr: Frame) => number)[] | null, zero: boolean): void {
    const at = d.loc;
    const elem = ty.of;
    const init = d.init;
    const charElem = elem.k === "int" && elem.ch;
    // Collect element expressions
    let list: Expr[] | null = null;
    let strLit: string | null = null;
    if (init) {
      if (init.k === "brace") list = init.args;
      else if (init.k === "assign" && init.expr.k === "init") list = init.expr.elems;
      else if (init.k === "assign" && init.expr.k === "str" && charElem) strLit = init.expr.value;
      else this.err("array-init", "an array is initialised with { ... }", at);
    }
    // Size from the initialiser: int a[] = {1,2,3}
    let size = ty.n;
    if (size === -1 && !sizeEvs) {
      if (list) size = list.length;
      else if (strLit !== null) size = strLit.length + 1;
      else this.err("array-size", `the size of array '${d.name}' is not known`, at, { name: d.name });
      (v.ty as { n: number }).n = size;
    }
    if (strLit !== null && ty.n !== -1 && strLit.length >= ty.n + 1) this.err("array-init", "the string is too long for the array", at);
    if (list && size >= 0 && list.length > size) this.err("too-many-initializers", `too many initialisers for an array of ${size}`, at);
    // Element creation
    const makeElem = this.cc.defaultMaker(elem, zero);
    const slot = v.slot;
    const G = this.cc.G;
    const store = (fr: Frame, a: any) => {
      if (v.global) G[slot] = a;
      else fr[slot] = a;
    };
    const rt = this.rt;
    const countMem = (n: number) => {
      rt.mem += n * 8;
      if (rt.mem > rt.memLimit) throw limitError("memory-limit", "the program used too much memory");
    };
    const elems: CE[] = [];
    if (list) {
      for (const x of list) {
        if (strip(elem).k === "arr") {
          // nested braces for rows
          elems.push(this.nestedArrayInit(elem as Extract<Ty, { k: "arr" }>, x, at));
        } else {
          const ce = this.expr(x, elem);
          this.checkNarrowing(ce, elem, at);
          elems.push(this.coerceInit(ce, elem, at));
        }
      }
    }
    const lits = strLit !== null ? [...strLit].map((c) => c.charCodeAt(0)) : null;
    const zeroElem = this.cc.defaultMaker(elem, true);
    const evs = elems.map((e) => this.copyOf(e, elem));
    const sizeOf = sizeEvs ? sizeEvs[0] : null;
    const rest = sizeEvs ? sizeEvs.slice(1) : null;
    void rest;
    this.exec((fr) => {
      let n = size;
      if (sizeOf) {
        n = sizeOf(fr);
        if (n < 0) throw semanticRuntime("negative array size");
      }
      countMem(n);
      const a = new Array(n);
      if (list || lits) {
        for (let i = 0; i < n; i++) a[i] = i < evs.length ? evs[i](fr) : lits ? (i < lits.length ? lits[i] : 0) : zeroElem();
      } else for (let i = 0; i < n; i++) a[i] = makeElem();
      store(fr, a);
    }, at);
  }

  private nestedArrayInit(ty: Extract<Ty, { k: "arr" }>, e: Expr, at: Loc): CE {
    if (e.k !== "init") this.err("array-init", "expected { ... } for a row of the array", e);
    const parts = e.elems.map((x) => (strip(ty.of).k === "arr" ? this.nestedArrayInit(ty.of as Extract<Ty, { k: "arr" }>, x, at) : this.coerce(this.expr(x, ty.of), ty.of, at)));
    const zero = this.cc.defaultMaker(ty.of, true);
    const n = ty.n;
    const evs = parts.map((p) => p.ev);
    return {
      ty,
      ev: (fr) => {
        const a = new Array(n);
        for (let i = 0; i < n; i++) a[i] = i < evs.length ? evs[i](fr) : zero();
        return a;
      },
      line: at.line,
    };
  }

  /** `Point p = {1, 2};` and `Point p{1, 2};` for a struct without constructors: set the fields in order. */
  private aggregateInit(info: ClassInfo, target: CE, args: Expr[], at: Loc): void {
    const fields = info.fields.filter((f) => !f.isStatic);
    if (args.length > fields.length) this.err("too-many-initializers", `${info.name} has ${fields.length} fields`, at, { name: info.name });
    const values = args.map((a, i) => {
      const f = fields[i];
      const ce = this.expr(a, f.ty);
      this.checkNarrowing(ce, f.ty, at);
      return { name: f.name, ev: this.copyOf(this.coerceInit(ce, f.ty, at), f.ty) };
    });
    const obj = target.ev;
    this.exec((fr) => {
      const o = obj(fr);
      for (let i = 0; i < values.length; i++) o[values[i].name] = values[i].ev(fr);
    }, at);
    // Fields not mentioned use their default member initialisers.
    for (let i = args.length; i < fields.length; i++) {
      const f = fields[i];
      if (f.init) {
        const ce = this.coerce(this.expr(f.init, f.ty), f.ty, at);
        const ev = this.copyOf(ce, f.ty);
        this.exec((fr) => void (obj(fr)[f.name] = ev(fr)), at);
      } else {
        const maker = this.cc.defaultMaker(f.ty, true);
        this.exec((fr) => void (obj(fr)[f.name] = maker()), at);
      }
    }
  }

  /* ------------------------------------ calls ------------------------------------- */

  /** `new Class` + constructor call on an existing object. */
  callConstructor(info: ClassInfo, args: Expr[], brace: boolean, at: Loc, obj: (fr: Frame) => any): void {
    if (!info.ctors.length) {
      // Aggregate: fields in order.
      const target: CE = { ty: info.ty, ev: obj, line: at.line };
      this.aggregateInit(info, target, args, at);
      return;
    }
    const fn = this.pickOverload(info.ctors, args.map((a) => this.expr(a)), args, at, info.name);
    this.emitCall(fn.fn, [obj, ...fn.args], -1, at, false);
  }

  /**
   * Chooses among overloads by the types of the arguments, and returns the
   * function with argument closures converted to what each parameter needs.
   */
  pickOverload(cands: FnInfo[], argCEs: CE[], argExprs: Expr[], at: Loc, name: string): { fn: FnInfo; args: ((fr: Frame) => any)[] } {
    type Scored = { fn: FnInfo; score: number; args: ((fr: Frame) => any)[]; binds: (CE | null)[] };
    const scored: Scored[] = [];
    const errors: string[] = [];
    for (let fn of cands) {
      if (fn.tparams.length) {
        const inst = this.deduceTemplate(fn, argCEs, at);
        if (!inst) continue;
        fn = inst;
      }
      const np = fn.params.length;
      const required = fn.params.filter((p) => !p.def).length;
      if (argCEs.length < required || argCEs.length > np) {
        errors.push(`${fn.qname} takes ${np} arguments`);
        continue;
      }
      let score = 0;
      const args: ((fr: Frame) => any)[] = [];
      const binds: (CE | null)[] = [];
      let ok = true;
      for (let i = 0; i < np && ok; i++) {
        const p = fn.params[i];
        let ce: CE;
        if (i < argCEs.length) ce = argCEs[i];
        else {
          ce = this.expr(p.def!, p.ty);
        }
        const r = this.passArg(p, ce, argExprs[i] ?? p.def!, at);
        if (!r) {
          ok = false;
          break;
        }
        score += r.score;
        args.push(r.ev);
        binds.push(r.bind ?? null);
      }
      if (ok) scored.push({ fn, score, args, binds });
    }
    if (!scored.length) {
      const argTypes = argCEs.map((c) => tyStr(c.ty)).join(", ");
      this.err("no-matching-function", `no function '${name}' matches the arguments (${argTypes})`, at, { name, args: argTypes });
    }
    scored.sort((a, b) => a.score - b.score);
    if (scored.length > 1 && scored[0].score === scored[1].score && scored[0].fn !== scored[1].fn) {
      this.err("ambiguous-call", `the call to '${name}' is ambiguous`, at, { name });
    }
    // A temporary bound to a reference parameter lives until the end of the statement.
    const best = scored[0];
    return { fn: best.fn, args: best.args.map((a, i) => (best.binds[i] ? this.bindTemp(best.binds[i]!) : a)) };
  }

  /** The cost of passing `ce` as parameter `p` (null if it cannot be passed) and the closure that passes it. */
  private passArg(p: ParamInfo, ce: CE, expr: Expr, at: Loc): { score: number; ev: (fr: Frame) => any; bind?: CE } | null {
    const to = p.ty;
    const from = strip(ce.ty);
    let score = 0;
    const exact = sameType(from, to) && !!from.c === !!to.c;
    if (!exact) score += sameType(from, to) ? 0 : 3;
    if (ce.fn && ce.fn.length && to.k === "fn") score += 1;
    if (p.pass === "ref") {
      if (!ce.lv) return null;
      if (!sameType(from, to)) return null;
      if (ce.ty.c && !to.c) return null;
      return { score, ev: ce.lv };
    }
    if (p.pass === "obj") {
      if (sameType(from, to)) {
        if (!ce.lv && !to.c && !ce.name && to.k !== "ostream" && to.k !== "istream" && to.k !== "sstream") {
          // non-const reference to a temporary
          const dr = p.declared.k === "ref" ? p.declared.to : p.declared;
          if (!dr.c) return null;
        }
        // `T&&` binds only to temporaries (and std::move); `const T&` prefers lvalues.
        const rvParam = p.declared.k === "ref" && !!p.declared.rv;
        const isRv = ce.lv === undefined || !!ce.rv;
        if (rvParam && !isRv) return null;
        if (!rvParam && isRv && p.declared.k === "ref") score += 1;
        const temp = p.declared.k === "ref" && ce.lv === undefined && !ce.name;
        return { score, ev: ce.ev, bind: temp ? ce : undefined };
      }
      let conv: CE;
      try {
        conv = this.coerce(ce, to, at, "arg");
      } catch {
        return null;
      }
      return { score: score + 2, ev: conv.ev };
    }
    // by value
    try {
      if (exact && strip(from).k !== "tparam") {
        return { score, ev: this.copyOf({ ...ce, alias: ce.alias || ce.lv !== undefined }, to) };
      }
      const conv = this.coerce(ce, to, at, "arg");
      if (!sameType(from, to)) {
        const ranking = isArithmetic(from) && isArithmetic(to) ? (isIntegral(from) === isIntegral(to) ? 1 : 2) : 3;
        score += ranking;
      }
      void expr;
      return { score, ev: this.copyOf(conv, to) };
    } catch {
      return null;
    }
  }

  /** Template function: infer its type arguments from the arguments of the call. */
  private deduceTemplate(template: FnInfo, argCEs: CE[], at: Loc): FnInfo | null {
    const decl = template.decl!;
    const bound = new Map<string, Ty>();
    const explicit = this.explicitTargs;
    explicit?.forEach((t, i) => bound.set(template.tparams[i], t));
    const given = new Set(template.tparams.slice(0, explicit?.length ?? 0));
    if (argCEs.length > decl.params.length || argCEs.length < decl.params.filter((p) => !p.def).length) return null;
    const unify = (spec: TypeSpec, actual: Ty): boolean => {
      actual = spec.k === "ref" ? actual : decay(actual);
      switch (spec.k) {
        case "ref":
          return unify(spec.to, strip(actual));
        case "ptr": {
          const a = strip(actual);
          if (a.k === "arr") return unify(spec.to, a.of);
          return a.k === "ptr" && unify(spec.to, a.to);
        }
        case "named": {
          if (template.tparams.includes(spec.name)) {
            const prev = bound.get(spec.name);
            const cand = noConst(strip(actual));
            // a type written out in <...> is not deduced; the arguments are converted to it
            if (given.has(spec.name)) return true;
            if (prev) return sameType(prev, cand);
            bound.set(spec.name, cand);
            return true;
          }
          if (spec.args.length) {
            const a = strip(actual);
            if (a.k === "std" && a.name === spec.name.replace(/^std::/, "")) return spec.args.every((x, i) => (a.args[i] ? unify(x, a.args[i]) : false));
            return false;
          }
          return true;
        }
        default:
          return true;
      }
    };
    for (let i = 0; i < argCEs.length; i++) {
      if (!unify(decl.params[i].type, argCEs[i].ty)) return null;
    }
    for (const p of template.tparams) if (!bound.has(p)) return null;
    return this.cc.instantiateFunction(template, template.tparams.map((p) => bound.get(p)!), at);
  }

  explicitTargs: Ty[] | null = null;

  /** Emits a call to a user function; the result (if any) is left in a temporary slot. */
  emitCall(fn: FnInfo, args: ((fr: Frame) => any)[], dst: number, at: Loc, virt: boolean): void {
    this.out.push({ op: Op.Call, fn, args, dst, line: at.line, virt });
  }

  /** The result of a call as an expression. */
  callResult(fn: FnInfo, args: ((fr: Frame) => any)[], at: Loc, virt = false): CE {
    // An `auto` function must be compiled before its return type is known.
    if (fn.ret.k === "tparam" && fn.ret.name === "auto" && !fn.compiled) {
      if (fn.compiling) this.err("auto-recursion", `the return type of '${fn.qname}' is not known yet (it calls itself before its first return)`, at, { name: fn.qname });
      this.cc.compileBody(fn, null);
    }
    const ret = fn.ret;
    if (ret.k === "void") {
      this.emitCall(fn, args, -1, at, virt);
      return { ty: T_VOID, ev: () => undefined, line: at.line };
    }
    const t = this.tmp();
    this.emitCall(fn, args, t, at, virt);
    const rk = strip(ret).k;
    if (fn.retRef && (rk === "ostream" || rk === "istream" || rk === "sstream")) {
      return { ty: ret, ev: (fr) => fr[t], line: at.line, name: "ref" };
    }
    if (fn.retRef && !isClassLike(ret)) {
      return { ty: ret, ev: (fr) => fr[t].get(), lv: (fr) => fr[t], set: (fr, x) => fr[t].set(x), line: at.line };
    }
    if (fn.retRef) {
      const assign = this.assigner(ret);
      return { ty: ret, ev: (fr) => fr[t], lv: (fr) => new ObjPlace(fr[t], assign), set: (fr, x) => assign(fr[t], x), line: at.line, name: "ref" };
    }
    return { ty: ret, ev: (fr) => fr[t], line: at.line };
  }

  /** Calls a function value: a lambda, a function pointer or a std::function. */
  callValue(callee: CE, argCEs: CE[], at: Loc): CE {
    const t = strip(callee.ty);
    if (t.k !== "fn") this.err("not-callable", `${tyStr(callee.ty)} is not a function`, at);
    if (argCEs.length !== t.params.length) this.err("arg-count", `the function takes ${t.params.length} arguments but ${argCEs.length} were given`, at, { expected: t.params.length, given: argCEs.length });
    const args = argCEs.map((a, i) => {
      const p = t.params[i];
      const target = strip(p);
      const conv = this.coerce(a, target, at, "arg");
      const clone = needsClone(target) && a.lv !== undefined ? this.cloner(target) : null;
      const ev = conv.ev;
      return clone ? (fr: Frame) => clone(ev(fr)) : ev;
    });
    const dst = t.ret.k === "void" ? -1 : this.tmp();
    this.out.push({ op: Op.CallInd, callee: callee.ev, args, dst, line: at.line });
    if (dst < 0) return { ty: T_VOID, ev: () => undefined, line: at.line };
    return { ty: t.ret, ev: (fr) => fr[dst], line: at.line };
  }

  /* ------------------------------------ lambdas ------------------------------------ */

  compileLambda(e: Extract<Expr, { k: "lambda" }>, hint?: Ty): CE {
    const cc = this.cc;
    const id = cc.newLambdaId();
    const params: ParamInfo[] = [];
    let slot = 1;
    for (const p of e.params) {
      let ty = cc.resolveType(p.type, this);
      if (ty.k === "tparam" && ty.name === "auto") {
        // A generic lambda: take the type from the context (the function type it is passed as).
        const h = hint ? strip(hint) : null;
        const i = params.length;
        if (h && h.k === "fn" && h.params[i]) ty = h.params[i];
        else this.unsupported("lambdas with 'auto' parameters outside of an algorithm call", e);
      }
      const declared = ty;
      let pass: ParamInfo["pass"] = "value";
      if (ty.k === "ref") {
        const to = ty.to;
        if (needsClone(to) || to.k === "cls") pass = "obj";
        else if (to.c) pass = "value";
        else pass = "ref";
        ty = to;
      } else if (ty.k === "tparam" && ty.name === "auto") {
        this.unsupported("lambdas with 'auto' parameters", e);
      }
      params.push({ name: p.name, ty, declared, def: p.def, slot: slot++, pass });
    }
    let ret: Ty | null = null;
    if (e.ret) ret = cc.resolveType(e.ret, this);
    let retRef = false;
    if (ret && ret.k === "ref") {
      retRef = true;
      ret = ret.to;
    }
    const info: FnInfo = {
      id: cc.newFnId(),
      name: `<lambda${id}>`,
      qname: `<lambda${id}>`,
      ret: ret ?? T_VOID,
      retRef,
      params,
      cls: this.thisCls,
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
      nslots: slot,
      code: null,
      fast: null,
      compiled: true,
      compiling: false,
      native: null,
      captures: [],
      line: e.line,
    };
    cc.allFns.push(info);
    const fc = new FnCompiler(cc, info, this);
    fc.retTy = ret;
    fc.lambdaDefault = e.defaultCapture;
    fc.lambdaMutable = e.mutable;
    for (const c of e.captures) fc.explicitCaptures.set(c.name, c.byRef);
    if (this.thisCls) {
      // `this` is visible inside lambdas that capture it
    }
    for (const p of params) {
      const v: VarInfo = { name: p.name, ty: p.ty, slot: p.slot, global: false, placeRef: p.pass === "ref", isConst: !!p.declared.c, check: false, line: e.line };
      if (p.name) fc.scopes[0].set(p.name, v);
    }
    fc.pushScope();
    const body = e.body;
    if (body.k === "block") for (const s of body.body) fc.stmt(s);
    fc.checkLabels();
    fc.popScope();
    if (fc.retTy === null) {
      info.ret = T_VOID;
    }
    fc.out.push({ op: Op.Ret, v: null });
    info.code = fc.out;
    info.nslots = fc.nslots;
    // Linking happens with everything else; remember the function for that.
    info.compiled = true;
    // Capture list: values are collected when the lambda is created.
    const caps = info.captures;
    const outer = caps.map((c) => {
      const ov = this.lookupVar(c.name)!;
      return { c, ov };
    });
    const maker = outer.map(({ c, ov }) => {
      const isClass = isClassLike(ov.ty);
      const G = this.cc.G;
      if (c.byRef) {
        if (isClass) return ov.global ? () => G[ov.slot] : (fr: Frame) => fr[ov.slot];
        if (ov.placeRef) return (fr: Frame) => fr[ov.slot];
        return ov.global ? () => new SlotPlace(G, ov.slot) : (fr: Frame) => new SlotPlace(fr, ov.slot);
      }
      // by value: a copy now
      const clone = isClass ? this.cloner(ov.ty) : null;
      if (ov.placeRef) return (fr: Frame) => fr[ov.slot].get();
      return (fr: Frame) => {
        const v = ov.global ? G[ov.slot] : fr[ov.slot];
        return clone ? clone(v) : v;
      };
    });
    const fty: Ty = { k: "fn", ret: info.ret, params: params.map((p) => (p.pass === "value" ? p.ty : { k: "ref", to: p.ty })) };
    void fty;
    const type: Ty = { k: "fn", ret: info.ret, params: params.map((p) => p.ty) };
    const thisSlot = this.thisCls ? 1 : -1;
    void thisSlot;
    return {
      ty: type,
      ev: (fr) => {
        const env = new Array(maker.length);
        for (let i = 0; i < maker.length; i++) env[i] = maker[i](fr);
        return new Func(info, env);
      },
      line: e.line,
    };
  }

  /** `Class(args)` or `Class{args}` as an expression: a new object. */
  constructObject(ty: Ty, args: Expr[], brace: boolean, at: Loc): CE {
    const t = strip(ty);
    if (t.k === "cls") {
      const info = t.cls.info as ClassInfo;
      this.cc.assertConcrete(info, at);
      const slot = this.tmp();
      const make = info.create!;
      this.exec((fr) => void (fr[slot] = make()), at);
      const obj: (fr: Frame) => any = (fr) => fr[slot];
      if (info.ctors.length) this.callConstructor(info, args, brace, at, obj);
      else this.aggregateInit(info, { ty, ev: obj, line: at.line }, args, at);
      return { ty, ev: obj, line: at.line };
    }
    return this.initializerValue(ty, { k: brace ? "brace" : "paren", args }, at);
  }
}

function withConstIf(t: Ty, c: boolean | undefined): Ty {
  return c ? withConst(t) : t;
}

function typeSpecOf(): void {}

function semanticRuntime(message: string): Error {
  return semanticError("negative-size", message, 0, 0);
}

function runtimeUninit(name: string, line: number): Error {
  return Object.assign(semanticError("uninitialized", `'${name}' was used before it was given a value`, line, 0, { name }), {});
}

/** A reference to a field of an object (created lazily by `FnCompiler.fieldCE`). */
class FieldPlaceLazy implements Place {
  constructor(
    private o: any,
    private name: string,
  ) {}
  get() {
    return this.o[this.name];
  }
  set(v: any) {
    this.o[this.name] = v;
  }
}

export { FieldPlaceLazy };
