"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { leastSquares, SPRING_SAMPLE, sumSquaredErrors } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { LineChart } from "../../charts";
import { fixed, Readout, SimSlider } from "../sim-controls";
import type { TaskReporter } from "./types";

export function LinearModelSim({ report }: { report: TaskReporter }) {
  const { dict } = useI18n();
  const s = dict.labs.stem.simulations;
  const [slope, setSlope] = useState(0.03);
  const [intercept, setIntercept] = useState(1);
  const [showBest, setShowBest] = useState(false);
  const best = leastSquares(SPRING_SAMPLE);
  const sse = sumSquaredErrors(SPRING_SAMPLE, slope, intercept);
  const line = (m: number, b: number) => [0, 320].map((x) => ({ x, y: m * x + b }));

  const update = (m: number, b: number) => {
    setSlope(m);
    setIntercept(b);
    report("fit_line", { summary: `y = ${fixed(m, 3)}x ${b >= 0 ? "+" : "−"} ${fixed(Math.abs(b), 2)}`, value: { slope: m, intercept: b } });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <LineChart
          title={`${s.error}: ${fixed(sse, 2)}`}
          series={[
            { label: s.stretch, points: SPRING_SAMPLE, dots: true, color: "var(--color-ink)" },
            { label: `y = ${fixed(slope, 3)}x + ${fixed(intercept, 2)}`, points: line(slope, intercept) },
            ...(showBest ? [{ label: `${s.bestLine}: y = ${fixed(best.slope, 3)}x + ${fixed(best.intercept, 2)}`, points: line(best.slope, best.intercept), dashed: true, color: "var(--color-success)" }] : []),
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
        <SimSlider label={s.slope} value={slope} min={0} max={0.08} step={0.001} format={(v) => fixed(v, 3)} onChange={(v) => update(v, intercept)} />
        <SimSlider label={s.intercept} value={intercept} min={-3} max={3} step={0.05} format={(v) => fixed(v, 2)} onChange={(v) => update(slope, v)} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label={s.error} value={fixed(sse, 2)} />
          <Readout label="R²" value={fixed(1 - sse / SPRING_SAMPLE.reduce((acc, p) => acc + (p.y - SPRING_SAMPLE.reduce((m, q) => m + q.y, 0) / SPRING_SAMPLE.length) ** 2, 0), 3)} />
        </div>
        <p className="text-sm text-ink-muted">{fmt(s.bestError, { value: fixed(best.sse, 2) })}</p>
        <Button variant="secondary" className="w-full" onClick={() => setShowBest((b) => !b)} aria-pressed={showBest}>
          {showBest ? s.hideBest : s.showBest}
        </Button>
      </div>
    </div>
  );
}

export const LINEAR_DEFAULT = { summary: "y = 0.030x + 1.00", value: { slope: 0.03, intercept: 1 } };
