import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { controlSession, getTeacherSessionView } from "@/lib/services/sessions";

type Ctx = { params: Promise<{ id: string }> };

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("launch"), activityId: z.string().max(40) }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("close") }),
  z.object({ type: z.literal("reopen"), activityId: z.string().max(40) }),
  z.object({ type: z.literal("reveal"), revealed: z.boolean() }),
  z.object({ type: z.literal("timer"), seconds: z.number().int().min(10).max(3600).nullable() }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("resume") }),
  z.object({ type: z.literal("clear") }),
  z.object({ type: z.literal("end") }),
]);

/** Teacher controls. Returns the fresh console state so the UI updates instantly. */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  const action = await readJson(req, actionSchema);
  controlSession(id, user, action);
  return json(getTeacherSessionView(id, user));
});
