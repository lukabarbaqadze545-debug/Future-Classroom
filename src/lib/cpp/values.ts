import { limitError, runtimeError } from "./errors";
import { fromUtf8Bytes } from "./lexer";

/**
 * What C++ values are at run time.
 *
 * Numbers, characters and booleans are plain JS values (64-bit integers see
 * `int64.ts`). Everything with identity or parts — strings, vectors, maps,
 * structs, arrays — is a heap object, so a C++ reference to one is just the
 * object, and copying (`b = a`) clones it. A reference to a *number* needs a
 * `Place`, which knows where the number lives.
 */

export interface Place {
  get(): any;
  set(v: any): void;
}

/** A local or global variable: slot `i` of a frame. */
export class SlotPlace implements Place {
  constructor(
    public fr: any[],
    public i: number,
  ) {}
  get() {
    return this.fr[this.i];
  }
  set(v: any) {
    this.fr[this.i] = v;
  }
}

/** An element of an array or vector; also a pointer into one (pointer arithmetic moves `i`). */
export class ElemPlace implements Place {
  constructor(
    public arr: any[],
    public i: number,
  ) {}
  private check(): void {
    if (this.i < 0 || this.i >= this.arr.length) throw runtimeError("pointer-range", `pointer is outside the array (index ${this.i}, size ${this.arr.length})`, 0, { index: this.i, size: this.arr.length });
  }
  get() {
    this.check();
    const v = this.arr[this.i];
    if (v === undefined) throw runtimeError("uninitialized", "reading a value that was never set", 0);
    return v;
  }
  set(v: any) {
    this.check();
    this.arr[this.i] = v;
  }
}

export class FieldPlace implements Place {
  constructor(
    public o: any,
    public name: string,
  ) {}
  get() {
    return this.o[this.name];
  }
  set(v: any) {
    this.o[this.name] = v;
  }
}

/** A value of its own: a temporary bound to a reference, or `new int`. */
export class BoxPlace implements Place {
  constructor(public v: any) {}
  get() {
    return this.v;
  }
  set(v: any) {
    this.v = v;
  }
}

/** A pointer to a class-like object (the object is the storage). */
export class ObjPlace implements Place {
  constructor(
    public o: any,
    public assign: (dst: any, src: any) => void,
  ) {}
  get() {
    return this.o;
  }
  set(v: any) {
    this.assign(this.o, v);
  }
}

/** Do two pointers point at the same thing? */
export function samePlace(a: Place | null, b: Place | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a instanceof ElemPlace && b instanceof ElemPlace) return a.arr === b.arr && a.i === b.i;
  if (a instanceof SlotPlace && b instanceof SlotPlace) return a.fr === b.fr && a.i === b.i;
  if (a instanceof FieldPlace && b instanceof FieldPlace) return a.o === b.o && a.name === b.name;
  if (a instanceof ObjPlace && b instanceof ObjPlace) return a.o === b.o;
  if (a instanceof ObjPlace && b instanceof ElemPlace) return a.o === b.arr[b.i];
  if (a instanceof ElemPlace && b instanceof ObjPlace) return b.o === a.arr[a.i];
  return false;
}

/* ------------------------------- containers ------------------------------- */

export class CStr {
  constructor(public s: string) {}
}

export class Vec {
  constructor(public a: any[]) {}
}

export class Pair {
  constructor(
    public first: any,
    public second: any,
  ) {}
}

export class Tup {
  constructor(public e: any[]) {}
}

/** std::set / std::multiset: sorted values. */
export class OSet {
  constructor(
    public a: any[],
    public cmp: (x: any, y: any) => number,
    public multi: boolean,
  ) {}
}

/** std::map / std::multimap: pairs sorted by key. */
export class OMap {
  constructor(
    public a: Pair[],
    public cmp: (x: any, y: any) => number,
    public multi: boolean,
  ) {}
}

/** std::unordered_map / unordered_set: insertion order (the real order is unspecified). */
export class HMap {
  constructor(
    public m: Map<any, Pair>,
    public key: (k: any) => any,
    public multi = false,
  ) {}
}

