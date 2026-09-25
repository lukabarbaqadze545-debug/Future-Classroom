import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { CT_EXERCISES, findExercise } from "@/lib/labs/critical/catalog";
import { absoluteWords, disrespectfulWords, gradeBuilder, gradeDecision, gradeHumility, updateIsReasonable } from "@/lib/labs/critical/grade";
import { criticalProgress, submitAttempt, toStudentExercise } from "@/lib/labs/critical/service";
import type { DecisionExercise, HumilityExercise, ItemExercise } from "@/lib/labs/critical/types";
import { FALLACIES } from "@/lib/labs/critical/types";
import { circuit, diceDistribution, leastSquares, projectile, ROBOT_LEVEL, runRobot, SPRING_SAMPLE } from "@/lib/labs/stem/physics";
import { checkItems, getRecord, parseNumber, saveExperimentRecord, submitChallenge, toStudentItems } from "@/lib/labs/stem/service";
import { findSimulation, SIMULATIONS } from "@/lib/labs/stem/simulations";
import { EXPERIMENTS } from "@/lib/labs/stem/experiments";
import { numericForms, toSessionActivities, bridgeItems } from "@/lib/labs/session-bridge";
import { gradeActivity } from "@/lib/domain/grading";
import { createAssignment, getAssignmentForStudent } from "@/lib/services/assignments";
import { ApiError } from "@/lib/http/errors";

describe("critical thinking content", () => {
  it("covers every fallacy at least twice and explains every item", () => {
    const tags = CT_EXERCISES.filter((e): e is ItemExercise => "items" in e && e.kind === "fallacy").flatMap((e) => e.items.map((i) => i.tag));
    for (const f of FALLACIES) expect(tags.filter((t) => t === f).length, f).toBeGreaterThanOrEqual(2);
    for (const e of CT_EXERCISES) {
      if (!("items" in e)) continue;
      for (const item of e.items) {
        expect(item.explanation.en && item.explanation.ka, `${e.id}/${item.id}`).toBeTruthy();
        if (item.type === "choice") expect(item.options.some((o) => o.id === item.correct), `${e.id}/${item.id}`).toBe(true);
      }
    }
  });

  it("never sends answers, explanations or evidence direction to the student", () => {
    for (const e of CT_EXERCISES) {
      const json = JSON.stringify(toStudentExercise(e));
      expect(json, e.id).not.toContain('"correct"');
      expect(json, e.id).not.toContain('"explanation"');
      expect(json, e.id).not.toContain('"role"');
      expect(json, e.id).not.toContain('"direction"');
      expect(json, e.id).not.toContain('"better"');
    }
  });
});

