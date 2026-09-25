/**
 * Creates a teacher, student or administrator account.
 *
 *   npm run user:create -- --role teacher --username nbe --name "Nino Beridze"
 *
 * The password is read from --password or generated and printed once.
 */
import { randomBytes } from "node:crypto";
import { openDatabase, databasePath } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { newId } from "../src/lib/domain/ids";
import { ROLES, type Role } from "../src/lib/domain/catalog";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const role = arg("role") as Role | undefined;
const username = arg("username");
const displayName = arg("name");
if (!role || !ROLES.includes(role) || !username || !displayName) {
  console.error('Usage: npm run user:create -- --role teacher|student|admin --username <name> --name "Display Name" [--password <pw>]');
  process.exit(1);
}
if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
  console.error("Username must be 3–30 letters, numbers, dots, dashes or underscores.");
  process.exit(1);
}
const password = arg("password") ?? randomBytes(9).toString("base64url");
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const db = openDatabase(databasePath());
const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
if (exists) {
  console.error(`User "${username}" already exists.`);
  process.exit(1);
}
db.prepare("INSERT INTO users (id, role, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
  newId(),
  role,
  username,
  displayName,
  hashPassword(password),
  Date.now(),
);
db.close();
console.log(`Created ${role} "${username}" (${displayName}).`);
if (!arg("password")) console.log(`Temporary password: ${password}`);
