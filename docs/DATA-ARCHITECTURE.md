# Data architecture: SQLite now, PostgreSQL later (if ever)

Decision for the pilot: **keep SQLite.** Nothing below was migrated; this is an
assessment and a plan.

## How data is stored today

| What | Where |
| --- | --- |
| All records (accounts, classes, lessons, live sessions, answers, lab work, library, review history) | One SQLite file, `DATABASE_PATH` (default `data/future-classroom.db`), 40 tables, schema migrations in `src/lib/db/schema.ts` applied at start-up |
| Uploaded materials and attachments | Files in `UPLOAD_DIR` (default `data/uploads`), random names, outside `public/` |
| Search over school materials | SQLite FTS5 table `material_chunks_fts` |
| Live-lesson notifications, rate limits | Memory of the one server process (lost on restart; nothing permanent is kept there) |

Settings: WAL journal, `synchronous = NORMAL`, `busy_timeout = 5000`, foreign
keys on. Access is through `better-sqlite3`, which is synchronous: 31 service
files call `getDb()` directly (about 340 prepared statements, 17 explicit
transactions).

## Is SQLite suitable for the pilot?

Measured on the development container with `scripts/classroom-sim.mjs`
(a teacher console, a projector view and N students with their own event
streams, all answering within a few seconds of each activity opening):

| Class size | Requests for a 7-activity lesson | Answer request p95 | Student screen refresh p95 | Activity reaches every screen p95 | Lost answers |
| --- | --- | --- | --- | --- | --- |
| 16 students | 664 | 10 ms | 58 ms | 86 ms | 0 |
| 32 students | 1,256 | 10 ms | 92 ms | 118 ms | 0 |

A lesson writes a few hundred small rows. SQLite handles thousands of such
writes per second on ordinary hardware; one class, or several classes at the
same time, is far below that. The database of the demo school after several
simulated lessons is under 6 MB.

**Suitable** for: one school, one server, a few classes at the same time.

**Not suitable** (and the code would need changing, not only the database) for:
several server processes behind a load balancer, a multi-school hosted
service, or a database on a network share (SQLite must be on a local disk).

## Concurrency

- Readers never block the writer and vice versa (WAL).
- Writes are serialised. Every write here is a short statement or a short
  transaction; `busy_timeout` makes a second writer wait up to 5 s instead of
  failing. No write holds the lock across a network call (AI requests run
  outside transactions).
- Because `better-sqlite3` is synchronous, a very slow query would pause the
  whole process. None was seen in the simulation; the slowest student refresh
  was 225 ms with 32 students.
- Live-lesson notifications live in process memory, which is why the app must
  run as **one** process. This, not SQLite, is the first thing to change for
  multiple processes (see below).

## Backup and recovery

- `npm run backup` uses SQLite's online backup API (safe while lessons run),
  copies the uploads, runs an integrity check on the copy and keeps the newest
  14 backups (`--keep`, `--to` or `BACKUP_DIR`).
- `npm run restore -- <backup folder>` refuses while the server runs, checks
  the backup, moves the current data aside (never deletes it) and restores.
- `npm run doctor` reports the age of the newest backup.
- Both were exercised on a scratch database (backup → change a password →
  restore → the change is gone, uploads are back). See `docs/OPERATIONS.md`.

A backup on the same disk does not survive a disk failure: copy the backup
folder to a USB disk or another computer regularly.

## Deployment

One Node.js process (`npm start`), the `data/` folder on a local disk, started
by the operating system's service manager so it restarts after a crash or a
reboot. When asked to stop, the server closes live-lesson event streams and
exits within about 3 seconds (measured: 3.0 s with a live lesson running);
browsers reconnect by themselves and queued answers are sent afterwards
(`npm run drill` checks this).

## When to move to PostgreSQL

Move only when one of these becomes true:

1. More than one server process is needed (several schools on one service, or
   high availability with a standby).
2. Another system (a school MIS, a reporting tool) must read the data live.
3. The database outgrows one machine's disk or needs point-in-time recovery
   beyond nightly backups.

Class size alone is not a reason; see the measurements above.

## What PostgreSQL would require

| Area | Change |
| --- | --- |
| Data access | `better-sqlite3` is synchronous; `pg` is asynchronous. Every service function that touches the database becomes `async`, and every caller (pages, routes, services) awaits it. This is the bulk of the work. |
| SQL dialect | `INSERT … ON CONFLICT` works in both. Replace `json_extract(detail, '$.x')` (2 places) with `detail->>'x'` and store JSON as `jsonb`. Integer 0/1 booleans can stay or become `boolean`. `COLLATE NOCASE` and `LIKE` behaviour differ (use `ILIKE` / `citext`). |
| Search | FTS5 (`material_chunks_fts`, BM25 ranking) → PostgreSQL full-text search (`tsvector`; there is no Georgian dictionary, so use the `simple` configuration plus `pg_trgm` for prefix matching). Re-check search quality with the existing unit tests. |
| Migrations | Port `MIGRATIONS` to PostgreSQL DDL (types, `TEXT` ids stay text). |
| Live notifications | Replace the in-process event bus with PostgreSQL `LISTEN/NOTIFY` (or Redis) so every process sees every lesson event. |
| Rate limits, sessions | Rate limits move to the database or Redis. Sessions are already in the database. |
| Uploads | Move to shared storage (S3-compatible or a network volume) once there is more than one process. |
| Tests | Unit tests use in-memory SQLite (`freshDb`). They would need a PostgreSQL test database per run (e.g. a container) and would run slower. |

### Migration plan (short)

1. Introduce a small data-access interface in `src/lib/db` and make the
   services `async` while still backed by SQLite. Ship this alone; it is the
   risky part and it is testable with the current suites.
2. Add a PostgreSQL implementation behind the same interface, with the ported
   schema and search. Run the unit tests against both.
3. Replace the in-process bus with `LISTEN/NOTIFY`; run two processes in the
   classroom simulator.
4. Write a one-off copy script (SQLite → PostgreSQL, table by table, with row
   counts compared) and rehearse it on a copy of the school's backup.
5. Switch over during a holiday, keeping the last SQLite backup as the way back.

Estimated effort: several weeks for one developer, most of it step 1.
