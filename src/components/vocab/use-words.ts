"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getClock, getServerClock, subscribeClock } from "@/components/engagement/store";
import { dueWords, hasWord, wordStats, type SavedWord, type WordStats } from "@/lib/vocab/model";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";

export interface UseWords {
  /** False on the server and during hydration: nothing about the saved list is known yet. */
  ready: boolean;
  words: SavedWord[];
  today: string;
  stats: WordStats;
  due: SavedWord[];
  has: (word: string) => boolean;
}

const EMPTY: WordStats = { total: 0, due: 0, learning: 0, known: 0, reviewedToday: 0 };

/** The visitor's saved words, live. Subscribes to the store directly; there is no context. */
export function useWords(): UseWords {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const clock = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  return useMemo(() => {
    if (!state || !clock.day) return { ready: false, words: [], today: clock.day, stats: EMPTY, due: [], has: () => false };
    return {
      ready: true,
      words: state.words,
      today: clock.day,
      stats: wordStats(state, clock.day),
      due: dueWords(state, clock.day),
      has: (word: string) => hasWord(state, word),
    };
  }, [state, clock.day]);
}
