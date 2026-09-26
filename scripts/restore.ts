/**
 * Restores a backup made with `npm run backup`.
 *
 *   1. Stop the Future Classroom server.
 *   2. npm run restore -- backups/future-classroom-2026-10-01-15-30
 *   3. Start the server again.
 *
 * The current database and uploads are moved aside (data/before-restore-…)
 * first, never deleted, so a restore can itself be undone.
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { databasePath } from "../src/lib/db";

const from = process.argv.slice(2).find((a) => !a.startsWith("--"));
const target = databasePath();
const uploads = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

function fail(message: string): never {
  console.error(`Restore FAILED: ${message}`);
  process.exit(1);
}

if (!from) fail("say which backup folder to restore, e.g. npm run restore -- backups/future-classroom-2026-10-01-15-30");
const backupDb = path.join(from, "future-classroom.db");
if (!fs.existsSync(backupDb)) fail(`${backupDb} does not exist.`);

// The backup must be readable and intact.
const check = new Database(backupDb, { readonly: true });
const integrity = check.pragma("integrity_check", { simple: true }) as string;
const users = (check.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
check.close();
if (integrity !== "ok") fail(`the backup failed its integrity check (${integrity}).`);

// The server writes its process id next to the database when it opens it.
const pidFile = `${target}.pid`;
if (fs.existsSync(pidFile)) {
  const pid = Number(fs.readFileSync(pidFile, "utf8"));
  let alive = false;
  try {
    process.kill(pid, 0);
    alive = pid !== process.pid;
  } catch (error) {
    alive = (error as NodeJS.ErrnoException).code === "EPERM";
  }
  if (alive) fail(`the server (process ${pid}) is still running. Stop it first.`);
}
// A writer in the middle of a change also blocks an exclusive lock.
if (fs.existsSync(target)) {
  const live = new Database(target, { fileMustExist: true, timeout: 1000 });
  try {
    live.exec("BEGIN EXCLUSIVE; COMMIT;");
    live.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    live.close();
    fail("the database is in use. Stop the Future Classroom server first.");
  }
  live.close();
}

const aside = path.join(path.dirname(target), `before-restore-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`);
fs.mkdirSync(aside, { recursive: true });
for (const file of [target, `${target}-wal`, `${target}-shm`]) {
  if (fs.existsSync(file)) fs.renameSync(file, path.join(aside, path.basename(file)));
}
if (fs.existsSync(uploads)) fs.renameSync(uploads, path.join(aside, "uploads"));

fs.copyFileSync(backupDb, target);
if (fs.existsSync(path.join(from, "uploads"))) fs.cpSync(path.join(from, "uploads"), uploads, { recursive: true });
console.log(`Restored ${from} (${users} accounts). The previous data is in ${aside}. Start the server again.`);
