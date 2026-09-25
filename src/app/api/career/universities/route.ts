import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { createCard, universitySchema } from "@/lib/labs/career/service";

const schema = z.object({ card: universitySchema, shared: z.boolean().default(false) });

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const { card, shared } = await readJson(req, schema);
  return json({ card: createCard(user, card, { shared }) }, { status: 201 });
});
