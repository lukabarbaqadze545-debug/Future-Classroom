import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { customProblemSchema, deleteCustomProblem, saveCustomProblem } from "@/lib/labs/programming/service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, customProblemSchema);
  return json({ id: saveCustomProblem(user, input, (await params).id) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteCustomProblem((await params).id, user);
  return new Response(null, { status: 204 });
});
