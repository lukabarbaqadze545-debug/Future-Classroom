import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { isRateLimited, LOGIN_FAILURES, rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { authenticate } from "@/lib/services/users";
import { createAuthSession } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  const body = await readJson(req, z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) }));
  rateLimit(`login:${clientKey(req)}`, 60, 60_000);
  const failures = LOGIN_FAILURES.key(body.username);
  if (isRateLimited(failures, LOGIN_FAILURES.limit)) throw new ApiError(429, "rate_limited");
  const user = authenticate(body.username, body.password);
  if (!user) {
    rateLimit(failures, LOGIN_FAILURES.limit + 1, LOGIN_FAILURES.windowMs);
    throw new ApiError(401, "invalid_credentials");
  }
  await createAuthSession(user.id);
  return json({ user, redirect: user.role === "student" ? "/student" : "/teacher" });
});
