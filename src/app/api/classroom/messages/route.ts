import { z } from "zod";
import { handler, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { markMessagesRead } from "@/lib/services/classroom";

/** The student closed the teacher's messages. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const { ids } = await readJson(req, z.object({ ids: z.array(z.string().max(40)).max(50) }));
  markMessagesRead(user, ids);
  return new Response(null, { status: 204 });
});
