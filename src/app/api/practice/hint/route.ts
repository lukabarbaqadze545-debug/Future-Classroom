import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getPublishedLesson } from "@/lib/services/lessons";
import { getHint, isSolutionLevel } from "@/lib/ai/hint-service";

export const maxDuration = 60;

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`practice-hint:${user.id}`, 60, 60_000);
  const body = await readJson(req, z.object({ lessonId: z.string().max(40), activityId: z.string().max(40), level: z.number().int().min(1).max(5) }));
  const lesson = getPublishedLesson(body.lessonId);
  const activity = lesson.content.activities.find((a) => a.id === body.activityId);
  if (!activity) throw new ApiError(404, "not_found");
  // The full solution contains the answer: a student sees it only after checking an answer once.
  if (user.role === "student" && isSolutionLevel(activity, body.level)) {
    const attempted = getDb()
      .prepare("SELECT 1 FROM learning_events WHERE user_id = ? AND kind = 'practice' AND lesson_id = ? AND json_extract(detail, '$.activityId') = ? LIMIT 1")
      .get(user.id, lesson.id, activity.id);
    if (!attempted) throw new ApiError(409, "attempt_first");
  }
  return json({ hint: await getHint({ activity, level: body.level }) });
});
