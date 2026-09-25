"use client";

import { useState } from "react";
import type { SimulationId } from "@/lib/labs/stem/types";
import type { StudentItem } from "@/lib/labs/stem/service";
import { Card } from "@/components/ui/card";
import { ItemChallenge, type TaskValues } from "./item-challenge";
import { CIRCUIT_DEFAULT, CircuitSim } from "./sims/circuit";
import { GridRobotSim, ROBOT_DEFAULT } from "./sims/grid-robot";
import { GrowthSim } from "./sims/growth";
import { LINEAR_DEFAULT, LinearModelSim } from "./sims/linear-model";
import { MotionSim } from "./sims/motion";
import { ProbabilitySim } from "./sims/probability";
import { PROJECTILE_DEFAULT, ProjectileSim } from "./sims/projectile";

/** A simulation plus its auto-checked challenge; the challenge reads the live simulation settings. */
export function SimulationView({ id, items, best, challengeTitle }: { id: SimulationId; items: StudentItem[]; best: { score: number; max: number } | null; challengeTitle: string }) {
  const [tasks, setTasks] = useState<TaskValues>({
    projectile_target: PROJECTILE_DEFAULT,
    circuit_current: CIRCUIT_DEFAULT,
    fit_line: LINEAR_DEFAULT,
    robot_goal: ROBOT_DEFAULT,
  });
  const report = (task: keyof TaskValues, value: { summary: string; value: unknown }) => setTasks((t) => ({ ...t, [task]: value }));

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5" data-testid="simulation">
        {id === "projectile" ? (
          <ProjectileSim report={report} />
        ) : id === "motion" ? (
          <MotionSim />
        ) : id === "circuit" ? (
          <CircuitSim report={report} />
        ) : id === "probability" ? (
          <ProbabilitySim />
        ) : id === "linear-model" ? (
          <LinearModelSim report={report} />
        ) : id === "growth" ? (
          <GrowthSim />
        ) : (
          <GridRobotSim report={report} />
        )}
      </Card>
      {items.length ? <ItemChallenge kind="simulation" id={id} items={items} taskValues={tasks} initialBest={best} title={challengeTitle} /> : null}
    </div>
  );
}
