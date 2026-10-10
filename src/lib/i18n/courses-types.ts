import type { coursesEn } from "./courses-en";
import type { Widen } from "./labs-types";

export type CoursesDictionary = Widen<typeof coursesEn>;