describe("critical thinking grading", () => {
  it("scores item sets deterministically", () => {
    const set = findExercise("ct-fallacies-1") as ItemExercise;
    const all = Object.fromEntries(set.items.map((i) => [i.id, i.type === "choice" ? i.correct : ""]));
    const one = submitAttemptLike(set, all);
    expect(one.score).toBe(10);
    const wrong = { ...all, [set.items[0].id]: "straw_man" === (set.items[0] as { correct: string }).correct ? "red_herring" : "straw_man" };
    expect(submitAttemptLike(set, wrong).score).toBe(9);
  });

  it("gives partial credit on sentence tagging", () => {
    const e = findExercise("ct-claims-1") as ItemExercise;
    const tag = e.items.find((i) => i.type === "tag")!;
    if (tag.type !== "tag") throw new Error();
    const answers = Object.fromEntries(tag.segments.map((s, i) => [s.id, i === 0 ? "claim" : s.role]));
    const result = submitAttemptLike(e, { [tag.id]: answers });
    const fb = result.items!.find((i) => i.id === tag.id)!;
    expect(fb.points).toBe(tag.segments.length - 1);
    expect(fb.correct).toBe(false);
  });

  it("checks argument structure and flags absolute or insulting language", () => {
    expect(absoluteWords("Phones are always bad and everyone agrees")).toEqual(expect.arrayContaining(["always", "everyone"]));
    expect(absoluteWords("ტელეფონი ყოველთვის ცუდია")).toContain("ყოველთვის");
    expect(absoluteWords("Most students use them sometimes")).toEqual([]);
    expect(disrespectfulWords("That idea is stupid")).toContain("stupid");
    const strong = gradeBuilder({
      questionId: "phones",
      claim: "Students should be allowed to use phones during breaks with clear rules.",
      reasons: [
        { text: "Breaks are free time for students to rest", evidence: "A survey of 28 students in our class", evidenceType: "statistic" },
        { text: "Phones help families contact students", evidence: "The school office reports many pick-up changes by message", evidenceType: "example" },
      ],
      counter: "Phones may reduce face-to-face contact during breaks.",
      rebuttal: "A clear rule protects lessons while keeping breaks free.",
      conclusion: "A clear break-time rule is fairer than a complete ban in our school.",
    });
    expect(strong.score).toBe(strong.max);
    const weak = gradeBuilder({ questionId: "phones", claim: "Phones are always bad", reasons: [], counter: "", rebuttal: "", conclusion: "" });
    expect(weak.checks!.find((c) => c.id === "no_absolutes")!.met).toBe(false);
    expect(weak.score).toBeLessThan(3);
  });

  it("rewards updating confidence in the direction of the evidence", () => {
    expect(updateIsReasonable(70, 30, "down")).toBe(true);
    expect(updateIsReasonable(70, 72, "down")).toBe(false);
    expect(updateIsReasonable(40, 80, "up")).toBe(true);
    expect(updateIsReasonable(60, 62, "none")).toBe(true);
    expect(updateIsReasonable(60, 90, "none")).toBe(false);
    const ex = findExercise("ct-humility-1") as HumilityExercise;
    const ratings = Object.fromEntries(ex.scenarios.map((s) => [s.id, { before: 50, after: s.direction === "up" ? 80 : s.direction === "down" ? 20 : 50 }]));
    const result = gradeHumility(ex, { ratings, belief: "I believe homework should be shorter on weekends", changeMind: "A study showing weekend homework improves long-term memory", opposing: "Practice spread over days helps people remember more" });
    expect(result.score).toBe(result.max);
  });

  it("computes decision-matrix totals and spots close calls", () => {
    const ex = findExercise("ct-decision-1") as DecisionExercise;
    const result = gradeDecision(ex, {
      options: ["A", "B"],
      criteria: [
        { name: "Cost", weight: 5 },
        { name: "Learning", weight: 3 },
        { name: "Time", weight: 1 },
      ],
      scores: [
        [5, 2, 3],
        [2, 5, 5],
      ],
      reflection: "The result matches what I expected because cost matters most to our class.",
    });
    expect(result.decision!.totals.map((t) => t.total)).toEqual([34, 30]);
    expect(result.decision!.winner).toBe("A");
    expect(result.decision!.close).toBe(false);
    expect(result.score).toBe(result.max);
  });
});

function submitAttemptLike(exercise: ItemExercise, items: Record<string, unknown>) {
  freshDb();
  const student = makeUser("student", `s${Math.random().toString(36).slice(2, 8)}`);
  return submitAttempt(student, exercise.id, { items }).result;
}

describe("critical thinking progress and assignments", () => {
  beforeEach(() => freshDb());
  it("records attempts, updates the fallacy map and completes assignments", () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "ana");
    const assignment = createAssignment(teacher, { kind: "critical", refId: "ct-fallacies-2", title: "Fallacies", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    const set = findExercise("ct-fallacies-2") as ItemExercise;
    const attempt = submitAttempt(student, set.id, { items: Object.fromEntries(set.items.map((i) => [i.id, i.type === "choice" ? i.correct : ""])) });
    expect(attempt.score).toBe(10);
    const progress = criticalProgress(student.id);
    expect(progress.completed).toBe(1);
    expect(progress.fallacies.every((f) => f.total === 1 && f.correct === 1)).toBe(true);
    const recipient = getAssignmentForStudent(assignment.id, student.id).recipient;
    expect(recipient.status).toBe("completed");
    expect(recipient.score).toBe(10);
  });
});

describe("STEM models", () => {
  it("matches textbook projectile results", () => {
    const shot = projectile(20, 45, 0, 9.81);
    expect(shot.range).toBeCloseTo((20 * 20) / 9.81, 5);
    expect(shot.maxHeight).toBeCloseTo((20 * 20 * 0.5) / (2 * 9.81), 5);
    expect(projectile(20, 30).range).toBeCloseTo(projectile(20, 60).range, 5);
  });
  it("computes series and parallel circuits", () => {
    expect(circuit(6, 10, 20, "series")).toMatchObject({ total: 30, current: 0.2, v1: 2, v2: 4 });
    expect(circuit(6, 10, 10, "parallel").total).toBeCloseTo(5, 10);
  });
  it("has correct dice distributions", () => {
    const two = diceDistribution(2);
    expect(two.reduce((s, x) => s + x.p, 0)).toBeCloseTo(1, 10);
    expect(two.find((x) => x.sum === 7)!.p).toBeCloseTo(1 / 6, 10);
  });
  it("fits the spring data and the robot level is solvable within the limit", () => {
    const fit = leastSquares(SPRING_SAMPLE);
    expect(fit.slope).toBeCloseTo(0.0401, 3);
    expect(fit.r2).toBeGreaterThan(0.99);
    const run = runRobot(ROBOT_LEVEL, [
      { command: "forward", times: 2 },
      { command: "right", times: 1 },
      { command: "forward", times: 5 },
      { command: "left", times: 1 },
      { command: "forward", times: 3 },
    ]);
    expect(run.reached).toBe(true);
    expect(runRobot(ROBOT_LEVEL, [{ command: "forward", times: 4 }]).crashed).toBe(true);
  });
});

