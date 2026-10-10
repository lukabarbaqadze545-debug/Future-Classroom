/**
 * Printing numbers the way C and C++ do.
 *
 * `printf("%.2f")` and `cout << setprecision(2) << fixed` round the *exact*
 * binary value of the double, and a value exactly halfway rounds to even
 * (0.125 → "0.12", 2.5 → "2"). JavaScript's toFixed rounds halves up, so
 * these functions work with the exact value instead, using BigInt.
 */

const dv = new DataView(new ArrayBuffer(8));

/** |x| = mant × 2^exp exactly, for finite non-zero x. */
function decompose(x: number): { mant: bigint; exp: number } {
  dv.setFloat64(0, Math.abs(x));
  const hi = dv.getUint32(0);
  const lo = dv.getUint32(4);
  const e = (hi >>> 20) & 0x7ff;
  const frac = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  if (e === 0) return { mant: frac, exp: -1074 };
  return { mant: frac | (1n << 52n), exp: e - 1075 };
}

/** round(num / den) to nearest, ties to even. */
function divRound(num: bigint, den: bigint): bigint {
  const q = num / den;
  const r = num % den;
  const twice = r * 2n;
  if (twice > den || (twice === den && (q & 1n) === 1n)) return q + 1n;
  return q;
}

const pow10 = (n: number): bigint => 10n ** BigInt(n);

/** Digits of round(|x| × 10^scale) as a BigInt (scale may be negative). */
function scaled(x: number, scale: number): bigint {
  const { mant, exp } = decompose(x);
  let num = mant;
  let den = 1n;
  if (exp >= 0) num <<= BigInt(exp);
  else den <<= BigInt(-exp);
  if (scale >= 0) num *= pow10(scale);
  else den *= pow10(-scale);
  return divRound(num, den);
}

const nonFinite = (x: number, upper = false): string | null => {
  // On x86 the NaN made by 0.0/0.0, sqrt(-1) and the like has its sign bit set, and glibc prints it as -nan.
  if (Number.isNaN(x)) return upper ? "-NAN" : "-nan";
  if (!Number.isFinite(x)) return (x < 0 ? "-" : "") + (upper ? "INF" : "inf");
  return null;
};

const negative = (x: number) => x < 0 || Object.is(x, -0);

/** `%.{prec}f` */
export function formatFixed(x: number, prec: number, alwaysPoint = false): string {
  const nf = nonFinite(x);
  if (nf) return nf;
  const sign = negative(x) ? "-" : "";
  let digits = x === 0 ? "0".repeat(prec + 1) : scaled(x, prec).toString().padStart(prec + 1, "0");
  if (digits.length < prec + 1) digits = digits.padStart(prec + 1, "0");
  const int = digits.slice(0, digits.length - prec);
  const frac = digits.slice(digits.length - prec);
  return `${sign}${int}${prec > 0 ? `.${frac}` : alwaysPoint ? "." : ""}`;
}

/** Decimal exponent X with 10^X <= |x| < 10^(X+1), and the digits after rounding to `p` places after the first digit. */
function expDigits(x: number, p: number): { digits: string; exp: number } {
  let exp = Math.floor(Math.log10(Math.abs(x)));
  for (let attempt = 0; attempt < 4; attempt++) {
    const d = scaled(x, p - exp);
    const text = d.toString();
    if (text.length === p + 1) return { digits: text, exp };
    // log10 was off by one, or rounding carried into a new digit (9.99 → 10.0).
    exp += text.length > p + 1 ? 1 : -1;
  }
  return { digits: scaled(x, p - exp).toString().slice(0, p + 1), exp };
}

const expText = (exp: number, upper: boolean) => `${upper ? "E" : "e"}${exp < 0 ? "-" : "+"}${String(Math.abs(exp)).padStart(2, "0")}`;

/** `%.{prec}e` */
export function formatExp(x: number, prec: number, upper = false, alwaysPoint = false): string {
  const nf = nonFinite(x, upper);
  if (nf) return nf;
  const sign = negative(x) ? "-" : "";
  if (x === 0) return `${sign}0${prec > 0 ? `.${"0".repeat(prec)}` : alwaysPoint ? "." : ""}${expText(0, upper)}`;
  const { digits, exp } = expDigits(x, prec);
  return `${sign}${digits[0]}${prec > 0 ? `.${digits.slice(1)}` : alwaysPoint ? "." : ""}${expText(exp, upper)}`;
}

/** `%.{prec}g` (and what `cout << x` does by default, with prec 6). */
export function formatGeneral(x: number, prec: number, upper = false, alt = false): string {
  const nf = nonFinite(x, upper);
  if (nf) return nf;
  const p = prec === 0 ? 1 : prec;
  const sign = negative(x) ? "-" : "";
  if (x === 0) return `${sign}0${alt && p > 1 ? `.${"0".repeat(p - 1)}` : ""}`;
  const { exp } = expDigits(x, p - 1);
  const strip = (s: string) => (alt || !s.includes(".") ? s : s.replace(/0+$/, "").replace(/\.$/, ""));
  if (exp < -4 || exp >= p) {
    const { digits } = expDigits(x, p - 1);
    const mant = p > 1 ? `${digits[0]}.${digits.slice(1)}` : digits[0];
    return `${sign}${strip(mant)}${expText(exp, upper)}`;
  }
  return `${sign}${strip(formatFixed(Math.abs(x), p - 1 - exp))}`;
}

/** Pads `text` to `width` the way printf and setw do. */
export function pad(text: string, width: number, left: boolean, fill = " "): string {
  if (text.length >= width) return text;
  return left ? text + fill.repeat(width - text.length) : fill.repeat(width - text.length) + text;
}
