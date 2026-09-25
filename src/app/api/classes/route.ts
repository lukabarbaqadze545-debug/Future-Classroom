import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { createClass } from "@/lib/services/classes";

const classSchema = z.object({ name: z.string().trim().min(1).max(80), studentIds: z.array(z.string().max(40)).max(200).default([]) });

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, classSchema);
  return json({ class: createClass(user, input.name, input.studentIds) }, { status: 201 });
});
