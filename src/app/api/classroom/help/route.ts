import { z } from "zod";
import { handler, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { lowerHand, raiseHand } from "@/lib/services/classroom";

/** A student raises their hand, with an optional note for the teacher. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const { note } = await readJson(req, z.object({ note: z.string().max(200).default("") }));
  raiseHand(user, note);
  return new Response(null, { status: 204 });
});

export const DELETE = handler(async () => {
  const user = await requireApiUser(["student"]);
  lowerHand(user);
  return new Response(null, { status: 204 });
});
