import { cookies } from "next/headers";
import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { AUTH_COOKIE, requireApiUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/domain/ids";
import { changeOwnPassword } from "@/lib/services/accounts";

/** Change your own password; other signed-in devices are signed out. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`password-change:${user.id}`, 10, 15 * 60_000);
  const body = await readJson(req, z.object({ current: z.string().min(1).max(200), next: z.string().min(8).max(200) }));
  changeOwnPassword(user, body.current, body.next);
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  getDb().prepare("DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?").run(user.id, token ? hashToken(token) : "");
  return json({ ok: true });
});
