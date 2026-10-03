import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { registerStudent } from "@/lib/services/users";
import { createAuthSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/http/errors";
import { openAccessEnabled, selfRegistrationEnabled } from "@/lib/config";

/** Self-registration: a name and a password. Accounts are always students; teacher accounts are created by the school. */
export const POST = handler(async (req) => {
  if (openAccessEnabled() || !selfRegistrationEnabled()) throw new ApiError(404, "not_found");
  // A whole class may register at once from behind one school address.
  rateLimit(`register:${clientKey(req)}`, 60, 60 * 60_000);
  const body = await readJson(req, z.object({ name: z.string().max(80), password: z.string().min(8).max(200) }));
  const user = registerStudent(body.name, body.password);
  await createAuthSession(user.id);
  return json({ user, redirect: "/student" }, { status: 201 });
});
