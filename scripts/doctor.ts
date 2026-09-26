/**
 * Health check for the person looking after the server.
 *
 *   npm run doctor
 *
 * Reports settings that matter for a real school, the database state, the
 * newest backup and free disk space. Prints OK / WARN / FAIL per line and
 * exits 1 if anything failed. Changes nothing.
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { databasePath } from "../src/lib/db";
import { MIGRATIONS } from "../src/lib/db/schema";
import { verifyPassword } from "../src/lib/auth/password";

type Level = "OK" | "WARN" | "FAIL";
const lines: { level: Level; text: string }[] = [];
const report = (level: Level, text: string) => lines.push({ level, text });
const flag = (name: string) => process.env[name];

// --- Settings ------------------------------------------------------------------
// Scripts do not run as a production build, so mirror the production defaults.
for (const [name, what] of [
  ["DEMO_MODE", "one-click demo sign-in"],
  ["SEED_DEMO", "demo accounts with the public password demo1234"],
  ["SELF_REGISTRATION", "students creating their own accounts"],
] as const) {
  if (flag(name) === "true") report(name === "SELF_REGISTRATION" ? "WARN" : "FAIL", `${name}=true: ${what} is on. Turn it off for real school use.`);
  else report("OK", `${name} is off in production (${flag(name) === undefined ? "default" : `set to ${flag(name)}`}).`);
}
report("OK", flag("ANTHROPIC_API_KEY") ? "AI is configured (optional)." : "AI is not configured: the platform runs fully without it (built-in lessons, teacher hints).");
if (flag("COOKIE_SECURE") !== "true") report("WARN", "COOKIE_SECURE is not true: fine on plain HTTP inside the school network; set it when serving over HTTPS.");

// --- Database ------------------------------------------------------------------
const file = databasePath();
if (!fs.existsSync(file)) {
  report("FAIL", `No database at ${file}. Start the server once (it creates it) or set DATABASE_PATH.`);
} else {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  const integrity = db.pragma("integrity_check", { simple: true }) as string;
  report(integrity === "ok" ? "OK" : "FAIL", `Database ${file}: integrity ${integrity}.`);
  const applied = (db.prepare("SELECT MAX(id) AS id FROM schema_migrations").get() as { id: number | null }).id ?? 0;
  const latest = MIGRATIONS[MIGRATIONS.length - 1].id;
  report(applied === latest ? "OK" : "WARN", applied === latest ? `Schema is up to date (migration ${latest}).` : `Schema at migration ${applied}, code expects ${latest}: start the server once to update it.`);
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const admins = count("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND password_hash != '!'");
  const teachers = count("SELECT COUNT(*) AS n FROM users WHERE role = 'teacher'");
  const students = count("SELECT COUNT(*) AS n FROM users WHERE role = 'student'");
  report(admins > 0 ? "OK" : "WARN", `Accounts: ${admins} administrator(s), ${teachers} teacher(s), ${students} student(s).${admins ? "" : " Create an administrator with npm run user:create -- --role admin …"}`);
  // Staff accounts still using the published demo password (students are not checked: scrypt is slow on purpose).
  const weak = (db.prepare("SELECT username, password_hash AS hash FROM users WHERE password_hash != '!' AND role != 'student'").all() as { username: string; hash: string }[]).filter((u) =>
    verifyPassword("demo1234", u.hash),
  );
  if (weak.length)
    report(
      "FAIL",
      `${weak.length} account(s) use the demo password demo1234 (e.g. ${weak
        .slice(0, 3)
        .map((u) => u.username)
        .join(", ")}). Use a fresh database for real students, or give them new passwords with npm run user:password.`,
    );
  const live = count("SELECT COUNT(*) AS n FROM classroom_sessions WHERE status != 'ended'");
  if (live) report("OK", `${live} lesson(s) not ended yet (a teacher can end them from Classroom sessions).`);
  const size = fs.statSync(file).size + (fs.existsSync(`${file}-wal`) ? fs.statSync(`${file}-wal`).size : 0);
  report("OK", `Database size ${(size / 1024 / 1024).toFixed(1)} MB.`);
  db.close();
}

// --- Backups -----------------------------------------------------------------------
const backups = path.resolve(process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups"));
const newest = fs.existsSync(backups)
  ? fs
      .readdirSync(backups)
      .filter((n) => n.startsWith("future-classroom-"))
      .sort()
      .pop()
  : undefined;
if (!newest) report("WARN", `No backups in ${backups}. Run npm run backup (and copy it off this computer).`);
else {
  const age = (Date.now() - fs.statSync(path.join(backups, newest)).mtimeMs) / 86_400_000;
  report(age <= 7 ? "OK" : "WARN", `Newest backup ${newest} (${age < 1 ? "today" : `${Math.floor(age)} day(s) old`}).`);
}

// --- Disk --------------------------------------------------------------------------
try {
  const stats = fs.statfsSync(path.dirname(file));
  const freeGb = (stats.bavail * stats.bsize) / 1024 ** 3;
  report(freeGb > 2 ? "OK" : freeGb > 0.5 ? "WARN" : "FAIL", `Free disk space: ${freeGb.toFixed(1)} GB.`);
} catch {
  report("WARN", "Could not read free disk space.");
}

for (const l of lines) console.log(`${l.level.padEnd(4)}  ${l.text}`);
const failed = lines.filter((l) => l.level === "FAIL").length;
console.log(failed ? `\n${failed} problem(s) need attention.` : "\nNo blocking problems found.");
process.exit(failed ? 1 : 0);
