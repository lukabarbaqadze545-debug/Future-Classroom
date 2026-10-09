import { describe, expect, it } from "vitest";
import { runCpp } from "@/lib/cpp";
import { COURSES, generated } from "@/lib/courses/data";
import { judge, sameOutput } from "@/lib/courses/judge";
import { blockSig, exerciseSig } from "@/lib/courses/signature";
import { checkExercise, checkPredict, checkQuiz, revealSolution, studentCourse, studentLesson } from "@/lib/courses/service";
import { AVOIDED } from "@/lib/i18n/terminology";
import type { Block, Lesson, Text } from "@/lib/courses/types";

/**
 * The course sources are checked like code: every example prints what the lesson says, every reference
 * solution passes its own tests in the site's runner (the expected outputs were made by the real g++,
 * scripts/build-course.ts), the tests catch the listed mistakes, and nothing that gives an answer
 * away reaches the browser.
 */
const course = COURSES.cpp;
const lessons: Lesson[] = course.modules.flatMap((m) => m.lessons);
const exercises = lessons.flatMap((l) => l.exercises.map((e) => ({ lesson: l, e })));
const programs = lessons.flatMap((l) => l.blocks.filter((b): b is Extract<Block, { k: "code" | "predict" }> => (b.k === "code" && !b.readonly) || b.k === "predict").map((b) => ({ lesson: l, b })));

const texts = (l: Lesson): Text[] => {
  const out: Text[] = [l.title, l.tagline, ...l.goals, ...l.mistakes, ...l.summary];
  for (const b of l.blocks) {
    if (b.k === "text" || b.k === "heading" || b.k === "callout") out.push(b.text);
    if (b.k === "callout" && b.title) out.push(b.title);
    if (b.k === "list") out.push(...b.items);
    if (b.k === "quiz") out.push(b.question, ...b.options, b.why);
    if (b.k === "predict") {
      if (b.ask) out.push(b.ask);
      if (b.why) out.push(b.why);
    }
    if (b.k === "code" && b.caption) out.push(b.caption);
    if (b.k === "table") out.push(...b.head);
  }
  for (const e of l.exercises) out.push(e.title, e.statement, ...e.hints, ...(e.inputFormat ? [e.inputFormat] : []), ...(e.outputFormat ? [e.outputFormat] : []), ...(e.explanation ? [e.explanation] : []));
  return out;
};

describe("course structure", () => {
  it("has modules numbered from 1 and lessons with unique ids", () => {
    expect(course.modules.map((m) => m.number)).toEqual(course.modules.map((_, i) => i + 1));
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const exIds = exercises.map((x) => x.e.id);
    expect(new Set(exIds).size).toBe(exIds.length);
  });

  it("gives every lesson goals, a summary and tasks (and three hints per task)", () => {
    for (const l of lessons) {
      expect(l.goals.length, l.id).toBeGreaterThan(0);
      expect(l.summary.length, l.id).toBeGreaterThan(0);
      expect(l.exercises.length, l.id).toBeGreaterThan(0);
      for (const e of l.exercises) {
        expect(e.hints.length).toBe(3);
        expect(e.samples.length, e.id).toBeGreaterThan(0);
        expect(e.tests.length, e.id).toBeGreaterThan(0);
      }
    }
  });

  it("starts every module with lessons and ends it with a checkpoint when it is complete", () => {
    for (const m of course.modules) {
      expect(m.lessons.length, m.id).toBeGreaterThan(0);
      expect(m.outcomes.length, m.id).toBeGreaterThan(0);
    }
  });

  it("uses valid quiz answers", () => {
    for (const l of lessons) {
      for (const b of l.blocks) {
        if (b.k !== "quiz") continue;
        expect(b.options.length, `${l.id}/${b.id}`).toBeGreaterThanOrEqual(2);
        expect(b.answer, `${l.id}/${b.id}`).toBeGreaterThanOrEqual(0);
        expect(b.answer, `${l.id}/${b.id}`).toBeLessThan(b.options.length);
      }
    }
  });
});

describe("course programs", () => {
  it("has current generated data (run scripts/build-course.ts after changing a lesson)", () => {
    for (const { e } of exercises) {
      const g = generated.exercises[e.id];
      expect(g, `${e.id}: no generated tests`).toBeDefined();
      expect(g.sig, `${e.id} changed after its tests were generated`).toBe(exerciseSig(e));
    }
    for (const { lesson, b } of programs) {
      const g = generated.outputs[`${lesson.id}/${b.id}`];
      expect(g, `${lesson.id}/${b.id}: no generated output`).toBeDefined();
      expect(g.sig, `${lesson.id}/${b.id} changed after its output was generated`).toBe(blockSig(b));
    }
  });

  for (const { lesson, b } of programs) {
    if (b.k === "code" && b.error) {
      it(`${lesson.id}/${b.id} fails with ${b.error}, as the lesson says`, () => {
        const r = runCpp(b.code, { stdin: b.stdin ?? "" });
        expect(r.status).not.toBe("ok");
        expect(r.diagnostic?.code).toBe(b.error);
      });
      continue;
    }
    it(`${lesson.id}/${b.id} prints what the lesson says`, () => {
      const out = generated.outputs[`${lesson.id}/${b.id}`].out;
      const r = runCpp(b.code, { stdin: b.stdin ?? "", stepLimit: 100_000_000 });
      expect(r.status, `${r.diagnostic?.code}: ${r.diagnostic?.message} (line ${r.diagnostic?.line})`).toBe("ok");
      expect(r.stdout).toBe(out);
      if (b.k === "code" && b.out !== undefined) expect(sameOutput(out, b.out)).toBe(true);
    });
  }

  for (const { e } of exercises) {
    it(`${e.id}: the reference solution passes, the starter does not, the mistakes are caught`, () => {
      const g = generated.exercises[e.id];
      const cases = [...g.samples, ...g.tests];
      const limits = { timeMs: 4000, totalSteps: 1_000_000_000 };
      const ok = judge({ code: e.solution, tests: cases, samples: g.samples.length, compare: e.compare, limits });
      expect(ok.verdict, JSON.stringify(ok.diagnostic ?? ok.tests.find((t) => t.status !== "ok"))).toBe("accepted");
      if (e.kind === "write") expect(judge({ code: e.starter, tests: cases, samples: g.samples.length, compare: e.compare }).verdict).not.toBe("accepted");
      for (const w of e.wrong ?? []) {
        const r = judge({ code: w.code, tests: cases, samples: g.samples.length, compare: e.compare });
        expect(r.verdict, `accepted a wrong solution: ${w.why}`).not.toBe("accepted");
        expect(r.verdict, `a wrong solution does not compile: ${w.why}`).not.toBe("compile_error");
      }
    });
  }
});

