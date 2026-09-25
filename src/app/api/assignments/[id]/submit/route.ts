import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { responseSchema, submitWork } from "@/lib/services/assignments";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ workRef: z.string().max(80).nullable().optional(), response: responseSchema.partial().optional() });

/** A student hands in work for an assignment. */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, schema);
  return json(submitWork((await params).id, user, input));
});
