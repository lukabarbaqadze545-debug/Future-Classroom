import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { createMaterial, listMaterials, searchPassages, getMaterial } from "@/lib/services/materials";
import { askLibrary } from "@/lib/ai/library-service";
import { createQuiz, getQuizResults, studentAttemptView, submitQuizAttempt, getPublishedQuiz, setQuizStatus } from "@/lib/services/quizzes";
import { quiz } from "@/lib/ai/templates/builders";
import { SEED_MATERIALS } from "@/lib/db/seed-materials";
import { seedDemoSchool } from "@/lib/db/seed";
import { getTeacherInsights, getStudentProgress, getMistakesToReview } from "@/lib/services/progress";
import { getUserByUsername } from "@/lib/services/users";
import { ApiError } from "@/lib/http/errors";
import type { MaterialMeta } from "@/lib/domain/schemas";

const newtonText = SEED_MATERIALS.find((m) => m.key === "newton-notes")!.text;
const meta = (overrides: Partial<MaterialMeta> = {}): MaterialMeta => ({ title: "Newton notes", subject: "physics", grade: 9, author: "", tags: [], visibility: "students", ...overrides });

describe("materials and library", () => {
  beforeEach(() => freshDb());

  it("indexes uploaded text and retrieves the relevant passage", async () => {
    const teacher = makeUser("teacher", "davit");
    const material = await createMaterial({ owner: teacher, meta: meta(), fileName: "notes.md", bytes: new TextEncoder().encode(newtonText) });
    expect(material.textStatus).toBe("indexed");
    expect(material.chunkCount).toBeGreaterThan(2);
    const [top] = searchPassages(teacher, "What does our physics material say about Newton's second law?");
    expect(top.content).toMatch(/second law/i);
    expect(top.content).toContain("F = m · a");
  });

  it("respects visibility: students only see student materials", async () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "ana");
    const shared = await createMaterial({ owner: teacher, meta: meta({ title: "Shared" }), fileName: "a.txt", bytes: new TextEncoder().encode("Photosynthesis happens in chloroplasts of plant cells.") });
    const staff = await createMaterial({ owner: teacher, meta: meta({ title: "Rubric", visibility: "teachers" }), fileName: "b.txt", bytes: new TextEncoder().encode("Photosynthesis rubric for teachers only, marking guide.") });
    expect(listMaterials(student).map((m) => m.id)).toEqual([shared.id]);
    expect(searchPassages(student, "photosynthesis").every((p) => p.materialId === shared.id)).toBe(true);
    expect(() => getMaterial(staff.id, student)).toThrow(ApiError);
    const other = makeUser("teacher", "eka");
    const priv = await createMaterial({ owner: teacher, meta: meta({ title: "Private", visibility: "private" }), fileName: "c.txt", bytes: new TextEncoder().encode("Private draft notes about photosynthesis.") });
    expect(() => getMaterial(priv.id, other)).toThrow(ApiError);
  });

  it("returns real passages (and no invented answer) when AI is offline", async () => {
    const teacher = makeUser("teacher", "davit");
    const student = makeUser("student", "mariam");
    await createMaterial({ owner: teacher, meta: meta(), fileName: "notes.md", bytes: new TextEncoder().encode(newtonText) });
    const result = await askLibrary(student, "Newton's second law");
    expect(result.mode).toBe("passages_only");
    expect(result.answer).toBeNull();
    expect(result.passages[0]).toMatchObject({ index: 1, materialTitle: "Newton notes" });
    const none = await askLibrary(student, "volcanic eruptions in Iceland");
    expect(none.passages).toHaveLength(0);
  });

  it("finds Georgian text despite case endings", async () => {
    const teacher = makeUser("teacher", "davit");
    const ka = SEED_MATERIALS.find((m) => m.key === "newton-notes-ka")!;
    await createMaterial({ owner: teacher, meta: meta({ title: ka.title }), fileName: "ka.md", bytes: new TextEncoder().encode(ka.text) });
    const passages = searchPassages(teacher, "ნიუტონის მეორე კანონი");
    expect(passages[0].content).toContain("F = m · a");
  });
});

describe("quizzes", () => {
  beforeEach(() => freshDb());

  it("grades attempts, hides answers in score-only mode and summarises results", () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "giorgi");
    const q = createQuiz({
      teacherId: teacher.id,
      origin: "manual",
      draft: {
        title: "Check",
        subject: "mathematics",
        grade: 11,
        topic: "Quadratics",
        feedbackMode: "score_only",
        questions: [quiz.numerical("q1", "Discriminant of x² − 6x + 9?", 0), quiz.short("q2", "Solve x² = 9", ["3, -3"]), quiz.trueFalse("q3", "x² + 1 = 0 has real roots", false)],
      },
    });
    expect(() => getPublishedQuiz(q.id)).toThrow(ApiError); // drafts are invisible to students
    setQuizStatus(q.id, teacher, "published");
    const attempt = submitQuizAttempt(q.id, student, { q1: { text: "0" }, q2: { text: "-3 and 3" }, q3: { optionIds: ["true"] } });
    expect(attempt).toMatchObject({ score: 2, maxScore: 3 });
    const view = studentAttemptView(getPublishedQuiz(q.id), attempt);
    expect(view.questions.every((x) => x.correctAnswer === null && x.correctOptionIds.length === 0)).toBe(true);
    const results = getQuizResults(q.id, teacher);
    expect(results.averagePercent).toBe(67);
    expect(results.questions[2].commonWrongAnswers).toEqual([{ answer: "true", count: 1 }]);
    expect(getMistakesToReview(student.id)).toHaveLength(1);
  });
});

describe("demo seed", () => {
  it("creates a coherent demo school", () => {
    const db = freshDb();
    seedDemoSchool(db);
    const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    expect(count("users")).toBe(12);
    expect(count("lessons")).toBe(6);
    expect(count("classroom_sessions")).toBe(2);
    expect(count("materials")).toBe(SEED_MATERIALS.length);
    const nino = getUserByUsername("nino")!;
    const insights = getTeacherInsights(nino.id);
    expect(insights.sessionsCompleted).toBe(2);
    expect(insights.participationPercent).toBeGreaterThan(80);
    expect(insights.commonWrongAnswers.length).toBeGreaterThan(0);
    const mariam = getUserByUsername("mariam")!;
    const progress = getStudentProgress(mariam.id);
    expect(progress.streakDays).toBeGreaterThan(0);
    expect(progress.quizzesTaken).toBe(3);
  });
});
