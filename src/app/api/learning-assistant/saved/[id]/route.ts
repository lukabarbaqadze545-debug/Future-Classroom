import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deleteSaved, updateSavedNote } from "@/lib/services/learning-assistant";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser();
  const body = await readJson(req, z.object({ note: z.string().max(2000) }));
  updateSavedNote(user, (await params).id, body.note);
  return json({ ok: true });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deleteSaved(user, (await params).id);
  return json({ ok: true });
});
