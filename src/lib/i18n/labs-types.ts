import type { labsEn } from "./labs-en";

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type LabsDictionary = Widen<typeof labsEn>;
