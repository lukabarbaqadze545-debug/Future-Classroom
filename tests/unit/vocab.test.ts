import { describe, expect, it } from "vitest";
import { BOX_DAYS, MAX_WORDS, TOP_BOX, addWord, dueWords, emptyWords, hasWord, parseWords, practiceRound, removeWord, reviewWord, wordStats, type WordsState } from "@/lib/vocab/model";
import { XP, applyEvent, emptyState } from "@/lib/engagement/model";

const D1 = "2026-10-09";
const D2 = "2026-10-10";
const ctx = (today: string) => ({ today, hour: 15 });

function withWords(...words: string[]): WordsState {
  return words.reduce((s, w) => addWord(s, w, D1), emptyWords());
}

describe("Saving words", () => {
  it("saves a word once, due today, in the first box", () => {
    const s = addWord(emptyWords(), "  Afternoon ", D1);
    expect(s.words).toEqual([{ word: "afternoon", added: D1, box: 0, due: D1, reviews: 0, lapses: 0, last: null }]);
    expect(addWord(s, "AFTERNOON", D2)).toBe(s);
    expect(hasWord(s, "afternoon")).toBe(true);
  });

  it("ignores empty text and stops at the limit", () => {
    expect(addWord(emptyWords(), "   ", D1).words).toHaveLength(0);
    let s = emptyWords();
    for (let i = 0; i < MAX_WORDS + 5; i++) s = addWord(s, `word${i}`, D1);
    expect(s.words).toHaveLength(MAX_WORDS);
  });

  it("removes a word, and leaves the state alone when it was not there", () => {
    const s = withWords("a1", "b2");
    expect(removeWord(s, "A1").words.map((w) => w.word)).toEqual(["b2"]);
    expect(removeWord(s, "zzz")).toBe(s);
  });
});

describe("Spacing the repetitions", () => {
  it("moves a known word up a box and makes it wait longer each time", () => {
    let s = withWords("go");
    const dues: string[] = [];
    let day = D1;
    for (let i = 0; i < 7; i++) {
      s = reviewWord(s, "go", true, day);
      dues.push(s.words[0].due);
      day = s.words[0].due;
    }
    expect(s.words[0].box).toBe(TOP_BOX);
    expect(s.words[0].reviews).toBe(7);
    expect(s.words[0].lapses).toBe(0);
    // Gaps between reviews follow the boxes and stop growing at the top box.
    const gaps = dues.map((due, i) => Math.round((Date.parse(due) - Date.parse(i === 0 ? D1 : dues[i - 1])) / 86_400_000));
    expect(gaps).toEqual([BOX_DAYS[1], BOX_DAYS[2], BOX_DAYS[3], BOX_DAYS[4], BOX_DAYS[5], BOX_DAYS[5], BOX_DAYS[5]]);
  });

  it("sends a missed word back to the first box, due the same day", () => {
    let s = withWords("go");
    for (let i = 0; i < 3; i++) s = reviewWord(s, "go", true, D1);
    expect(s.words[0].box).toBe(3);
    s = reviewWord(s, "go", false, D2);
    expect(s.words[0]).toMatchObject({ box: 0, due: D2, lapses: 1, last: D2 });
  });

  it("lists what is due, the least known first, and nothing else", () => {
    let s = withWords("a", "b", "c");
    s = reviewWord(s, "b", true, D1); // box 1, due tomorrow
    s = reviewWord(s, "c", false, D1); // box 0, due today
    expect(dueWords(s, D1).map((w) => w.word)).toEqual(["a", "c"]);
    expect(dueWords(s, D2).map((w) => w.word)).toEqual(["a", "c", "b"]);
  });

  it("builds a round from the due words, and fills it with the soonest others only when asked", () => {
    let s = withWords("a", "b", "c", "d");
    s = reviewWord(s, "c", true, D1);
    s = reviewWord(s, "d", true, D1);
    expect(practiceRound(s, D1, 10).map((w) => w.word)).toEqual(["a", "b"]);
    expect(practiceRound(s, D1, 10, true).map((w) => w.word)).toEqual(["a", "b", "c", "d"]);
    expect(practiceRound(s, D1, 3, true)).toHaveLength(3);
    expect(practiceRound(s, D1, 1)).toHaveLength(1);
  });

  it("counts what is learning, known and done today", () => {
    let s = withWords("a", "b", "c");
    for (let i = 0; i < TOP_BOX; i++) s = reviewWord(s, "a", true, D1);
    s = reviewWord(s, "b", true, D1);
    expect(wordStats(s, D1)).toEqual({ total: 3, due: 1, learning: 2, known: 1, reviewedToday: 2 });
  });
});

describe("Reading what was stored", () => {
  it("round-trips", () => {
    let s = withWords("a", "b");
    s = reviewWord(s, "a", true, D1);
    expect(parseWords(JSON.stringify(s), D1)).toEqual(s);
  });

  it("starts empty for anything unreadable", () => {
    for (const raw of [null, "", "not json", "[]", "null", '{"v":2,"words":[]}', '{"v":1}', '{"v":1,"words":"x"}']) {
      expect(parseWords(raw, D1), String(raw)).toEqual(emptyWords());
    }
  });

  it("repairs bad entries and drops duplicates", () => {
    const raw = JSON.stringify({
      v: 1,
      words: [{ word: "Go", box: 99, due: "tomorrow", reviews: -3, lapses: "x" }, { word: "go" }, 5, null, { word: 7 }, { word: "  " }],
    });
    expect(parseWords(raw, D1).words).toEqual([{ word: "go", added: D1, box: TOP_BOX, due: D1, reviews: 0, lapses: 0, last: null }]);
  });
});

describe("Words in the Today game", () => {
  it("earns a little experience for a known word, up to a daily limit, and counts for the streak", () => {
    let state = emptyState(D1);
    const first = applyEvent(state, { kind: "word" }, ctx(D1));
    expect(first.delta.xp).toBe(XP.word);
    expect(first.delta.streakGrew).toBe(true);
    state = first.state;
    for (let i = 1; i < XP.wordDailyCap / XP.word + 5; i++) state = applyEvent(state, { kind: "word" }, ctx(D1)).state;
    expect(state.today.wordsXp).toBe(XP.wordDailyCap);
    expect(state.xp).toBe(XP.wordDailyCap);
    expect(state.totals.words).toBe(XP.wordDailyCap / XP.word + 5);
    // A new day starts the limit again.
    const next = applyEvent(state, { kind: "word" }, ctx(D2));
    expect(next.delta.xp).toBe(XP.word);
    expect(next.state.today).toMatchObject({ day: D2, words: 1, wordsXp: XP.word });
  });

  it("earns the word badges at 25 and 100 known words", () => {
    let state = emptyState(D1);
    const earned: string[] = [];
    let day = D1;
    for (let i = 1; i <= 100; i++) {
      if (i % 10 === 0) day = new Date(Date.parse(day) + 86_400_000).toISOString().slice(0, 10);
      const r = applyEvent(state, { kind: "word" }, ctx(day));
      state = r.state;
      earned.push(...r.delta.newBadges.filter((b) => b.startsWith("words")));
      if (i === 24) expect(state.badges.words25).toBeUndefined();
      if (i === 25) expect(state.badges.words25).toBeDefined();
    }
    expect(earned).toEqual(["words25", "words100"]);
  });
});
