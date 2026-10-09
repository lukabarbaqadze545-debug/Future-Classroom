import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { freshDb, makeUser } from "../helpers";
import { syncBuiltInBooks } from "@/lib/db/builtin-books";
import { createMaterial } from "@/lib/services/materials";
import { resetLessonIndexForTests } from "@/lib/services/knowledge-search";
import { runAssistant } from "@/lib/services/learning-assistant";
import { lookupWord, resetDictionariesForTests, suggestWords, wordCards, wordsOfTheDay, hasDictionary } from "@/lib/services/dictionary";
import { HEADWORD_LINE } from "@/lib/knowledge/dictionary";
import type { MaterialMeta } from "@/lib/domain/schemas";

const BOOK = "lib-english-spanish-dictionary-1";

const meta = (over: Partial<MaterialMeta> = {}): MaterialMeta => ({ title: "Word list", subject: "english", grade: 8, author: "", tags: [], visibility: "students", ...over });

/** A small dictionary in the book's layout: 24 invented-simple entries. */
function smallDictionary(): string {
  const words = ["apple", "bread", "chair", "dance", "eagle", "fruit", "grape", "house", "ivory", "juice", "knife", "lemon", "mango", "night", "olive", "peach", "queen", "river", "sugar", "table", "uncle", "voice", "water", "yacht"];
  return [
    "# Mini dictionary",
    ...words.map((w, i) => `${w.toUpperCase()}   /${w}/  •  noun  •  A1\n\nSpanish:  la palabra${i}\n\nMeaning:  a word number ${i}\n\nExample:  I like the ${w}.\n\n→  Me gusta la cosa.\n\nCommon:  a ${w} • the ${w}`),
  ].join("\n\n");
}

describe("Dictionary look-up on the site", () => {
  beforeEach(() => {
    syncBuiltInBooks(freshDb());
    resetDictionariesForTests();
    resetLessonIndexForTests();
  });

  it("finds a word in the school's book, with its source and a link to the page", () => {
    const student = makeUser("student", "giorgi");
    const result = lookupWord(student, "afternoon")!;
    expect(result.direction).toBe("en-es");
    expect(result.matches).toHaveLength(1);
    const { card, how } = result.matches[0];
    expect(how).toBe("headword");
    expect(card).toMatchObject({ word: "afternoon", level: "A1", spanish: "la tarde", example: "We usually have lunch in the early afternoon." });
    expect(card.source.title).toMatch(/English–Spanish Learning Dictionary/);
    expect(card.source.href).toMatch(new RegExp(`^/library/${BOOK}/read\\?view=text&s=\\d+&p=\\d+&hl=AFTERNOON#hit$`));
  });

  it("opens the page the word is really on", async () => {
    const student = makeUser("student", "giorgi");
    const { readerPage } = await import("@/lib/services/material-reader");
    for (const word of ["afternoon", "have", "year", "ambiguity"]) {
      const card = lookupWord(student, word)?.matches[0]?.card;
      if (!card) continue;
      const q = new URL(card.source.href!, "http://x").searchParams;
      const page = readerPage("book-english-spanish-dictionary-1", student, { s: Number(q.get("s")), p: Number(q.get("p")) })!;
      expect(page.paragraphs.some((p) => HEADWORD_LINE.test(p) && p.startsWith(`${card.headword} `)), word).toBe(true);
    }
  });

  it("says how an inflected form, a phrase and a Spanish word were found", () => {
    const student = makeUser("student", "giorgi");
    const went = lookupWord(student, "went")!.matches[0];
    expect(went).toMatchObject({ how: "form", via: "went" });
    expect(went.card.word).toBe("go");
    expect(lookupWord(student, "good afternoon")!.matches[0]).toMatchObject({ how: "phrase" });
    const spanish = lookupWord(student, "la tarde")!;
    expect(spanish.direction).toBe("es-en");
    expect(spanish.matches[0]).toMatchObject({ how: "translation", via: "la tarde" });
    expect(spanish.matches[0].card.word).toBe("afternoon");
  });

  it("follows the language a question asks for", () => {
    const student = makeUser("student", "giorgi");
    // "tarde" alone could be either; "… in English" says which.
    expect(lookupWord(student, "tarde", { target: "en" })!.direction).toBe("es-en");
    expect(lookupWord(student, "dog", { target: "es" })!.direction).toBe("en-es");
  });

  it("offers close spellings, and says nothing is an entry", () => {
    const student = makeUser("student", "giorgi");
    const result = lookupWord(student, "recieve")!;
    expect(result.matches).toEqual([]);
    expect(result.suggestions[0]).toMatchObject({ word: "receive" });
  });

  it("does not look up Georgian, empty text or long sentences", () => {
    const student = makeUser("student", "giorgi");
    expect(lookupWord(student, "გამარჯობა")).toBeNull();
    expect(lookupWord(student, "  ")).toBeNull();
    expect(lookupWord(student, "why do leaves change colour in autumn")).toBeNull();
  });

  it("completes words and Spanish translations while typing", () => {
    const student = makeUser("student", "giorgi");
    const list = suggestWords(student, "afte");
    expect(list[0]).toMatchObject({ word: "afternoon", language: "en", spanish: "la tarde" });
    expect(suggestWords(student, "tard").some((s) => s.language === "es" && s.word === "afternoon")).toBe(true);
    expect(suggestWords(student, "")).toEqual([]);
  });

  it("returns saved words in the order asked and leaves out unknown ones", () => {
    const student = makeUser("student", "giorgi");
    expect(wordCards(student, ["year", "nonsenseword", "afternoon"]).map((c) => c.word)).toEqual(["year", "afternoon"]);
    expect(wordCards(student, [])).toEqual([]);
  });

  it("gives everyone the same words on a day, and other words on another day", () => {
    const a = makeUser("student", "a");
    const b = makeUser("teacher", "b");
    const day = (user: typeof a, d: string) => wordsOfTheDay(user, d, 3).map((c) => c.word);
    expect(day(a, "2026-10-09")).toEqual(day(b, "2026-10-09"));
    expect(day(a, "2026-10-09")).toHaveLength(3);
    expect(new Set(day(a, "2026-10-09")).size).toBe(3);
    // Over a year of days, never a word unfit for a school's front page.
    const year = new Set<string>();
    for (let i = 0; i < 366; i++) for (const c of wordsOfTheDay(a, new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), 3)) year.add(c.word);
    expect(year.size).toBeGreaterThan(300);
    for (const word of ["kill", "crime", "criminal", "prison"]) expect(year.has(word), word).toBe(false);
    const days = new Set(["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"].map((d) => day(a, d)[0]));
    expect(days.size).toBeGreaterThan(2);
  });
});

