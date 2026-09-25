import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { getLessonForEditor } from "@/lib/services/lessons";
import { createQuiz } from "@/lib/services/quizzes";
import { generateQuiz } from "@/lib/ai/quiz-generator";

type Ctx = { params: Promise<{ id: string }> };
export const maxDuration = 180;

/** Creates a draft quiz from a lesson (AI, or built from the lesson's own questions). */
export const POST = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  rateLimit(`quiz:${user.id}`, 20, 60 * 60_000);
  const lesson = getLessonForEditor((await params).id, user);
  const generated = await generateQuiz(lesson, lesson.content);
  const quiz = createQuiz({ teacherId: user.id, lessonId: lesson.id, draft: generated.draft, origin: generated.source.kind === "ai" ? "ai" : "template" });
  return json({ quizId: quiz.id, source: generated.source }, { status: 201 });
});
