"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { GRAVITY, projectile } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { LineChart } from "../../charts";
import { Readout, Segmented, SimSlider, useSimFormat, type SimFormat } from "../sim-controls";
import type { TaskInputs, TaskReporter } from "./types";

const TARGET = 40;

export function ProjectileSim({ report }: { report: TaskReporter }) {
  const { s, num } = useSimFormat();
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(15);
  const [height, setHeight] = useState(0);
  const [planet, setPlanet] = useState<keyof typeof GRAVITY>("earth");
  const [progress, setProgress] = useState(1);
  const frame = useRef<number | null>(null);
  const g = GRAVITY[planet];
  const shot = projectile(speed, angle, height, g);
  const points = shot.points(80);

  const update = (next: Partial<{ angle: number; speed: number; height: number; planet: keyof typeof GRAVITY }>) => {
    const v = { angle, speed, height, planet, ...next };
    if (next.angle !== undefined) setAngle(next.angle);
    if (next.speed !== undefined) setSpeed(next.speed);
    if (next.height !== undefined) setHeight(next.height);
    if (next.planet !== undefined) setPlanet(next.planet);
    setProgress(1);
    report("projectile_target", { angle: v.angle, speed: v.speed, gravity: GRAVITY[v.planet], height: v.height });
  };

  const launch = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    const start = performance.now();
    const duration = Math.min(2500, Math.max(900, shot.flightTime * 350));
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  const shown = points.slice(0, Math.max(1, Math.round(progress * points.length)));
  const ball = shown[shown.length - 1];
  const xMax = Math.max(TARGET + 10, shot.range * 1.1);
  const yMax = Math.max(10, shot.maxHeight * 1.25);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <LineChart
          title={`${s.range}: ${num(shot.range, 1)} ${s.units.m}`}
          series={[{ label: "path", points: shown }]}
          xLabel={`x (${s.units.m})`}
          yLabel={`y (${s.units.m})`}
          xDomain={[0, xMax]}
          yDomain={[0, yMax]}
          width={640}
          height={320}
          extra={({ x, y }) => (
            <>
              <line x1={x(TARGET)} x2={x(TARGET)} y1={y(0)} y2={y(yMax * 0.18)} stroke="var(--color-danger)" strokeWidth={3} />
              <path d={`M${x(TARGET)},${y(yMax * 0.18)} l14,5 l-14,5 z`} fill="var(--color-danger)" />
              <text x={x(TARGET)} y={y(0) - 6} dx={6} className="fill-danger text-[11px]">
                {s.target} {TARGET} {s.units.m}
              </text>
              {ball ? <circle cx={x(ball.x)} cy={y(ball.y)} r={7} fill="var(--color-lab-stem)" stroke="white" strokeWidth={2} /> : null}
            </>
          )}
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Readout label={s.range} value={`${num(shot.range, 1)} ${s.units.m}`} />
          <Readout label={s.maxHeight} value={`${num(shot.maxHeight, 1)} ${s.units.m}`} />
          <Readout label={s.flightTime} value={`${num(shot.flightTime, 2)} ${s.units.s}`} />
        </div>
      </div>
      <div className="space-y-4">
        <SimSlider label={s.angle} value={angle} min={0} max={90} step={1} format={(v) => `${v}°`} onChange={(v) => update({ angle: v })} />
        <SimSlider label={s.speed} value={speed} min={1} max={40} step={0.1} unit={s.units.mps} onChange={(v) => update({ speed: Math.round(v * 10) / 10 })} />
        <SimSlider label={s.height} value={height} min={0} max={30} step={1} unit={s.units.m} onChange={(v) => update({ height: v })} />
        <div>
          <p className="mb-1.5 text-sm font-medium">{s.gravity}</p>
          <Segmented label={s.gravity} value={planet} options={(["earth", "moon", "mars"] as const).map((id) => ({ id, label: `${s.planets[id]} (${num(GRAVITY[id], 2)})` }))} onChange={(v) => update({ planet: v })} />
        </div>
        <Button size="lg" onClick={launch} className="w-full">
          <Rocket aria-hidden className="size-5" />
          {s.launch}
        </Button>
      </div>
    </div>
  );
}

export const PROJECTILE_START: TaskInputs["projectile_target"] = { angle: 45, speed: 15, gravity: GRAVITY.earth, height: 0 };

export function projectileSummary(v: TaskInputs["projectile_target"], { s, num }: SimFormat): string {
  const planet = (Object.keys(GRAVITY) as (keyof typeof GRAVITY)[]).find((p) => GRAVITY[p] === v.gravity) ?? "earth";
  return `${v.angle}°, ${num(v.speed, 1)} ${s.units.mps}, ${s.planets[planet]}${v.height ? `, h = ${v.height} ${s.units.m}` : ""}`;
}
