import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireParticipant } from "@/lib/auth/participant";
import { requestSessionHint } from "@/lib/services/sessions";

type Ctx = { params: Promise<{ id: string }> };
export const maxDuration = 60;

/** Unlocks the next rung of the hint ladder for the current activity. */
export const POST = handler(async (req, { params }: Ctx) => {
  const { id } = await params;
  const participant = await requireParticipant(id);
  rateLimit(`hint:${participant.id}`, 30, 60_000);
  const body = await readJson(req, z.object({ activityId: z.string().max(40) }));
  return json({ hint: await requestSessionHint({ sessionId: id, participant, activityId: body.activityId }) });
});
