import "server-only";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import { selfRegistrationEnabled } from "@/lib/config";
import { normalizeSignInName, type UserRecord } from "./users";

/** What the sign-in provider vouches for after the access token was checked with it. */
export interface VerifiedSupabaseUser {
  id: string;
  email: string;
  /** The person opened the link in the confirmation email (or the project does not require it). */
  emailConfirmed: boolean;
  /** The name typed on the sign-up form (`user_metadata.full_name`), if any. */
  fullName: string | null;
}

/** Placeholder password hash: nothing verifies against it, so these accounts cannot sign in with a local password. */
const NO_PASSWORD = "!";

/** The name others see: what the person typed, cleaned the way registering by name cleans it; "student" in the school's language when there is none. */
export function displayNameFor(fullName: string | null): string {
  const clean = normalizeSignInName(fullName ?? "")
    .replace(/[\p{C}<>]/gu, "")
    .slice(0, 40)
    .trim();
  if (clean.length >= 2 && /\p{L}/u.test(clean)) return clean;
  return process.env.DEFAULT_LANGUAGE?.trim() === "en" ? "Student" : "მოსწავლე";
}

function freeUsername(base: string): string {
  const db = getDb();
  const taken = db.prepare("SELECT 1 FROM users WHERE username = ?");
  if (!taken.get(base)) return base;
  for (let n = 2; n <= 99; n++) {
    const candidate = `${base.slice(0, 36)} ${n}`;
    if (!taken.get(candidate)) return candidate;
  }
  return `${base.slice(0, 32)} ${Math.floor(1000 + Math.random() * 9000)}`;
}

const SELECT_BY_SUPABASE_ID = "SELECT id, role, username, display_name AS displayName FROM users WHERE supabase_id = ?";

/**
 * The local account of a person Supabase has vouched for. The account is found
 * by the Supabase user id (never by email or name, so nobody can take over an
 * existing account by registering with a matching address); a new one is
 * always a student. When the school has turned self-registration off, only
 * accounts that already exist can sign in.
 */
export function accountForSupabaseUser(user: VerifiedSupabaseUser): UserRecord {
  if (!user.emailConfirmed) throw new ApiError(403, "email_not_confirmed");
  const db = getDb();
  const email = user.email.trim().toLowerCase();
  const existing = db.prepare(SELECT_BY_SUPABASE_ID).get(user.id) as UserRecord | undefined;
  if (existing) {
    db.prepare("UPDATE users SET email = ? WHERE supabase_id = ? AND (email IS NULL OR email != ?)").run(email, user.id, email);
    return existing;
  }
  if (!selfRegistrationEnabled()) throw new ApiError(403, "forbidden");

  const displayName = displayNameFor(user.fullName);
  try {
    return db.transaction(() => {
      const id = newId();
      const username = freeUsername(displayName);
      db.prepare("INSERT INTO users (id, role, username, display_name, password_hash, created_at, supabase_id, email) VALUES (?, 'student', ?, ?, ?, ?, ?, ?)").run(
        id,
        username,
        displayName,
        NO_PASSWORD,
        now(),
        user.id,
        email,
      );
      return { id, role: "student" as const, username, displayName };
    })();
  } catch (error) {
    // Two sign-in requests for the same new person arrived together: the other one created the account.
    const created = db.prepare(SELECT_BY_SUPABASE_ID).get(user.id) as UserRecord | undefined;
    if (created) return created;
    throw error;
  }
}

/** The email an account signs in with when it was opened through Supabase; null for the school's own name-and-password accounts. */
export function emailSignInOf(userId: string): string | null {
  const row = getDb().prepare("SELECT email FROM users WHERE id = ? AND supabase_id IS NOT NULL").get(userId) as { email: string | null } | undefined;
  return row ? (row.email ?? "") : null;
}
