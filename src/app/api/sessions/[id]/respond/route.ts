import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireParticipant } from "@/lib/auth/participant";
import { answerSchema } from "@/lib/domain/schemas";
import { submitResponse } from "@/lib/services/sessions";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req, { params }: Ctx) => {
  const { id } = await params;
  const participant = await requireParticipant(id);
  rateLimit(`respond:${participant.id}`, 60, 60_000);
  const body = await readJson(req, z.object({ activityId: z.string().max(40), answer: answerSchema, submissionId: z.string().min(8).max(64).optional() }));
  return json(submitResponse({ sessionId: id, participant, activityId: body.activityId, answer: body.answer, submissionId: body.submissionId }));
});
