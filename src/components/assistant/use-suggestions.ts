"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import type { WordSuggestion } from "@/lib/services/dictionary";

const GEORGIAN = /[Ⴀ-ჿᲐ-Ჿ]/;

/** Only a word or two: a sentence being typed is not a look-up. */
export function looksLikeWord(text: string): boolean {
  const t = text.trim();
  return t.length >= 2 && t.length <= 30 && t.split(/\s+/).length <= 2 && !/[?？!.,;:]/.test(t) && !GEORGIAN.test(t);
}

/**
 * Words and Spanish translations that start with what is being typed. Waits a
 * moment after the last key, asks for nothing while a sentence is typed, and
 * remembers earlier answers. A failed request just means no suggestions.
 */
export function useWordSuggestions(text: string, enabled: boolean): WordSuggestion[] {
  const [answers, setAnswers] = useState<Record<string, WordSuggestion[]>>({});
  const query = text.trim().toLowerCase();
  const wanted = enabled && looksLikeWord(query);
  const known = answers[query];

  useEffect(() => {
    if (!wanted || known) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await api<{ suggestions: WordSuggestion[] }>(`/api/learning-assistant/words?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        setAnswers((previous) => ({ ...Object.fromEntries(Object.entries(previous).slice(-49)), [query]: response.suggestions }));
      } catch {
        // No suggestions this time.
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, wanted, known]);

  return wanted && known ? known : [];
}
