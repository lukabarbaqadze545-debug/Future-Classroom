import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { customProblemSchema, saveCustomProblem } from "@/lib/labs/programming/service";

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, customProblemSchema);
  return json({ id: saveCustomProblem(user, input) }, { status: 201 });
});
