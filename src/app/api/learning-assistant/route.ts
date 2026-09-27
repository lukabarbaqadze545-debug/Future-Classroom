import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { assistantRequestSchema, runAssistant } from "@/lib/services/learning-assistant";

export const maxDuration = 60;

/** One Learning Assistant task (explain, locate, evidence, check, questions, research). */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`assistant:${user.id}`, 40, 5 * 60_000);
  const body = await readJson(req, assistantRequestSchema);
  return json(await runAssistant(user, body));
});
