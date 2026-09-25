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
}

const g = globalThis as typeof globalThis & { __fcBus?: EventEmitter };
const bus = (g.__fcBus ??= (() => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);
  return emitter;
})());

export function publishSessionUpdate(event: SessionEvent): void {
  bus.emit(`session:${event.sessionId}`, event);
}

export function subscribeToSession(sessionId: string, listener: (event: SessionEvent) => void): () => void {
  const channel = `session:${sessionId}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}
