import { LEVEL_1_2 } from "./curriculum-1-2";
import { LEVEL_3_4 } from "./curriculum-3-4";
import type { Problem } from "./types";

/** The built-in programming curriculum, from first programs to contest problems. */
export const BUILT_IN_PROBLEMS: Problem[] = [...LEVEL_1_2, ...LEVEL_3_4];

export function findBuiltInProblem(id: string): Problem | undefined {
  return BUILT_IN_PROBLEMS.find((p) => p.id === id);
}
