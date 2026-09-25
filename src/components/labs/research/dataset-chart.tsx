"use client";

import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { DatasetInput } from "@/lib/labs/research/model";
import { correlation, correlationStrength, countValues, groupMeans, toNumbers } from "@/lib/labs/research/stats";
import { BarChart, LineChart } from "../charts";

export type ChartSpec = { type: "counts"; column: number } | { type: "means"; group: number; value: number } | { type: "scatter"; x: number; y: number };

/** Picks a sensible first chart for a dataset (used by the presentation). */
export function defaultChart(dataset: DatasetInput): ChartSpec | null {
  const text = dataset.columns.findIndex((c) => c.type === "text");
  const numbers = dataset.columns.map((c, i) => (c.type === "number" ? i : -1)).filter((i) => i >= 0);
  if (text >= 0 && numbers.length) return { type: "means", group: text, value: numbers[0] };
  if (numbers.length >= 2) return { type: "scatter", x: numbers[0], y: numbers[1] };
  if (text >= 0) return { type: "counts", column: text };
  return null;
}

export function DatasetChart({ dataset, spec, large }: { dataset: DatasetInput; spec: ChartSpec; large?: boolean }) {
  const { dict } = useI18n();
  const d = dict.labs.research.data;
  const col = (i: number) => dataset.rows.map((r) => r[i] ?? "");
  const size = large ? { width: 900, height: 420 } : { width: 640, height: 300 };
  if (spec.type === "counts") {
    const counts = countValues(col(spec.column)).slice(0, 20);
    return <BarChart title={`${d.counts}: ${dataset.columns[spec.column]?.name ?? ""}`} bars={counts.map((c) => ({ label: c.value, value: c.count }))} xLabel={dataset.columns[spec.column]?.name ?? ""} yLabel={d.counts} {...size} />;
  }
  if (spec.type === "means") {
    const means = groupMeans(col(spec.group), col(spec.value)).slice(0, 20);
    return (
      <BarChart
        title={`${d.mean}: ${dataset.columns[spec.value]?.name ?? ""}`}
        bars={means.map((m) => ({ label: `${m.group} (${m.n})`, value: Math.round(m.mean * 100) / 100 }))}
        xLabel={dataset.columns[spec.group]?.name ?? ""}
        yLabel={`${d.mean} ${dataset.columns[spec.value]?.name ?? ""}`}
        {...size}
      />
    );
  }
  const pairs = dataset.rows
    .map((r) => {
      const [x] = toNumbers([r[spec.x] ?? ""]);
      const [y] = toNumbers([r[spec.y] ?? ""]);
      return x === undefined || y === undefined ? null : { x, y };
    })
    .filter((p): p is { x: number; y: number } => p !== null);
  if (pairs.length < 3) return <p className="text-sm text-ink-muted">{d.needNumbers}</p>;
  const r = correlation(pairs);
  return (
    <div>
      <LineChart title={`${dataset.columns[spec.y]?.name} / ${dataset.columns[spec.x]?.name}`} series={[{ label: "data", points: pairs, dots: true }]} xLabel={dataset.columns[spec.x]?.name ?? ""} yLabel={dataset.columns[spec.y]?.name ?? ""} {...size} />
      {r !== null ? (
        <p className="mt-2 text-sm">
          {fmt(d.correlation, { r: r.toFixed(2), strength: d.strength[correlationStrength(r)] })} <span className="text-ink-muted">— {d.correlationNote}</span>
        </p>
      ) : null}
    </div>
  );
}
