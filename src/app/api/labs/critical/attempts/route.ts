import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { submitAttempt } from "@/lib/labs/critical/service";

const schema = z.object({ exerciseId: z.string().max(40), answers: z.unknown() });

/** Grades a critical-thinking exercise deterministically and stores the attempt. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`ct:${user.id}`, 60, 60_000);
  const { exerciseId, answers } = await readJson(req, schema);
  return json({ attempt: submitAttempt(user, exerciseId, answers) }, { status: 201 });
});
