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

export function authenticate(username: string, password: string): UserRecord | null {
  const row = getDb()
    .prepare("SELECT id, role, username, display_name AS displayName, password_hash AS hash FROM users WHERE username = ?")
    .get(username) as (UserRecord & { hash: string }) | undefined;
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
