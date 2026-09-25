import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { createUser } from "@/lib/services/users";
import { createAuthSession } from "@/lib/auth/session";

/** Self-registration is for students only; teacher accounts are created by the school. */
export const POST = handler(async (req) => {
  rateLimit(`register:${clientKey(req)}`, 10, 60 * 60_000);
  const body = await readJson(
    req,
    z.object({
      displayName: z.string().trim().min(1).max(40),
      username: z.string().trim().regex(/^[a-zA-Z0-9._-]{3,30}$/),
      password: z.string().min(8).max(200),
    }),
  );
  const user = createUser({ role: "student", username: body.username, displayName: body.displayName, password: body.password });
  await createAuthSession(user.id);
  return json({ user, redirect: "/student" }, { status: 201 });
});
