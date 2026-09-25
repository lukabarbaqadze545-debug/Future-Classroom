import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { authenticate } from "@/lib/services/users";
import { createAuthSession } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  const body = await readJson(req, z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) }));
  rateLimit(`login:${clientKey(req)}`, 20, 60_000);
  const user = authenticate(body.username, body.password);
  if (!user) throw new ApiError(401, "invalid_credentials");
  await createAuthSession(user.id);
  return json({ user, redirect: user.role === "student" ? "/student" : "/teacher" });
});
