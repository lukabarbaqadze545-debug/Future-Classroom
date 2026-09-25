import type { TaskValues } from "../item-challenge";

export type TaskReporter = (task: keyof TaskValues, value: { summary: string; value: unknown }) => void;
