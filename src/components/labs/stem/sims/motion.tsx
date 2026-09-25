"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { motionAt } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { LineChart } from "../../charts";
import { fixed, Readout, SimSlider } from "../sim-controls";

const DURATION = 10;

export function MotionSim() {
  const { dict } = useI18n();
  const s = dict.labs.stem.simulations;
  const [v0, setV0] = useState(2);
  const [a, setA] = useState(0.5);
  const [t, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const tRef = useRef(0);
  const setT = (value: number) => {
    tRef.current = value;
    setTime(value);
  };

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      tRef.current = Math.min(DURATION, tRef.current + dt);
      setTime(tRef.current);
      if (tRef.current >= DURATION) {
        setPlaying(false);
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [playing]);

  const samples = Array.from({ length: 101 }, (_, i) => {
    const time = (DURATION * i) / 100;
    return { time, ...motionAt(0, v0, a, time) };
  });
  const xs = samples.map((p) => p.x);
  const xMin = Math.min(0, ...xs);
  const xMax = Math.max(1, ...xs);
  const now = motionAt(0, v0, a, t);
  const carLeft = ((now.x - xMin) / (xMax - xMin || 1)) * 100;
  const shown = samples.filter((p) => p.time <= t + 1e-9);

  return (
    <div className="space-y-5">
      <div className="relative h-20 overflow-hidden rounded-xl border border-line bg-muted/50" aria-hidden>
        <div className="absolute inset-x-4 bottom-5 h-1 rounded bg-line-strong" />
        <div className="absolute bottom-6 -translate-x-1/2 text-3xl transition-none" style={{ left: `calc(1rem + (100% - 2rem) * ${carLeft / 100})` }}>
          🚗
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <LineChart title={s.positionGraph} series={[{ label: s.position, points: shown.map((p) => ({ x: p.time, y: p.x })) }]} xLabel={`${s.time} (s)`} yLabel={`${s.position} (m)`} xDomain={[0, DURATION]} yDomain={[xMin, xMax]} width={480} height={260} />
          <LineChart
            title={s.velocityGraph}
            series={[{ label: s.velocity, points: shown.map((p) => ({ x: p.time, y: p.v })), color: "var(--color-warn)" }]}
            xLabel={`${s.time} (s)`}
            yLabel={`${s.velocity} (m/s)`}
            xDomain={[0, DURATION]}
            yDomain={[Math.min(0, ...samples.map((p) => p.v)), Math.max(1, ...samples.map((p) => p.v))]}
            width={480}
            height={260}
          />
        </div>
        <div className="space-y-4">
          <SimSlider label={s.v0} value={v0} min={-5} max={10} step={0.5} unit="m/s" onChange={(v) => { setV0(v); setT(0); setPlaying(false); }} />
          <SimSlider label={s.acceleration} value={a} min={-3} max={3} step={0.1} unit="m/s²" format={(v) => fixed(v, 1)} onChange={(v) => { setA(v); setT(0); setPlaying(false); }} />
          <div className="grid grid-cols-3 gap-2">
            <Readout label={s.time} value={`${fixed(t, 1)} s`} />
            <Readout label={s.position} value={`${fixed(now.x, 1)} m`} />
            <Readout label={s.velocity} value={`${fixed(now.v, 1)} m/s`} />
          </div>
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => { if (t >= DURATION) setT(0); setPlaying((p) => !p); }}>
              {playing ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
              {playing ? s.pause : s.play}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => { setPlaying(false); setT(0); }} aria-label={s.reset}>
              <RotateCcw aria-hidden className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