describe("The dictionary in assistant answers", () => {
  beforeEach(() => {
    syncBuiltInBooks(freshDb());
    resetDictionariesForTests();
    resetLessonIndexForTests();
  });
  const ask = (text: string, extra: Record<string, unknown> = {}) => runAssistant(makeUser("student", `s${Math.random().toString(36).slice(2, 8)}`), { mode: "explain", text, useAI: false, ...extra });

  it("answers 'what does X mean' with the entry, and shows what was searched", async () => {
    const r = await ask("What does afternoon mean?");
    expect(r.understood).toMatchObject({ kind: "define", focus: "afternoon" });
    expect(r.dictionary?.matches[0]).toMatchObject({ how: "headword" });
    expect(r.dictionary?.matches[0].card.word).toBe("afternoon");
    expect(r.passages[0].text.toLowerCase()).toContain("afternoon");
  });

  it("answers a translation question in the language asked", async () => {
    const es = await ask("how do you say afternoon in Spanish");
    expect(es.understood).toMatchObject({ kind: "translate", target: "es", focus: "afternoon" });
    expect(es.dictionary?.matches[0].card.spanish).toBe("la tarde");
    const en = await ask("what is la tarde in English?");
    expect(en.dictionary?.direction).toBe("es-en");
    expect(en.dictionary?.matches[0].card.word).toBe("afternoon");
  });

  it("looks up both sides of a comparison", async () => {
    const r = await ask("what is the difference between big and small?");
    expect(r.understood?.kind).toBe("compare");
    expect(r.dictionary?.matches.map((m) => m.card.word)).toEqual(["big", "small"]);
  });

  it("does not look up questions about ideas, nor statements", async () => {
    expect((await ask("how does photosynthesis work?")).dictionary).toBeNull();
    expect((await ask("why is the sky blue")).dictionary).toBeNull();
    const student = makeUser("student", "nino");
    const check = await runAssistant(student, { mode: "check", text: "The afternoon is part of the day.", topic: "afternoon", useAI: false });
    expect(check.dictionary).toBeNull();
    expect(check.understood).toBeNull();
  });

  it("does not look up Georgian questions", async () => {
    const r = await ask("რას ნიშნავს ძალა?");
    expect(r.dictionary).toBeNull();
    expect(r.understood).toMatchObject({ kind: "define", focus: "ძალა" });
  });

  it("stays out of a search scoped to another material", async () => {
    const teacher = makeUser("teacher", "davit");
    const other = await createMaterial({ owner: teacher, meta: meta({ title: "Notes", subject: "physics" }), fileName: "n.md", bytes: new TextEncoder().encode("# Notes\n\nAfternoon light is slanted. ".repeat(10)) });
    const r = await runAssistant(teacher, { mode: "explain", text: "what does afternoon mean", materialId: other.id, useAI: false });
    expect(r.dictionary).toBeNull();
    const scoped = await runAssistant(teacher, { mode: "explain", text: "what does afternoon mean", materialId: "book-english-spanish-dictionary-1", useAI: false });
    expect(scoped.dictionary?.matches[0].card.word).toBe("afternoon");
  });

  it("finds the entry for a word of the book through a question, every time", async () => {
    const md = readFileSync("content/books/english-spanish-learning-dictionary-1.md", "utf8");
    const words = md.split("\n").map((l) => HEADWORD_LINE.exec(l.replace(/\s+/g, " ").trim())?.[1]).filter(Boolean) as string[];
    const sample = words.filter((_, i) => i % 20 === 0);
    const student = makeUser("student", "bench");
    let entry = 0;
    let topThree = 0;
    for (const word of sample) {
      const r = await runAssistant(student, { mode: "explain", text: `what does ${word.toLowerCase()} mean`, useAI: false });
      if (r.dictionary?.matches[0]?.card.word === word.toLowerCase()) entry++;
      if (r.passages.slice(0, 3).some((p) => p.text.split("\n").some((l) => l.replace(/\s+/g, " ").startsWith(`${word} /`)))) topThree++;
    }
    // The entry is found by headword every time; the passage search alone finds it in the top three for nine in ten.
    expect(sample.length).toBe(100);
    expect(entry).toBe(sample.length);
    expect(topThree / sample.length).toBeGreaterThan(0.85);
  }, 120_000);
});

