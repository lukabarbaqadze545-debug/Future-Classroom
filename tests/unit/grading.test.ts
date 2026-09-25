import { describe, expect, it } from "vitest";
import { extractNumbers, gradeActivity, gradeQuizQuestion, matchesAcceptedAnswer, normalizeText } from "@/lib/domain/grading";
import { exercise, multipleChoice, discussion, quiz } from "@/lib/ai/templates/builders";

describe("normalizeText", () => {
  it("normalises case, dashes, quotes and trailing punctuation", () => {
    expect(normalizeText("  Steep   Slope. ")).toBe("steep slope");
    expect(normalizeText("x − 2")).toBe("x - 2");
    expect(normalizeText("“newton”")).toBe("newton");
  });
});

describe("extractNumbers", () => {
  it("reads fractions and negative numbers", () => {
    expect(extractNumbers("1/2, -2")).toEqual([0.5, -2]);
  });
  it("ignores subscripted variable names", () => {
    expect(extractNumbers("x1 = 2, x2 = 3")).toEqual([2, 3]);
    expect(extractNumbers("x₁=2; x₂=3")).toEqual([2, 3]);
  });
  it("treats a comma as a separator or as a decimal mark on request", () => {
    expect(extractNumbers("2,3")).toEqual([2, 3]);
    expect(extractNumbers("2,5", true)).toEqual([2.5]);
  });
});

describe("matchesAcceptedAnswer", () => {
  const accepted = ["2, 3"];
  it.each(["2, 3", "3, 2", "x = 2, 3", "3 and 2", "x = 2 or x = 3", "{2; 3}", "2 და 3", "x1 = 2, x2 = 3", "2,3"])("accepts %s", (answer) => {
    expect(matchesAcceptedAnswer(answer, accepted)).toBe(true);
  });
  it.each(["-2, -3", "2", "2, 3, 4", "6, 1", ""])("rejects %s", (answer) => {
    expect(matchesAcceptedAnswer(answer, accepted)).toBe(false);
  });
  it("matches words case-insensitively", () => {
    expect(matchesAcceptedAnswer("Decomposers", ["decomposers"])).toBe(true);
    expect(matchesAcceptedAnswer("producers", ["decomposers"])).toBe(false);
  });
  it("matches fractions against decimals", () => {
    expect(matchesAcceptedAnswer("0.5, -2", ["1/2, -2"])).toBe(true);
    expect(matchesAcceptedAnswer("-2 and 1/2", ["1/2, -2"])).toBe(true);
  });
});

describe("gradeActivity", () => {
  it("grades multiple choice by exact option set", () => {
    const a = multipleChoice("a1", "Pick", ["x", "y", "z"], 1);
    expect(gradeActivity(a, { optionIds: ["b"], text: "" })).toBe(true);
    expect(gradeActivity(a, { optionIds: ["a"], text: "" })).toBe(false);
    expect(gradeActivity(a, { optionIds: ["a", "b"], text: "" })).toBe(false);
  });
  it("grades exercises against accepted answers", () => {
    const a = exercise("a2", "Solve", ["2, 3"]);
    expect(gradeActivity(a, { optionIds: [], text: "3 and 2" })).toBe(true);
  });
  it("returns null for open activities", () => {
    expect(gradeActivity(discussion("d", "Discuss"), { optionIds: [], text: "anything" })).toBeNull();
    expect(gradeActivity(exercise("e", "Open problem", []), { optionIds: [], text: "x" })).toBeNull();
  });
});

describe("gradeQuizQuestion", () => {
  it("grades numerical answers with tolerance and decimal commas", () => {
    const q = quiz.numerical("q", "Value?", 2.5, 0.01);
    expect(gradeQuizQuestion(q, { optionIds: [], text: "2.5" })).toBe(true);
    expect(gradeQuizQuestion(q, { optionIds: [], text: "2,5" })).toBe(true);
    expect(gradeQuizQuestion(q, { optionIds: [], text: "2.6" })).toBe(false);
    expect(gradeQuizQuestion(q, { optionIds: [], text: "2.5 or 3" })).toBe(false);
  });
  it("grades true/false", () => {
    const q = quiz.trueFalse("q", "Statement", false);
    expect(gradeQuizQuestion(q, { optionIds: ["false"], text: "" })).toBe(true);
    expect(gradeQuizQuestion(q, { optionIds: ["true"], text: "" })).toBe(false);
  });
});
