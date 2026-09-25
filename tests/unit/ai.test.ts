import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ZodType } from "zod";
import { freshDb } from "../helpers";
import { setAIProviderForTests, getAIStatus } from "@/lib/ai";
import { AIGenerationError, type AIProvider } from "@/lib/ai/provider";
import { getHint, hintLadderInfo } from "@/lib/ai/hint-service";
import { generateLesson } from "@/lib/ai/lesson-generator";
import { generateQuiz } from "@/lib/ai/quiz-generator";
import { exercise, discussion, poll } from "@/lib/ai/templates/builders";
import { lessonContentSchema, lessonInputSchema } from "@/lib/domain/schemas";
import { CURATED_LESSONS } from "@/lib/ai/templates";

function fakeProvider(respond: (prompt: string) => unknown): AIProvider & { calls: number } {
  const provider = {
    name: "fake",
    model: "fake-model",
    calls: 0,
    async generateObject<T>({ prompt, schema }: { prompt: string; schema: ZodType<T> }) {
      provider.calls++;
      return schema.parse(respond(prompt));
    },
    async generateText() {
      provider.calls++;
      return "fake";
    },
  };
  return provider;
}

describe("hint service", () => {
  beforeEach(() => freshDb());

  it("uses teacher hints in order and keeps the solution for the last level", async () => {
    const a = exercise("a", "Solve x + 1 = 3", ["2"], { hints: ["h1", "h2", "h3", "h4"], solution: "x = 2" });
    const levels = await Promise.all([1, 2, 3, 4, 5].map((level) => getHint({ activity: a, level })));
    expect(levels.map((h) => h.text)).toEqual(["h1", "h2", "h3", "h4", "x = 2"]);
    expect(levels.map((h) => h.kind)).toEqual(["concept", "specific", "next_step", "explanation", "solution"]);
    expect(levels[4].isSolution).toBe(true);
  });

  it("never offers a solution when the teacher disallows it", async () => {
    const a = exercise("a", "Solve", ["2"], { hints: ["h1"], solution: "x = 2", allowSolution: false });
    expect(hintLadderInfo(a).maxLevel).toBe(4);
    const hint = await getHint({ activity: a, level: 5 });
    expect(hint.isSolution).toBe(false);
    expect(hint.text).not.toBe("x = 2");
  });

  it("falls back to clearly labelled generic strategies when AI is offline", async () => {
    const a = exercise("a", "Solve", ["2"]);
    const hint = await getHint({ activity: a, level: 2 });
    expect(hint).toMatchObject({ source: "generic", text: null, genericKey: "solve_2" });
    expect(hintLadderInfo(a).maxLevel).toBe(4); // no solution without text or AI
    expect((await getHint({ activity: discussion("d", "Why?"), level: 1 })).genericKey).toBe("reflect_1");
    expect(hintLadderInfo(poll("p", "Mood?", ["a", "b"])).maxLevel).toBe(0);
  });

  it("generates AI hints once per activity and level, then serves them from cache", async () => {
    const provider = fakeProvider(() => ({ hint: "Think about which numbers multiply to 6." }));
    setAIProviderForTests(provider);
    const a = exercise("a", "Solve x² − 5x + 6 = 0", ["2, 3"]);
    const results = await Promise.all(Array.from({ length: 3 }, () => getHint({ activity: a, level: 1 })));
    await getHint({ activity: a, level: 1 });
    expect(results[0]).toMatchObject({ source: "ai", text: "Think about which numbers multiply to 6." });
    expect(provider.calls).toBeLessThanOrEqual(3);
    const before = provider.calls;
    await getHint({ activity: a, level: 1 });
    expect(provider.calls).toBe(before);
    expect(hintLadderInfo(a).maxLevel).toBe(5);
  });

  it("reports AI failures in the status and still returns a hint", async () => {
    setAIProviderForTests({
      name: "broken",
      model: "m",
      generateObject: vi.fn().mockRejectedValue(new AIGenerationError("down", "network")),
      generateText: vi.fn(),
    });
    const hint = await getHint({ activity: exercise("a", "Solve", ["1"]), level: 1 });
    expect(hint.source).toBe("generic");
    expect(getAIStatus().mode).toBe("degraded");
  });
});

