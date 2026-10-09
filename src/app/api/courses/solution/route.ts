import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { revealSolution } from "@/lib/courses/service";

/** The reference solution, opened only for a program that passes every test. */
export const POST = handler(async (req) => {
  rateLimit(`course-solution:${clientKey(req)}`, 20, 60_000);
  const body = await readJson(req, z.object({ exerciseId: z.string().min(1).max(60), code: z.string().max(20_000) }));
  return json(revealSolution(body.exerciseId, body.code));
});
