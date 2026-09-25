import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { createGoal, goalSchema } from "@/lib/labs/career/service";

export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, goalSchema);
  return json({ goal: createGoal(user, input) }, { status: 201 });
});
