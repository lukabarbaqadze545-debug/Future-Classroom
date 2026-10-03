import { describe, expect, it } from "vitest";
import { AuthApiError, AuthRetryableFetchError, AuthWeakPasswordError } from "@supabase/supabase-js";
import { AUTH_PROBLEMS, classifyAuthError, readAuthRedirect } from "@/lib/supabase/problems";
import { en } from "@/lib/i18n/en";
import { ka } from "@/lib/i18n/ka";

describe("Sign-up and sign-in problems", () => {
  it("recognises what Supabase reports by its code", () => {
    const cases: [unknown, string][] = [
      [new AuthApiError("User already registered", 422, "user_already_exists"), "already_registered"],
      [new AuthApiError("exists", 422, "email_exists"), "already_registered"],
      [new AuthApiError("Password should be at least 8 characters.", 422, "weak_password"), "weak_password"],
      [new AuthWeakPasswordError("weak", 422, ["length"]), "weak_password"],
      [new AuthApiError("Unable to validate email address: invalid format", 400, "email_address_invalid"), "invalid_email"],
      [new AuthApiError("Email address is not authorized", 400, "email_address_not_authorized"), "email_not_allowed"],
      [new AuthApiError("Signups not allowed for this instance", 422, "signup_disabled"), "signups_disabled"],
      [new AuthApiError("email rate limit exceeded", 429, "over_email_send_rate_limit"), "email_rate_limit"],
      [new AuthApiError("slow down", 429, "over_request_rate_limit"), "rate_limit"],
      [new AuthApiError("Email not confirmed", 400, "email_not_confirmed"), "not_confirmed"],
      [new AuthApiError("Invalid login credentials", 400, "invalid_credentials"), "invalid_credentials"],
      [new AuthApiError("Email link is invalid or has expired", 403, "otp_expired"), "expired_link"],
      [new AuthRetryableFetchError("Failed to fetch", 0), "network"],
      [new AuthRetryableFetchError("Database error", 500), "unavailable"],
      [new AuthRetryableFetchError("gateway timeout", 504), "unavailable"],
    ];
    for (const [error, expected] of cases) expect(classifyAuthError(error), String((error as Error).message)).toBe(expected);
  });

  it("falls back to the message and the HTTP status when there is no code", () => {
    expect(classifyAuthError({ message: "User already registered", status: 400 })).toBe("already_registered");
    expect(classifyAuthError({ message: "Password should be at least 6 characters", status: 422 })).toBe("weak_password");
    expect(classifyAuthError({ message: "Invalid login credentials", status: 400 })).toBe("invalid_credentials");
    expect(classifyAuthError({ message: "Email rate limit exceeded", status: 429 })).toBe("email_rate_limit");
    expect(classifyAuthError({ message: "", status: 429 })).toBe("rate_limit");
    expect(classifyAuthError({ message: "gateway", status: 502 })).toBe("unavailable");
    expect(classifyAuthError(new TypeError("Failed to fetch"))).toBe("network");
    expect(classifyAuthError({ message: "something odd", status: 418 })).toBe("unknown");
    expect(classifyAuthError(null)).toBe("unknown");
    expect(classifyAuthError("text")).toBe("unknown");
  });

  it("has a message in both languages for every problem", () => {
    for (const problem of AUTH_PROBLEMS) {
      expect(en.auth.problems[problem], problem).toBeTruthy();
      expect(ka.auth.problems[problem], problem).toBeTruthy();
    }
    expect(Object.keys(en.auth.problems).sort()).toEqual([...AUTH_PROBLEMS].sort());
  });
});

describe("The address the confirmation link comes back to", () => {
  it("reads the tokens of the default email link", () => {
    expect(readAuthRedirect("", "#access_token=abc.def.ghi&expires_in=3600&refresh_token=r&token_type=bearer&type=signup")).toEqual({
      kind: "tokens",
      accessToken: "abc.def.ghi",
      type: "signup",
    });
  });

  it("reads an error in the hash or in the query, with the problem it means", () => {
    const expired = readAuthRedirect("", "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    expect(expired).toMatchObject({ kind: "error", problem: "expired_link", code: "otp_expired", description: "Email link is invalid or has expired" });
    expect(readAuthRedirect("?error=server_error&error_code=unexpected_failure&error_description=Error+confirming+user", "")).toMatchObject({
      kind: "error",
      problem: "unavailable",
    });
    expect(readAuthRedirect("", "#error=access_denied")).toMatchObject({ kind: "error", problem: "expired_link" });
  });

  it("reads a token hash that an email template sends, and ignores unknown types", () => {
    expect(readAuthRedirect("?token_hash=abc123&type=signup", "")).toEqual({ kind: "otp", tokenHash: "abc123", type: "signup" });
    expect(readAuthRedirect("?token_hash=abc123&type=nonsense", "")).toEqual({ kind: "empty" });
  });

  it("does not pretend to handle a PKCE code, and treats a bare page as empty", () => {
    expect(readAuthRedirect("?code=abc", "")).toMatchObject({ kind: "error", problem: "unsupported_link" });
    expect(readAuthRedirect("", "")).toEqual({ kind: "empty" });
    expect(readAuthRedirect("?next=/student", "#top")).toEqual({ kind: "empty" });
  });

  it("lets an error in the hash win over a token in the query", () => {
    expect(readAuthRedirect("?token_hash=x&type=signup", "#error_code=otp_expired")).toMatchObject({ kind: "error", problem: "expired_link" });
  });
});
