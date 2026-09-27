import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { listSaved, saveQuestion, saveQuestionSchema } from "@/lib/services/learning-assistant";

export const GET = handler(async () => {
  const user = await requireApiUser();
  return json({ saved: listSaved(user) });
});

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`assistant-save:${user.id}`, 60, 10 * 60_000);
  const body = await readJson(req, saveQuestionSchema);
  return json({ saved: saveQuestion(user, body) }, { status: 201 });
});
