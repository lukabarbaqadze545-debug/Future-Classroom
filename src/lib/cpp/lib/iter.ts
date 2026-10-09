import { runtimeError } from "../errors";
import { CStr, Deq, ElemPlace, HMap, HSet, OMap, OSet, Vec, type Place } from "../values";
import { T_CHAR, pairOf, strip, withConst, type Ty } from "../types";

/** Iterators over the standard containers: a container and a position. */

export class It {
  constructor(
    public c: any,
    public i: number,
    /** A snapshot of the elements, for containers that have no array to point into (unordered ones). */
    public snap: any[] | null = null,
    /** A reverse iterator: position i counts from the end. */
    public rev = false,
  ) {}
}

/** The array the elements of a container live in. */
export function backingOf(of: Ty): ((c: any) => any[]) | null {
  const t = strip(of);
  if (t.k === "str") return null;
  if (t.k === "std") {
    switch (t.name) {
      case "vector":
      case "array":
      case "deque":
        return (c: Vec) => c.a;
      case "set":
      case "multiset":
        return (c: OSet) => c.a;
      case "map":
      case "multimap":
        return (c: OMap) => c.a;
    }
  }
  return null;
}

export function iterElemTy(of: Ty): Ty {
  const t = strip(of);
  if (t.k === "str") return T_CHAR;
  if (t.k === "arr") return t.of;
  if (t.k === "std") {
    switch (t.name) {
      case "vector":
      case "array":
      case "deque":
        return t.args[0];
      case "set":
      case "multiset":
      case "unordered_set":
      case "unordered_multiset":
        return withConst(t.args[0]);
      case "map":
      case "multimap":
      case "unordered_map":
      case "unordered_multimap":
        return pairOf(t.args[0], t.args[1]);
    }
  }
  return T_CHAR;
}

/** The number of elements in a container. */
export function lengthOf(of: Ty): (c: any) => number {
  const t = strip(of);
  if (t.k === "str") return (c: CStr) => c.s.length;
  if (t.k === "std") {
    switch (t.name) {
      case "vector":
      case "array":
      case "deque":
      case "set":
      case "multiset":
      case "map":
      case "multimap":
        return (c: any) => c.a.length;
      case "unordered_map":
      case "unordered_multimap":
      case "unordered_set":
      case "unordered_multiset":
        return (c: HMap | HSet) => c.m.size;
    }
  }
  return () => 0;
}

/** The elements of an unordered container, in iteration order (a snapshot). */
export function snapshotOf(c: HMap | HSet): any[] {
  return Array.from(c.m.values());
}

/** The signed byte at position i of a string. */
export const charAt = (s: string, i: number): number => (s.charCodeAt(i) << 24) >> 24;

/** A place for one character of a string (writing rebuilds the string). */
export class CharPlace implements Place {
  constructor(
    public s: CStr,
    public i: number,
  ) {}
  get() {
    if (this.i < 0 || this.i >= this.s.s.length) throw runtimeError("index-range", `index ${this.i} is outside the string (size ${this.s.s.length})`, 0, { index: this.i, size: this.s.s.length, kind: "string" });
    return charAt(this.s.s, this.i);
  }
  set(v: number) {
    const str = this.s;
    if (this.i < 0 || this.i >= str.s.length) throw runtimeError("index-range", `index ${this.i} is outside the string (size ${str.s.length})`, 0, { index: this.i, size: str.s.length, kind: "string" });
    str.s = str.s.slice(0, this.i) + String.fromCharCode(v & 255) + str.s.slice(this.i + 1);
  }
}

export { Deq, ElemPlace };
