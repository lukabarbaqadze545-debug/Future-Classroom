import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { deleteClass, renameClass, setClassMembers } from "@/lib/services/classes";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(1).max(80), studentIds: z.array(z.string().max(40)).max(200) });

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  const input = await readJson(req, schema);
  renameClass(id, user, input.name);
  return json({ class: setClassMembers(id, user, input.studentIds) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteClass((await params).id, user);
  return new Response(null, { status: 204 });
});
