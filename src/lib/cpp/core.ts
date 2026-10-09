import type { ClassDecl, Expr, FuncDecl } from "./ast";
import type { Place } from "./values";
import type { Ty } from "./types";

/** Shared shapes between the compiler, the machine and the library. */

export type Frame = any[];

export interface Label {
  pc: number;
}

export const enum Op {
  Exec,
  Jmp,
  Jf,
  Jt,
  Call,
  CallInd,
  Ret,
  Label,
  Switch,
}

export type Instr =
  /** Runs a closure for its effect. Adjacent ones are merged when the code is linked. */
  | { op: Op.Exec; f: (fr: Frame) => any; line: number }
  | { op: Op.Jmp; to: Label }
  | { op: Op.Jf; c: (fr: Frame) => boolean; to: Label }
  | { op: Op.Jt; c: (fr: Frame) => boolean; to: Label }
  | { op: Op.Call; fn: FnInfo; args: ((fr: Frame) => any)[]; dst: number; line: number; /** virtual: pick the override by the object in slot 1 */ virt: boolean }
  | { op: Op.CallInd; callee: (fr: Frame) => any; args: ((fr: Frame) => any)[]; dst: number; line: number }
  | { op: Op.Ret; v: ((fr: Frame) => any) | null }
  | { op: Op.Label; l: Label }
  | { op: Op.Switch; sel: (fr: Frame) => any; table: Map<any, Label>; dflt: Label | null; end: Label };

/** How a parameter is passed. */
export type PassKind = "value" | "ref" | "obj";

export interface ParamInfo {
  name: string;
  ty: Ty;
  /** What the declaration said (before decay); a reference parameter is `ref`. */
  declared: Ty;
  def: Expr | null;
  slot: number;
  /** "ref": the slot holds a Place (a reference to a number); "obj": a class-like object shared with the caller; "value": a copy. */
  pass: PassKind;
}

export interface FnInfo {
  id: number;
  name: string;
  /** Printable, for messages: `Counter::add`. */
  qname: string;
  ret: Ty;
  /** The return value is a reference (a Place for numbers, the object itself otherwise). */
  retRef: boolean;
  params: ParamInfo[];
  cls: ClassInfo | null;
  isMethod: boolean;
  isStatic: boolean;
  isCtor: boolean;
  isDtor: boolean;
  isVirtual: boolean;
  /** `= 0`: declared but not defined; an override must supply the body. */
  isPure: boolean;
  isConst: boolean;
  access: "public" | "private" | "protected";
  decl: FuncDecl | null;
  /** Template functions are compiled once per set of argument types. */
  tparams: string[];
  instances: Map<string, FnInfo>;
  nslots: number;
  code: Instr[] | null;
  /** A body without calls to user code: run it directly. */
  fast: ((fr: Frame) => any) | null;
  compiled: boolean;
  compiling: boolean;
  /** Natives are implemented in JS and called with evaluated arguments. */
  native: ((...args: any[]) => any) | null;
  /** Lambdas: slots of the captured variables, and how they are held. */
  captures: { slot: number; byRef: boolean; name: string; viaEnv?: boolean }[];
  line: number;
}

export interface FieldInfo {
  name: string;
  ty: Ty;
  init: Expr | null;
  initBrace: Expr[] | null;
  isStatic: boolean;
  access: "public" | "private" | "protected";
  line: number;
}

export interface ClassInfo {
  name: string;
  isStruct: boolean;
  decl: ClassDecl | null;
  fields: FieldInfo[];
  fieldMap: Map<string, FieldInfo>;
  methods: Map<string, FnInfo[]>;
  ctors: FnInfo[];
  dtor: FnInfo | null;
  /** The fields declared by this class itself (not inherited), in order. */
  ownFields: FieldInfo[];
  /** A user-written copy constructor / move constructor / copy assignment, when there is one. */
  copyCtor: FnInfo | null;
  moveCtor: FnInfo | null;
  copyAssign: FnInfo | null;
  /** No user code runs when it is copied: a plain field-by-field copy will do. */
  simpleCopy: boolean;
  /** Initialises an existing, freshly created object as a copy of another. */
  copyConstruct: ((o: any, src: any) => void) | null;
  /** Does destroying an object of this class run any user code? (cached) */
  destroys: boolean | undefined;
  bases: ClassInfo[];
  /** Static data members, by name. */
  statics: Map<string, VarInfo>;
  /** Shapes a new object: fields set to their defaults. */
  create: (() => any) | null;
  /** For template instances: how it was written. */
  targs: Ty[];
  ty: Ty;
  /** Copy of one object into another (for `a = b`). */
  copyInto: ((dst: any, src: any) => void) | null;
  clone: ((src: any) => any) | null;
  hasVirtual: boolean;
}

export interface VarInfo {
  name: string;
  ty: Ty;
  slot: number;
  global: boolean;
  /** The slot holds a Place (a reference to a number). */
  placeRef: boolean;
  isConst: boolean;
  /** Reads must check the value was set (declared without an initialiser). */
  check: boolean;
  line: number;
  /** Enumerators and constexpr values known at compile time. */
  cst?: number | boolean | bigint;
}

/** A compiled expression. */
export interface CE {
  ty: Ty;
  ev: (fr: Frame) => any;
  /** For lvalues: where the value lives. */
  lv?: (fr: Frame) => Place;
  /** For lvalues: store directly (the fast path for assignment). */
  set?: (fr: Frame, v: any) => void;
  /** A string literal, for functions that take the text itself. */
  lit?: string;
  /** Known at compile time. */
  cst?: number | boolean | bigint;
  /** The name of a function (to call it, or take its address). */
  fn?: FnInfo[];
  /** `std::tie(a, b)`: assigning a tuple or pair to it unpacks into the variables. */
  tied?: boolean;
  /** An rvalue (a temporary, or the result of std::move) even if it still names storage. */
  rv?: boolean;
  /** The value is storage somebody else holds (a variable, an element) that a conversion kept: copy it before keeping it. */
  alias?: boolean;
  /** Overloaded builtin names that are not values (`endl`, `cout`…) carry their identity here. */
  name?: string;
  /** `this`-less member functions found by name (for `obj.method(...)`). */
  line: number;
}

export const isLvalue = (c: CE): boolean => c.lv !== undefined;
