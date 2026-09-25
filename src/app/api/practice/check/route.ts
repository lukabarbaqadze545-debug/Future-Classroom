import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { answerSchema } from "@/lib/domain/schemas";
import { describeAnswer, gradeActivity, isAnswerEmpty } from "@/lib/domain/grading";
import { getPublishedLesson } from "@/lib/services/lessons";
import { recordLearningEvent } from "@/lib/services/progress";

/** Self-study practice: checks an answer on the server so answers never ship to the browser early. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  rateLimit(`practice:${user.id}`, 120, 60_000);
  const body = await readJson(req, z.object({ lessonId: z.string().max(40), activityId: z.string().max(40), answer: answerSchema }));
  const lesson = getPublishedLesson(body.lessonId);
  const activity = lesson.content.activities.find((a) => a.id === body.activityId);
  if (!activity) throw new ApiError(404, "not_found");
  if (isAnswerEmpty(body.answer)) throw new ApiError(400, "invalid_input");
  const isCorrect = gradeActivity(activity, body.answer);
  recordLearningEvent({
    userId: user.id,
    kind: "practice",
    subject: lesson.subject,
    topic: lesson.topic,
    lessonId: lesson.id,
    refId: lesson.id,
    correct: isCorrect,
    detail: { prompt: activity.prompt, given: describeAnswer(body.answer, activity.options), activityId: activity.id },
  });
  return json({ isCorrect, explanation: isCorrect !== false ? activity.explanation : "" });
});
