import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { deleteAssignment, updateAssignment } from "@/lib/services/assignments";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  instructions: z.string().trim().max(4000).optional(),
  dueAt: z.number().int().positive().nullable().optional(),
  archived: z.boolean().optional(),
});

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, schema);
  return json({ assignment: updateAssignment((await params).id, user, input) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteAssignment((await params).id, user);
  return new Response(null, { status: 204 });
});