describe("Who may look in a dictionary", () => {
  beforeEach(() => {
    freshDb();
    resetDictionariesForTests();
    resetLessonIndexForTests();
  });

  it("only offers dictionaries the person may open", async () => {
    const teacher = makeUser("teacher", "nino");
    const other = makeUser("teacher", "levan");
    const student = makeUser("student", "ana");
    const bytes = new TextEncoder().encode(smallDictionary());
    expect(hasDictionary(student)).toBe(false);

    await createMaterial({ owner: teacher, meta: meta({ title: "Private words", visibility: "private" }), fileName: "words.md", bytes });
    expect(lookupWord(teacher, "apple")?.matches[0].card.word).toBe("apple");
    expect(lookupWord(student, "apple")).toBeNull();
    expect(lookupWord(other, "apple")).toBeNull();

    await createMaterial({ owner: teacher, meta: meta({ title: "Shared words", visibility: "teachers" }), fileName: "shared.md", bytes: new TextEncoder().encode(smallDictionary().replace(/APPLE/g, "BANANA").replace(/Apple/g, "Banana")) });
    expect(lookupWord(other, "banana")?.matches[0].card.word).toBe("banana");
    expect(lookupWord(student, "banana")).toBeNull();

    await createMaterial({ owner: teacher, meta: meta({ title: "Student words", visibility: "students" }), fileName: "students.md", bytes: new TextEncoder().encode(smallDictionary().replace(/APPLE/g, "CHERRY")) });
    expect(lookupWord(student, "cherry")?.matches[0].card.word).toBe("cherry");
    // A dictionary the student can open does not have "apple": searched, nothing found.
    expect(lookupWord(student, "apple")?.matches).toEqual([]);
  });

  it("ignores a book that only looks a little like a dictionary", async () => {
    const teacher = makeUser("teacher", "nino");
    const text = Array.from({ length: 10 }, (_, i) => `WORD${i}   /w/  •  noun  •  A1\n\nSpanish:  x\n\nMeaning:  y\n\nExample:  z\n\n→  w`).join("\n\n");
    await createMaterial({ owner: teacher, meta: meta(), fileName: "few.md", bytes: new TextEncoder().encode(`# Few\n\n${text}`) });
    expect(hasDictionary(teacher)).toBe(false);
  });
});
