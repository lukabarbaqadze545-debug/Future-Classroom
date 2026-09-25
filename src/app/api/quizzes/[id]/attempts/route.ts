import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { getPublishedQuiz, studentAttemptView, submitQuizAttempt } from "@/lib/services/quizzes";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  rateLimit(`quiz-attempt:${user.id}`, 30, 60 * 60_000);
  const { id } = await params;
  const body = await readJson(req, z.object({ answers: z.record(z.string().max(40), z.unknown()) }));
  const attempt = submitQuizAttempt(id, user, body.answers);
  return json({ attemptId: attempt.id, result: studentAttemptView(getPublishedQuiz(id), attempt) }, { status: 201 });
});
