import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { deleteQuiz, getQuizForEditor, updateQuiz } from "@/lib/services/quizzes";
import { quizDraftSchema } from "@/lib/domain/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json({ quiz: getQuizForEditor((await params).id, user) });
});

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const draft = await readJson(req, quizDraftSchema);
  return json({ quiz: updateQuiz((await params).id, user, draft) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteQuiz((await params).id, user);
  return new Response(null, { status: 204 });
});
