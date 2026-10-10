import type { Course, Exercise, Lesson, Module, TestCase } from "./types";
import { cppCourse } from "./cpp";
import generatedJson from "./cpp/generated.json";

/**
 * The course in full, with the tests that were made from the reference solutions by
 * scripts/build-course.ts (run with the real g++). Server-side only: this is where the
 * answers live.
 */

export interface GeneratedExercise {
  /** A fingerprint of what the outputs were made from; the course tests compare it, so stale data is caught. */
  sig: string;
  samples: TestCase[];
  tests: TestCase[];
}

export interface Generated {
  version: 1;
  exercises: Record<string, GeneratedExercise>;
  /** What each runnable example and each "what will it print?" program prints, by `lessonId/blockId`. */
  outputs: Record<string, { sig: string; out: string }>;
}

export const generated = generatedJson as unknown as Generated;

export const COURSES: Record<string, Course> = { cpp: cppCourse };

export interface LessonRef {
  course: Course;
  module: Module;
  lesson: Lesson;
  /** Position of the lesson in the whole course (0-based). */
  order: number;
}

let lessonIndex: Map<string, LessonRef> | null = null;
let exerciseIndex: Map<string, { ref: LessonRef; exercise: Exercise }> | null = null;

function build(): void {
  lessonIndex = new Map();
  exerciseIndex = new Map();
  let order = 0;
  for (const course of Object.values(COURSES)) {
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        const ref: LessonRef = { course, module: mod, lesson, order: order++ };
        lessonIndex.set(lesson.id, ref);
        for (const exercise of lesson.exercises) exerciseIndex.set(exercise.id, { ref, exercise });
      }
    }
  }
}

export function findLesson(id: string): LessonRef | null {
  if (!lessonIndex) build();
  return lessonIndex!.get(id) ?? null;
}

export function findExercise(id: string): { ref: LessonRef; exercise: Exercise } | null {
  if (!exerciseIndex) build();
  return exerciseIndex!.get(id) ?? null;
}

export function allLessons(course: Course): LessonRef[] {
  if (!lessonIndex) build();
  return course.modules.flatMap((m) => m.lessons.map((l) => lessonIndex!.get(l.id)!));
}

/** The tests of an exercise: the samples first, then the hidden ones. */
export function testsOf(exerciseId: string): { samples: TestCase[]; hidden: TestCase[] } | null {
  const g = generated.exercises[exerciseId];
  return g ? { samples: g.samples, hidden: g.tests } : null;
}
