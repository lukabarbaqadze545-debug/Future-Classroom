import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { submitChallenge } from "@/lib/labs/stem/service";

const schema = z.object({ kind: z.enum(["simulation", "challenge"]), id: z.string().max(40), answers: z.record(z.string().max(40), z.unknown()) });

/** Checks simulation and electronics/robotics challenge answers on the server. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`stem-check:${user.id}`, 60, 60_000);
  const { kind, id, answers } = await readJson(req, schema);
  return json(submitChallenge(user, kind, id, answers));
});
