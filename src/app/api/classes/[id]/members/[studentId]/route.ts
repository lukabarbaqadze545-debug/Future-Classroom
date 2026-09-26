import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { removeClassMember } from "@/lib/services/classes";

type Ctx = { params: Promise<{ id: string; studentId: string }> };

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id, studentId } = await params;
  return json({ class: removeClassMember(id, user, studentId) });
});
