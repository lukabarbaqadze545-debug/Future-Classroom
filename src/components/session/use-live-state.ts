"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ClientApiError } from "@/lib/client/api";

export type ConnectionState = "live" | "reconnecting" | "offline";

/**
 * Keeps a piece of server state fresh for a live classroom session.
 *
 * - Server-Sent Events announce new versions; the client then re-fetches.
 * - If the event stream drops (school proxies, Wi-Fi hiccups) the hook polls
 *   every few seconds until the stream recovers.
 * - A slow safety poll catches anything missed. Existing state is kept while
 *   reconnecting, so a network blip never blanks the screen.
 */
export function useLiveState<T>({
  stateUrl,
  eventsUrl,
  initial,
  versionOf,
}: {
  stateUrl: string;
  eventsUrl: string;
  initial: T | null;
  versionOf: (data: T) => number;
}) {
  const [data, setData] = useState<T | null>(initial);
  const [connection, setConnection] = useState<ConnectionState>("live");
  const [error, setError] = useState<ClientApiError | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const version = useRef<number>(initial ? versionOf(initial) : -1);
  const inFlight = useRef(false);
  const again = useRef(false);
  const versionOfRef = useRef(versionOf);
  useEffect(() => {
    versionOfRef.current = versionOf;
  });

  const refetch = useCallback(async () => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        const next = await api<T>(stateUrl);
        const serverTime = (next as { serverTime?: number }).serverTime;
        if (typeof serverTime === "number") setClockOffset(serverTime - Date.now());
        version.current = versionOfRef.current(next);
        setData(next);
        setError(null);
      } while (again.current);
    } catch (e) {
      if (e instanceof ClientApiError) {
        if (e.code === "network") setConnection("offline");
        else setError(e);
      }
    } finally {
      inFlight.current = false;
    }
  }, [stateUrl]);

  /** Apply a state snapshot returned by a mutation (optimistic-fast path). */
  const replace = useCallback(
    (next: T) => {
      version.current = versionOfRef.current(next);
      setData(next);
    },
    [],
  );

  useEffect(() => {
    let source: EventSource | null = null;
    let fastPoll: ReturnType<typeof setInterval> | null = null;
    let disposed = false;
    const startFastPoll = () => {
      fastPoll ??= setInterval(() => void refetch(), 4000);
    };
    const stopFastPoll = () => {
      if (fastPoll) clearInterval(fastPoll);
      fastPoll = null;
    };
    const connect = () => {
      if (disposed) return;
      source = new EventSource(eventsUrl);
      source.addEventListener("version", (event) => {
        setConnection("live");
        stopFastPoll();
        try {
          const { version: v } = JSON.parse((event as MessageEvent).data) as { version: number };
          if (v !== version.current) void refetch();
        } catch {
          void refetch();
        }
      });
      source.onerror = () => {
        setConnection(navigator.onLine ? "reconnecting" : "offline");
        startFastPoll();
      };
    };
    connect();
    const safetyPoll = setInterval(() => void refetch(), 15000);
    const onOnline = () => {
      setConnection("reconnecting");
      void refetch();
    };
    const onOffline = () => setConnection("offline");
    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      source?.close();
      stopFastPoll();
      clearInterval(safetyPoll);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [eventsUrl, refetch]);

  return { data, refetch, replace, connection, error, clockOffset };
}
