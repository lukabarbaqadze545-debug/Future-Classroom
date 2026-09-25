import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { createQuiz } from "@/lib/services/quizzes";
import { SUBJECTS } from "@/lib/domain/catalog";

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const body = await readJson(req, z.object({ title: z.string().trim().min(1).max(160), subject: z.enum(SUBJECTS), grade: z.number().int().min(1).max(12) }));
  const quiz = createQuiz({ teacherId: user.id, origin: "manual", draft: { ...body, topic: "", feedbackMode: "full", questions: [] } });
  return json({ quizId: quiz.id }, { status: 201 });
});
