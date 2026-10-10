/**
 * Error codes are stable identifiers; the client maps them to translated
 * messages (see `errors` in the i18n dictionaries).
 */
export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "invalid_credentials"
  | "username_taken"
  | "rate_limited"
  | "session_not_found"
  | "session_ended"
  | "activity_closed"
  | "no_open_activity"
  | "ai_unavailable"
  | "ai_failed"
  | "file_too_large"
  | "file_type_not_allowed"
  | "file_invalid"
  | "bad_origin"
  | "invalid_token"
  | "email_not_confirmed"
  | "auth_unavailable"
  | "conflict"
  | "attempt_first"
  | "stale_day"
  | "not_solved"
  | "internal";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function notFound(): never {
  throw new ApiError(404, "not_found");
}
