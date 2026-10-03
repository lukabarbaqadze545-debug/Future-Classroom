/**
 * What can go wrong when signing up or in with Supabase, in the terms the
 * person on the screen needs. `classifyAuthError` turns whatever supabase-js
 * reports (an AuthError with a code and an HTTP status, a network failure, an
 * error handed back in a link) into one of these; the interface has a
 * message for each (`dict.auth.problems`).
 */
export const AUTH_PROBLEMS = [
  /** This email already has an account. */
  "already_registered",
  "weak_password",
  "invalid_email",
  /** The project only accepts certain addresses (custom SMTP, allow-list). */
  "email_not_allowed",
  "signups_disabled",
  /** Too many confirmation emails were requested for this address or by this project. */
  "email_rate_limit",
  "rate_limit",
  "network",
  /** The address has not been confirmed yet. */
  "not_confirmed",
  "invalid_credentials",
  /** The link in the email has expired or was already used. */
  "expired_link",
  /** The link is of a kind this site does not handle (for example a password reset). */
  "unsupported_link",
  /** The sign-in service answered with a server error. */
  "unavailable",
  "unknown",
] as const;

export type AuthProblem = (typeof AUTH_PROBLEMS)[number];

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  status?: unknown;
}

const BY_CODE: Record<string, AuthProblem> = {
  user_already_exists: "already_registered",
  email_exists: "already_registered",
  weak_password: "weak_password",
  email_address_invalid: "invalid_email",
  validation_failed: "invalid_email",
  email_address_not_authorized: "email_not_allowed",
  signup_disabled: "signups_disabled",
  email_provider_disabled: "signups_disabled",
  over_email_send_rate_limit: "email_rate_limit",
  over_request_rate_limit: "rate_limit",
  email_not_confirmed: "not_confirmed",
  invalid_credentials: "invalid_credentials",
  otp_expired: "expired_link",
  flow_state_expired: "expired_link",
  flow_state_not_found: "expired_link",
  bad_code_verifier: "unsupported_link",
  request_timeout: "unavailable",
  unexpected_failure: "unavailable",
  hook_timeout: "unavailable",
  hook_timeout_after_retry: "unavailable",
};

/** Older servers and proxies send a message but no code. */
const BY_MESSAGE: [RegExp, AuthProblem][] = [
  [/already (been )?registered|already exists/i, "already_registered"],
  [/password (should|must) be at least|weak password|password is too/i, "weak_password"],
  [/email not confirmed/i, "not_confirmed"],
  [/invalid login credentials/i, "invalid_credentials"],
  [/(email )?rate limit|too many requests|after \d+ seconds/i, "email_rate_limit"],
  [/unable to validate email|invalid.*email|email.*invalid/i, "invalid_email"],
  [/signups? (not allowed|are disabled|disabled)/i, "signups_disabled"],
  [/(link|token).*(expired|invalid)|expired/i, "expired_link"],
  [/failed to fetch|networkerror|network request failed|load failed|fetch failed/i, "network"],
];

export function classifyAuthError(error: unknown): AuthProblem {
  if (!error || typeof error !== "object") return "unknown";
  const e = error as ErrorLike;
  if (e.name === "AuthWeakPasswordError") return "weak_password";
  if (typeof e.code === "string" && BY_CODE[e.code]) return BY_CODE[e.code];
  // supabase-js reports a failed request as a "retryable fetch error": status 0 (or none) means no answer at all, a 5xx the service answering with trouble.
  if (e.name === "AuthRetryableFetchError") return typeof e.status === "number" && e.status >= 500 ? "unavailable" : "network";
  if (e.status === 0) return "network";
  const message = typeof e.message === "string" ? e.message : "";
  const byMessage = BY_MESSAGE.find(([pattern]) => pattern.test(message));
  if (byMessage) return byMessage[1];
  if (typeof e.status === "number") {
    if (e.status === 429) return e.code === "over_email_send_rate_limit" ? "email_rate_limit" : "rate_limit";
    if (e.status >= 500) return "unavailable";
  }
  // fetch itself failing (no connection, blocked, wrong URL) is a TypeError.
  if (e.name === "TypeError" && /fetch|network/i.test(message)) return "network";
  return "unknown";
}

/** What the link the person came back through says (see `readAuthRedirect`). */
export type AuthRedirect =
  /** Supabase sent tokens in the address (the default email link). */
  | { kind: "tokens"; accessToken: string; type: string | null }
  /** The email template sends `token_hash` and `type`, to be exchanged by the page. */
  | { kind: "otp"; tokenHash: string; type: "signup" | "email" | "magiclink" | "recovery" | "invite" | "email_change" }
  | { kind: "error"; problem: AuthProblem; code: string | null; description: string | null }
  /** Nothing from Supabase in the address (someone opened the page directly). */
  | { kind: "empty" };

const OTP_TYPES = ["signup", "email", "magiclink", "recovery", "invite", "email_change"] as const;

/**
 * Reads the address Supabase redirected to: `?error_code=…` and `#error_code=…`
 * (the link expired, access was denied), `#access_token=…` (the default
 * implicit flow), or `?token_hash=…&type=…` (a template that sends the hash).
 * The hash wins over the query string when both carry something.
 */
export function readAuthRedirect(search: string, hash: string): AuthRedirect {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const pick = (name: string) => fragment.get(name) ?? query.get(name);

  const errorCode = pick("error_code");
  const errorName = pick("error");
  if (errorCode || errorName) {
    const description = pick("error_description");
    const problem = (errorCode && BY_CODE[errorCode]) || classifyAuthError({ message: description ?? errorName ?? "" });
    // "access_denied" without a more precise code is what an unusable (used or expired) link looks like.
    const code = errorCode ?? errorName;
    return { kind: "error", problem: problem === "unknown" && code === "access_denied" ? "expired_link" : problem, code, description };
  }

  const accessToken = fragment.get("access_token");
  if (accessToken) return { kind: "tokens", accessToken, type: fragment.get("type") };

  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  if (tokenHash && type && (OTP_TYPES as readonly string[]).includes(type)) return { kind: "otp", tokenHash, type: type as (typeof OTP_TYPES)[number] };

  // A PKCE `?code=…` needs the browser that started the sign-up to hold the verifier; this site does not keep one.
  if (query.get("code")) return { kind: "error", problem: "unsupported_link", code: "pkce_code", description: null };
  return { kind: "empty" };
}
