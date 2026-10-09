import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { exerciseHint } from "@/lib/courses/service";

/** One hint of an exercise, when the student asks for it (hints are not sent with the page). */
export const POST = handler(async (req) => {
  rateLimit(`course-hint:${clientKey(req)}`, 60, 60_000);
  const body = await readJson(req, z.object({ exerciseId: z.string().min(1).max(60), n: z.number().int().min(1).max(3) }));
  return json({ hint: exerciseHint(body.exerciseId, body.n) });
});