describe("course text", () => {
  it("never mixes Georgian and Latin letters inside one word (a typing slip)", () => {
    const bad: string[] = [];
    for (const l of lessons) {
      for (const t of texts(l)) {
        // Hyphenated suffixes (main-ის) are separate words; code in backticks is skipped.
        const plain = t.ka.replace(/`[^`]*`/g, " ");
        for (const word of plain.split(/[\s\-–—/(),.:;!?„“"«»…]+/)) {
          if (/[Ⴀ-ჿ]/.test(word) && /[A-Za-zÀ-ž]/.test(word)) bad.push(`${l.id}: ${word}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("avoids the wordings the terminology rules out", () => {
    const hits: string[] = [];
    for (const l of lessons) {
      for (const t of texts(l)) {
        const lower = t.ka.toLowerCase();
        for (const a of AVOIDED) if (lower.includes(a.wording.toLowerCase())) hits.push(`${l.id}: „${a.wording}“ (use ${a.use})`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("writes decimal numbers with a comma in Georgian prose (code is exempt)", () => {
    const hits: string[] = [];
    for (const l of lessons) {
      for (const t of texts(l)) {
        const plain = t.ka.replace(/`[^`]*`/g, " ").replace(/\*\*/g, "");
        const m = plain.match(/(^|[^\w.])\d+\.\d+(?!\w)/g);
        if (m) hits.push(`${l.id}: ${m.join(" ")}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("what the browser gets", () => {
  it("leaves out answers, solutions, later hints and hidden tests", () => {
    const secrets: string[] = [];
    for (const l of lessons) {
      for (const b of l.blocks) {
        if (b.k === "quiz") secrets.push(b.why.ka);
        if (b.k === "predict" && b.why) secrets.push(b.why.ka);
      }
      for (const e of l.exercises) {
        secrets.push(e.solution, e.hints[0].ka, e.hints[1].ka, e.hints[2].ka);
        if (e.explanation) secrets.push(e.explanation.ka);
        for (const t of generated.exercises[e.id].tests) if (t.input.length > 12) secrets.push(t.input);
      }
    }
    const shipped = JSON.stringify([studentCourse("cpp"), ...lessons.map((l) => studentLesson(l.id))]);
    for (const s of secrets) expect(shipped.includes(JSON.stringify(s).slice(1, -1)), `leaks: ${s.slice(0, 60)}`).toBe(false);
    expect(shipped).not.toContain('"answer"');
  });
});

describe("checking", () => {
  const first = exercises[0];

  it("accepts the reference solution and reports a wrong answer with the first failing test", () => {
    expect(checkExercise(first.e.id, first.e.solution).verdict).toBe("accepted");
    const wrong = checkExercise(first.e.id, "#include <iostream>\nint main() { std::cout << \"nope\\n\"; }");
    expect(wrong.verdict).toBe("wrong_answer");
    expect(wrong.tests[0].got).toBe("nope");
  });

  it("explains a program that does not compile", () => {
    const r = checkExercise(first.e.id, "int main() { cout << 1 }");
    expect(r.verdict).toBe("compile_error");
    expect(r.diagnostic?.code).toBeTruthy();
  });

  it("stops a program that never ends", () => {
    const r = checkExercise(first.e.id, "int main() { while (true) {} }");
    expect(r.verdict).toBe("time_limit");
  });

  it("opens the solution only for a program that passes", () => {
    expect(() => revealSolution(first.e.id, "int main() {}")).toThrow();
    expect(revealSolution(first.e.id, first.e.solution).solution).toBe(first.e.solution);
  });

  it("checks quiz and predict answers on the server", () => {
    for (const l of lessons) {
      for (const b of l.blocks) {
        if (b.k === "quiz") {
          expect(checkQuiz(l.id, b.id, b.answer).correct).toBe(true);
          expect(checkQuiz(l.id, b.id, (b.answer + 1) % b.options.length).correct).toBe(false);
        }
        if (b.k === "predict") {
          const out = generated.outputs[`${l.id}/${b.id}`].out;
          expect(checkPredict(l.id, b.id, out).correct).toBe(true);
          expect(checkPredict(l.id, b.id, `${out}x`).correct).toBe(false);
        }
      }
    }
  });
});
