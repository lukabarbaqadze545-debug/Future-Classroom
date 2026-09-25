import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { getAssignmentForTeacher } from "@/lib/services/assignments";
import { workHref } from "@/lib/labs/assignment-items";

type Ctx = { params: Promise<{ id: string }> };

/** Polled by the teacher's review page so statuses update without a reload. */
export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { assignment, recipients } = getAssignmentForTeacher((await params).id, user);
  const links = Object.fromEntries(recipients.map((r) => [r.studentId, workHref(assignment.kind, assignment.refId, r.workRef, r.studentId)]));
  return json({ assignment, recipients, links });
});
