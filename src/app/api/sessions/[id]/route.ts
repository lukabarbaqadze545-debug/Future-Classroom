import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { deleteSession, getTeacherSessionView } from "@/lib/services/sessions";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json(getTeacherSessionView((await params).id, user));
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteSession((await params).id, user);
  return new Response(null, { status: 204 });
});
