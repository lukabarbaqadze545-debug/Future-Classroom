import "server-only";
import { randomInt } from "node:crypto";
import { getDb, now } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

/** Georgian letters in the national romanisation, for usernames. */
const GEORGIAN_TO_LATIN: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh",
  რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

export function romanize(text: string): string {
  return [...text.toLowerCase()].map((ch) => GEORGIAN_TO_LATIN[ch] ?? ch).join("");
}

/** "მარიამ ლომიძე" → "mariam.l" (unique: "mariam.l2", …). Usernames allow a–z, 0–9, dot and dash. */
export function suggestUsername(displayName: string, taken: (username: string) => boolean): string {
  const parts = romanize(displayName)
    .replace(/[^a-z0-9\s.-]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  let base = parts.length ? parts[0].slice(0, 20) : "student";
  if (parts.length > 1) base += `.${parts[parts.length - 1][0]}`;
  if (base.length < 3) base = `${base}${"000".slice(base.length)}`;
  let candidate = base;
  for (let n = 2; taken(candidate); n++) candidate = `${base}${n}`;
  return candidate;
}

// No look-alike characters (0/o, 1/l/i), so a password copied from paper works first time.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function temporaryPassword(length = 8): string {
  return Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");
}

function usernameTaken(username: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM users WHERE username = ?").get(username));
}

export interface NewAccount {
  id: string;
  displayName: string;
  username: string;
  /** Shown once, to the teacher who created the account. */
  password: string;
}

/** Student accounts from a list of names, each with a temporary password. */
export function createStudentAccounts(names: string[]): NewAccount[] {
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO users (id, role, username, display_name, password_hash, created_at, must_change_password) VALUES (?, 'student', ?, ?, ?, ?, 1)",
  );
  const created: NewAccount[] = [];
  db.transaction(() => {
    for (const raw of names) {
      const displayName = raw.trim().replace(/\s+/g, " ").slice(0, 40);
      if (!displayName) continue;
      const username = suggestUsername(displayName, usernameTaken);
      const password = temporaryPassword();
      const id = newId();
      insert.run(id, username, displayName, hashPassword(password), now());
      created.push({ id, displayName, username, password });
    }
  })();
  return created;
}

/** Replaces a user's password with a temporary one and signs them out everywhere. */
export function setTemporaryPassword(userId: string): string {
  const password = temporaryPassword();
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(hashPassword(password), userId);
    db.prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(userId);
  })();
  return password;
}

/** A user changes their own password (the current one is required). */
export function changeOwnPassword(user: CurrentUser, current: string, next: string): void {
  const row = getDb().prepare("SELECT password_hash AS hash FROM users WHERE id = ?").get(user.id) as { hash: string } | undefined;
  if (!row || !verifyPassword(current, row.hash)) throw new ApiError(400, "invalid_credentials");
  if (next.length < 8) throw new ApiError(400, "invalid_input");
  getDb().prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(hashPassword(next), user.id);
}
