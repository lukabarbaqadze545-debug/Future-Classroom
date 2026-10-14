import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { heartbeatSchema } from "@/lib/classroom/schema";
import { recordHeartbeat } from "@/lib/services/classroom";

/** A student's browser reports which platform page is open, and gets back what the teacher sent. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const body = await readJson(req, heartbeatSchema);
  return json({ state: recordHeartbeat(user, body) });
});
