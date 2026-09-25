"use client";

import { useState } from "react";
import type { SimulationId } from "@/lib/labs/stem/types";
import type { StudentItem } from "@/lib/labs/stem/service";
import { Card } from "@/components/ui/card";
import { ItemChallenge, type TaskValues } from "./item-challenge";
import { useSimFormat } from "./sim-controls";
import { CIRCUIT_START, CircuitSim, circuitSummary } from "./sims/circuit";
import { GridRobotSim, ROBOT_START, robotSummary } from "./sims/grid-robot";
import { GrowthSim } from "./sims/growth";
import { LINEAR_START, LinearModelSim, linearSummary } from "./sims/linear-model";
import { MotionSim } from "./sims/motion";
import { ProbabilitySim } from "./sims/probability";
import { PROJECTILE_START, ProjectileSim, projectileSummary } from "./sims/projectile";
import type { TaskInputs, TaskReporter } from "./sims/types";

/** A simulation plus its auto-checked challenge; the challenge reads the live simulation settings. */
export function SimulationView({ id, items, best, challengeTitle }: { id: SimulationId; items: StudentItem[]; best: { score: number; max: number } | null; challengeTitle: string }) {
  const [inputs, setInputs] = useState<TaskInputs>({
    projectile_target: PROJECTILE_START,
    circuit_current: CIRCUIT_START,
    fit_line: LINEAR_START,
    robot_goal: ROBOT_START,
  });
  const report: TaskReporter = (task, value) => setInputs((t) => ({ ...t, [task]: value }));
  // Summaries are built on every render so they follow the interface language.
  const f = useSimFormat();
  const tasks: TaskValues = {
    projectile_target: { value: inputs.projectile_target, summary: projectileSummary(inputs.projectile_target, f) },
    circuit_current: { value: inputs.circuit_current, summary: circuitSummary(inputs.circuit_current, f) },
    fit_line: { value: inputs.fit_line, summary: linearSummary(inputs.fit_line, f) },
    robot_goal: { value: inputs.robot_goal, summary: robotSummary(inputs.robot_goal, f) },
  };

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
