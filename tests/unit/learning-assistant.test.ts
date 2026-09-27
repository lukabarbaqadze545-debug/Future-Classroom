import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ZodType } from "zod";
import { freshDb, makeUser } from "../helpers";
import { setAIProviderForTests, type AIProvider } from "@/lib/ai";
import { syncBuiltInContent } from "@/lib/db/builtin";
import { upgradeMaterialIndexes } from "@/lib/db/material-index";
import { syncBuiltInBooks } from "@/lib/db/builtin-books";
import { getResource } from "@/lib/labs/library/service";
import { createMaterial } from "@/lib/services/materials";
import { resetLessonIndexForTests, searchKnowledge } from "@/lib/services/knowledge-search";
import { deleteSaved, explainSchema, listSaved, runAssistant, saveQuestion, startResearch, updateSavedNote } from "@/lib/services/learning-assistant";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { getResearchBundle } from "@/lib/labs/research/service";
import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import { SEED_MATERIALS } from "@/lib/db/seed-materials";
import { ApiError } from "@/lib/http/errors";
import type { MaterialMeta } from "@/lib/domain/schemas";

const meta = (over: Partial<MaterialMeta> = {}): MaterialMeta => ({ title: "Notes", subject: "physics", grade: 9, author: "", tags: [], visibility: "students", ...over });
const seed = (key: string) => SEED_MATERIALS.find((m) => m.key === key)!;

async function upload(owner: ReturnType<typeof makeUser>, key: string, over: Partial<MaterialMeta> = {}) {
  const m = seed(key);
  return createMaterial({ owner, meta: meta({ title: m.title, subject: m.subject, ...over }), fileName: m.fileName, bytes: new TextEncoder().encode(m.text) });
}

function fakeAI(respond: (prompt: string) => unknown): AIProvider & { calls: number } {
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
      return "";
    },
  };
  return provider;
}

