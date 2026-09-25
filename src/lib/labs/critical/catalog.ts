import { BUILDER_EXERCISES, DEBATE_EXERCISES, DECISION_EXERCISES, HUMILITY_EXERCISES } from "./exercises-writing";
import { ITEM_EXERCISES } from "./exercises-items";
import type { CtExercise } from "./types";

/** Ordered roughly A–F from the curriculum, then supporting sets. */
export const CT_EXERCISES: CtExercise[] = [
  ...ITEM_EXERCISES.filter((e) => e.kind === "claim"),
  ...BUILDER_EXERCISES,
  ...ITEM_EXERCISES.filter((e) => e.kind === "fallacy"),
  ...ITEM_EXERCISES.filter((e) => e.kind === "media"),
  ...DEBATE_EXERCISES,
  ...HUMILITY_EXERCISES,
  ...ITEM_EXERCISES.filter((e) => e.kind === "bias" || e.kind === "sources"),
  ...DECISION_EXERCISES,
];

export function findExercise(id: string): CtExercise | null {
  return CT_EXERCISES.find((e) => e.id === id) ?? null;
}
