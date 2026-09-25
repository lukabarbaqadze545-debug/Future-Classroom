import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deleteResearchProject, updateResearchProject } from "@/lib/labs/research/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ title: z.string().trim().max(160).optional(), subject: z.string().trim().max(80).optional(), data: z.unknown(), submit: z.boolean().default(false) });

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, schema);
  return json({ project: updateResearchProject((await params).id, user, input) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deleteResearchProject((await params).id, user);
  return new Response(null, { status: 204 });
});
