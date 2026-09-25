"use client";

import { useState } from "react";
import { exponentialGrowth, logisticGrowth } from "@/lib/labs/stem/physics";
import { LineChart } from "../../charts";
import { Readout, SimSlider, useSimFormat } from "../sim-controls";

const HOURS = 20;

export function GrowthSim() {
  const { s, num } = useSimFormat();
  const [p0, setP0] = useState(100);
  const [r, setR] = useState(0.4);
  const [k, setK] = useState(2000);
  const cap = k * 1.6;
  const times = Array.from({ length: 81 }, (_, i) => (HOURS * i) / 80);
  const exp = times.map((t) => ({ x: t, y: exponentialGrowth(p0, r, t) })).filter((p) => p.y <= cap);
  const logi = times.map((t) => ({ x: t, y: logisticGrowth(p0, r, k, t) }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <LineChart
          title={`${s.exponential} / ${s.logistic}`}
          series={[
            { label: s.exponential, points: exp, color: "var(--color-danger)" },
            { label: s.logistic, points: logi, color: "var(--color-lab-stem)" },
            { label: `K = ${k}`, points: [{ x: 0, y: k }, { x: HOURS, y: k }], dashed: true, color: "var(--color-ink-subtle)" },
          ]}
          xLabel={s.hours}
          yLabel={s.population}
          xDomain={[0, HOURS]}
          yDomain={[0, cap]}
          width={640}
          height={320}
        />
      </div>
      <div className="space-y-4">
        <SimSlider label={s.start} value={p0} min={10} max={500} step={10} onChange={setP0} />
        <SimSlider label={s.rate} value={r} min={0.1} max={1.5} step={0.05} format={(v) => num(v, 2)} onChange={setR} />
        <SimSlider label={s.capacity} value={k} min={500} max={5000} step={100} onChange={setK} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label={`${s.exponential}, t = 10`} value={num(exponentialGrowth(p0, r, 10), 0)} />
          <Readout label={`${s.logistic}, t = 10`} value={num(logisticGrowth(p0, r, k, 10), 0)} />
        </div>
      </div>
    </div>
  );
}
