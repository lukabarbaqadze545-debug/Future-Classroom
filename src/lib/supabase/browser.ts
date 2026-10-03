import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { api } from "@/lib/client/api";
import type { SupabaseConfig } from "./config";

const clients = new Map<string, SupabaseClient>();

/**
 * The Supabase client for the browser. It keeps nothing: no session in
 * storage (a shared school computer must not keep the next person's tokens)
 * and no background refresh. The browser uses it to sign up or in, hands the
 * access token to this site's server (`startLocalSession`) and is done; the
 * site's own session cookie takes over from there. The default "implicit"
 * flow is used on purpose: the link in the confirmation email carries the
 * tokens, so it also works when it is opened in another browser than the one
 * that signed up.
 */
export function supabaseBrowser(config: SupabaseConfig): SupabaseClient {
  const key = `${config.url}|${config.anonKey}`;
  let client = clients.get(key);
  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: "implicit" },
    });
    clients.set(key, client);
  }
  return client;
}

/** The page the confirmation email brings the person back to. */
export function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

/** Trades a Supabase access token for this site's own session (the server checks the token with Supabase first). */
export function startLocalSession(accessToken: string): Promise<{ redirect: string; user: { role: string } }> {
  return api("/api/auth/supabase/session", { body: { accessToken } });
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
