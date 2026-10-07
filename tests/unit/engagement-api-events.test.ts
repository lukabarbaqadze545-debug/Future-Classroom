import { describe, expect, it } from "vitest";
import { eventFromApiCall } from "@/lib/engagement/api-events";

describe("which calls count as learning", () => {
  it("rewards a correct practice answer, not a wrong one", () => {
    expect(eventFromApiCall("/api/practice/check", "POST", { isCorrect: true })).toEqual({ kind: "practice" });
    expect(eventFromApiCall("/api/practice/check", "POST", { isCorrect: false })).toBeNull();
    expect(eventFromApiCall("/api/practice/check", "POST", { isCorrect: null })).toBeNull();
  });

  it("reads the score of a finished quiz", () => {
    expect(eventFromApiCall("/api/quizzes/q-1/attempts", "POST", { attemptId: "a", result: { score: 3, maxScore: 4 } })).toEqual({ kind: "quiz", score: 3, max: 4 });
    expect(eventFromApiCall("/api/quizzes/q-1/attempts", "POST", { attemptId: "a" })).toBeNull();
    expect(eventFromApiCall("/api/quizzes/q-1/status", "POST", {})).toBeNull();
  });

  it("notices live class answers and joins", () => {
    expect(eventFromApiCall("/api/sessions/s-1/respond", "POST", {})).toEqual({ kind: "live" });
    expect(eventFromApiCall("/api/sessions/join", "POST", { sessionId: "s-1" })).toEqual({ kind: "join" });
    expect(eventFromApiCall("/api/sessions/s-1/control", "POST", {})).toBeNull();
  });

  it("notices work in a laboratory but not reading", () => {
    expect(eventFromApiCall("/api/labs/stem/experiments/e-1/run", "POST", {})).toEqual({ kind: "lab", lab: "stem" });
    expect(eventFromApiCall("/api/labs/programming/submit", "POST", {})).toEqual({ kind: "lab", lab: "programming" });
    expect(eventFromApiCall("/api/labs/research/projects/p-1?x=1", "PUT", {})).toEqual({ kind: "lab", lab: "research" });
    expect(eventFromApiCall("/api/labs/critical/exercises/1", "GET", {})).toBeNull();
    expect(eventFromApiCall("/api/labs/other/thing", "POST", {})).toBeNull();
  });

  it("ignores everything else, including the daily challenge itself", () => {
    expect(eventFromApiCall("/api/daily/check", "POST", { isCorrect: true })).toBeNull();
    expect(eventFromApiCall("/api/materials", "POST", {})).toBeNull();
    expect(eventFromApiCall("/api/practice/check", "POST", undefined)).toBeNull();
  });
});
