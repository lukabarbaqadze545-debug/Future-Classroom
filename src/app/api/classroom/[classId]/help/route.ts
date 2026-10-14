import { z } from "zod";
import { handler, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { answerHelp } from "@/lib/services/classroom";

/** "I'm coming" or "done" for a raised hand. */
export const POST = handler(async (req, { params }: { params: Promise<{ classId: string }> }) => {
  const user = await requireApiUser(STAFF_ROLES);
  const body = await readJson(req, z.object({ studentId: z.string().max(40), action: z.enum(["ack", "resolve"]) }));
  answerHelp((await params).classId, user, body.studentId, body.action);
  return new Response(null, { status: 204 });
});
