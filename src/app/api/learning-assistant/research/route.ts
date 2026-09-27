import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { startResearch, startResearchSchema } from "@/lib/services/learning-assistant";

/** Starts a Research Lab project from a topic, with sources and quotations from the material. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`assistant-research:${user.id}`, 10, 10 * 60_000);
  const body = await readJson(req, startResearchSchema);
  return json(startResearch(user, body), { status: 201 });
});
