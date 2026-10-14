import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/http/errors";
import type { VerifiedSupabaseUser } from "@/lib/services/supabase-accounts";
import { supabaseConfig } from "./config";
import { classifyAuthError } from "./problems";

/** Checks an access token with the sign-in provider. Replaceable in tests. */
export type TokenVerifier = (accessToken: string) => Promise<VerifiedSupabaseUser>;

let override: TokenVerifier | null = null;

export function setTokenVerifierForTests(verifier: TokenVerifier | null): void {
  override = verifier;
}

/**
 * The browser hands over the access token it got from Supabase; the server
 * never believes it by itself, it asks Supabase who the token belongs to
 * (`auth.getUser(token)`, which checks the signature, the expiry and that the
 * user still exists). Only the public (anon) key is needed for that.
 */
export const verifyAccessToken: TokenVerifier = async (accessToken) => {
  if (override) return override(accessToken);
  const config = supabaseConfig();
  if (!config) throw new ApiError(404, "not_found");
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    // The service being unreachable or busy is not the same as the token being wrong.
    const problem = classifyAuthError(error);
    const unreachable = problem === "network" || problem === "unavailable" || problem === "rate_limit";
    throw new ApiError(unreachable ? 502 : 401, unreachable ? "auth_unavailable" : "invalid_token");
  }
  const user = data.user;
  const fullName = (user.user_metadata as { full_name?: unknown } | null)?.full_name;
  return {
    id: user.id,
    email: user.email ?? "",
    emailConfirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
    fullName: typeof fullName === "string" ? fullName : null,
  };
};
