import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { checkQuiz } from "@/lib/courses/service";

/** Checks one answer of a lesson quiz; the right answer is returned together with the explanation. */
export const POST = handler(async (req) => {
  rateLimit(`course-quiz:${clientKey(req)}`, 120, 60_000);
  const body = await readJson(req, z.object({ lessonId: z.string().min(1).max(60), blockId: z.string().min(1).max(40), choice: z.number().int().min(0).max(9) }));
  return json(checkQuiz(body.lessonId, body.blockId, body.choice));
});
