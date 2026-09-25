import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { getAssignmentForTeacher } from "@/lib/services/assignments";

type Ctx = { params: Promise<{ id: string }> };

/** Polled by the teacher's review page so statuses update without a reload. */
export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json(getAssignmentForTeacher((await params).id, user));
});
