"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { circuit } from "@/lib/labs/stem/physics";
import { fixed, Readout, Segmented, SimSlider } from "../sim-controls";
import type { TaskReporter } from "./types";

function Resistor({ x, y, label, vertical }: { x: number; y: number; label: string; vertical?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {vertical ? (
        <rect x={-10} y={-28} width={20} height={56} rx={3} fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth={2.5} />
      ) : (
        <rect x={-28} y={-10} width={56} height={20} rx={3} fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth={2.5} />
      )}
      <text x={vertical ? -18 : 0} y={vertical ? 5 : -18} textAnchor={vertical ? "end" : "middle"} className="fill-ink text-[13px] font-semibold">
        {label}
      </text>
    </g>
  );
}

export function CircuitSim({ report }: { report: TaskReporter }) {
  const { dict } = useI18n();
  const s = dict.labs.stem.simulations;
  const [voltage, setVoltage] = useState(6);
  const [r1, setR1] = useState(10);
  const [r2, setR2] = useState(20);
  const [mode, setMode] = useState<"series" | "parallel">("series");
  const c = circuit(voltage, r1, r2, mode);

  const update = (next: Partial<{ voltage: number; r1: number; r2: number; mode: "series" | "parallel" }>) => {
    const v = { voltage, r1, r2, mode, ...next };
    if (next.voltage !== undefined) setVoltage(next.voltage);
    if (next.r1 !== undefined) setR1(next.r1);
    if (next.r2 !== undefined) setR2(next.r2);
    if (next.mode !== undefined) setMode(next.mode);
    report("circuit_current", {
      summary: `${v.voltage} V, R₁ = ${v.r1} Ω, R₂ = ${v.r2} Ω, ${v.mode === "series" ? s.series : s.parallel}`,
      value: v,
    });
  };

  const flow = Math.min(1, c.current / 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <svg viewBox="0 0 520 300" role="img" aria-label={`${dict.labs.stem.schematic}: ${mode === "series" ? s.series : s.parallel}`} className="h-auto w-full rounded-xl border border-line bg-surface">
          <title>{dict.labs.stem.schematic}</title>
          {/* Battery on the left */}
          <line x1={60} y1={60} x2={60} y2={130} stroke="var(--color-ink)" strokeWidth={2.5} />
          <line x1={60} y1={170} x2={60} y2={240} stroke="var(--color-ink)" strokeWidth={2.5} />
          <line x1={36} y1={130} x2={84} y2={130} stroke="var(--color-ink)" strokeWidth={3} />
          <line x1={46} y1={146} x2={74} y2={146} stroke="var(--color-ink)" strokeWidth={5} />
          <line x1={36} y1={156} x2={84} y2={156} stroke="var(--color-ink)" strokeWidth={3} />
          <line x1={46} y1={170} x2={74} y2={170} stroke="var(--color-ink)" strokeWidth={5} />
          <text x={96} y={154} className="fill-ink text-[14px] font-semibold">
            {voltage} V
          </text>
          <text x={24} y={126} className="fill-ink-subtle text-[12px]">
            +
          </text>
          {mode === "series" ? (
            <>
              <polyline points="60,60 60,40 460,40 460,260 60,260 60,240" fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
              <Resistor x={260} y={40} label={`R₁ ${r1} Ω`} />
              <Resistor x={460} y={150} label={`R₂ ${r2} Ω`} vertical />
            </>
          ) : (
            <>
              <polyline points="60,60 60,40 300,40" fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
              <polyline points="60,240 60,260 300,260" fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
              <line x1={300} y1={40} x2={440} y2={40} stroke="var(--color-ink)" strokeWidth={2.5} />
              <line x1={300} y1={260} x2={440} y2={260} stroke="var(--color-ink)" strokeWidth={2.5} />
              <line x1={300} y1={40} x2={300} y2={260} stroke="var(--color-ink)" strokeWidth={2.5} />
              <line x1={440} y1={40} x2={440} y2={260} stroke="var(--color-ink)" strokeWidth={2.5} />
              <Resistor x={300} y={150} label={`R₁ ${r1} Ω`} vertical />
              <Resistor x={440} y={150} label={`R₂ ${r2} Ω`} vertical />
              <circle cx={300} cy={40} r={4} fill="var(--color-ink)" />
              <circle cx={300} cy={260} r={4} fill="var(--color-ink)" />
            </>
          )}
          {/* Current indicator */}
          <g transform="translate(150 260)">
            <circle r={20} fill="var(--color-surface)" stroke="var(--color-lab-stem)" strokeWidth={2.5} />
            <text textAnchor="middle" dominantBaseline="central" className="fill-lab-stem text-[15px] font-bold">
              A
            </text>
          </g>
          <text x={150} y={296} textAnchor="middle" className="fill-ink text-[13px] font-semibold tabular-nums">
            {fixed(c.current, 3)} A
          </text>
          <circle cx={250} cy={260} r={5} fill="var(--color-warn)" opacity={0.3 + flow * 0.7}>
            <animate attributeName="cx" values="100;300;100" dur={`${Math.max(0.6, 3 - flow * 2.4)}s`} repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="space-y-4">
        <Segmented label={s.series} value={mode} options={[{ id: "series", label: s.series }, { id: "parallel", label: s.parallel }]} onChange={(m) => update({ mode: m })} />
        <SimSlider label={s.voltage} value={voltage} min={1.5} max={12} step={0.5} unit="V" onChange={(v) => update({ voltage: v })} />
        <SimSlider label="R₁" value={r1} min={1} max={100} step={1} unit="Ω" onChange={(v) => update({ r1: v })} />
        <SimSlider label="R₂" value={r2} min={1} max={100} step={1} unit="Ω" onChange={(v) => update({ r2: v })} />
        <div className="grid grid-cols-2 gap-2">
          <Readout label={s.totalResistance} value={`${fixed(c.total, 2)} Ω`} />
          <Readout label={s.current} value={`${fixed(c.current, 3)} A`} />
          <Readout label={fmt(s.voltageAcross, { name: "R₁" })} value={`${fixed(c.v1, 2)} V`} />
          <Readout label={fmt(s.voltageAcross, { name: "R₂" })} value={`${fixed(c.v2, 2)} V`} />
          <Readout label={fmt(s.currentThrough, { name: "R₁" })} value={`${fixed(c.i1, 3)} A`} />
          <Readout label={fmt(s.currentThrough, { name: "R₂" })} value={`${fixed(c.i2, 3)} A`} />
          <Readout label={s.power} value={`${fixed(c.power, 2)} W`} />
        </div>
      </div>
    </div>
  );
}

export const CIRCUIT_DEFAULT = { summary: "6 V, R₁ = 10 Ω, R₂ = 20 Ω", value: { voltage: 6, r1: 10, r2: 20, mode: "series" } };
