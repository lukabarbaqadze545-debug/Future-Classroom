/** Basic descriptive statistics for student datasets. */

export function toNumbers(values: string[]): number[] {
  return values
    .map((v) => v.trim().replace(",", "."))
    .filter((v) => v !== "" && /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(v))
    .map(Number);
}

export function describe(values: number[]) {
  const n = values.length;
  if (!n) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  return { n, mean, median, min: sorted[0], max: sorted[n - 1], sd: Math.sqrt(variance), range: sorted[n - 1] - sorted[0] };
}

export function countValues(values: string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Pearson correlation for paired numeric values (rows where both are numbers). */
export function correlation(pairs: { x: number; y: number }[]): number | null {
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
  const my = pairs.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pairs) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** Mean of a numeric column for each group of a text column. */
export function groupMeans(groups: string[], values: string[]): { group: string; mean: number; n: number }[] {
  const acc = new Map<string, number[]>();
  groups.forEach((g, i) => {
    const key = g.trim();
    const [v] = toNumbers([values[i] ?? ""]);
    if (!key || v === undefined) return;
    acc.set(key, [...(acc.get(key) ?? []), v]);
  });
  return [...acc.entries()].map(([group, list]) => ({ group, mean: list.reduce((s, v) => s + v, 0) / list.length, n: list.length }));
}

export function correlationStrength(r: number): "strong" | "moderate" | "weak" | "none" {
  const a = Math.abs(r);
  return a >= 0.7 ? "strong" : a >= 0.4 ? "moderate" : a >= 0.2 ? "weak" : "none";
}
