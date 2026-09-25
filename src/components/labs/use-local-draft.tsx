"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

/*
 * Keeps unsaved work on this computer (localStorage), so a refresh, a closed
 * tab or a lost connection never loses a student's code or notes. Falls back
 * to memory when storage is unavailable (private windows, locked-down PCs).
 *
 * School workstations are shared, so drafts are kept per signed-in user and
 * removed when anyone signs out: the next student never sees them.
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

const DraftScope = createContext("guest");

/** Keeps drafts separate for each signed-in user (rendered once in the root layout). */
export function DraftScopeProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  return <DraftScope.Provider value={userId ?? "guest"}>{children}</DraftScope.Provider>;
}

/** Removes every draft stored on this computer (on sign-out). */
export function clearAllDrafts() {
  memory.clear();
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing was stored.
  }
  listeners.forEach((l) => l());
}

/** Returns the saved draft (or the fallback), a setter, a reset and whether a draft exists. */
export function useLocalDraft(draftKey: string, fallback: string): [string, (value: string) => void, () => void, boolean] {
  const key = `${useContext(DraftScope)}:${draftKey}`;
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback((value: string) => write(key, value), [key]);
  const reset = useCallback(() => write(key, null), [key]);
  return [stored ?? fallback, set, reset, stored !== null];
}

/** JSON variant for structured drafts (forms with several fields). */
export function useLocalJsonDraft<T>(key: string, fallback: T): [T, (value: T) => void, () => void, boolean] {
  const [raw, set, reset, hasDraft] = useLocalDraft(key, "");
  let value = fallback;
  if (hasDraft && raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  const setJson = useCallback((next: T) => set(JSON.stringify(next)), [set]);
  return [value, setJson, reset, hasDraft];
}
