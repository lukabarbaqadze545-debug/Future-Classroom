import { z } from "zod";
import { handler, json, readJson, clientKey } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { answerSchema } from "@/lib/domain/schemas";
import { isAnswerEmpty } from "@/lib/domain/grading";
import { getLocale } from "@/lib/i18n/server";
import { checkChallenge } from "@/lib/daily/pick";
import { todayInSchool } from "@/lib/services/daily";
import { CHALLENGE_TRIES } from "@/lib/engagement/model";

/**
 * Checks an answer to today's challenge. Open to everyone (the challenge needs
 * no account and keeps nothing on the server); the answer is only ever sent
 * back after a correct answer or the last wrong one.
 */
export const POST = handler(async (req) => {
  rateLimit(`daily:${clientKey(req)}`, 60, 60_000);
  const body = await readJson(req, z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), answer: answerSchema, attempt: z.number().int().min(1).max(CHALLENGE_TRIES) }));
  // The page was opened before midnight: today's question is another one now.
  if (body.day !== todayInSchool()) throw new ApiError(409, "stale_day");
  if (isAnswerEmpty(body.answer)) throw new ApiError(400, "invalid_input");
  const language = await getLocale();
  return json(checkChallenge(body.day, language, body.answer, body.attempt));
});
