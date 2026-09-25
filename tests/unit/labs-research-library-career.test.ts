import { beforeEach, describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { freshDb, makeUser } from "../helpers";
import { openDatabase, setDbForTests } from "@/lib/db";
import { seedDemoSchool } from "@/lib/db/seed";
import { correlation, describe as describeStats, groupMeans, toNumbers } from "@/lib/labs/research/stats";
import { sourceQuality } from "@/lib/labs/research/quality";
import { formatReference } from "@/lib/labs/research/citation";
import { sourceSchema } from "@/lib/labs/research/model";
import { addItem, createResearchProject, getResearchBundle, researchStepStatus, updateResearchProject } from "@/lib/labs/research/service";
import { SEED_LIBRARY } from "@/lib/labs/library/catalog-seed";
import { resourceSchema } from "@/lib/labs/library/model";
import { addCopy, createResource, findCopyByCode, listResources, setReading, updateCopy } from "@/lib/labs/library/service";
import { copyCard, createCard, isStale, listSharedCards, skillProfile, setSkillRating } from "@/lib/labs/career/service";
import { CAREERS, FIELDS } from "@/lib/labs/career/careers";
import { createPortfolioItem, listPortfolio } from "@/lib/services/portfolio";
import { addToPortfolioFromSource } from "@/lib/services/portfolio-sources";
import { submit } from "@/lib/labs/programming/service";
import { findBuiltInProblem } from "@/lib/labs/programming/catalog";
import { createAssignment, getAssignmentForStudent, listAssignmentsForTeacher, reviewWork, submitWork } from "@/lib/services/assignments";
import { createClass } from "@/lib/services/classes";
import { learningProfile } from "@/lib/services/learning-profile";
import { ApiError } from "@/lib/http/errors";

describe("research statistics", () => {
  it("describes numeric columns and ignores non-numbers", () => {
    const values = toNumbers(["6,5", "7", "", "abc", "8.5"]);
    expect(values).toEqual([6.5, 7, 8.5]);
    const d = describeStats(values)!;
    expect(d.mean).toBeCloseTo(22 / 3);
    expect(d.median).toBe(7);
    expect(d.min).toBe(6.5);
  });
  it("computes correlation and group means", () => {
    expect(correlation([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }])).toBeCloseTo(1);
    expect(correlation([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBeNull();
    expect(groupMeans(["a", "b", "a"], ["1", "5", "3"])).toEqual(expect.arrayContaining([{ group: "a", mean: 2, n: 2 }]));
  });
});

describe("source quality and references", () => {
  const base = sourceSchema.parse({ title: "Report" });
  it("summarises only the student's own answers", () => {
    expect(sourceQuality(base).level).toBe("unclear");
    expect(sourceQuality({ ...base, authorKnown: "yes", recent: "yes", evidenceShown: "yes", balanced: "yes", corroborated: "unsure" }).level).toBe("strong");
    expect(sourceQuality({ ...base, authorKnown: "yes", recent: "yes", evidenceShown: "no", balanced: "yes", corroborated: "yes" }).level).toBe("weak");
  });
  it("never invents missing details in a reference", () => {
    const labels = { accessed: "accessed", noDate: "n.d." };
    expect(formatReference({ ...base, title: "Sleep facts", organisation: "Health Office", url: "https://example.org/sleep", accessed: "2026-09-01" }, labels)).toBe(
      "Health Office (n.d.). Sleep facts. https://example.org/sleep (accessed 2026-09-01)",
    );
    expect(formatReference({ ...base, title: "Untitled survey" }, labels)).toBe("Untitled survey (n.d.).");
  });
});

describe("research projects", () => {
  beforeEach(() => freshDb());
  it("tracks the workflow and keeps quotations attributed", () => {
    const student = makeUser("student", "mariam");
    const other = makeUser("student", "giorgi");
    const project = createResearchProject(student, { title: "Sleep", subject: "Biology" });
    expect(() => addItem(project.id, student, "notes", { kind: "quote", content: "A quote with no source" })).toThrow(ApiError);
    const sourceId = addItem(project.id, student, "sources", { title: "Consensus statement", organisation: "AASM", year: "2016" });
    addItem(project.id, student, "notes", { kind: "quote", content: "Exact words", sourceId, page: "p. 2" });
    addItem(project.id, student, "notes", { kind: "evidence", content: "17 of 24 slept < 8h", stance: "supports" });
    expect(() => addItem(project.id, other, "sources", { title: "Not mine" })).toThrow(ApiError);
    expect(() => getResearchBundle(project.id, other)).toThrow(ApiError);
    updateResearchProject(project.id, student, { data: { question: "How much do students in our school sleep on school nights?" } });
    const steps = researchStepStatus(getResearchBundle(project.id, student));
    expect(steps.question).toBe(true);
    expect(steps.evidence).toBe(true);
    expect(steps.sources).toBe(false);
  });
});

describe("library", () => {
  beforeEach(() => freshDb());
  it("has a legitimate starter catalogue", () => {
    for (const r of SEED_LIBRARY) {
      expect(() => resourceSchema.parse(r), r.id).not.toThrow();
      if (r.license === "physical_only") expect(r.digitalUrl, r.id).toBe("");
      if (r.digitalUrl) expect(r.digitalUrl.startsWith("https://"), r.id).toBe(true);
    }
    expect(SEED_LIBRARY.filter((r) => r.license === "physical_only").length).toBeGreaterThan(0);
  });
  it("gives each copy a unique code that resolves back to the resource", async () => {
    const admin = makeUser("admin", "admin");
    const resource = createResource(admin, resourceSchema.parse({ title: "Atlas", description: { en: "Atlas", ka: "ატლასი" } }));
    const a = addCopy(resource.id, { shelf: "G-1" });
    const b = addCopy(resource.id, { shelf: "G-1" });
    expect(a.code).toBe("LIB-0001");
    expect(b.code).toBe("LIB-0002");
    expect(findCopyByCode("lib-0002")!.resourceId).toBe(resource.id);
    const svg = await QRCode.toString(`https://school.example/library/qr/${a.code}`, { type: "svg" });
    expect(svg).toContain("<svg");
    const student = makeUser("student", "ana");
    const loaned = updateCopy(a.id, { status: "on_loan", borrowerId: student.id, dueAt: Date.now() + 86_400_000 });
    expect(loaned.borrowerName).toBe("ana");
    expect(updateCopy(a.id, { status: "available" }).borrowerId).toBeNull();
    expect(listResources({ availability: "available" }).map((r) => r.id)).toContain(resource.id);
  });
  it("completes reading assignments when a book is finished", () => {
    const teacher = makeUser("teacher", "eka");
    const student = makeUser("student", "ana");
    const resource = createResource(teacher, resourceSchema.parse({ title: "Alice", description: { en: "", ka: "" } }));
    const assignment = createAssignment(teacher, { kind: "library", refId: resource.id, title: "Read", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    setReading(student, resource.id, { status: "reading", percent: 30 });
    expect(getAssignmentForStudent(assignment.id, student.id).recipient.status).toBe("in_progress");
    expect(setReading(student, resource.id, { status: "finished" })!.percent).toBe(100);
    expect(getAssignmentForStudent(assignment.id, student.id).recipient.status).toBe("completed");
  });
});

describe("career and portfolio", () => {
  beforeEach(() => freshDb());
  it("contains no hard-coded salaries or admission figures", () => {
    const text = JSON.stringify([CAREERS, FIELDS]);
    expect(text).not.toMatch(/\b(GEL|USD|EUR|₾|\$)\s?\d/);
    expect(text).not.toMatch(/\d{2,3}\s?%/);
  });
  it("flags unchecked or year-old university cards and lets students copy shared ones", () => {
    const teacher = makeUser("teacher", "eka");
    const student = makeUser("student", "mariam");
    const shared = createCard(teacher, { university: "Example University" } as never, { shared: true, checkedAt: null });
    expect(isStale(shared)).toBe(true);
    expect(isStale({ checkedAt: Date.now() - 400 * 86_400_000 })).toBe(true);
    expect(isStale({ checkedAt: Date.now() - 10 * 86_400_000 })).toBe(false);
    expect(listSharedCards()).toHaveLength(1);
    const studentCard = createCard(student, { university: "Mine" } as never, { shared: true });
    expect(studentCard.shared).toBe(false);
    const copy = copyCard(shared.id, student);
    expect(copy.ownerId).toBe(student.id);
    expect(copy.university).toBe("Example University");
  });
  it("adds solved work to the portfolio once, and only the student's own", async () => {
    const student = makeUser("student", "mariam");
    await expect(Promise.resolve().then(() => addToPortfolioFromSource(student, "programming", "l1-sum-to-n", "en"))).rejects.toBeInstanceOf(ApiError);
    const problem = findBuiltInProblem("l1-sum-to-n");
    if (problem?.kind !== "code") throw new Error();
    await submit(student, { problemId: problem.id, language: "python", mode: "browser", code: "", answer: "", results: problem.tests.map((t) => ({ output: t.output })) });
    const first = addToPortfolioFromSource(student, "programming", "l1-sum-to-n", "ka");
    const second = addToPortfolioFromSource(student, "programming", "l1-sum-to-n", "ka");
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(listPortfolio(student.id)).toHaveLength(1);
    expect(first.item.skills).toContain("programming");
  });
  it("shows self-ratings next to portfolio evidence", () => {
    const student = makeUser("student", "mariam");
    setSkillRating(student.id, "communication", 3);
    createPortfolioItem(student, { title: "Talk", category: "presentation", date: "2026-09-01", description: "", link: "", evidence: "", skills: ["communication"], reflection: "" });
    const row = skillProfile(student.id).find((s) => s.id === "communication")!;
    expect(row.level).toBe(3);
    expect(row.evidence).toBe(1);
    expect(() => setSkillRating(student.id, "juggling", 2)).toThrow(ApiError);
  });
});

describe("assignment workflow", () => {
  beforeEach(() => freshDb());
  it("assigns to a class, hands in open work, reviews and reports progress", () => {
    const teacher = makeUser("teacher", "nino");
    const mariam = makeUser("student", "mariam");
    const giorgi = makeUser("student", "giorgi");
    const cls = createClass(teacher, "11A", [mariam.id, giorgi.id]);
    const assignment = createAssignment(teacher, { kind: "research", refId: null, title: "Research", instructions: "", dueAt: Date.now() - 1000, classId: cls.id, studentIds: [] });
    expect(listAssignmentsForTeacher(teacher.id)[0]).toMatchObject({ total: 2, done: 0, overdue: 2 });
    expect(() => submitWork(assignment.id, mariam, { response: { text: "done" } })).toThrow(ApiError);
    const project = createResearchProject(mariam, { title: "Sleep", subject: "" });
    submitWork(assignment.id, mariam, { workRef: project.id, response: { text: "Ready" } });
    const reviewed = reviewWork(assignment.id, mariam.id, teacher, { feedback: "Good start", status: "reviewed" });
    expect(reviewed.status).toBe("reviewed");
    expect(() => submitWork(assignment.id, mariam, { workRef: project.id })).toThrow(ApiError);
    const intruder = makeUser("teacher", "other");
    expect(() => reviewWork(assignment.id, giorgi.id, intruder, { feedback: "", status: "reviewed" })).toThrow(ApiError);
    expect(listAssignmentsForTeacher(teacher.id)[0]).toMatchObject({ done: 1, overdue: 1 });
  });
  it("refuses hand-ins for automatically checked kinds", () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "luka");
    const a = createAssignment(teacher, { kind: "programming", refId: "l1-hello", title: "Hello", instructions: "", dueAt: null, classId: null, studentIds: [student.id] });
    expect(() => submitWork(a.id, student, { response: { text: "I did it" } })).toThrow(ApiError);
  });
});

describe("demo school", () => {
  it("seeds every laboratory and a coherent learning profile", () => {
    const db = openDatabase(":memory:");
    setDbForTests(db);
    seedDemoSchool(db);
    const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    for (const table of ["classes", "assignments", "programming_submissions", "ct_attempts", "stem_records", "stem_projects", "research_projects", "research_sources", "library_resources", "library_copies", "university_cards", "portfolio_items", "development_goals"]) {
      expect(count(table), table).toBeGreaterThan(0);
    }
    const mariam = db.prepare("SELECT id, role, username, display_name AS displayName FROM users WHERE username = 'mariam'").get() as { id: string; role: "student"; username: string; displayName: string };
    const profile = learningProfile(mariam.id, mariam, "en");
    expect(profile.programming.solved).toBeGreaterThan(5);
    expect(profile.research).toHaveLength(1);
    expect(profile.assignments.stats.total).toBeGreaterThan(3);
    expect(profile.recent.length).toBeGreaterThan(3);
  });
});
