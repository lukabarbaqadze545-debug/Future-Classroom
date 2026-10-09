import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { checkExercise } from "@/lib/courses/service";

/**
 * Checks a student's program against the hidden tests of a course exercise. Open to everyone (the
 * course needs no account); the tests and the reference solution never leave the server.
 */
export const POST = handler(async (req) => {
  rateLimit(`course-check:${clientKey(req)}`, 40, 60_000);
  const body = await readJson(req, z.object({ exerciseId: z.string().min(1).max(60), code: z.string().max(20_000) }));
  return json(checkExercise(body.exerciseId, body.code));
});
