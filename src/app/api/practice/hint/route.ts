import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getPublishedLesson } from "@/lib/services/lessons";
import { getHint } from "@/lib/ai/hint-service";

export const maxDuration = 60;

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`practice-hint:${user.id}`, 60, 60_000);
  const body = await readJson(req, z.object({ lessonId: z.string().max(40), activityId: z.string().max(40), level: z.number().int().min(1).max(5) }));
  const lesson = getPublishedLesson(body.lessonId);
  const activity = lesson.content.activities.find((a) => a.id === body.activityId);
  if (!activity) throw new ApiError(404, "not_found");
  return json({ hint: await getHint({ activity, level: body.level }) });
});
