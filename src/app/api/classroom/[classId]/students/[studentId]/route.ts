import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { startOfToday } from "@/lib/classroom/time";
import { studentActivity } from "@/lib/services/classroom";

/** One student today: pages, work and messages. */
export const GET = handler(async (_req, { params }: { params: Promise<{ classId: string; studentId: string }> }) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { classId, studentId } = await params;
  return json(studentActivity(classId, user, studentId, startOfToday()));
});
