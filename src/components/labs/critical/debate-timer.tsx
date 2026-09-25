"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

const PHASES = [
  { id: "opening", seconds: 120 },
  { id: "rebuttal", seconds: 60 },
  { id: "closing", seconds: 60 },
] as const;

/** A large, touch-friendly speaking timer for class debates on the board. */
export function DebateTimer() {
  const { dict } = useI18n();
  const d = dict.labs.critical.debate;
  const [phase, setPhase] = useState<(typeof PHASES)[number]["id"]>("opening");
  const [left, setLeft] = useState<number>(PHASES[0].seconds);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const choose = (id: (typeof PHASES)[number]["id"]) => {
    setPhase(id);
    setRunning(false);
    setLeft(PHASES.find((p) => p.id === id)!.seconds);
  };
  const mm = String(Math.floor(left / 60)).padStart(1, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Timer aria-hidden className="size-4.5 text-lab-critical" />
            {d.timer}
          </p>
          <p className="text-sm text-ink-muted">{d.timerLead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={phase === p.id}
              onClick={() => choose(p.id)}
              className={cn("h-10 rounded-lg border px-3 text-sm font-medium", phase === p.id ? "border-lab-critical bg-lab-critical/10 text-lab-critical" : "border-line-strong hover:bg-muted")}
            >
              {d.phases[p.id]} · {p.seconds / 60}:00
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className={cn("font-mono text-5xl font-semibold tabular-nums", left === 0 ? "text-danger" : "text-ink")} aria-live="polite" aria-atomic>
          {left === 0 ? d.timeUp : `${mm}:${ss}`}
        </p>
        <div className="flex gap-2">
          <Button size="lg" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
            {running ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
            {running ? d.pauseTimer : d.startTimer}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => choose(phase)}>
            <RotateCcw aria-hidden className="size-5" />
            {d.resetTimer}
          </Button>
        </div>
      </div>
    </Card>
  );
}
