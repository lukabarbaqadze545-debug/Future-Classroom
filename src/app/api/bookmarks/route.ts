import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { setBookmark } from "@/lib/services/bookmarks";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const body = await readJson(
    req,
    z.object({ kind: z.enum(["programming", "library", "career", "experiment", "simulation", "critical"]), refId: z.string().min(1).max(80), on: z.boolean() }),
  );
  return json({ bookmarked: setBookmark(user.id, body.kind, body.refId, body.on) });
});