describe("STEM checking", () => {
  beforeEach(() => freshDb());
  it("parses numbers written the Georgian or English way", () => {
    expect(parseNumber("0,2")).toBe(0.2);
    expect(parseNumber("1/6")).toBeCloseTo(1 / 6);
    expect(parseNumber("0,2 ა")).toBe(0.2);
    expect(parseNumber("12 m/s")).toBe(12);
    expect(parseNumber("abc")).toBeNull();
  });
  it("checks numeric tolerance, choices and simulation tasks on the server", () => {
    const sim = findSimulation("projectile")!;
    const ok = checkItems(sim.items, { "p-angle": "45", "p-double": "x4", "p-target": { angle: 45, speed: 19.8, gravity: 9.81, height: 0 } });
    expect(ok.score).toBe(3);
    const moon = checkItems(sim.items, { "p-target": { angle: 45, speed: 8.05, gravity: 1.62, height: 0 } });
    expect(moon.items.find((i) => i.id === "p-target")!.correct).toBe(false);
    const circuitSim = findSimulation("circuit")!;
    const res = checkItems(circuitSim.items, { "c-ohm": "0,2", "c-parallel": "5", "c-target": { voltage: 6, r1: 10, r2: 14, mode: "series" } });
    expect(res.score).toBe(3);
  });
  it("never sends answers to the student", () => {
    for (const sim of SIMULATIONS) {
      const json = JSON.stringify(toStudentItems(sim.items));
      expect(json).not.toContain('"correct"');
      expect(json).not.toContain('"answer"');
      expect(json).not.toContain('"explanation"');
    }
  });
  it("keeps the best challenge score and completes assignments", () => {
    const teacher = makeUser("teacher", "davit");
    const student = makeUser("student", "giorgi");
    const assignment = createAssignment(teacher, { kind: "simulation", refId: "probability", title: "Dice", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    submitChallenge(student, "simulation", "probability", { "pr-seven": "0.167", "pr-gambler": "same", "pr-two-sixes": "1/36" });
    const second = submitChallenge(student, "simulation", "probability", { "pr-seven": "0.5" });
    expect(second.best).toEqual({ score: 3, max: 3 });
    expect(getAssignmentForStudent(assignment.id, student.id).recipient.status).toBe("completed");
  });
  it("saves experiment drafts and submissions", () => {
    const student = makeUser("student", "luka");
    saveExperimentRecord(student, "pendulum", { prediction: "Longer is slower" }, false);
    expect(getRecord(student.id, "experiment", "pendulum")!.status).toBe("draft");
    expect(() => saveExperimentRecord(student, "pendulum", { prediction: "x" }, true)).toThrow(ApiError);
    saveExperimentRecord(student, "pendulum", { conclusion: "Period grows with length." }, true);
    expect(getRecord(student.id, "experiment", "pendulum")!.status).toBe("submitted");
    expect(EXPERIMENTS.every((e) => e.safety.length > 0 && e.materials.length > 0)).toBe(true);
  });
});

describe("session bridge", () => {
  it("turns fallacy items into gradable multiple-choice activities with letter options", () => {
    const activities = toSessionActivities("critical:ct-fallacies-1", "en");
    expect(activities).toHaveLength(10);
    const first = activities[0];
    expect(first.options.map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
    expect(gradeActivity(first, { optionIds: first.correctOptionIds, text: "" })).toBe(true);
    const wrong = first.options.find((o) => !first.correctOptionIds.includes(o.id))!;
    expect(gradeActivity(first, { optionIds: [wrong.id], text: "" })).toBe(false);
  });
  it("accepts numeric answers written in different ways", () => {
    expect(numericForms(0.2)).toEqual(expect.arrayContaining(["0.2", "0,2"]));
    expect(numericForms(1 / 6)).toEqual(expect.arrayContaining(["0.17", "0.167", "1/6"]));
    const [ohm] = toSessionActivities("simulation:circuit", "ka");
    expect(gradeActivity(ohm, { optionIds: [], text: "0,2" })).toBe(true);
  });
  it("uses the first sample for code problems and skips what cannot be shown", () => {
    const [trace] = toSessionActivities("programming:l1-sum-to-n", "en");
    expect(trace.type).toBe("short_answer");
    expect(gradeActivity(trace, { optionIds: [], text: "15" })).toBe(true);
    expect(toSessionActivities("critical:ct-builder-1", "en")).toEqual([]);
    expect(bridgeItems("en").length).toBeGreaterThan(40);
  });
});
