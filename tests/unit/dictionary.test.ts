import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DictionaryIndex, baseForms, fold, looksSpanish, parseDictionary, parseTranslations, typoDistance, type DictEntry } from "@/lib/knowledge/dictionary";

let entries: DictEntry[];
let index: DictionaryIndex;

beforeAll(() => {
  const md = readFileSync("content/books/english-spanish-learning-dictionary-1.md", "utf8");
  entries = parseDictionary([{ position: 0, content: md }]);
  index = new DictionaryIndex(entries);
});

describe("Reading the dictionary", () => {
  it("parses every one of the 2,000 entries with all its parts", () => {
    expect(entries).toHaveLength(2000);
    const counts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 } as Record<string, number>;
    for (const e of entries) {
      counts[e.level]++;
      expect(e.word, e.headword).toBe(e.headword.toLowerCase());
      // A word said two ways carries both: "/kloʊz/ (verb); /kloʊs/ (adjective)".
      expect(e.ipa, e.word).toMatch(/^\/.+\//);
      expect(e.pos.length, e.word).toBeGreaterThan(0);
      expect(e.translations.length, e.word).toBeGreaterThan(0);
      expect(e.meaning.length, e.word).toBeGreaterThan(3);
      expect(e.example.length, e.word).toBeGreaterThan(3);
      expect(e.exampleEs.length, e.word).toBeGreaterThan(3);
    }
    expect(counts).toEqual({ A1: 407, A2: 352, B1: 469, B2: 420, C1: 352 });
    expect(new Set(entries.map((e) => e.word)).size).toBe(2000);
  });

  it("reads one entry completely", () => {
    const e = index.get("afternoon")!;
    expect(e).toMatchObject({ headword: "AFTERNOON", ipa: "/ˌæftərˈnuːn/", pos: ["noun"], level: "A1", spanish: "la tarde" });
    expect(e.translations).toEqual([{ text: "la tarde", plain: "tarde", article: "la", note: null }]);
    expect(e.meaning).toBe("the part of the day between midday and evening");
    expect(e.example).toBe("We usually have lunch in the early afternoon.");
    expect(e.exampleEs).toBe("Normalmente almorzamos a primera hora de la tarde.");
    expect(e.common).toEqual(["this afternoon", "good afternoon", "in the afternoon"]);
  });

  it("splits several translations and keeps the book's notes apart", () => {
    expect(parseTranslations("el ordenador (Spain); la computadora (Latin America)")).toEqual([
      { text: "el ordenador", plain: "ordenador", article: "el", note: "Spain" },
      { text: "la computadora", plain: "computadora", article: "la", note: "Latin America" },
    ]);
    expect(parseTranslations("correcto/a; derecho/a; a la derecha").map((t) => t.text)).toEqual(["correcto/a", "derecho/a", "a la derecha"]);
  });

  it("keeps a note about a word with the word", () => {
    const withNote = entries.filter((e) => e.note);
    expect(withNote.length).toBeGreaterThan(50);
    expect(index.get("also")!.note).toContain("usually goes before the main verb");
  });
});

