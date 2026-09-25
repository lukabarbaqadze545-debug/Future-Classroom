import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getPublishedLesson, type LessonRecord } from "@/lib/services/lessons";
import { getAIProvider } from "@/lib/ai";
import { askTutor } from "@/lib/ai/tutor-service";

export const maxDuration = 60;

/** Hint-first study tutor. Conversations are not stored. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  if (!getAIProvider()) throw new ApiError(503, "ai_unavailable");
  rateLimit(`tutor:${user.id}`, 20, 60_000);
  const body = await readJson(
    req,
    z.object({
      lessonId: z.string().max(40).nullable().default(null),
      helpLevel: z.number().int().min(1).max(5).default(1),
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(20),
    }),
  );
  if (body.messages[body.messages.length - 1].role !== "user") throw new ApiError(400, "invalid_input");
  let lesson: LessonRecord | null = null;
  if (body.lessonId) lesson = getPublishedLesson(body.lessonId);
  try {
    return json({ reply: await askTutor({ lesson, helpLevel: body.helpLevel, messages: body.messages }) });
  } catch {
    throw new ApiError(502, "ai_failed");
  }
});
