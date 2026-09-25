import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deleteProject, updateProject } from "@/lib/labs/stem/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ title: z.string().trim().max(160).optional(), data: z.unknown(), submit: z.boolean().default(false) });

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, schema);
  return json({ project: updateProject((await params).id, user, input) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deleteProject((await params).id, user);
  return new Response(null, { status: 204 });
});
