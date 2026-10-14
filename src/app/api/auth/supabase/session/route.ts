import { z } from "zod";
import { clientKey, handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { createAuthSession } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";
import { verifyAccessToken } from "@/lib/supabase/server";
import { accountForSupabaseUser } from "@/lib/services/supabase-accounts";

/**
 * Turns a Supabase sign-in into this site's own session. The browser signs up
 * or in with Supabase and sends the access token; the server asks Supabase who
 * it belongs to, finds or opens the matching local account (always a student
 * when new) and starts the usual server-side session cookie. Nothing from
 * Supabase is kept in the browser afterwards.
 */
export const POST = handler(async (req) => {
  if (!supabaseConfig()) throw new ApiError(404, "not_found");
  rateLimit(`supabase-session:${clientKey(req)}`, 60, 60_000);
  const { accessToken } = await readJson(req, z.object({ accessToken: z.string().min(20).max(4000) }));
  const user = accountForSupabaseUser(await verifyAccessToken(accessToken));
  await createAuthSession(user.id);
  return json({ user, redirect: user.role === "student" ? "/student" : "/teacher" });
});
