import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { submit, submitSchema } from "@/lib/labs/programming/service";

export const maxDuration = 120;

/** Checks a programming answer. Student code is never executed on this server. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`prog-submit:${user.id}`, 60, 60_000);
  const input = await readJson(req, submitSchema);
  return json(await submit(user, input));
});
