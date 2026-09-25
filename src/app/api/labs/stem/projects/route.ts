import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { createProject } from "@/lib/labs/stem/service";

const schema = z.object({ templateId: z.string().max(40).nullable().default(null), title: z.string().trim().min(1).max(160) });

export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const { templateId, title } = await readJson(req, schema);
  return json({ project: createProject(user, templateId, title) }, { status: 201 });
});
