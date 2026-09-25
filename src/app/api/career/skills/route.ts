import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { setSkillRating, skillProfile } from "@/lib/labs/career/service";

const schema = z.object({ skillId: z.string().max(40), level: z.number().int().min(1).max(4).nullable() });

export const PUT = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const { skillId, level } = await readJson(req, schema);
  setSkillRating(user.id, skillId, level);
  return json({ skills: skillProfile(user.id) });
});
