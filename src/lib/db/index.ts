import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./schema";
import { seedDemoSchool } from "./seed";

export type DB = Database.Database;

type GlobalWithDb = typeof globalThis & { __fcDb?: DB; __fcDbSeeding?: boolean };
const g = globalThis as GlobalWithDb;

export function databasePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), "data", "future-classroom.db");
}

export function migrate(db: DB): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)`);
  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row) => (row as { id: number }).id),
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)").run(
        migration.id,
        migration.name,
        Date.now(),
      );
    })();
  }
}

export function openDatabase(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");
  migrate(db);
  return db;
}

/**
 * Process-wide database connection. The first call creates the schema and,
 * on an empty database, seeds the demo school (unless SEED_DEMO=false).
 */
export function getDb(): DB {
  if (g.__fcDb) return g.__fcDb;
  const db = openDatabase(databasePath());
  g.__fcDb = db;
  if (process.env.SEED_DEMO !== "false" && !g.__fcDbSeeding) {
    const users = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    if (users.n === 0) {
      g.__fcDbSeeding = true;
      try {
        seedDemoSchool(db);
      } finally {
        g.__fcDbSeeding = false;
      }
    }
  }
  return db;
}

/** Test helper: replaces the process-wide connection. */
export function setDbForTests(db: DB | undefined): void {
  g.__fcDb = db;
}

export function now(): number {
  return Date.now();
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
