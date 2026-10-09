import { dayKey } from "@/lib/engagement/model";
import { getTimeZone } from "@/components/engagement/store";
import { addWord, emptyWords, parseWords, removeWord, reviewWord, type WordsState } from "@/lib/vocab/model";

/*
 * "My words", kept in this browser (localStorage) as a tiny external store that
 * components subscribe to directly (useSyncExternalStore) — no React context,
 * for the same reason as the engagement store: a context that changes right
 * after load makes React discard the server HTML of parts still streaming in.
 * Other tabs stay in step; a browser that refuses storage still works for as
 * long as the page is open.
 */
const KEY = "fc:words:v1";

let cache: WordsState | null = null;
const subscribers = new Set<() => void>();

const schoolDay = () => dayKey(new Date(), getTimeZone());

function read(): WordsState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked: start empty and keep the list in memory.
  }
  return parseWords(raw, schoolDay());
}

function write(state: WordsState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not saved; the page still shows it until it is closed.
  }
}

const emit = () => subscribers.forEach((notify) => notify());

function update(change: (state: WordsState, today: string) => WordsState): void {
  const current = getSnapshot() ?? emptyWords();
  const next = change(current, schoolDay());
  if (next === current) return;
  cache = next;
  write(next);
  emit();
}

/** The saved words; null on the server (and while it renders there). */
export function getSnapshot(): WordsState | null {
  if (typeof window === "undefined") return null;
  return (cache ??= read());
}

export const getServerSnapshot = (): WordsState | null => null;

export function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      cache = null;
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export const saveWord = (word: string) => update((state, today) => addWord(state, word, today));
export const saveWords = (words: string[]) => update((state, today) => words.reduce((s, word) => addWord(s, word, today), state));
export const forgetWord = (word: string) => update((state) => removeWord(state, word));
export const gradeWord = (word: string, correct: boolean) => update((state, today) => reviewWord(state, word, correct, today));

export function resetWords(): void {
  cache = emptyWords();
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to remove.
  }
  emit();
}
