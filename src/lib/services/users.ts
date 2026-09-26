import "server-only";
import { getDb, now } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { newId } from "@/lib/domain/ids";
import type { Role } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";

export interface UserRecord {
  id: string;
  role: Role;
  username: string;
  displayName: string;
}

export function createUser(input: {
  role: Role;
  username: string;
  displayName: string;
  password: string;
  id?: string;
}): UserRecord {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(input.username);
  if (exists) throw new ApiError(409, "username_taken");
  const id = input.id ?? newId();
  db.prepare(
    "INSERT INTO users (id, role, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, input.role, input.username, input.displayName, hashPassword(input.password), now());
  return { id, role: input.role, username: input.username, displayName: input.displayName };
}

/** The form people type their sign-in name in: extra spaces removed, Unicode normalised. */
export function normalizeSignInName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

/**
 * Self-registration: a name and a password, nothing else. The name is both
 * what others see and what the person signs in with, so it must be unique
 * (letter case does not matter). New accounts are always students.
 */
export function registerStudent(name: string, password: string): UserRecord {
  const clean = normalizeSignInName(name);
  if (clean.length < 2 || clean.length > 40 || !/\p{L}/u.test(clean) || /[\p{C}<>]/u.test(clean)) throw new ApiError(400, "invalid_input");
  if (password.length < 8 || password.length > 200) throw new ApiError(400, "invalid_input");
  return createUser({ role: "student", username: clean, displayName: clean, password });
}

export function authenticate(username: string, password: string): UserRecord | null {
  const row = getDb()
    .prepare("SELECT id, role, username, display_name AS displayName, password_hash AS hash FROM users WHERE username = ?")
    .get(normalizeSignInName(username)) as (UserRecord & { hash: string }) | undefined;
  if (!row || !verifyPassword(password, row.hash)) return null;
  return { id: row.id, role: row.role, username: row.username, displayName: row.displayName };
}

export function getUserByUsername(username: string): UserRecord | null {
  return (
    (getDb()
      .prepare("SELECT id, role, username, display_name AS displayName FROM users WHERE username = ?")
      .get(username) as UserRecord | undefined) ?? null
  );
}
