import { runtimeError } from "./errors";
import type { ClassInfo, FnInfo } from "./core";
import { strip, type Ty } from "./types";
import { CStr, Deq, Func, HMap, HSet, OMap, OSet, PQ, Pair, Tup, Vec, type Rt } from "./values";

/**
 * When objects die. A class "destroys" if running its destructor does anything:
 * it has a destructor written by the user, or a base class or a member does.
 * Everything else is simply forgotten, so ordinary programs pay nothing.
 */

export function classDestroys(info: ClassInfo): boolean {
  if (info.destroys !== undefined) return info.destroys;
  info.destroys = false;
  info.destroys = hasBody(info.dtor) || info.bases.some(classDestroys) || info.ownFields.some((f) => !f.isStatic && needsDestroy(f.ty));
  return info.destroys;
}

function hasBody(fn: FnInfo | null): boolean {
  return !!fn && !!fn.decl && fn.decl.body !== null;
}

export function needsDestroy(ty: Ty): boolean {
  const t = strip(ty);
  switch (t.k) {
    case "cls":
      return classDestroys(t.cls.info as ClassInfo);
    case "arr":
      return needsDestroy(t.of);
    case "std":
      return (t.name === "vector" || t.name === "deque" || t.name === "array" || t.name === "pair" || t.name === "tuple") && t.args.some(needsDestroy);
  }
  return false;
}

/** `delete p` on a base pointer runs the derived destructor only when the base destructor is virtual. */
export function hasVirtualDtor(info: ClassInfo): boolean {
  return !!(info.dtor && info.dtor.isVirtual) || info.bases.some(hasVirtualDtor);
}

/** The destructor body, then the members (last first), then the base classes (last first). */
export function destroyChain(rt: Rt, info: ClassInfo, obj: any): void {
  if (info.dtor && hasBody(info.dtor)) rt.invoke(new Func(info.dtor, null), [obj]);
  for (let i = info.ownFields.length - 1; i >= 0; i--) {
    const f = info.ownFields[i];
    if (f.isStatic) continue;
    const d = destroyerOf(rt, f.ty);
    if (d) {
      const v = obj[f.name];
      if (v !== undefined) d(v);
    }
  }
  for (let i = info.bases.length - 1; i >= 0; i--) destroyChain(rt, info.bases[i], obj);
}

/** The function that destroys a value of this type, or null when nothing needs to happen. */
export function destroyerOf(rt: Rt, ty: Ty): ((v: any) => void) | null {
  const t = strip(ty);
  if (!needsDestroy(t)) return null;
  switch (t.k) {
    case "cls": {
      const info = t.cls.info as ClassInfo;
      const dynamic = hasVirtualDtor(info);
      return (o) => {
        if (o === null || o === undefined) return;
        destroyChain(rt, dynamic && o.__c ? (o.__c as ClassInfo) : info, o);
        o.__dead = true;
      };
    }
    case "arr": {
      const inner = destroyerOf(rt, t.of)!;
      return (a: any[]) => {
        for (let i = a.length - 1; i >= 0; i--) if (a[i] !== undefined) inner(a[i]);
      };
    }
    case "std": {
      if (t.name === "pair") {
        const a = destroyerOf(rt, t.args[0]);
        const b = destroyerOf(rt, t.args[1]);
        return (p: Pair) => {
          if (b) b(p.second);
          if (a) a(p.first);
        };
      }
      if (t.name === "tuple") {
        const ds = t.args.map((x) => destroyerOf(rt, x));
        return (p: Tup) => {
          for (let i = ds.length - 1; i >= 0; i--) ds[i]?.(p.e[i]);
        };
      }
      const inner = destroyerOf(rt, t.args[0])!;
      if (t.name === "array") {
        return (v: Vec) => {
          for (let i = v.a.length - 1; i >= 0; i--) inner(v.a[i]);
        };
      }
      return (v: Vec) => {
        for (let i = 0; i < v.a.length; i++) inner(v.a[i]);
      };
    }
  }
  return null;
}

/** `delete p`: destroys a heap object once. */
export function deleteObject(rt: Rt, info: ClassInfo, o: any, line: number): void {
  if (o === null || o === undefined) return;
  if (o.__dead) throw runtimeError("double-delete", "this object was already deleted", line);
  destroyChain(rt, hasVirtualDtor(info) && o.__c ? (o.__c as ClassInfo) : info, o);
  o.__dead = true;
}

/** Pure virtual functions that no class in the chain has supplied a body for. */
export function abstractMethods(info: ClassInfo): FnInfo[] {
  const table = vtable(info);
  return [...table.values()].filter((m) => m.isPure);
}

const vcache = new WeakMap<ClassInfo, Map<string, FnInfo>>();

/** Final overriders of the virtual functions of a class, keyed by name and parameter count. */
export function vtable(info: ClassInfo): Map<string, FnInfo> {
  const hit = vcache.get(info);
  if (hit) return hit;
  const table = new Map<string, FnInfo>();
  for (const b of info.bases) for (const [k, m] of vtable(b)) table.set(k, m);
  for (const [name, list] of info.methods) {
    for (const m of list) {
      if (m.cls !== info || m.isStatic || m.isCtor || m.isDtor) continue;
      const key = `${name}/${m.params.length}`;
      if (m.isVirtual || table.has(key)) {
        m.isVirtual = true;
        table.set(key, m);
      }
    }
  }
  vcache.set(info, table);
  return table;
}

/** What a move leaves behind in the source: strings and containers are emptied, members likewise. */
export function moveOut(v: any, ty: Ty): void {
  const t = strip(ty);
  if (v === null || v === undefined) return;
  if (v instanceof CStr) v.s = "";
  else if (v instanceof Vec || v instanceof OSet || v instanceof OMap || v instanceof PQ) v.a = [];
  else if (v instanceof Deq) {
    v.a = [];
    v.head = 0;
  } else if (v instanceof HMap || v instanceof HSet) v.m.clear();
  else if (t.k === "cls") {
    const info = t.cls.info as ClassInfo;
    for (const f of info.fields) if (!f.isStatic && (strip(f.ty).k === "str" || strip(f.ty).k === "std" || strip(f.ty).k === "cls")) moveOut(v[f.name], f.ty);
  }
}
