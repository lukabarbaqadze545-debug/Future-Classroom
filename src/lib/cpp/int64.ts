/**
 * 64-bit integers that are fast when they are small and exact when they are not.
 *
 * A `long long` is a JS number while it fits in 53 bits and a BigInt beyond
 * that; the representation is canonical (a BigInt is never used for a value
 * that would fit a number), so `===` still compares them. Every operation
 * wraps around at 64 bits like the real thing, so overflow behaves as in C++
 * on a normal machine.
 */

export type I64 = number | bigint;

const MS = Number.MAX_SAFE_INTEGER;
const MSB = BigInt(MS);

export const big = (v: I64): bigint => (typeof v === "bigint" ? v : BigInt(v));
const norm = (b: bigint): I64 => (b >= -MSB && b <= MSB ? Number(b) : b);

export const wrapS64 = (b: bigint): I64 => norm(BigInt.asIntN(64, b));
export const wrapU64 = (b: bigint): I64 => norm(BigInt.asUintN(64, b));

export const INT64_MIN = -(2n ** 63n);
export const INT64_MAX = 2n ** 63n - 1n;
export const UINT64_MAX = 2n ** 64n - 1n;

/* ----------------------------- signed 64-bit ----------------------------- */

export function addS(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a + b;
    if (r <= MS && r >= -MS) return r;
  }
  return wrapS64(big(a) + big(b));
}
export function subS(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a - b;
    if (r <= MS && r >= -MS) return r;
  }
  return wrapS64(big(a) - big(b));
}
export function mulS(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a * b;
    if (r <= MS && r >= -MS) return r + 0;
  }
  return wrapS64(big(a) * big(b));
}
/** Truncating division; the caller has checked for a zero divisor. */
export function divS(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") return (a - (a % b)) / b + 0;
  return wrapS64(big(a) / big(b));
}
export function modS(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") return (a % b) + 0;
  return norm(big(a) % big(b));
}
export const negS = (a: I64): I64 => (typeof a === "number" ? 0 - a : wrapS64(-a));

/* ---------------------------- unsigned 64-bit ---------------------------- */

export function addU(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a + b;
    if (r <= MS) return r;
  }
  return wrapU64(big(a) + big(b));
}
export function subU(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a - b;
    if (r >= 0) return r;
  }
  return wrapU64(big(a) - big(b));
}
export function mulU(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") {
    const r = a * b;
    if (r <= MS) return r;
  }
  return wrapU64(big(a) * big(b));
}
export function divU(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") return (a - (a % b)) / b;
  return norm(big(a) / big(b));
}
export function modU(a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number") return a % b;
  return norm(big(a) % big(b));
}

/* ------------------------------- bit operations ----------------------------- */

export type BitOp = "&" | "|" | "^" | "<<" | ">>";

export function bitS(op: BitOp, a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number" && b >= 0 && b <= 52) {
    if (op === ">>") return Math.floor(a / 2 ** b);
    if (op === "<<") {
      const r = a * 2 ** b;
      if (r <= MS && r >= -MS) return r;
    }
  }
  if (op !== "<<" && op !== ">>" && typeof a === "number" && typeof b === "number" && a >= 0 && b >= 0 && a <= 0x7fffffff && b <= 0x7fffffff) {
    return op === "&" ? a & b : op === "|" ? a | b : a ^ b;
  }
  const x = big(a);
  const y = big(b);
  switch (op) {
    case "&":
      return wrapS64(x & y);
    case "|":
      return wrapS64(x | y);
    case "^":
      return wrapS64(x ^ y);
    case "<<":
      return wrapS64(y >= 64n || y < 0n ? 0n : x << y);
    case ">>":
      return wrapS64(y >= 64n || y < 0n ? (x < 0n ? -1n : 0n) : x >> y);
  }
}

export function bitU(op: BitOp, a: I64, b: I64): I64 {
  if (typeof a === "number" && typeof b === "number" && b >= 0 && b <= 52) {
    if (op === ">>") return Math.floor(a / 2 ** b);
    if (op === "<<") {
      const r = a * 2 ** b;
      if (r <= MS) return r;
    }
  }
  if (op !== "<<" && typeof a === "number" && typeof b === "number" && a <= 0x7fffffff && b <= 0x7fffffff && op !== ">>") {
    return op === "&" ? a & b : op === "|" ? a | b : a ^ b;
  }
  const x = big(a);
  const y = big(b);
  switch (op) {
    case "&":
      return wrapU64(x & y);
    case "|":
      return wrapU64(x | y);
    case "^":
      return wrapU64(x ^ y);
    case "<<":
      return wrapU64(y >= 64n || y < 0n ? 0n : x << y);
    case ">>":
      return wrapU64(y >= 64n || y < 0n ? 0n : x >> y);
  }
}

export const notS = (a: I64): I64 => wrapS64(~big(a));
export const notU = (a: I64): I64 => wrapU64(~big(a));

/* -------------------------------- conversions ------------------------------- */

/** Any integer (as a number or BigInt, already an integer) to the given width. */
export function toInt(v: I64, bits: 8 | 16 | 32 | 64, signed: boolean): I64 {
  if (bits === 64) {
    if (typeof v === "number") {
      if (signed || v >= 0) return v;
      return wrapU64(BigInt(v));
    }
    return signed ? wrapS64(v) : wrapU64(v);
  }
  const n = typeof v === "number" ? v : Number(BigInt.asIntN(32, v));
  if (bits === 32) return signed ? n | 0 : n >>> 0;
  if (bits === 16) return signed ? (n << 16) >> 16 : n & 0xffff;
  return signed ? (n << 24) >> 24 : n & 0xff;
}

/** A double to an integer type: truncation, then wrap-around (what a normal machine does, where C++ says "undefined"). */
export function fromDouble(x: number, bits: 8 | 16 | 32 | 64, signed: boolean): I64 {
  if (!Number.isFinite(x)) return bits === 64 ? (signed ? INT64_MIN : 0) : bits === 32 ? (signed ? -2147483648 : 0) : 0;
  const t = Math.trunc(x);
  if (Math.abs(t) <= MS) return toInt(t + 0, bits, signed);
  return toInt(norm(BigInt(t)), bits, signed);
}

export const toDouble = (v: I64): number => (typeof v === "number" ? v : Number(v));

export function compareI64(a: I64, b: I64): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
