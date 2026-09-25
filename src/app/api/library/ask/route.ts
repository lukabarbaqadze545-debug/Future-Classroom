import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { SUBJECTS } from "@/lib/domain/catalog";
import { askLibrary } from "@/lib/ai/library-service";

export const maxDuration = 60;

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`library:${user.id}`, 30, 60_000);
  const body = await readJson(req, z.object({ question: z.string().trim().min(2).max(500), subject: z.enum(SUBJECTS).optional() }));
  return json(await askLibrary(user, body.question, body.subject));
});