describe("Finding an English word", () => {
  const found = (q: string) => index.lookupEnglish(q).matches.map((m) => `${m.entry.word}:${m.how}`);

  it("finds a headword however it is written", () => {
    expect(found("afternoon")).toEqual(["afternoon:headword"]);
    expect(found("  Afternoon ")).toEqual(["afternoon:headword"]);
    expect(found("AFTERNOON")).toEqual(["afternoon:headword"]);
    expect(found("the afternoon")).toEqual(["afternoon:headword"]);
    expect(found("to have")).toEqual(["have:headword"]);
  });

  it("treats a hyphen and a space alike", () => {
    expect(found("living room")[0]).toBe("living-room:headword");
    expect(found("living-room")[0]).toBe("living-room:headword");
  });

  it("finds the word an inflected form comes from", () => {
    expect(found("went")).toEqual(["go:form"]);
    expect(found("children")).toEqual(["child:form"]);
    expect(found("studies")[0]).toBe("study:form");
    expect(found("stopped")[0]).toBe("stop:form");
    expect(found("running")[0]).toBe("run:form");
    expect(found("bigger")[0]).toBe("big:form");
    expect(found("happily")[0]).toBe("happy:form");
    expect(found("better")[0]).toBe("good:form");
    expect(found("was")[0]).toBe("be:form");
    expect(found("taken")[0]).toBe("take:form");
    expect(found("making")[0]).toBe("make:form");
    expect(found("boxes")[0]).toBe("box:form");
  });

  it("says which form was typed", () => {
    expect(index.lookupEnglish("went").matches[0].via).toBe("went");
  });

  it("finds a phrase listed under a headword", () => {
    expect(found("good afternoon")).toEqual(["afternoon:phrase"]);
  });

  it("suggests close spellings when nothing matches, nearest first", () => {
    const l = index.lookupEnglish("recieve");
    expect(l.matches.filter((m) => m.how !== "mention")).toEqual([]);
    expect(l.suggestions.map((e) => e.word)[0]).toBe("receive");
    expect(index.lookupEnglish("beutiful").suggestions.map((e) => e.word)[0]).toBe("beautiful");
    expect(index.lookupEnglish("afternon").suggestions.map((e) => e.word)[0]).toBe("afternoon");
    expect(index.lookupEnglish("freind").suggestions.map((e) => e.word)).toContain("friend");
  });

  it("does not guess when the word is a real entry", () => {
    expect(index.lookupEnglish("afternoon").suggestions).toEqual([]);
  });

  it("does not guess for very short words", () => {
    expect(index.similar("xq")).toEqual([]);
  });

  it("falls back to entries that use the word", () => {
    // "lunch" is used in AFTERNOON's example; if lunch is itself an entry the headword wins, so pick a word that is only used.
    const only = entries.flatMap((e) => e.example.toLowerCase().match(/[a-z]{5,}/g) ?? []).find((w) => !index.lookupEnglish(w).matches.some((m) => m.how === "headword" || m.how === "form"))!;
    const matches = index.lookupEnglish(only).matches;
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.how === "mention")).toBe(true);
  });
});

describe("Finding a Spanish word", () => {
  const found = (q: string) => index.lookupSpanish(q).matches.map((m) => `${m.entry.word}:${m.how}`);

  it("finds the English word from its Spanish translation, with or without the article", () => {
    expect(found("la tarde")[0]).toBe("afternoon:translation");
    expect(found("tarde")[0]).toBe("afternoon:translation");
    expect(found("Tarde")[0]).toBe("afternoon:translation");
    expect(found("el aire")).toEqual(["air:translation"]);
  });

  it("ignores accents when they are left out, and prefers them when given", () => {
    expect(found("habitacion").length).toBeGreaterThan(0);
    expect(found("habitación")[0]).toBe(found("habitacion")[0]);
  });

  it("finds a plural and the other gender", () => {
    expect(found("las tardes")[0]).toBe("afternoon:translation");
    expect(found("correcta")).toContain("correct:translation");
  });

  it("finds a word that is only part of a longer translation, and says so", () => {
    const l = index.lookupSpanish("baño");
    expect(l.matches.length).toBeGreaterThan(0);
    expect(l.matches.some((m) => m.how === "translation" || m.how === "contains")).toBe(true);
  });

  it("returns nothing for what the book does not have", () => {
    expect(found("zzzzzz")).toEqual([]);
  });

  it("recognises Spanish when it is typed", () => {
    expect(looksSpanish("la tarde")).toBe(true);
    expect(looksSpanish("niño")).toBe(true);
    expect(looksSpanish("¿qué?")).toBe(true);
    expect(looksSpanish("afternoon")).toBe(false);
    expect(looksSpanish("the afternoon")).toBe(false);
  });
});

describe("Suggestions while typing", () => {
  it("lists headwords that start with what was typed, easiest first, exact word first", () => {
    const list = index.suggest("af");
    expect(list.length).toBeGreaterThan(1);
    expect(list.every((s) => s.text.startsWith("af"))).toBe(true);
    // English headwords come first (easiest first); Spanish translations only fill what is left.
    const english = list.filter((s) => s.language === "en");
    const levels = english.map((s) => s.entry.level);
    expect(levels).toEqual([...levels].sort());
    expect(list.findIndex((s) => s.language === "es")).toBeGreaterThanOrEqual(english.length);
    expect(index.suggest("go")[0].text).toBe("go");
  });

  it("falls back to Spanish translations", () => {
    const list = index.suggest("tard");
    expect(list.some((s) => s.language === "es" && s.entry.word === "afternoon")).toBe(true);
  });

  it("gives nothing for nothing", () => {
    expect(index.suggest("")).toEqual([]);
    expect(index.suggest("qqqqq")).toEqual([]);
  });
});