describe("Learning Assistant", () => {
  beforeEach(() => {
    freshDb();
    resetLessonIndexForTests();
  });

  it("explains from the material without AI, with the source, section and key definitions", async () => {
    const teacher = makeUser("teacher", "davit");
    const student = makeUser("student", "mariam");
    await upload(teacher, "newton-notes");
    const result = await runAssistant(student, { mode: "explain", text: "What is inertia?" });
    expect(result.found).toBe(true);
    expect(result.ai?.status).toBe("off");
    expect(result.passages[0]).toMatchObject({ n: 1, kind: "material", sourceTitle: seed("newton-notes").title, pageStart: null });
    expect(result.passages[0].section).toMatch(/first law/i);
    expect(result.passages[0].highlights).toContain("inertia");
    const definition = result.key.find((k) => k.type === "definition");
    expect(definition?.content).toContain("is called inertia");
    expect(result.passages.map((p) => p.n)).toContain(definition!.n);
  });

  it("answers a Georgian question from Georgian material, and finds English material through equivalents", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "newton-notes-ka");
    await upload(teacher, "newton-notes");
    const result = await runAssistant(teacher, { mode: "explain", text: "რა არის ინერცია?" });
    expect(result.passages[0].sourceTitle).toBe(seed("newton-notes-ka").title);
    expect(result.key.find((k) => k.type === "definition")?.term).toBe("ინერცია");
    expect(result.passages.some((p) => p.sourceTitle === seed("newton-notes").title)).toBe(true);
  });

  it("never shows materials a person may not see, and refuses a hidden material as scope", async () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "ana");
    const rubric = await upload(teacher, "rubric", { visibility: "teachers", subject: "mathematics" });
    await upload(teacher, "quadratic-worked", { subject: "mathematics" });
    const forStudent = searchKnowledge(student, "assessment rubric level method");
    expect(forStudent.passages.every((p) => p.sourceId !== rubric.id)).toBe(true);
    const forTeacher = searchKnowledge(teacher, "assessment rubric level method");
    expect(forTeacher.passages[0].sourceId).toBe(rubric.id);
    await expect(runAssistant(student, { mode: "locate", text: "rubric", materialId: rubric.id })).rejects.toBeInstanceOf(ApiError);
  });

  it("keeps a single-material scope to that material", async () => {
    const teacher = makeUser("teacher", "davit");
    const en = await upload(teacher, "newton-notes");
    await upload(teacher, "newton-notes-ka");
    const result = await runAssistant(teacher, { mode: "locate", text: "Newton's second law force mass", materialId: en.id });
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages.every((p) => p.sourceId === en.id)).toBe(true);
    expect(result.scope.materialTitle).toBe(seed("newton-notes").title);
  });

  it("says honestly when nothing was found, and never asks the AI then", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "newton-notes");
    const ai = fakeAI(() => ({ sentences: [], covered: false, checkQuestion: "" }));
    setAIProviderForTests(ai);
    const result = await runAssistant(teacher, { mode: "explain", text: "volcanic eruptions in Iceland" });
    expect(result.found).toBe(false);
    expect(result.passages).toEqual([]);
    expect(result.terms.every((t) => !t.found)).toBe(true);
    expect(result.ai?.status).toBe("not_needed");
    expect(ai.calls).toBe(0);
  });

  it("tolerates a typo in a long word", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "ecosystems-reading", { subject: "biology" });
    const result = await runAssistant(teacher, { mode: "locate", text: "photosintesis in forests" });
    expect(result.passages[0]?.text).toContain("photosynthesis");
  });

  it("checks every AI sentence against the passages and marks what they do not carry", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "newton-notes");
    setAIProviderForTests(
      fakeAI(() => ({
        sentences: [
          { text: "Inertia is the property of an object to resist changes in its motion.", status: "grounded", evidence: ["E1"] },
          { text: "Newton published these laws in 1687 in London.", status: "grounded", evidence: ["E1"] },
          { text: "So a heavier bus is harder to stop.", status: "inferred", evidence: ["E1"] },
        ],
        covered: true,
        checkQuestion: "Why do passengers lean forward when the bus brakes?",
      })),
    );
    const result = await runAssistant(teacher, { mode: "explain", text: "inertia" });
    expect(result.ai?.status).toBe("used");
    expect(result.ai?.claims.map((c) => c.status)).toEqual(["grounded", "unsupported", "inferred"]);
    expect(result.ai?.claims[0].sources).toEqual([1]);
    expect(result.ai?.checkQuestion).toMatch(/bus/);
  });

  it("asks the AI for output the provider's structured format accepts", () => {
    const format = betaZodOutputFormat(explainSchema) as unknown as { type: string; schema: { properties: Record<string, unknown> } };
    expect(format.type).toBe("json_schema");
    expect(Object.keys(format.schema.properties)).toEqual(["sentences", "covered", "checkQuestion"]);
  });

  it("falls back to the passages when the AI fails", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "newton-notes");
    setAIProviderForTests({ name: "broken", model: "x", generateObject: vi.fn().mockRejectedValue(new Error("down")), generateText: vi.fn() });
    const result = await runAssistant(teacher, { mode: "explain", text: "inertia" });
    expect(result.ai?.status).toBe("failed");
    expect(result.passages.length).toBeGreaterThan(0);
  });

  it("searches published lessons — their texts only, never answers or solutions", async () => {
    const db = freshDb();
    syncBuiltInContent(db);
    resetLessonIndexForTests();
    const student = makeUser("student", "luka");
    const result = await runAssistant(student, { mode: "explain", text: "transverse and longitudinal waves" });
    const lesson = result.passages.find((p) => p.kind === "lesson");
    expect(lesson).toBeDefined();
    expect(lesson!.href).toMatch(/^\/student\/learn\//);
    expect(lesson!.pageStart).toBeNull();
    // No lesson passage anywhere contains an activity's solution or accepted answers.
    const waves = BUILT_IN_LESSONS.find((l) => l.key.includes("waves") && l.language === "en")!;
    const secrets = waves.content.activities.flatMap((a) => [a.solution, ...a.acceptedAnswers]).filter((s) => s && s.length > 25);
    const everything = searchKnowledge(student, waves.content.activities.map((a) => a.solution).join(" ").slice(0, 400), {}, { limit: 50 });
    for (const passage of everything.passages) for (const secret of secrets) expect(passage.text).not.toContain(secret);
  });

  it("compares a student's understanding with the material", async () => {
    const teacher = makeUser("teacher", "davit");
    const student = makeUser("student", "mariam");
    await upload(teacher, "newton-notes");
    const result = await runAssistant(student, {
      mode: "check",
      topic: "Newton's third law",
      text: "When one object pushes another, the second pushes back with a force of equal size in the opposite direction. The two forces cancel out because they act on the same object. Gravity is caused by the Moon.",
    });
    expect(result.checks?.map((c) => c.status)).toEqual(["found", "may_contradict", "not_found"]);
    expect(result.checks?.[0].match?.n).toBeGreaterThan(0);
  });

  it("looks for evidence for a statement and names what it assumes", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "ecosystems-reading", { subject: "biology" });
    const result = await runAssistant(teacher, { mode: "evidence", text: "There are always fewer wolves than deer because energy is lost at each level of a food chain." });
    expect(result.statement?.types).toEqual(expect.arrayContaining(["causal", "universal"]));
    expect(result.statement?.assumptions).toEqual(expect.arrayContaining(["cause_not_coincidence", "no_exception"]));
    expect(result.statement?.supporting.length).toBeGreaterThan(0);
    expect(result.statement?.supporting[0].sentence).toMatch(/energy|fewer/i);
  });

  it("suggests questions built from the material itself", async () => {
    const teacher = makeUser("teacher", "davit");
    await upload(teacher, "quadratic-worked", { subject: "mathematics" });
    const result = await runAssistant(teacher, { mode: "questions", text: "discriminant quadratic equation" });
    const kinds = result.questions!.map((q) => q.kind);
    expect(kinds).toContain("formula_parts");
    expect(kinds[kinds.length - 1]).toBe("not_covered");
    expect(result.questions!.find((q) => q.kind === "formula_parts")!.subject).toMatch(/=/);
  });

  it("starts a Research Lab project with real quotations and no invented pages", async () => {
    const teacher = makeUser("teacher", "davit");
    const student = makeUser("student", "mariam");
    const material = await upload(teacher, "ecosystems-reading", { subject: "biology" });
    const preview = await runAssistant(student, { mode: "research", text: "food chains in Georgian forests" });
    expect(preview.research?.questions[0].kind).toBe("what_known");
    expect(preview.research?.sources[0].sourceId).toBe(material.id);
    const { projectId } = startResearch(student, { topic: "food chains in Georgian forests", question: "How does energy move through a Colchic forest food chain?" });
    const bundle = getResearchBundle(projectId, student);
    expect(bundle.project.data.question).toMatch(/Colchic/);
    expect(bundle.sources[0].title).toBe(material.title);
    expect(bundle.notes.length).toBeGreaterThan(0);
    for (const note of bundle.notes) {
      expect(note.kind).toBe("quote");
      expect(seed("ecosystems-reading").text.replace(/\s+/g, " ")).toContain(note.content.replace(/…$/, "").replace(/\s+/g, " "));
      expect(note.page).toBe("");
    }
  });

  it("saves questions with a note, only for their owner", async () => {
    const student = makeUser("student", "mariam");
    const other = makeUser("student", "ana");
    const saved = saveQuestion(student, { mode: "explain", question: "What is inertia?", note: "Ask about buses." });
    expect(listSaved(student)).toHaveLength(1);
    expect(listSaved(other)).toHaveLength(0);
    expect(() => deleteSaved(other, saved.id)).toThrow(ApiError);
    updateSavedNote(student, saved.id, "Understood now.");
    expect(listSaved(student)[0].note).toBe("Understood now.");
    deleteSaved(student, saved.id);
    expect(listSaved(student)).toHaveLength(0);
  });

  it("upgrades materials indexed by an older version without losing them", () => {
    const db = freshDb();
    const teacher = makeUser("teacher", "davit");
    db.prepare(
      `INSERT INTO materials (id, owner_id, title, subject, grade, author, tags, visibility, file_name, stored_name, mime_type, size_bytes, text_status, page_count, created_at)
       VALUES ('old1', ?, 'Old PDF', 'physics', 9, '', '[]', 'students', 'old.pdf', 'missing.pdf', 'application/pdf', 10, 'indexed', 7, 1)`,
    ).run(teacher.id);
    db.prepare("INSERT INTO material_chunks (material_id, position, page, content) VALUES ('old1', 0, 6, 'Friction is the force that opposes motion between two surfaces.')").run();
    expect(searchKnowledge(teacher, "friction").passages).toHaveLength(0);
    expect(upgradeMaterialIndexes(db)).toBe(1);
    const [passage] = searchKnowledge(teacher, "friction").passages;
    expect(passage).toMatchObject({ sourceId: "old1", pageStart: 6 });
    expect(db.prepare("SELECT index_version, page_count FROM materials WHERE id = 'old1'").get()).toEqual({ index_version: 1, page_count: 7 });
    expect(upgradeMaterialIndexes(db)).toBe(0);
  });

  it("installs the built-in library books once, searchable by students, and never brings back a removed one", async () => {
    const db = freshDb();
    const started = Date.now();
    expect(syncBuiltInBooks(db)).toBe(2);
    expect(Date.now() - started).toBeLessThan(15_000);
    expect(syncBuiltInBooks(db)).toBe(0);
    expect(getResource("lib-business-courses")?.title).toBe("Business courses");
    const cpp = getResource("lib-cpp-code-to-olympiad-1")!;
    expect(cpp).toMatchObject({ title: "C++: From Code to Olympiad, Vol. 1", materialId: "book-cpp-code-to-olympiad-1", language: "ka" });
    const student = makeUser("student", "giorgi");
    const result = await runAssistant(student, { mode: "locate", text: "რა არის მასივი C++-ში?" });
    expect(result.passages[0]).toMatchObject({ sourceId: "book-cpp-code-to-olympiad-1", pageStart: null });
    expect(result.passages[0].section).toBeTruthy();
    const business = await runAssistant(student, { mode: "explain", text: "ფულადი ნაკადი და მარკეტინგი" });
    expect(business.passages.some((p) => p.sourceId === "book-business-courses")).toBe(true);
    db.prepare("DELETE FROM library_resources WHERE id = 'lib-business-courses'").run();
    expect(syncBuiltInBooks(db)).toBe(0);
  });
});
