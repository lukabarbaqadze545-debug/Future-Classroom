import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deleteCard, universitySchema, updateCard } from "@/lib/labs/career/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ card: universitySchema, shared: z.boolean().optional(), checked: z.boolean().default(false) });

/** "checked: true" records that the facts were re-checked on the official website today. */
export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser();
  const { card, shared, checked } = await readJson(req, schema);
  return json({ card: updateCard((await params).id, user, card, { shared, checked }) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deleteCard((await params).id, user);
  return new Response(null, { status: 204 });
});
