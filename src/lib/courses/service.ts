import "server-only";
import { runCpp } from "@/lib/cpp";
import { ApiError } from "@/lib/http/errors";
import { normalizeOutput } from "@/lib/labs/programming/compare";
import { allLessons, COURSES, findExercise, findLesson, generated, testsOf } from "./data";
import { judge, sameOutput } from "./judge";
import type { Block, CheckResult, Course, Lesson, StudentBlock, StudentCourse, StudentExercise, StudentLesson, Text } from "./types";

/**
 * What the browser may know about a course, and the checks that need the answers.
 * Nothing that gives an answer away leaves this file: quiz answers, reference solutions,
 * hidden tests and later hints are only returned by the checking functions below.
 */

function course(id: string): Course {
  const c = COURSES[id];
  if (!c) throw new ApiError(404, "not_found");
  return c;
}

const itemIdsOf = (lesson: Lesson): string[] => lesson.blocks.filter((b): b is Extract<Block, { k: "quiz" | "predict" }> => b.k === "quiz" || b.k === "predict").map((b) => b.id);

export function studentCourse(id: string): StudentCourse {
  const c = course(id);
  return {
    id: c.id,
    language: c.language,
    title: c.title,
    tagline: c.tagline,
    audience: c.audience,
    modules: c.modules.map((m) => ({
      id: m.id,
      number: m.number,
      title: m.title,
      summary: m.summary,
      outcomes: m.outcomes,
      lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, tagline: l.tagline, minutes: l.minutes, kind: l.kind, exerciseIds: l.exercises.map((e) => e.id), itemIds: itemIdsOf(l) })),
    })),
    planned: c.planned,
  };
}

function studentBlock(b: Block): StudentBlock {
  if (b.k === "predict") return { k: "predict", id: b.id, code: b.code, stdin: b.stdin, ask: b.ask };
  if (b.k === "quiz") return { k: "quiz", id: b.id, question: b.question, options: b.options };
  return b;
}

export function studentLesson(lessonId: string): StudentLesson {
  const ref = findLesson(lessonId);
  if (!ref) throw new ApiError(404, "not_found");
  const { course: c, module, lesson } = ref;
  const flat = allLessons(c);
  const at = flat.findIndex((r) => r.lesson.id === lessonId);
  const link = (r: (typeof flat)[number] | undefined) => (r ? { id: r.lesson.id, title: r.lesson.title } : null);
  return {
    id: lesson.id,
    moduleId: module.id,
    moduleNumber: module.number,
    index: module.lessons.findIndex((l) => l.id === lessonId),
    title: lesson.title,
    tagline: lesson.tagline,
    minutes: lesson.minutes,
    kind: lesson.kind,
    goals: lesson.goals,
    blocks: lesson.blocks.map(studentBlock),
    exercises: lesson.exercises.map((e): StudentExercise => {
      const g = generated.exercises[e.id];
      return {
        id: e.id,
        kind: e.kind,
        title: e.title,
        statement: e.statement,
        inputFormat: e.inputFormat,
        outputFormat: e.outputFormat,
        starter: e.starter,
        samples: g?.samples ?? [],
        weight: e.weight ?? 1,
        hintCount: e.hints.length,
        timeMs: e.timeMs ?? 1000,
      };
    }),
    mistakes: lesson.mistakes,
    summary: lesson.summary,
    prev: link(flat[at - 1]),
    next: link(flat[at + 1]),
  };
}

/** The first lesson, for the "start" button. */
export function firstLessonId(courseId: string): string | null {
  return allLessons(course(courseId))[0]?.lesson.id ?? null;
}

/* ---------------------------------- checking ---------------------------------- */

export function checkExercise(exerciseId: string, code: string): CheckResult {
  const found = findExercise(exerciseId);
  if (!found) throw new ApiError(404, "not_found");
  const tests = testsOf(exerciseId);
  if (!tests) throw new ApiError(500, "internal", "The tests of this exercise have not been generated: run scripts/build-course.ts.");
  const { exercise } = found;
  return judge({
    code,
    tests: [...tests.samples, ...tests.hidden],
    samples: tests.samples.length,
    compare: exercise.compare,
    limits: { timeMs: exercise.timeMs ?? 1000 },
  });
}

export function exerciseHint(exerciseId: string, n: number): Text {
  const found = findExercise(exerciseId);
  if (!found) throw new ApiError(404, "not_found");
  const hint = found.exercise.hints[n - 1];
  if (!hint) throw new ApiError(404, "not_found");
  return hint;
}

/** The reference solution — only to someone whose own program already passes every test. */
export function revealSolution(exerciseId: string, code: string): { solution: string; explanation?: Text } {
  const found = findExercise(exerciseId);
  if (!found) throw new ApiError(404, "not_found");
  const result = checkExercise(exerciseId, code);
  if (result.verdict !== "accepted") throw new ApiError(403, "not_solved");
  return { solution: found.exercise.solution, explanation: found.exercise.explanation };
}

function findBlock<K extends Block["k"]>(lessonId: string, blockId: string, kind: K): Extract<Block, { k: K }> {
  const ref = findLesson(lessonId);
  const block = ref?.lesson.blocks.find((b) => b.k === kind && "id" in b && b.id === blockId);
  if (!block) throw new ApiError(404, "not_found");
  return block as Extract<Block, { k: K }>;
}

export function checkQuiz(lessonId: string, blockId: string, choice: number): { correct: boolean; answer: number; why: Text } {
  const quiz = findBlock(lessonId, blockId, "quiz");
  if (choice < 0 || choice >= quiz.options.length) throw new ApiError(400, "invalid_input");
  return { correct: choice === quiz.answer, answer: quiz.answer, why: quiz.why };
}

/** What a program prints, as the interpreter prints it. */
export function outputOf(code: string, stdin = ""): string {
  const r = runCpp(code, { stdin, stepLimit: 20_000_000 });
  return r.status === "ok" ? r.stdout : "";
}

export function checkPredict(lessonId: string, blockId: string, answer: string): { correct: boolean; output: string; why?: Text } {
  const block = findBlock(lessonId, blockId, "predict");
  const output = generated.outputs[`${lessonId}/${blockId}`]?.out ?? outputOf(block.code, block.stdin ?? "");
  return { correct: sameOutput(answer, output), output: normalizeOutput(output), why: block.why };
}
