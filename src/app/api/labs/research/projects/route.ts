import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { createResearchProject } from "@/lib/labs/research/service";

const schema = z.object({ title: z.string().trim().min(1).max(160), subject: z.string().trim().max(80).default("") });

export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, schema);
  return json({ project: createResearchProject(user, input) }, { status: 201 });
});
