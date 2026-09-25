"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Keeps unsaved work on this computer (localStorage), so a refresh, a closed
 * tab or a lost connection never loses a student's code or notes. Falls back
 * to memory when storage is unavailable (private windows, locked-down PCs).
 */
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();
const PREFIX = "fc:draft:";

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    const stored = window.localStorage.getItem(PREFIX + key);
    memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  memory.set(key, value);
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage unavailable: the draft lives in memory for this page.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    // Another tab changed a draft: forget our cached copy and re-read.
    if (event.key?.startsWith(PREFIX)) {
      memory.delete(event.key.slice(PREFIX.length));
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns the saved draft (or the fallback), a setter and a reset. */
export function useLocalDraft(key: string, fallback: string): [string, (value: string) => void, () => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback((value: string) => write(key, value), [key]);
  const reset = useCallback(() => write(key, null), [key]);
  return [stored ?? fallback, set, reset];
}

/** JSON variant for structured drafts (forms with several fields). */
export function useLocalJsonDraft<T>(key: string, fallback: T): [T, (value: T) => void, () => void] {
  const [raw, set, reset] = useLocalDraft(key, "");
  let value = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  const setJson = useCallback((next: T) => set(JSON.stringify(next)), [set]);
  return [value, setJson, reset];
}
