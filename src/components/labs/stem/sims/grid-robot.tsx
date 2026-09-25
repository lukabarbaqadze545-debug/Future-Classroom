"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, CornerUpLeft, CornerUpRight, Minus, Play, Plus, Trash2, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ROBOT_LEVEL, runRobot, type RobotCommand, type RobotStep } from "@/lib/labs/stem/physics";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { TaskReporter } from "./types";

const CELL = 56;
const ICONS = { forward: ArrowUp, left: CornerUpLeft, right: CornerUpRight };

export function GridRobotSim({ report }: { report: TaskReporter }) {
  const { dict } = useI18n();
  const s = dict.labs.stem.simulations;
  const [program, setProgram] = useState<RobotStep[]>([]);
  const [shown, setShown] = useState(0);
  const [ran, setRan] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const run = runRobot(ROBOT_LEVEL, program);
  const pos = run.path[Math.min(shown, run.path.length - 1)];
  const size = ROBOT_LEVEL.size * CELL;

  const change = (next: RobotStep[]) => {
    setProgram(next);
    setRan(false);
    setShown(0);
    report("robot_goal", {
      summary: next.length ? next.map((st) => `${s.commands[st.command]}${st.times > 1 ? ` ×${st.times}` : ""}`).join(", ") : "—",
      value: { program: next },
    });
  };

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    setShown(0);
    setRan(false);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= run.path.length - 1) {
        if (timer.current) clearInterval(timer.current);
        setRan(true);
      }
    }, 280);
    if (run.path.length <= 1) setRan(true);
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const add = (command: RobotCommand) => {
    const last = program[program.length - 1];
    if (last && last.command === command && command === "forward" && last.times < 9) change([...program.slice(0, -1), { ...last, times: last.times + 1 }]);
    else change([...program, { command, times: 1 }]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${ROBOT_LEVEL.size}×${ROBOT_LEVEL.size}`} className="h-auto w-full max-w-[360px] rounded-xl border border-line bg-surface">
        {Array.from({ length: ROBOT_LEVEL.size * ROBOT_LEVEL.size }, (_, i) => {
          const x = i % ROBOT_LEVEL.size;
          const y = Math.floor(i / ROBOT_LEVEL.size);
          const wall = ROBOT_LEVEL.walls.some((w) => w.x === x && w.y === y);
          return <rect key={i} x={x * CELL + 1} y={y * CELL + 1} width={CELL - 2} height={CELL - 2} rx={6} fill={wall ? "var(--color-ink)" : "var(--color-muted)"} />;
        })}
        <text x={ROBOT_LEVEL.goal.x * CELL + CELL / 2} y={ROBOT_LEVEL.goal.y * CELL + CELL / 2} textAnchor="middle" dominantBaseline="central" fontSize={30}>
          🏁
        </text>
        {run.path.slice(0, shown + 1).map((p, i) => (
          <circle key={i} cx={p.x * CELL + CELL / 2} cy={p.y * CELL + CELL / 2} r={5} fill="var(--color-lab-stem)" opacity={0.4} />
        ))}
        <g transform={`translate(${pos.x * CELL + CELL / 2} ${pos.y * CELL + CELL / 2}) rotate(${pos.heading * 90})`}>
          <circle r={20} fill="var(--color-lab-stem)" />
          <path d="M0,-14 L9,6 L-9,6 Z" fill="white" />
        </g>
      </svg>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["forward", "left", "right"] as const).map((cmd) => {
            const Icon = ICONS[cmd];
            return (
              <Button key={cmd} size="lg" variant="secondary" onClick={() => add(cmd)} disabled={program.length >= 30}>
                <Icon aria-hidden className="size-5" />
                {s.commands[cmd]}
              </Button>
            );
          })}
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">
            {s.program} · {fmt(s.steps, { n: program.length })}
          </p>
          {program.length ? (
            <ol className="space-y-1.5" data-testid="robot-program">
              {program.map((st, i) => {
                const Icon = ICONS[st.command];
                return (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
                    <span className="w-5 text-ink-subtle tabular-nums">{i + 1}.</span>
                    <Icon aria-hidden className="size-4 text-lab-stem" />
                    <span className="flex-1 font-medium">{s.commands[st.command]}</span>
                    <Button variant="ghost" size="sm" aria-label="−" disabled={st.times <= 1} onClick={() => change(program.map((x, j) => (j === i ? { ...x, times: x.times - 1 } : x)))}>
                      <Minus aria-hidden className="size-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold tabular-nums">{fmt(s.times, { n: st.times })}</span>
                    <Button variant="ghost" size="sm" aria-label="+" disabled={st.times >= 9} onClick={() => change(program.map((x, j) => (j === i ? { ...x, times: x.times + 1 } : x)))}>
                      <Plus aria-hidden className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">{s.emptyProgram}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={start} disabled={!program.length}>
            <Play aria-hidden className="size-5" />
            {s.run}
          </Button>
          <Button variant="ghost" onClick={() => change(program.slice(0, -1))} disabled={!program.length}>
            <Undo2 aria-hidden className="size-4" />
            {s.undo}
          </Button>
          <Button variant="ghost" onClick={() => change([])} disabled={!program.length}>
            <Trash2 aria-hidden className="size-4" />
            {s.clearProgram}
          </Button>
        </div>
        {ran ? <Notice tone={run.reached ? "success" : run.crashed ? "danger" : "warn"}>{run.reached ? s.reached : run.crashed ? s.crashed : s.notReached}</Notice> : null}
      </div>
    </div>
  );
}

export const ROBOT_DEFAULT = { summary: "—", value: { program: [] } };
