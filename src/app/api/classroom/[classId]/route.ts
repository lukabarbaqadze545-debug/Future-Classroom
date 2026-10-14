import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { classroomState } from "@/lib/services/classroom";

/** What each student of the class is doing right now. */
export const GET = handler(async (_req, { params }: { params: Promise<{ classId: string }> }) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json(classroomState((await params).classId, user));
});