describe("lesson generation", () => {
  beforeEach(() => freshDb());
  const input = (topic: string, language: "en" | "ka" = "en", subject: "mathematics" | "history" = "mathematics") =>
    lessonInputSchema.parse({ subject, grade: 11, topic, language });

  it("uses the built-in lesson offline, in the requested language", async () => {
    const en = await generateLesson(input("Quadratic equations"));
    expect(en.source).toEqual({ kind: "template", reason: "ai_offline", curated: true });
    expect(en.content.activities.length).toBeGreaterThan(4);
    const ka = await generateLesson(input("კვადრატული განტოლებები", "ka"));
    expect(ka.meta.title).toBe("კვადრატული განტოლებები");
  });

  it("returns an outline (not invented content) for unknown topics offline", async () => {
    const outline = await generateLesson(input("The Silk Road", "en", "history"));
    expect(outline.source).toEqual({ kind: "template", reason: "ai_offline", curated: false });
    expect(outline.content.teacherNotes).toMatch(/without AI/);
  });

  it("maps AI output onto validated lesson content", async () => {
    setAIProviderForTests(
      fakeProvider(() => ({
        title: "Linear functions",
        objectives: ["Understand slope"],
        sections: [
          { kind: "explanation", title: "Slope", body: "Rise over run", minutes: 10, graphExpression: "2x + 1", graphXMin: -5, graphXMax: 5, graphCaption: "y = 2x + 1" },
          { kind: "summary", title: "Summary", body: "Done", minutes: 5, graphExpression: "import os", graphXMin: 0, graphXMax: 1, graphCaption: "" },
        ],
        activities: [
          { type: "multiple_choice", title: "Slope", prompt: "Slope of y = 2x + 1?", options: ["1", "2", "3"], correctOptionIndexes: [1, 9], acceptedAnswers: [], hints: ["a", "b", "c", "d"], solution: "2", explanation: "m = 2" },
          { type: "poll", title: "Mood", prompt: "Ready?", options: ["Yes", "No"], correctOptionIndexes: [0], acceptedAnswers: ["x"], hints: ["x"], solution: "x", explanation: "" },
        ],
        discussionQuestions: ["Why?"],
        assessment: ["Check"],
        homework: ["Do"],
        teacherNotes: "Verify",
      })),
    );
    const result = await generateLesson(input("Linear functions"));
    expect(result.source).toEqual({ kind: "ai", model: "fake-model" });
    expect(result.content.sections[0].visual?.expression).toBe("2x + 1");
    expect(result.content.sections[1].visual).toBeNull(); // unsafe expression dropped
    expect(result.content.activities[0].correctOptionIds).toEqual(["b"]); // out-of-range index ignored
    expect(result.content.activities[1]).toMatchObject({ correctOptionIds: [], hints: [], solution: "", allowSolution: false });
    expect(result.content.sources).toEqual([]); // AI never fills in sources
  });

  it("falls back to a template when the AI call fails", async () => {
    setAIProviderForTests({ name: "x", model: "x", generateObject: vi.fn().mockRejectedValue(new Error("boom")), generateText: vi.fn() });
    const result = await generateLesson(input("Quadratic equations"));
    expect(result.source).toMatchObject({ kind: "template", reason: "ai_failed" });
  });

  it("builds a quiz offline from curated questions", async () => {
    const lesson = CURATED_LESSONS.find((l) => l.key === "newton-en")!;
    const quiz = await generateQuiz(
      { title: lesson.title, subject: lesson.subject, grade: lesson.grade, topic: lesson.topic, durationMin: 45, objective: "", difficulty: "standard", language: "en" },
      lesson.content,
    );
    expect(quiz.draft.questions.length).toBe(lesson.quiz.questions.length);
    expect(quiz.source).toMatchObject({ kind: "template" });
  });
});

describe("curated content", () => {
  it.each(CURATED_LESSONS.map((l) => [l.key, l] as const))("%s validates and has hint-first activities", (_key, lesson) => {
    const content = lessonContentSchema.parse(lesson.content);
    for (const activity of content.activities) {
      if (activity.type === "multiple_choice") expect(activity.correctOptionIds.length).toBeGreaterThan(0);
      if (activity.type === "exercise") expect(activity.acceptedAnswers.length).toBeGreaterThan(0);
      if (activity.type === "multiple_choice" || activity.type === "exercise") {
        expect(activity.hints.length).toBeGreaterThanOrEqual(2);
        // Early hints must not give the answer away.
        for (const answer of activity.acceptedAnswers) expect(activity.hints[0]).not.toContain(answer);
      }
    }
  });
});
