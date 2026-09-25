import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deleteGoal, goalSchema, updateGoal } from "@/lib/labs/career/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ goal: goalSchema, status: z.enum(["active", "done"]) });

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const { goal, status } = await readJson(req, schema);
  return json({ goal: updateGoal((await params).id, user, goal, status) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  deleteGoal((await params).id, user);
  return new Response(null, { status: 204 });
});
