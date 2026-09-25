import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { createLesson } from "@/lib/services/lessons";
import {
  controlSession,
  createSessionFromLesson,
  getSessionSummary,
  getStudentSessionView,
  getTeacherSessionView,
  joinSession,
  requestSessionHint,
  submitResponse,
} from "@/lib/services/sessions";
import { getStudentProgress } from "@/lib/services/progress";
import { quadraticEn } from "@/lib/ai/templates/quadratic-en";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

function lessonFor(teacher: CurrentUser) {
  return createLesson({
    teacherId: teacher.id,
    meta: {
      title: quadraticEn.title,
      subject: "mathematics",
      grade: 11,
      topic: quadraticEn.topic,
      durationMin: 45,
      objective: "",
      difficulty: "standard",
      language: "en",
    },
    content: quadraticEn.content,
    origin: "template",
  });
}

describe("classroom session flow", () => {
  let teacher: CurrentUser;
  beforeEach(() => {
    freshDb();
    teacher = makeUser("teacher", "nino", "Nino Beridze");
  });

  it("runs the full demo flow: create → join → launch → hint → answer → results → end", async () => {
    const lesson = lessonFor(teacher);
    const session = createSessionFromLesson({ user: teacher, lessonId: lesson.id, classLabel: "11A" });
    expect(session.joinCode).toMatch(/^FC-\d{4}$/);
    expect(session.status).toBe("lobby");

    // Students join with the code (lower-case, no dash) and a first name.
    const giorgi = joinSession({ code: session.joinCode.toLowerCase().replace("-", ""), displayName: "Giorgi", user: null });
    const ana = joinSession({ code: session.joinCode, displayName: "Ana", user: null });
    expect(getTeacherSessionView(session.id, teacher).participants.map((p) => p.name)).toEqual(["Giorgi", "Ana"]);

    // Waiting screen until the teacher launches something.
    expect(getStudentSessionView(session.id, giorgi.participant).current).toBeNull();

    controlSession(session.id, teacher, { type: "next" }); // multiple choice
    controlSession(session.id, teacher, { type: "next" }); // x² − 5x + 6 = 0
    const view = getStudentSessionView(session.id, giorgi.participant);
    expect(view.current?.prompt).toContain("x² − 5x + 6");
    // The student payload must not contain answers, hints or solutions.
    const payload = JSON.stringify(view);
    expect(payload).not.toContain("acceptedAnswers");
    expect(payload).not.toContain("(x − 2)(x − 3)");
    expect(view.current?.hints).toEqual({ used: 0, maxLevel: 5 });

    // Hint ladder: conceptual first, then more specific.
    const first = await requestSessionHint({ sessionId: session.id, participant: giorgi.participant, activityId: view.current!.id });
    const second = await requestSessionHint({ sessionId: session.id, participant: giorgi.participant, activityId: view.current!.id });
    expect(first).toMatchObject({ level: 1, kind: "concept", source: "teacher" });
    expect(second.text).toBe("What two numbers multiply to 6 and add to −5?");

    expect(submitResponse({ sessionId: session.id, participant: giorgi.participant, activityId: view.current!.id, answer: { optionIds: [], text: "-2, -3" } })).toEqual({ isCorrect: false, attempts: 1 });
    expect(submitResponse({ sessionId: session.id, participant: giorgi.participant, activityId: view.current!.id, answer: { optionIds: [], text: "x = 2 or x = 3" } })).toEqual({ isCorrect: true, attempts: 2 });
    submitResponse({ sessionId: session.id, participant: ana.participant, activityId: view.current!.id, answer: { optionIds: [], text: "6, 1" } });

    const teacherView = getTeacherSessionView(session.id, teacher);
    expect(teacherView.current?.results).toMatchObject({ responseCount: 2, participantCount: 2, correctCount: 1, gradedCount: 2, hintsRequested: 2 });
    expect(teacherView.current?.results.answers.find((a) => a.name === "Giorgi")).toMatchObject({ isCorrect: true, attempts: 2, hintsUsed: 2 });
    expect(teacherView.current?.results.commonWrongAnswers).toEqual([{ answer: "6, 1", count: 1 }]);

    // Explanation is shown to the student who got it right, not to the one who did not.
    expect(getStudentSessionView(session.id, giorgi.participant).current?.explanation).not.toBe("");
    expect(getStudentSessionView(session.id, ana.participant).current?.explanation).toBe("");

    // Revealing results shows the class distribution and the answer.
    controlSession(session.id, teacher, { type: "reveal", revealed: true });
    expect(getStudentSessionView(session.id, ana.participant).current?.results?.correctAnswer).toBe("2, 3");

    controlSession(session.id, teacher, { type: "end" });
    const ended = getStudentSessionView(session.id, ana.participant);
    expect(ended.session.status).toBe("ended");
    expect(ended.summary).toMatchObject({ answered: 1, correct: 0 });

    const summary = getSessionSummary(session.id, teacher);
    expect(summary.participantCount).toBe(2);
    expect(summary.activitiesRun).toBe(2);
    expect(summary.students.find((s) => s.name === "Giorgi")).toMatchObject({ answered: 1, correct: 1, hintsUsed: 2 });
  });

  it("rejects answers to closed activities and joins to ended sessions", () => {
    const lesson = lessonFor(teacher);
    const session = createSessionFromLesson({ user: teacher, lessonId: lesson.id });
    const { participant } = joinSession({ code: session.joinCode, displayName: "Luka", user: null });
    const state = controlSession(session.id, teacher, { type: "next" });
    controlSession(session.id, teacher, { type: "close" });
    expect(() => submitResponse({ sessionId: session.id, participant, activityId: state.currentActivityId!, answer: { optionIds: ["b"], text: "" } })).toThrow(ApiError);
    controlSession(session.id, teacher, { type: "end" });
    expect(() => joinSession({ code: session.joinCode, displayName: "Late", user: null })).toThrow(ApiError);
  });

  it("keeps sessions private to their teacher", () => {
    const other = makeUser("teacher", "davit");
    const session = createSessionFromLesson({ user: teacher, lessonId: lessonFor(teacher).id });
    expect(() => getTeacherSessionView(session.id, other)).toThrow(ApiError);
    expect(() => controlSession(session.id, other, { type: "end" })).toThrow(ApiError);
    const admin = makeUser("admin", "admin");
    expect(getTeacherSessionView(session.id, admin).session.id).toBe(session.id);
  });

  it("de-duplicates names and records progress for signed-in students", () => {
    const session = createSessionFromLesson({ user: teacher, lessonId: lessonFor(teacher).id });
    joinSession({ code: session.joinCode, displayName: "Nika", user: null });
    const second = joinSession({ code: session.joinCode, displayName: "nika", user: null });
    expect(second.participant.displayName).toBe("nika 2");

    const student = makeUser("student", "mariam", "Mariam L.");
    const joined = joinSession({ code: session.joinCode, displayName: "ignored", user: student });
    expect(joined.participant.displayName).toBe("Mariam L.");
    const again = joinSession({ code: session.joinCode, displayName: "", user: student });
    expect(again.participant.id).toBe(joined.participant.id);

    const state = controlSession(session.id, teacher, { type: "next" });
    submitResponse({ sessionId: session.id, participant: joined.participant, activityId: state.currentActivityId!, answer: { optionIds: ["b"], text: "" } });
    expect(getStudentProgress(student.id)).toMatchObject({ completedActivities: 1, correctActivities: 1 });
  });

  it("walks through all activities with next and reports when none are left", () => {
    const session = createSessionFromLesson({ user: teacher, lessonId: lessonFor(teacher).id });
    for (let i = 0; i < quadraticEn.content.activities.length; i++) controlSession(session.id, teacher, { type: "next" });
    expect(() => controlSession(session.id, teacher, { type: "next" })).toThrow(ApiError);
    const view = getTeacherSessionView(session.id, teacher);
    expect(view.activities.filter((a) => a.state === "closed")).toHaveLength(quadraticEn.content.activities.length - 1);
  });
});
