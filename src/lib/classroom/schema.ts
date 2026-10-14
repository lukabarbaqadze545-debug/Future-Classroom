import { z } from "zod";

/** A day, the longest "no keyboard or mouse use" the server records. */
export const MAX_IDLE_MS = 24 * 60 * 60_000;

/**
 * What a student's browser reports about the open page. A silly idle time
 * (a clock that has not started, a wrong clock) is clamped, never refused: a
 * refused report would show the student as offline.
 */
export const heartbeatSchema = z.object({
  tabId: z.string().min(1).max(40),
  path: z.string().max(2000),
  title: z.string().max(500).default(""),
  visible: z.boolean(),
  idleMs: z
    .number()
    .finite()
    .default(0)
    .transform((n) => Math.round(Math.min(Math.max(n, 0), MAX_IDLE_MS))),
});
