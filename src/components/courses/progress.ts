"use client";

import { useSyncExternalStore } from "react";

/*
 * What the visitor has done in the courses, kept in this browser only (localStorage). A tiny external
 * store, like the one for the "Today" game: components subscribe to it directly, other tabs stay in step,
 * and a browser that refuses storage still works for as long as the page is open.
 */

const KEY = "fc:courses:v1";
const VERSION = 1;

export interface CourseProgress {
  v: typeof VERSION;
  /** Programming tasks: solved or not, and how many times they were checked. */
  exercises: Record<string, { done: boolean; attempts: number }>;
  /** Quiz questions and "what will it print?" programs answered correctly, by `lessonId/blockId`. */
  items: Record<string, true>;
  /** Lessons that were finished (all tasks solved); the XP for finishing is given once. */
  finished: Record<string, true>;
  /** The lesson opened last, for the "continue" button. */
  last: string | null;
}

const EMPTY: CourseProgress = { v: VERSION, exercises: {}, items: {}, finished: {}, last: null };

let cache: CourseProgress | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): CourseProgress {
  if (!raw) return EMPTY;
  try {
    const o = JSON.parse(raw) as Partial<CourseProgress> | null;
    if (!o || o.v !== VERSION) return EMPTY;
    const obj = <T,>(x: unknown): Record<string, T> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, T>) : {});
    return { v: VERSION, exercises: obj(o.exercises), items: obj(o.items), finished: obj(o.finished), last: typeof o.last === "string" ? o.last : null };
  } catch {
    return EMPTY;
  }
}

function load(): CourseProgress {
  if (cache) return cache;
  try {
    cache = parse(window.localStorage.getItem(KEY));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function save(next: CourseProgress): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage is unavailable: progress lives in memory for this page.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's progress (empty on the server and before the first render in the browser). */
export function useCourseProgress(): CourseProgress {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** Counts a check of a task. Returns true if this check solved it for the first time. */
export function recordCheck(exerciseId: string, passed: boolean): boolean {
  const p = load();
  const before = p.exercises[exerciseId] ?? { done: false, attempts: 0 };
  const firstSolve = passed && !before.done;
  save({ ...p, exercises: { ...p.exercises, [exerciseId]: { done: before.done || passed, attempts: before.attempts + 1 } } });
  return firstSolve;
}

/** Notes a correctly answered question or program. Returns true if it was the first time. */
export function recordItem(key: string): boolean {
  const p = load();
  if (p.items[key]) return false;
  save({ ...p, items: { ...p.items, [key]: true } });
  return true;
}

/** Notes that the lesson was finished. Returns true if it was the first time. */
export function recordFinished(lessonId: string): boolean {
  const p = load();
  if (p.finished[lessonId]) return false;
  save({ ...p, finished: { ...p.finished, [lessonId]: true } });
  return true;
}

export function recordVisit(lessonId: string): void {
  const p = load();
  if (p.last !== lessonId) save({ ...p, last: lessonId });
}

export function resetCourseProgress(): void {
  save(EMPTY);
  try {
    // The code the student wrote is kept next to it.
    for (const key of Object.keys(window.localStorage)) if (/^fc:draft:[^:]+:course:/.test(key)) window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

export interface LessonStats {
  tasksDone: number;
  tasksTotal: number;
  itemsDone: number;
  itemsTotal: number;
  /** Every task of the lesson is solved. */
  complete: boolean;
}

export function lessonStats(lessonId: string, exerciseIds: string[], itemIds: string[], p: CourseProgress): LessonStats {
  const tasksDone = exerciseIds.filter((id) => p.exercises[id]?.done).length;
  const itemsDone = itemIds.filter((id) => p.items[`${lessonId}/${id}`]).length;
  return { tasksDone, tasksTotal: exerciseIds.length, itemsDone, itemsTotal: itemIds.length, complete: exerciseIds.length > 0 ? tasksDone === exerciseIds.length : p.finished[lessonId] === true };
}
