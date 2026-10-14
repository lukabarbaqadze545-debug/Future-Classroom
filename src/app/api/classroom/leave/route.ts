import { z } from "zod";
import { handler, readJson } from "@/lib/http/api";
import { getCurrentUser } from "@/lib/auth/session";
import { recordLeave } from "@/lib/services/classroom";

/** The student closed the tab (sent with keepalive while the page unloads). */
export const POST = handler(async (req) => {
  const user = await getCurrentUser();
  const { tabId } = await readJson(req, z.object({ tabId: z.string().min(1).max(40) }));
  if (user) recordLeave(user, tabId);
  return new Response(null, { status: 204 });
});