export class HSet {
  constructor(
    public m: Map<any, any>,
    public key: (k: any) => any,
  ) {}
}

/** std::deque, std::queue and std::stack. `head` lets pop_front be cheap. */
export class Deq {
  constructor(
    public a: any[],
    public head = 0,
  ) {}
  get length(): number {
    return this.a.length - this.head;
  }
  compact(): void {
    if (this.head > 1024 && this.head * 2 > this.a.length) {
      this.a = this.a.slice(this.head);
      this.head = 0;
    }
  }
}

/** std::priority_queue: a binary heap where `cmp(a, b) < 0` means a is "less" (the top is the greatest). */
export class PQ {
  constructor(
    public a: any[],
    public cmp: (x: any, y: any) => number,
  ) {}
}

export class Bits {
  constructor(
    public n: number,
    public b: boolean[],
  ) {}
}

/** An instance of a user struct or class. Fields are properties; `__c` is its class (for virtual calls). */
export type Obj = { __c: unknown; [field: string]: any };

/** A callable: a function, a lambda with what it captured, or a bound method. */
export class Func {
  constructor(
    public info: any,
    public env: any,
  ) {}
}

/* -------------------------------- streams --------------------------------- */

export interface Fmt {
  precision: number;
  fixed: boolean;
  scientific: boolean;
  width: number;
  fill: string;
  left: boolean;
  boolalpha: boolean;
  base: 8 | 10 | 16;
  showpos: boolean;
  showpoint: boolean;
  showbase: boolean;
  uppercase: boolean;
}

export const defaultFmt = (): Fmt => ({ precision: 6, fixed: false, scientific: false, width: 0, fill: " ", left: false, boolalpha: false, base: 10, showpos: false, showpoint: false, showbase: false, uppercase: false });

export class OStream {
  chunks: string[] = [];
  size = 0;
  fmt = defaultFmt();
  constructor(
    protected readonly cap: number,
    readonly name: "cout" | "cerr" | "sstream",
  ) {}
  /** How much may be written in all. */
  limit(): number {
    return this.cap;
  }
  write(s: string): void {
    if (s.length === 0) return;
    this.size += s.length;
    if (this.size > this.cap) throw limitError("output-limit", "the program printed too much");
    this.chunks.push(s);
  }
  /** The bytes written so far, as text. */
  text(): string {
    return fromUtf8Bytes(this.chunks.join(""));
  }
  bytes(): string {
    return this.chunks.join("");
  }
}

export class IStream {
  pos = 0;
  failed = false;
  constructor(public data: string) {}
  get eof(): boolean {
    return this.pos >= this.data.length;
  }
}

/** A std::stringstream: what is written to it can be read back (and `str()` is the whole text). */
export class SStream extends OStream {
  pos = 0;
  failed = false;
  data: string;
  constructor(cap: number, init = "") {
    super(cap, "sstream");
    this.data = init;
  }
  get eof(): boolean {
    return this.pos >= this.data.length;
  }
  write(s: string): void {
    if (s.length === 0) return;
    this.size += s.length;
    if (this.size > this.cap) throw limitError("output-limit", "the program built too much text");
    this.data += s;
  }
  text(): string {
    return fromUtf8Bytes(this.data);
  }
  bytes(): string {
    return this.data;
  }
}

/** The per-run state every closure shares. */
export interface Rt {
  /** Steps left before the program is stopped. */
  budget: number;
  /** Bytes allocated by the program (roughly), and the most it may use. */
  mem: number;
  memLimit: number;
  depth: number;
  maxDepth: number;
  cout: OStream;
  cerr: OStream;
  cin: IStream;
  /** Calls back into interpreted code from natives (sort comparators, lambdas passed to algorithms). */
  invoke: (f: Func, args: any[]) => any;
  /** Destructors of globals and static locals, run (last in, first out) when the program ends. */
  atExit: (() => void)[];
  line: number;
}

export function charge(rt: Rt, bytes: number): void {
  rt.mem += bytes;
  if (rt.mem > rt.memLimit) throw limitError("memory-limit", "the program used too much memory");
}

/** `exit(n)` unwinds the whole program. */
export class ExitSignal {
  constructor(public code: number) {}
}
