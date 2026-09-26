/**
 * Gives an account a new temporary password (for a teacher or administrator
 * who forgot theirs; teachers reset students' passwords on the class page).
 *
 *   npm run user:password -- --username nbe
 *   npm run user:password -- --list            # list accounts by role
 *
 * The new password is printed once. The person is signed out everywhere and
 * asked to choose their own password after signing in.
 */
import "./env";
import { randomBytes } from "node:crypto";
import { databasePath, openDatabase } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const db = openDatabase(databasePath());
if (process.argv.includes("--list")) {
  const rows = db
    .prepare("SELECT role, username, display_name AS name FROM users WHERE password_hash != '!' ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'teacher' THEN 1 ELSE 2 END, username")
    .all() as { role: string; username: string; name: string }[];
  for (const r of rows) console.log(`${r.role.padEnd(8)} ${r.username.padEnd(24)} ${r.name}`);
  console.log(`${rows.length} accounts.`);
  process.exit(0);
}

const username = arg("username");
if (!username) {
  console.error("Usage: npm run user:password -- --username <name>   (or --list)");
  process.exit(1);
}
const user = db.prepare("SELECT id, role, display_name AS name FROM users WHERE username = ?").get(username) as { id: string; role: string; name: string } | undefined;
if (!user) {
  console.error(`No account "${username}". Use --list to see all accounts.`);
  process.exit(1);
}
const password = randomBytes(9).toString("base64url");
db.transaction(() => {
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(hashPassword(password), user.id);
  db.prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(user.id);
})();
db.close();
console.log(`New temporary password for ${user.role} "${username}" (${user.name}): ${password}`);
console.log("They are signed out everywhere. If the sign-in page says 'too many attempts', wait 15 minutes or restart the server.");
