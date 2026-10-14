import { addDays } from "@/lib/engagement/model";

/**
 * "My words": the words a visitor chose to learn, and when to see each again.
 *
 * Spaced repetition in its plainest form (Leitner boxes): a word you know
 * moves up a box and comes back later; a word you miss goes back to the first
 * box and comes back today. Pure: the list lives in the visitor's own browser
 * (see `components/vocab/store.ts`), so it works for everyone who opens the
 * site and on a host that keeps no data between visits.
 *
 * This is for studying, not assessment: the visitor grades themselves and
 * nothing here is ever sent to a teacher.
 */

export const WORDS_VERSION = 1;
export const MAX_WORDS = 500;

/** Days until a word is due again, by the box it is in. Box 0 is "new, or missed": due the same day. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const TOP_BOX = BOX_DAYS.length - 1;

export interface SavedWord {
  /** The headword, lower case: "afternoon". */
  word: string;
  /** The school day it was saved. */
  added: string;
  box: number;
  /** The school day it is next due (YYYY-MM-DD). */
  due: string;
  reviews: number;
  lapses: number;
  last: string | null;
}

export interface WordsState {
  v: typeof WORDS_VERSION;
  words: SavedWord[];
}

export const emptyWords = (): WordsState => ({ v: WORDS_VERSION, words: [] });

const clean = (word: string) => word.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);

export const hasWord = (state: WordsState, word: string) => state.words.some((w) => w.word === clean(word));

/** Saves a word, due today. Saving a word twice, or past the limit, changes nothing. */
export function addWord(state: WordsState, word: string, today: string): WordsState {
  const w = clean(word);
  if (!w || hasWord(state, w) || state.words.length >= MAX_WORDS) return state;
  return { ...state, words: [{ word: w, added: today, box: 0, due: today, reviews: 0, lapses: 0, last: null }, ...state.words] };
}

export function removeWord(state: WordsState, word: string): WordsState {
  const w = clean(word);
  return state.words.some((x) => x.word === w) ? { ...state, words: state.words.filter((x) => x.word !== w) } : state;
}

/** Records an answer: a known word moves up a box and waits longer; a missed one starts again and is due today. */
export function reviewWord(state: WordsState, word: string, correct: boolean, today: string): WordsState {
  const w = clean(word);
  return {
    ...state,
    words: state.words.map((x) => {
      if (x.word !== w) return x;
      const box = correct ? Math.min(TOP_BOX, x.box + 1) : 0;
      return { ...x, box, due: addDays(today, BOX_DAYS[box]), reviews: x.reviews + 1, lapses: x.lapses + (correct ? 0 : 1), last: today };
    }),
  };
}

/** Words to see now: those whose day has come, the least known first. */
export function dueWords(state: WordsState, today: string): SavedWord[] {
  return state.words.filter((w) => w.due <= today).sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.word.localeCompare(b.word));
}

export interface WordStats {
  total: number;
  due: number;
  /** Words still being learned (the first boxes). */
  learning: number;
  /** Words known well (the top box: not due for a month). */
  known: number;
  reviewedToday: number;
}

export function wordStats(state: WordsState, today: string): WordStats {
  return {
    total: state.words.length,
    due: dueWords(state, today).length,
    learning: state.words.filter((w) => w.box < TOP_BOX).length,
    known: state.words.filter((w) => w.box >= TOP_BOX).length,
    reviewedToday: state.words.filter((w) => w.last === today).length,
  };
}

/**
 * The words of one practice round: those that are due, up to `size`. With
 * `anyway`, words that are not due yet fill what is left (the ones due soonest), so
 * a visitor who wants to practise more is not told to come back tomorrow.
 */
export function practiceRound(state: WordsState, today: string, size = 10, anyway = false): SavedWord[] {
  const due = dueWords(state, today);
  if (due.length >= size || !anyway) return due.slice(0, size);
  const rest = state.words.filter((w) => w.due > today).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.word.localeCompare(b.word));
  return [...due, ...rest].slice(0, size);
}

/* ------------------------------ storage format ----------------------------- */

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);

/** Reads what was stored; anything unreadable or from an unknown version starts with an empty list. Never throws. */
export function parseWords(raw: string | null, today: string): WordsState {
  if (!raw) return emptyWords();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyWords();
  }
  if (!data || typeof data !== "object" || (data as { v?: unknown }).v !== WORDS_VERSION) return emptyWords();
  const list = (data as { words?: unknown }).words;
  if (!Array.isArray(list)) return emptyWords();
  const seen = new Set<string>();
  const words: SavedWord[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.word !== "string") continue;
    const word = clean(o.word);
    if (!word || seen.has(word)) continue;
    seen.add(word);
    words.push({
      word,
      added: typeof o.added === "string" && DAY.test(o.added) ? o.added : today,
      box: Math.min(TOP_BOX, count(o.box)),
      due: typeof o.due === "string" && DAY.test(o.due) ? o.due : today,
      reviews: count(o.reviews),
      lapses: count(o.lapses),
      last: typeof o.last === "string" && DAY.test(o.last) ? o.last : null,
    });
    if (words.length >= MAX_WORDS) break;
  }
  return { v: WORDS_VERSION, words };
}
