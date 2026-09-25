import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { reviewSchema, reviewWork } from "@/lib/services/assignments";

type Ctx = { params: Promise<{ id: string }> };
const schema = reviewSchema.extend({ studentId: z.string().min(1).max(40) });

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { studentId, ...input } = await readJson(req, schema);
  return json({ recipient: reviewWork((await params).id, studentId, user, input) });
});
