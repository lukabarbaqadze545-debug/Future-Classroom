/**
 * Backs up the database and uploaded files into one dated folder.
 *
 *   npm run backup                      # into ./backups
 *   npm run backup -- --to /mnt/usb/fc  # somewhere else (e.g. a USB disk; or set BACKUP_DIR)
 *   npm run backup -- --keep 30         # keep the 30 newest backups (default 14)
 *
 * Safe while the server is running: SQLite's online backup copies a
 * consistent snapshot. The copy is checked (integrity check + account count)
 * before older backups are pruned.
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { databasePath } from "../src/lib/db";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const source = databasePath();
const uploads = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const root = path.resolve(arg("to") ?? process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups"));
const keep = Math.max(1, Number(arg("keep") ?? 14));

async function main() {
  if (!fs.existsSync(source)) throw new Error(`No database at ${source}. Set DATABASE_PATH if it lives elsewhere.`);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const target = path.join(root, `future-classroom-${stamp}`);
  fs.mkdirSync(target, { recursive: true });

  const db = new Database(source, { fileMustExist: true });
  await db.backup(path.join(target, "future-classroom.db"));
  db.close();
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(target, "uploads"), { recursive: true });

  // Check the copy before trusting it.
  const copy = new Database(path.join(target, "future-classroom.db"), { readonly: true });
  const integrity = (copy.pragma("integrity_check", { simple: true }) as string) ?? "";
  const users = (copy.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  const sessions = (copy.prepare("SELECT COUNT(*) AS n FROM classroom_sessions").get() as { n: number }).n;
  copy.close();
  if (integrity !== "ok") throw new Error(`The backup failed its integrity check: ${integrity}`);
  fs.writeFileSync(
    path.join(target, "BACKUP.txt"),
    `Future Classroom backup\nCreated: ${new Date().toISOString()}\nFrom: ${source}\nAccounts: ${users}\nClassroom sessions: ${sessions}\nRestore: npm run restore -- ${target}\n`,
  );

  const size = (dir: string): number =>
    fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => sum + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
  console.log(`Backup written to ${target} (${(size(target) / 1024 / 1024).toFixed(1)} MB, ${users} accounts, ${sessions} classroom sessions, integrity ok).`);

  const old = fs
    .readdirSync(root)
    .filter((name) => name.startsWith("future-classroom-"))
    .sort()
    .reverse()
    .slice(keep);
  for (const name of old) {
    fs.rmSync(path.join(root, name), { recursive: true, force: true });
    console.log(`Removed old backup ${name}`);
  }
}

main().catch((error) => {
  console.error(`Backup FAILED: ${error.message ?? error}`);
  process.exit(1);
});
