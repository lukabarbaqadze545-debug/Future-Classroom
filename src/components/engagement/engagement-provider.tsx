"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { onApiSuccess } from "@/lib/client/api";
import { useI18n } from "@/lib/i18n/client";
import { eventFromApiCall } from "@/lib/engagement/api-events";
import { XP, streakOf, type Delta, type EngagementEvent, type EngagementState } from "@/lib/engagement/model";
import { Sheen, Toasts, type Toast } from "./celebration";
import * as store from "./store";

export interface EngagementApi {
  /** False on the server and until the browser's saved state has been read. */
  ready: boolean;
  state: EngagementState | null;
  /** The school day now ("" on the server). */
  today: string;
  /** The hour of the day now (0–23), for greetings. */
  hour: number;
  timeZone: string;
  streak: number;
  doneToday: boolean;
  /** Records something the visitor did and celebrates what it earned. */
  award: (event: EngagementEvent) => Delta;
  /** The light across the top of the window. */
  celebrate: () => void;
  rename: (name: string) => void;
  reset: () => void;
}

/**
 * The visitor's game state. Reads the browser's store directly, so it changes
 * nothing for components that do not use it (see the note in store.ts).
 */
export function useEngagement(): EngagementApi {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const clock = useSyncExternalStore(store.subscribeClock, store.getClock, store.getServerClock);
  return useMemo<EngagementApi>(() => {
    const { streak, doneToday } = state ? streakOf(state.days, clock.day) : { streak: 0, doneToday: false };
    return { ready: state !== null, state, today: clock.day, hour: clock.hour, timeZone: store.getTimeZone(), streak, doneToday, award: store.award, celebrate: store.sheen, rename: store.rename, reset: store.resetAll };
  }, [state, clock]);
}

let nextToast = 1;

/** Shows what the visitor earns (toasts and a light across the top) and counts real activity anywhere on the platform. Renders no context. */
export function EngagementProvider({ timeZone, children }: { timeZone: string; children: ReactNode }) {
  store.setTimeZone(timeZone);
  const { dict } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sheen, setSheen] = useState(0);

  const push = useCallback((toast: Omit<Toast, "id">, ms: number) => {
    const id = nextToast++;
    setToasts((list) => [...list.slice(-3), { ...toast, id }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), ms);
  }, []);

  const shine = useCallback(() => {
    setSheen((n) => n + 1);
    setTimeout(() => setSheen(0), 1300);
  }, []);

  useEffect(
    () =>
      store.onCelebration((celebration) => {
        if (celebration.kind === "sheen") return shine();
        const delta = celebration.delta;
        if (delta.streakGrew) push({ kind: "streak", streak: delta.streak }, 4200);
        const plainXp = delta.xp - (delta.chest ? XP.chest : 0);
        if (plainXp > 0) push({ kind: "xp", xp: plainXp }, 2600);
        const names = delta.newBadges.map((id) => (dict.today.badges.list as Record<string, { name: string }>)[id]?.name ?? id);
        if (delta.newBadges.length === 1) push({ kind: "badge", badge: delta.newBadges[0] }, 5200);
        else if (delta.newBadges.length > 1) push({ kind: "badges", names }, 5600);
        if (delta.levelUp) push({ kind: "level", level: delta.levelUp }, 5600);
        if (delta.chest) push({ kind: "chest", xp: XP.chest }, 4600);
        if (delta.levelUp || delta.chest || delta.newBadges.length > 0) shine();
      }),
    [push, shine, dict],
  );

  // Real activity anywhere on the platform earns experience.
  useEffect(
    () =>
      onApiSuccess(({ url, method, data }) => {
        const event = eventFromApiCall(url, method, data);
        if (event) store.award(event);
      }),
    [],
  );

  return (
    <>
      {children}
      {sheen > 0 ? <Sheen key={sheen} /> : null}
      <Toasts toasts={toasts} onClose={(id) => setToasts((list) => list.filter((t) => t.id !== id))} />
    </>
  );
}
