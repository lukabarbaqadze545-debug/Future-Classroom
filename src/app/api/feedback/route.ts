import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { addFeedback, FEEDBACK_TARGETS } from "@/lib/services/feedback";

const schema = z.object({ targetKind: z.enum(FEEDBACK_TARGETS), targetId: z.string().min(1).max(60), body: z.string().trim().min(1).max(4000) });

/** Teachers comment on a piece of student work. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, schema);
  return json({ feedback: addFeedback(input.targetKind, input.targetId, user.id, input.body) }, { status: 201 });
});
