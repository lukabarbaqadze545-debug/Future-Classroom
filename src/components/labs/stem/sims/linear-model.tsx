"use client";

import { useState } from "react";
import { fmt } from "@/lib/i18n/config";
import { leastSquares, SPRING_SAMPLE, sumSquaredErrors } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { LineChart } from "../../charts";
import { Readout, SimSlider, useSimFormat, type SimFormat } from "../sim-controls";
import type { TaskInputs, TaskReporter } from "./types";

export function LinearModelSim({ report }: { report: TaskReporter }) {
  const { s, num } = useSimFormat();
  const [slope, setSlope] = useState(0.03);
  const [intercept, setIntercept] = useState(1);
  const [showBest, setShowBest] = useState(false);
  const best = leastSquares(SPRING_SAMPLE);
  const sse = sumSquaredErrors(SPRING_SAMPLE, slope, intercept);
  const line = (m: number, b: number) => [0, 320].map((x) => ({ x, y: m * x + b }));

  const update = (m: number, b: number) => {
    setSlope(m);
    setIntercept(b);
    report("fit_line", { slope: m, intercept: b });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <LineChart
          title={`${s.error}: ${num(sse, 2)}`}
          series={[
            { label: s.stretch, points: SPRING_SAMPLE, dots: true, color: "var(--color-ink)" },
            { label: `y = ${num(slope, 3)}x + ${num(intercept, 2)}`, points: line(slope, intercept) },
            ...(showBest ? [{ label: `${s.bestLine}: y = ${num(best.slope, 3)}x + ${num(best.intercept, 2)}`, points: line(best.slope, best.intercept), dashed: true, color: "var(--color-success)" }] : []),
          ]}
          xLabel={s.mass}
          yLabel={s.stretch}
          xDomain={[0, 320]}
          yDomain={[-2, 14]}
          width={640}
          height={320}
          extra={({ x, y }) => (
            <>
              {SPRING_SAMPLE.map((p, i) => (
                <line key={i} x1={x(p.x)} x2={x(p.x)} y1={y(p.y)} y2={y(slope * p.x + intercept)} stroke="var(--color-danger)" strokeWidth={1.5} strokeDasharray="3 3" />
              ))}
            </>
          )}
        />
        <p className="mt-2 text-xs text-ink-muted">{s.sampleData}</p>
      </div>
      <div className="space-y-4">
        <SimSlider label={s.slope} value={slope} min={0} max={0.08} step={0.001} format={(v) => num(v, 3)} onChange={(v) => update(v, intercept)} />
        <SimSlider label={s.intercept} value={intercept} min={-3} max={3} step={0.05} format={(v) => num(v, 2)} onChange={(v) => update(slope, v)} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label={s.error} value={num(sse, 2)} />
          <Readout label="R²" value={num(1 - sse / SPRING_SAMPLE.reduce((acc, p) => acc + (p.y - SPRING_SAMPLE.reduce((m, q) => m + q.y, 0) / SPRING_SAMPLE.length) ** 2, 0), 3)} />
        </div>
        <p className="text-sm text-ink-muted">{fmt(s.bestError, { value: num(best.sse, 2) })}</p>
        <Button variant="secondary" className="w-full" onClick={() => setShowBest((b) => !b)} aria-pressed={showBest}>
          {showBest ? s.hideBest : s.showBest}
        </Button>
      </div>
    </div>
  );
}

export const LINEAR_START: TaskInputs["fit_line"] = { slope: 0.03, intercept: 1 };

export function linearSummary(v: TaskInputs["fit_line"], { num }: SimFormat): string {
  return `y = ${num(v.slope, 3)}x ${v.intercept >= 0 ? "+" : "−"} ${num(Math.abs(v.intercept), 2)}`;
}
