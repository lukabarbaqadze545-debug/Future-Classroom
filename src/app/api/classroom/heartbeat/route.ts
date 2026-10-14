import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { recordHeartbeat } from "@/lib/services/classroom";

const schema = z.object({
  tabId: z.string().min(1).max(40),
  path: z.string().max(2000),
  title: z.string().max(500).default(""),
  visible: z.boolean(),
  idleMs: z.number().int().min(0).max(1e9).default(0),
});

/** A student's browser reports which platform page is open, and gets back what the teacher sent. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const body = await readJson(req, schema);
  return json({ state: recordHeartbeat(user, body) });
});
