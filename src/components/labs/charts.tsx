import type { ReactNode } from "react";

/*
 * Dependency-free SVG charts for simulations and research datasets.
 * Every chart has an accessible name; numbers use tabular figures.
 */

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.5 : 1;
    min -= pad;
    max += pad;
  }
  const span = max - min;
  const rough = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Math.round(v / step) * step);
  return ticks;
}

export function formatTick(v: number): string {
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 100000 || abs < 0.001)) return v.toExponential(1);
  return String(Math.round(v * 1000) / 1000);
}

export const CHART_COLORS = ["var(--color-lab-stem)", "var(--color-warn)", "var(--color-lab-programming)", "var(--color-success)", "var(--color-danger)", "var(--color-lab-research)"];

interface Frame {
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const PAD = { left: 52, right: 16, top: 14, bottom: 40 };

function scales(f: Frame) {
  const w = f.width - PAD.left - PAD.right;
  const h = f.height - PAD.top - PAD.bottom;
  return {
    x: (v: number) => PAD.left + ((v - f.xMin) / (f.xMax - f.xMin || 1)) * w,
    y: (v: number) => PAD.top + h - ((v - f.yMin) / (f.yMax - f.yMin || 1)) * h,
    w,
    h,
  };
}

function Axes({ frame, xLabel, yLabel, xTicks, yTicks, children }: { frame: Frame; xLabel: string; yLabel: string; xTicks: number[]; yTicks: number[]; children?: ReactNode }) {
  const s = scales(frame);
  return (
    <>
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={PAD.left} x2={frame.width - PAD.right} y1={s.y(t)} y2={s.y(t)} stroke="var(--color-line)" strokeWidth={1} />
          <text x={PAD.left - 6} y={s.y(t)} textAnchor="end" dominantBaseline="middle" className="fill-ink-subtle text-[11px] tabular-nums">
            {formatTick(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={s.x(t)} y={frame.height - PAD.bottom + 16} textAnchor="middle" className="fill-ink-subtle text-[11px] tabular-nums">
          {formatTick(t)}
        </text>
      ))}
      <line x1={PAD.left} x2={frame.width - PAD.right} y1={s.y(Math.max(frame.yMin, Math.min(0, frame.yMax)))} y2={s.y(Math.max(frame.yMin, Math.min(0, frame.yMax)))} stroke="var(--color-line-strong)" />
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={frame.height - PAD.bottom} stroke="var(--color-line-strong)" />
      <text x={PAD.left + s.w / 2} y={frame.height - 6} textAnchor="middle" className="fill-ink-muted text-[12px]">
        {xLabel}
      </text>
      <text transform={`translate(13 ${PAD.top + s.h / 2}) rotate(-90)`} textAnchor="middle" className="fill-ink-muted text-[12px]">
        {yLabel}
      </text>
      {children}
    </>
  );
}

export interface Series {
  label: string;
  points: { x: number; y: number }[];
  color?: string;
  dashed?: boolean;
  /** Draw dots instead of a line. */
  dots?: boolean;
}

export function LineChart({
  series,
  xLabel,
  yLabel,
  title,
  width = 560,
  height = 280,
  xDomain,
  yDomain,
  extra,
}: {
  series: Series[];
  xLabel: string;
  yLabel: string;
  title: string;
  width?: number;
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  extra?: (s: { x: (v: number) => number; y: (v: number) => number }) => ReactNode;
}) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xTicks = niceTicks(xDomain?.[0] ?? Math.min(0, ...xs), xDomain?.[1] ?? Math.max(1, ...xs));
  const yTicks = niceTicks(yDomain?.[0] ?? Math.min(0, ...ys), yDomain?.[1] ?? Math.max(1, ...ys));
  const frame: Frame = { width, height, xMin: xTicks[0], xMax: xTicks[xTicks.length - 1], yMin: yTicks[0], yMax: yTicks[yTicks.length - 1] };
  const s = scales(frame);
  return (
    <figure className="min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        <Axes frame={frame} xLabel={xLabel} yLabel={yLabel} xTicks={xTicks} yTicks={yTicks}>
          {series.map((line, i) => {
            const color = line.color ?? CHART_COLORS[i % CHART_COLORS.length];
            if (line.dots) {
              return (
                <g key={line.label}>
                  {line.points.map((p, j) => (
                    <circle key={j} cx={s.x(p.x)} cy={s.y(p.y)} r={4.5} fill={color} stroke="var(--color-surface)" strokeWidth={1.5} />
                  ))}
                </g>
              );
            }
            const d = line.points.map((p, j) => `${j ? "L" : "M"}${s.x(p.x).toFixed(1)},${s.y(p.y).toFixed(1)}`).join(" ");
            return <path key={line.label} d={d} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={line.dashed ? "6 5" : undefined} strokeLinejoin="round" />;
          })}
          {extra?.(s)}
        </Axes>
      </svg>
      {series.length > 1 ? <Legend items={series.map((l, i) => ({ label: l.label, color: l.color ?? CHART_COLORS[i % CHART_COLORS.length], dashed: l.dashed }))} /> : null}
    </figure>
  );
}

export function BarChart({
  bars,
  xLabel,
  yLabel,
  title,
  width = 560,
  height = 280,
  overlay,
  yMax,
}: {
  bars: { label: string; value: number }[];
  xLabel: string;
  yLabel: string;
  title: string;
  width?: number;
  height?: number;
  /** A second series drawn as markers on each bar (e.g. theoretical values). */
  overlay?: { label: string; values: number[] };
  yMax?: number;
}) {
  const maxValue = Math.max(yMax ?? 0, ...bars.map((b) => b.value), ...(overlay?.values ?? [0]));
  const yTicks = niceTicks(0, maxValue || 1);
  const frame: Frame = { width, height, xMin: 0, xMax: bars.length, yMin: 0, yMax: yTicks[yTicks.length - 1] };
  const s = scales(frame);
  const bw = (s.w / Math.max(1, bars.length)) * 0.7;
  return (
    <figure className="min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        <Axes frame={frame} xLabel={xLabel} yLabel={yLabel} xTicks={[]} yTicks={yTicks}>
          {bars.map((b, i) => {
            const cx = s.x(i + 0.5);
            return (
              <g key={b.label}>
                <rect x={cx - bw / 2} y={s.y(b.value)} width={bw} height={Math.max(0, s.y(0) - s.y(b.value))} rx={3} fill="var(--color-lab-stem)" opacity={0.85}>
                  <title>{`${b.label}: ${formatTick(b.value)}`}</title>
                </rect>
                {overlay ? <line x1={cx - bw / 2 - 3} x2={cx + bw / 2 + 3} y1={s.y(overlay.values[i] ?? 0)} y2={s.y(overlay.values[i] ?? 0)} stroke="var(--color-warn)" strokeWidth={3} /> : null}
                {bars.length <= 24 ? (
                  <text x={cx} y={height - PAD.bottom + 16} textAnchor="middle" className="fill-ink-subtle text-[11px]">
                    {b.label.length > 10 ? `${b.label.slice(0, 9)}…` : b.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </Axes>
      </svg>
      {overlay ? (
        <Legend
          items={[
            { label: yLabel, color: "var(--color-lab-stem)" },
            { label: overlay.label, color: "var(--color-warn)" },
          ]}
        />
      ) : null}
    </figure>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="0" x2="18" y1="4" y2="4" stroke={item.color} strokeWidth="3" strokeDasharray={item.dashed ? "4 3" : undefined} />
          </svg>
          {item.label}
        </span>
      ))}
    </figcaption>
  );
}
