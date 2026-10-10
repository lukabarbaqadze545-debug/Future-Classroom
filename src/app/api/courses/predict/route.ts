import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { checkPredict } from "@/lib/courses/service";

/** Checks what a student thinks a program prints against what it really prints. */
export const POST = handler(async (req) => {
  rateLimit(`course-predict:${clientKey(req)}`, 120, 60_000);
  const body = await readJson(req, z.object({ lessonId: z.string().min(1).max(60), blockId: z.string().min(1).max(40), answer: z.string().max(4000) }));
  return json(checkPredict(body.lessonId, body.blockId, body.answer));
});
