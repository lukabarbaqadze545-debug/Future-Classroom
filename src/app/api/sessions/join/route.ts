import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { setParticipantCookie } from "@/lib/auth/participant";
import { joinSession } from "@/lib/services/sessions";

/** Students join with the code on the board. Only a first name is needed. */
export const POST = handler(async (req) => {
  rateLimit(`join:${clientKey(req)}`, 60, 60_000);
  const body = await readJson(req, z.object({ code: z.string().trim().min(1).max(20), name: z.string().trim().max(40).default("") }));
  const user = await getCurrentUser();
  const { session, participant, token } = joinSession({ code: body.code, displayName: body.name, user: user?.role === "student" ? user : null });
  await setParticipantCookie(session.id, token);
  return json({ sessionId: session.id, name: participant.displayName });
});