describe("Word helpers", () => {
  it("folds accents and case", () => {
    expect(fold("  Ñandú  ")).toBe("nandu");
    expect(fold("Año")).toBe("ano");
  });

  it("counts a swap of neighbours as one mistake", () => {
    expect(typoDistance("recieve", "receive", 2)).toBe(1);
    expect(typoDistance("cat", "cart", 2)).toBe(1);
    expect(typoDistance("abc", "xyz", 1)).toBeGreaterThan(1);
  });

  it("lists the base forms a word may come from", () => {
    expect(baseForms("studied")).toContain("study");
    expect(baseForms("hoping")).toContain("hope");
    expect(baseForms("wives")).toContain("wife");
    expect(baseForms("is")).toContain("be");
  });
});

/** Measured over the whole book, so a change to the finder shows up as a number, not an anecdote. */
describe("How well the book is found", () => {
  it("finds every headword, and every headword from its first Spanish translation", () => {
    for (const e of entries) {
      expect(index.get(e.word), e.word).toBe(e);
      const found = index.lookupSpanish(e.translations[0].text).matches.map((m) => m.entry);
      expect(found, `${e.word} = ${e.translations[0].text}`).toContain(e);
    }
  });

  it("puts the word first when its Spanish translation is not shared with another", () => {
    let alone = 0;
    let first = 0;
    for (const e of entries) {
      const found = index.lookupSpanish(e.translations[0].text).matches;
      if (found.length === 1) {
        alone++;
        if (found[0].entry === e) first++;
      }
    }
    expect(alone).toBeGreaterThan(1500);
    expect(first).toBe(alone);
  });

  it("finds the right word for a misspelling nine times in ten at the top, almost always in the first three", () => {
    const mistakes = [
      (w: string, i: number) => w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2), // two letters swapped
      (w: string, i: number) => w.slice(0, i) + w.slice(i + 1), // a letter missing
      (w: string, i: number) => w.slice(0, i) + w[i] + w.slice(i), // a letter doubled
    ];
    let total = 0;
    let top1 = 0;
    let top3 = 0;
    entries.forEach((e, n) => {
      if (n % 3 !== 0 || e.word.length < 6 || e.word.includes("-")) return;
      for (const mistake of mistakes) {
        const typed = mistake(e.word, Math.floor(e.word.length / 2));
        const lookup = index.lookupEnglish(typed);
        // Only real mistakes: not another word of the book and not a form of one.
        if (typed === e.word || lookup.matches.some((m) => m.how !== "mention")) continue;
        total++;
        const guesses = lookup.suggestions.map((s) => s.word);
        if (guesses[0] === e.word) top1++;
        if (guesses.slice(0, 3).includes(e.word)) top3++;
      }
    });
    expect(total).toBeGreaterThan(1000);
    expect(top1 / total).toBeGreaterThan(0.95);
    expect(top3 / total).toBeGreaterThan(0.99);
  });

  it("finds the base word of regular verb and noun forms", () => {
    let total = 0;
    let found = 0;
    entries.forEach((e, n) => {
      if (n % 2 !== 0 || e.word.includes("-") || !e.pos.includes("verb")) return;
      const w = e.word;
      for (const form of [w.endsWith("e") ? `${w}d` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ied` : `${w}ed`, w.endsWith("e") ? `${w.slice(0, -1)}ing` : `${w}ing`]) {
        if (index.get(form) || IRREGULAR_ENOUGH.has(w)) continue;
        total++;
        if (index.lookupEnglish(form).matches.some((m) => m.entry === e && m.how === "form")) found++;
      }
    });
    expect(total).toBeGreaterThan(400);
    expect(found / total).toBeGreaterThan(0.99);
  });
});

/** Verbs whose regular-looking forms are words of their own or spelled differently (bing, panicked…). */
const IRREGULAR_ENOUGH = new Set(["be"]);
