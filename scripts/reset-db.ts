/**
 * Deletes the local database and uploaded files, then recreates the demo
 * school. Usage: npm run db:reset   (add --empty to skip the demo data)
 */
import fs from "node:fs";
import path from "node:path";
import { databasePath, openDatabase } from "../src/lib/db";
import { seedDemoSchool } from "../src/lib/db/seed";

const file = databasePath();
const uploads = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
for (const target of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(target, { force: true });
fs.rmSync(uploads, { recursive: true, force: true });

const db = openDatabase(file);
if (!process.argv.includes("--empty")) seedDemoSchool(db);
db.close();
console.log(`Database ready at ${file}${process.argv.includes("--empty") ? " (empty)" : " with demo data"}.`);
