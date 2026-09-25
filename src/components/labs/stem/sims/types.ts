import type { RobotStep } from "@/lib/labs/stem/physics";

/** The live settings each auto-checked simulation task reads. */
export interface TaskInputs {
  projectile_target: { angle: number; speed: number; gravity: number; height: number };
  circuit_current: { voltage: number; r1: number; r2: number; mode: "series" | "parallel" };
  fit_line: { slope: number; intercept: number };
  robot_goal: { program: RobotStep[] };
}

export type TaskReporter = <K extends keyof TaskInputs>(task: K, value: TaskInputs[K]) => void;
