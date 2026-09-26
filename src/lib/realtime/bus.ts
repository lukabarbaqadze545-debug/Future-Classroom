import { EventEmitter } from "node:events";

/**
 * In-process pub/sub for classroom sessions. Events only carry the new
 * session version — clients re-fetch state they are allowed to see, so no
 * data is ever pushed to a client that did not request it.
 *
 * The classroom server runs as a single Node process (one school server), so
 * an in-memory emitter is enough. Clients also poll as a fallback, which keeps
 * sessions working behind proxies that break Server-Sent Events.
 */
export interface SessionEvent {
  sessionId: string;
  version: number;
  /**
   * Who needs to re-fetch. "staff" changes (a student joined, answered or asked
   * for a hint while results are hidden) do not change any student's screen, so
   * students are not notified — otherwise every answer would make the whole
   * class re-fetch at once.
   */
  audience: "all" | "staff";
}

const g = globalThis as typeof globalThis & { __fcBus?: EventEmitter; __fcShuttingDown?: boolean };
const bus = (g.__fcBus ??= (() => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);
  // Live lessons keep event streams open and browsers poll on kept-alive
  // connections, so the server's graceful shutdown would wait forever and a
  // service restart would hang. On a stop signal: close the streams, refuse
  // new ones, and exit after a short grace period. Answers are idempotent and
  // browsers retry, so nothing is lost; they reconnect when the server is back.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      g.__fcShuttingDown = true;
      emitter.emit("shutdown");
      setTimeout(() => process.exit(0), 3000).unref();
      // Nobody else handles the signal (e.g. a script): keep its default effect.
      if (process.listenerCount(signal) === 0) process.kill(process.pid, signal);
    });
  }
  return emitter;
})());

/** True once the server has been asked to stop. */
export function isShuttingDown(): boolean {
  return g.__fcShuttingDown === true;
}

export function publishSessionUpdate(event: SessionEvent): void {
  // FC_DEBUG_EVENTS=1 logs every event, e.g. to check who is notified during a lesson.
  if (process.env.FC_DEBUG_EVENTS) console.log(`[events] session ${event.sessionId} v${event.version} → ${event.audience}`);
  bus.emit(`session:${event.sessionId}`, event);
}

/** Called once when the server is asked to stop. */
export function onShutdown(listener: () => void): () => void {
  bus.once("shutdown", listener);
  return () => bus.off("shutdown", listener);
}

export function subscribeToSession(sessionId: string, listener: (event: SessionEvent) => void): () => void {
  const channel = `session:${sessionId}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}
