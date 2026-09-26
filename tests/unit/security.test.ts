import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { createClass } from "@/lib/services/classes";
import { createResearchProject, getResearchProjectFor } from "@/lib/labs/research/service";
import { createProject, getProjectFor } from "@/lib/labs/stem/service";
import { getAttemptFor, submitAttempt } from "@/lib/labs/critical/service";
import { CT_EXERCISES } from "@/lib/labs/critical/catalog";
import { createPortfolioItem, getPortfolioItem } from "@/lib/services/portfolio";
import { createCard, getCardFor } from "@/lib/labs/career/service";
import { createLesson } from "@/lib/services/lessons";
import { controlSession, createSessionFromLesson, getStudentSessionView, joinSession, requestSessionHint, submitResponse } from "@/lib/services/sessions";
import { quadraticEn } from "@/lib/ai/templates/quadratic-en";
import { demoModeEnabled, seedDemoEnabled, selfRegistrationEnabled } from "@/lib/config";

function expectStatus(fn: () => unknown, status: number) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    return;
  }
  throw new Error(`expected ApiError ${status}`);
}

async function expectStatusAsync(fn: () => Promise<unknown>, status: number) {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    return;
  }
  throw new Error(`expected ApiError ${status}`);
}

describe("student work is private to the student and their teachers", () => {
  let ana: CurrentUser;
  let luka: CurrentUser;
  let nino: CurrentUser;
  let davit: CurrentUser;
  let admin: CurrentUser;
  beforeEach(() => {
    freshDb();
    ana = makeUser("student", "ana");
    luka = makeUser("student", "luka");
    nino = makeUser("teacher", "nino");
    davit = makeUser("teacher", "davit");
    admin = makeUser("admin", "admin");
    createClass(nino, "11A", [ana.id]);
  });

  const works = () => {
    const research = createResearchProject(ana, { title: "Sleep", subject: "biology" });
    const stem = createProject(ana, null, "Filter");
    const exercise = CT_EXERCISES.find((e) => e.kind === "fallacy")!;
    const attempt = submitAttempt(ana, exercise.id, { items: {} });
    const portfolio = createPortfolioItem(ana, { title: "Talk", category: "presentation", date: "2026-09-01", description: "", link: "", evidence: "", skills: [], reflection: "" });
    const card = createCard(ana, { university: "Private plan" } as never);
    return [
      (u: CurrentUser) => getResearchProjectFor(research.id, u),
      (u: CurrentUser) => getProjectFor(stem.id, u),
      (u: CurrentUser) => getAttemptFor(attempt.id, u),
      (u: CurrentUser) => getPortfolioItem(portfolio.id, u),
      (u: CurrentUser) => getCardFor(card.id, u),
    ];
  };

  it("student A never reads student B's work", () => {
    for (const read of works()) {
      expect(read(ana)).toBeTruthy();
      expectStatus(() => read(luka), 404);
    }
  });

  it("teachers read the work of students they teach; administrators read all", () => {
    for (const read of works()) {
      expect(read(nino)).toBeTruthy();
      expectStatus(() => read(davit), 404);
      expect(read(admin)).toBeTruthy();
    }
  });
});

describe("answers stay on the server until the student has answered", () => {
  beforeEach(() => freshDb());

  it("hides the answer key before reveal and opens the solution only after a first attempt", async () => {
    const teacher = makeUser("teacher", "nino");
    const lesson = createLesson({
      teacherId: teacher.id,
      meta: { title: quadraticEn.title, subject: "mathematics", grade: 11, topic: quadraticEn.topic, durationMin: 45, objective: "", difficulty: "standard", language: "en" },
      content: quadraticEn.content,
      origin: "template",
    });
    // The second activity has an authored solution the student may open.
    const target = lesson.content.activities.find((a) => a.solution && a.allowSolution && a.hints.length === 4)!;
    const session = createSessionFromLesson({ user: teacher, lessonId: lesson.id, activityIds: [target.id] });
    const { participant } = joinSession({ code: session.joinCode, displayName: "Ana", user: null });
    controlSession(session.id, teacher, { type: "next" });

    const view = getStudentSessionView(session.id, participant);
    const json = JSON.stringify(view);
    expect(view.current).not.toHaveProperty("correctOptionIds");
    expect(view.current).not.toHaveProperty("acceptedAnswers");
    expect(view.current!.explanation).toBe("");
    for (const accepted of target.acceptedAnswers) expect(json).not.toContain(accepted);
    expect(json).not.toContain(target.solution);

    for (let level = 1; level <= 4; level++) {
      expect((await requestSessionHint({ sessionId: session.id, participant, activityId: view.current!.id })).level).toBe(level);
    }
    await expectStatusAsync(() => requestSessionHint({ sessionId: session.id, participant, activityId: view.current!.id }), 409);
    submitResponse({ sessionId: session.id, participant, activityId: view.current!.id, answer: { optionIds: [], text: "no idea" } });
    const solution = await requestSessionHint({ sessionId: session.id, participant, activityId: view.current!.id });
    expect(solution).toMatchObject({ level: 5, isSolution: true, text: target.solution });
  });
});

describe("demo sign-in, demo accounts and self-registration are opt-in for production builds", () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, DEMO_MODE: process.env.DEMO_MODE, SEED_DEMO: process.env.SEED_DEMO, SELF_REGISTRATION: process.env.SELF_REGISTRATION };
  const env = process.env as Record<string, string | undefined>;
  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete env[key];
      else env[key] = value;
    }
  });

  it("is off in production unless enabled, on in development", () => {
    delete env.DEMO_MODE;
    delete env.SEED_DEMO;
    delete env.SELF_REGISTRATION;
    env.NODE_ENV = "production";
    expect(demoModeEnabled()).toBe(false);
    expect(seedDemoEnabled()).toBe(false);
    expect(selfRegistrationEnabled()).toBe(false);
    env.DEMO_MODE = "true";
    expect(demoModeEnabled()).toBe(true);
    env.NODE_ENV = "development";
    delete env.DEMO_MODE;
    expect(demoModeEnabled()).toBe(true);
    env.DEMO_MODE = "false";
    expect(demoModeEnabled()).toBe(false);
  });
});
