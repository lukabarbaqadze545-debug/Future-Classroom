import { describe, expect, it } from "vitest";
import { freshDb } from "../helpers";
import { SUBJECTS } from "@/lib/domain/catalog";
import { SUBJECT_CATALOG, findSubjectEntry } from "@/lib/content/subjects";
import { resolveCatalog, resolveSubjectPage, unresolvedReferences } from "@/lib/content/subject-items";
import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import { seedDemoSchool } from "@/lib/db/seed";
import { getUserByUsername } from "@/lib/services/users";
import { en } from "@/lib/i18n/en";

const tools = en.subjectCatalog.tools;

describe("subject catalogue", () => {
  it("has one entry per subject, each with real starter content", () => {
    expect(SUBJECT_CATALOG.map((s) => s.id).sort()).toEqual([...SUBJECTS].sort());
    for (const entry of SUBJECT_CATALOG) {
      expect(entry.topics.length, entry.id).toBeGreaterThan(0);
      for (const topic of entry.topics) expect(topic.items.length, `${entry.id}/${topic.id}`).toBeGreaterThan(0);
      expect(entry.path.length, entry.id).toBeGreaterThan(0);
      expect(entry.description.en && entry.description.ka, entry.id).toBeTruthy();
      expect(BUILT_IN_LESSONS.some((l) => l.subject === entry.id), `${entry.id} has a built-in lesson`).toBe(true);
      expect(entry.grades[0]).toBeLessThanOrEqual(entry.grades[1]);
    }
  });

  it("links only to things that exist", () => {
    seedDemoSchool(freshDb());
    expect(unresolvedReferences()).toEqual([]);
  });

  it("shows lessons in the reader's language and counts activities", () => {
    const db = freshDb();
    seedDemoSchool(db);
    const ka = resolveCatalog("ka", tools);
    const maths = ka.find((s) => s.id === "mathematics")!;
    const lessons = maths.topics.flatMap((t) => t.items).filter((i) => i.source === "lesson");
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((i) => i.language === null)).toBe(true);
    expect(maths.counts.lesson).toBeGreaterThan(0);
    expect(maths.counts.simulation).toBeGreaterThan(0);
    // Georgian literature exists only in Georgian, so English readers see a language badge.
    const georgian = resolveCatalog("en", tools).find((s) => s.id === "georgian")!;
    expect(georgian.topics.flatMap((t) => t.items).find((i) => i.source === "lesson")?.language).toBe("ka");
  });

  it("marks a student's progress along the learning path", () => {
    const db = freshDb();
    seedDemoSchool(db);
    const mariam = getUserByUsername("mariam")!;
    const ct = resolveSubjectPage(findSubjectEntry("critical_thinking")!, "en", tools, mariam.id);
    const fallacies = ct.topics.flatMap((t) => t.items).find((i) => i.key === "critical:ct-fallacies-1")!;
    expect(fallacies.status).toBe("done");
    const teacherView = resolveSubjectPage(findSubjectEntry("critical_thinking")!, "en", tools, null);
    expect(teacherView.path.every((i) => i.status === null)).toBe(true);
    expect(teacherView.path.find((i) => i.source === "critical")?.assign?.kind).toBe("critical");
  });
});
