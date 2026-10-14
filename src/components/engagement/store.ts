import { applyEvent, dayKey, emptyState, hourIn, parseState, withName, type Delta, type EngagementEvent, type EngagementState } from "@/lib/engagement/model";

/*
 * Components subscribe to this store directly (useSyncExternalStore); there is
 * deliberately no React context carrying the state. A context whose value
 * changes right after the page loads makes React throw away the server HTML of
 * every part of the page that is still streaming in and render it again in the
 * browser (it cannot know that nothing in it reads the context).
 */

/**
 * The visitor's streak, experience and badges, kept in this browser
 * (localStorage). It is a tiny external store so React can subscribe to it,
 * other tabs stay in step, and a browser that refuses storage still works for
 * as long as the page is open.
 */
const KEY = "fc:engagement:v1";

let timeZone = "Asia/Tbilisi";
let cache: EngagementState | null = null;
const subscribers = new Set<() => void>();

export function setTimeZone(zone: string): void {
  if (zone !== timeZone) {
    timeZone = zone;
    cache = null;
    clock = null;
  }
}

export const getTimeZone = () => timeZone;

// --- The clock: the school day and hour now, refreshed every half minute while anything listens ---

export interface Clock {
  day: string;
  hour: number;
}
const SERVER_CLOCK: Clock = { day: "", hour: 12 };
let clock: Clock | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;
const clockSubscribers = new Set<() => void>();

const readClock = (): Clock => {
  const now = new Date();
  return { day: dayKey(now, timeZone), hour: hourIn(now, timeZone) };
};

export const getServerClock = (): Clock => SERVER_CLOCK;

export function getClock(): Clock {
  if (typeof window === "undefined") return SERVER_CLOCK;
  return (clock ??= readClock());
}

export function subscribeClock(notify: () => void): () => void {
  clockSubscribers.add(notify);
  clockTimer ??= setInterval(() => {
    const next = readClock();
    if (!clock || next.day !== clock.day || next.hour !== clock.hour) {
      clock = next;
      clockSubscribers.forEach((listener) => listener());
    }
  }, 30_000);
  return () => {
    clockSubscribers.delete(notify);
    if (clockSubscribers.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

// --- Celebrations: what the provider shows when something was earned ---

export type Celebration = { kind: "earned"; delta: Delta } | { kind: "sheen" };
const celebrationListeners = new Set<(celebration: Celebration) => void>();

export function onCelebration(listener: (celebration: Celebration) => void): () => void {
  celebrationListeners.add(listener);
  return () => void celebrationListeners.delete(listener);
}

const celebrate = (celebration: Celebration) => celebrationListeners.forEach((listener) => listener(celebration));

/** The light across the top of the window. */
export const sheen = () => celebrate({ kind: "sheen" });

const schoolDay = () => dayKey(new Date(), timeZone);

function read(): EngagementState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private window, site data off): start fresh and keep the state in memory.
  }
  return parseState(raw, schoolDay());
}

function write(state: EngagementState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not saved; the page still shows it until it is closed.
  }
}

const emit = () => subscribers.forEach((notify) => notify());

/** The current state in the browser; null on the server (and while it renders there). */
export function getSnapshot(): EngagementState | null {
  if (typeof window === "undefined") return null;
  return (cache ??= read());
}

export const getServerSnapshot = (): EngagementState | null => null;

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

/** Records one thing the visitor did and celebrates what it earned. */
export function award(event: EngagementEvent): Delta {
  const delta = record(event);
  celebrate({ kind: "earned", delta });
  return delta;
}

function record(event: EngagementEvent): Delta {
  const now = new Date();
  const current = getSnapshot() ?? emptyState(schoolDay());
  const { state, delta } = applyEvent(current, event, { today: dayKey(now, timeZone), hour: hourIn(now, timeZone) });
  cache = state;
  write(state);
  emit();
  return delta;
}

export function rename(name: string): void {
  const current = getSnapshot() ?? emptyState(schoolDay());
  cache = withName(current, name);
  write(cache);
  emit();
}

export function resetAll(): void {
  cache = emptyState(schoolDay());
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to remove.
  }
  emit();
}
