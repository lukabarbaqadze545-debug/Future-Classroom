import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { syncBuiltInBooks } from "@/lib/db/builtin-books";
import { HEADWORD_LINE, READER_PAGE_CHUNKS, locate, readerOutline, readerPage, searchInMaterial, type ReaderLocation, type ReaderPage } from "@/lib/services/material-reader";
import { ApiError } from "@/lib/http/errors";

const DICTIONARY = "book-english-spanish-dictionary-1";

describe("Reading a book on the site", () => {
  beforeEach(() => {
    syncBuiltInBooks(freshDb());
  });

  it("builds a table of contents and pages that cover every passage once", () => {
    const student = makeUser("student", "giorgi");
    const outline = readerOutline(DICTIONARY, student);
    expect(outline.map((s) => s.section)).toEqual(expect.arrayContaining(["About This Edition", "A1 Vocabulary", "C1 Vocabulary", "30-Day Study Tracker"]));
    const a1 = outline.find((s) => s.section === "A1 Vocabulary")!;
    expect(a1.parts).toBe(Math.ceil(a1.chunks / READER_PAGE_CHUNKS));
    // Walking "next" from the first page reaches every page of every section exactly once.
    let at: ReaderLocation | null = { s: 0, p: 0 };
    let pages = 0;
    while (at) {
      const page: ReaderPage = readerPage(DICTIONARY, student, at)!;
      pages++;
      at = page.next;
      if (pages > 1000) throw new Error("next never ends");
    }
    expect(pages).toBe(outline.reduce((n, s) => n + s.parts, 0));
  });

  it("never splits a dictionary entry between pages and never repeats one", () => {
    const student = makeUser("student", "giorgi");
    const outline = readerOutline(DICTIONARY, student);
    const a1 = outline.find((s) => s.section === "A1 Vocabulary")!;
    const seen = new Set<string>();
    for (let p = 0; p < a1.parts; p++) {
      const { paragraphs } = readerPage(DICTIONARY, student, { s: a1.index, p })!;
      expect(paragraphs.length).toBeGreaterThan(0);
      if (p > 0) expect(HEADWORD_LINE.test(paragraphs[0])).toBe(true);
      // Every entry on the page is complete: headword, then Spanish, Meaning and Example lines before the next headword.
      paragraphs.forEach((text, i) => {
        if (!HEADWORD_LINE.test(text)) return;
        const word = text.match(HEADWORD_LINE)![1];
        expect(seen.has(word)).toBe(false);
        seen.add(word);
        const rest = [];
        for (let j = i + 1; j < paragraphs.length && !HEADWORD_LINE.test(paragraphs[j]); j++) rest.push(paragraphs[j]);
        if (i < paragraphs.length - 1 || rest.length) expect(rest.some((x) => x.startsWith("Example:"))).toBe(true);
      });
    }
    expect(seen.size).toBe(407);
  });

  it("finds a headword first and opens the page that holds it", () => {
    const student = makeUser("student", "giorgi");
    const hits = searchInMaterial(DICTIONARY, student, "afternoon");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].snippet.toLowerCase()).toContain("afternoon");
    const page = readerPage(DICTIONARY, student, hits[0].at)!;
    expect(page.paragraphs.some((x) => x.toLowerCase().startsWith("afternoon /"))).toBe(true);
    expect(searchInMaterial(DICTIONARY, student, "a")).toEqual([]);
    expect(searchInMaterial(DICTIONARY, student, "zzzzqqq")).toEqual([]);
  });

  it("clamps stale locations and respects who may see the material", () => {
    const student = makeUser("student", "giorgi");
    const page = readerPage(DICTIONARY, student, { s: 9999, p: 9999 })!;
    expect(page.next).toBeNull();
    const outline = readerOutline(DICTIONARY, student);
    expect(locate(outline, 0)).toEqual({ s: 0, p: 0 });
    expect(() => readerOutline("missing-material", student)).toThrow(ApiError);
  });

  it("reads Georgian books by chapter too", () => {
    const student = makeUser("student", "giorgi");
    const outline = readerOutline("book-cpp-code-to-olympiad-1", student);
    expect(outline.length).toBeGreaterThan(100);
    const page = readerPage("book-cpp-code-to-olympiad-1", student, { s: 8, p: 0 })!;
    expect(page.paragraphs.join(" ")).toMatch(/[Ⴀ-ჿ]/);
  });
});
