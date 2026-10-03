import type { SupabaseConfig, SupabaseConfigProblemCode } from "./config";

/** What `npm run doctor` and `npm run supabase:check` say about the two variables (for the person looking after the server, in English). */
export const CONFIG_PROBLEM_TEXT: Record<SupabaseConfigProblemCode, string> = {
  missing_url: "NEXT_PUBLIC_SUPABASE_URL is empty while NEXT_PUBLIC_SUPABASE_ANON_KEY is set. Copy the project URL (https://<project>.supabase.co) from Project Settings → API.",
  missing_key: "NEXT_PUBLIC_SUPABASE_ANON_KEY is empty while NEXT_PUBLIC_SUPABASE_URL is set. Copy the anon (or publishable) key from Project Settings → API.",
  bad_url: "NEXT_PUBLIC_SUPABASE_URL is not a web address (it should look like https://<project>.supabase.co).",
  secret_key:
    "NEXT_PUBLIC_SUPABASE_ANON_KEY holds a SECRET key (service_role / sb_secret_…). Everything in a NEXT_PUBLIC variable is sent to every browser: remove it, rotate the key in the Supabase dashboard and use the anon (publishable) key here. Email sign-in stays off until this is fixed.",
  bad_key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like an anon key (a long eyJ… token with the role "anon", or sb_publishable_…).',
  url_has_path: "NEXT_PUBLIC_SUPABASE_URL has a path or query after the host; only https://<project>.supabase.co is used.",
  insecure_url: "NEXT_PUBLIC_SUPABASE_URL uses plain http to a host other than this computer: passwords would travel unencrypted.",
};

/** The parts of the project's public settings (GET /auth/v1/settings) that matter here. */
export interface ProjectSettings {
  external?: { email?: boolean };
  disable_signup?: boolean;
  mailer_autoconfirm?: boolean;
}

export type CheckLevel = "OK" | "WARN" | "FAIL";
export interface CheckLine {
  level: CheckLevel;
  text: string;
}

export type SettingsResult =
  | { ok: true; settings: ProjectSettings }
  /** The project answered, but refused the key. */
  | { ok: false; reason: "rejected"; status: number }
  /** The project (or the internet) could not be reached from this computer. */
  | { ok: false; reason: "unreachable"; detail: string }
  /** An answer that is not a Supabase Auth answer (wrong URL?). */
  | { ok: false; reason: "unexpected"; status: number };

/** Asks the project for its public auth settings. Needs only the public key. */
export async function fetchProjectSettings(config: SupabaseConfig, fetchImpl: typeof fetch = fetch): Promise<SettingsResult> {
  let response: Response;
  try {
    response = await fetchImpl(`${config.url}/auth/v1/settings`, { headers: { apikey: config.anonKey }, signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    return { ok: false, reason: "unreachable", detail: error instanceof Error ? error.message : String(error) };
  }
  if (response.status === 401 || response.status === 403) return { ok: false, reason: "rejected", status: response.status };
  if (!response.ok) return { ok: false, reason: "unexpected", status: response.status };
  try {
    const body = (await response.json()) as ProjectSettings;
    if (typeof body !== "object" || body === null || !("external" in body)) return { ok: false, reason: "unexpected", status: response.status };
    return { ok: true, settings: body };
  } catch {
    return { ok: false, reason: "unexpected", status: response.status };
  }
}

/** What the project's settings mean for this site, as lines for the person who looks after it. */
export function interpretSettingsResult(result: SettingsResult, redirectUrl: string): CheckLine[] {
  if (!result.ok) {
    if (result.reason === "rejected")
      return [
        { level: "FAIL", text: `The project refused the key (HTTP ${result.status}). Check NEXT_PUBLIC_SUPABASE_ANON_KEY belongs to the project in NEXT_PUBLIC_SUPABASE_URL.` },
      ];
    if (result.reason === "unexpected")
      return [{ level: "FAIL", text: `The address answered HTTP ${result.status}, but not like a Supabase project. Check NEXT_PUBLIC_SUPABASE_URL.` }];
    return [
      {
        level: "WARN",
        text: `Could not reach the project from this computer (${result.detail}). The settings cannot be checked from here; the site itself needs internet access to Supabase.`,
      },
    ];
  }
  const { settings } = result;
  const lines: CheckLine[] = [{ level: "OK", text: "The project answers and accepts the key." }];
  if (settings.external?.email === false)
    lines.push({
      level: "FAIL",
      text: "The Email provider is switched off in the project (Authentication → Sign In / Providers). People cannot register or sign in with an email.",
    });
  if (settings.disable_signup === true)
    lines.push({
      level: "WARN",
      text: 'New sign-ups are disabled in the project: people can only sign in, nobody can register. (Authentication → Sign In / Providers → "Allow new users to sign up".)',
    });
  if (settings.mailer_autoconfirm === true) {
    lines.push({
      level: "WARN",
      text: 'Email confirmation is OFF: a person is signed in straight after registering, with any address, without proving it is theirs. Turn on "Confirm email" in Authentication → Sign In / Providers → Email unless that is what you want.',
    });
  } else if (settings.mailer_autoconfirm === false) {
    lines.push({ level: "OK", text: "Email confirmation is ON: people must open the link in the email before they can sign in." });
    lines.push({
      level: "WARN",
      text: `Make sure ${redirectUrl} is in Authentication → URL Configuration → Redirect URLs (and that Site URL is your site). Without it the confirmation link lands on the Site URL; the site then forwards it, but a wrong Site URL (such as http://localhost:3000) breaks the link.`,
    });
  }
  return lines;
}
