/**
 * Supabase sign-in is optional: it is on only when NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY are both set and look right. Without them
 * the platform keeps its own sign-in (name and password, all on the school's
 * server), which is what a school without internet needs.
 *
 * This file has no server-only imports: the same checks run in the server,
 * in `npm run doctor` and in tests.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type SupabaseConfigProblemCode =
  /** One of the two variables is set and the other is not. */
  | "missing_url"
  | "missing_key"
  | "bad_url"
  /** The key is a secret key: it must never be in a NEXT_PUBLIC variable (browsers receive those). */
  | "secret_key"
  | "bad_key"
  /** The URL has a path (such as /rest/v1); only the origin is used. */
  | "url_has_path"
  /** Plain http to a host other than localhost. */
  | "insecure_url";

export interface SupabaseConfigProblem {
  code: SupabaseConfigProblemCode;
  severity: "error" | "warning";
}

export interface SupabaseEnvReport {
  /** The usable settings, or null when Supabase sign-in is off or the settings are wrong. */
  config: SupabaseConfig | null;
  problems: SupabaseConfigProblem[];
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function jwtRole(key: string): string | null | "not_jwt" {
  const parts = key.split(".");
  if (parts.length !== 3 || parts.some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) return "not_jwt";
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return "not_jwt";
  }
}

/** Reads and checks the two public variables. Never throws; says what is wrong instead. */
export function diagnoseSupabaseEnv(env: Record<string, string | undefined>): SupabaseEnvReport {
  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const rawKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const problems: SupabaseConfigProblem[] = [];
  if (!rawUrl && !rawKey) return { config: null, problems };
  const error = (code: SupabaseConfigProblemCode) => problems.push({ code, severity: "error" });
  const warning = (code: SupabaseConfigProblemCode) => problems.push({ code, severity: "warning" });

  let url = "";
  if (!rawUrl) error("missing_url");
  else {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("scheme");
      url = parsed.origin;
      if (parsed.pathname !== "/" || parsed.search || parsed.hash) warning("url_has_path");
      if (parsed.protocol === "http:" && !LOCAL_HOSTS.has(parsed.hostname)) warning("insecure_url");
    } catch {
      error("bad_url");
    }
  }

  if (!rawKey) error("missing_key");
  else if (rawKey.startsWith("sb_secret_")) error("secret_key");
  else if (!rawKey.startsWith("sb_publishable_")) {
    // The legacy keys are JWTs whose "role" says what they may do.
    const role = jwtRole(rawKey);
    if (role === "service_role") error("secret_key");
    else if (role !== "anon") error("bad_key");
  }

  if (problems.some((p) => p.severity === "error")) return { config: null, problems };
  return { config: { url, anonKey: rawKey }, problems };
}

/** The settings from the environment, or null when Supabase sign-in is off, misconfigured or switched off by open access (no sign-in at all). */
export function supabaseConfig(): SupabaseConfig | null {
  return process.env.OPEN_ACCESS === "true" ? null : diagnoseSupabaseEnv(process.env).config;
}
