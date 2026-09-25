import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { createAssignment, createAssignmentSchema } from "@/lib/services/assignments";

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, createAssignmentSchema);
  return json({ assignment: createAssignment(user, input) }, { status: 201 });
});
