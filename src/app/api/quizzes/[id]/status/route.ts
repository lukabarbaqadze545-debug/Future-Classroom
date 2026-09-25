import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { setQuizStatus } from "@/lib/services/quizzes";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { status } = await readJson(req, z.object({ status: z.enum(["draft", "published"]) }));
  return json({ quiz: setQuizStatus((await params).id, user, status) });
});
