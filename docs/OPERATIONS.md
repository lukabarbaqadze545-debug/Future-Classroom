# Running Future Classroom at school

For the person who looks after the server (an IT teacher, a technician or an
administrator). No programming is needed. Each command is run in a terminal
inside the Future Classroom folder.

## 1. Install (once)

Requirements: a computer that stays on during school hours (Windows, macOS or
Linux), Node.js 22 or newer, 2 GB of free disk space, and a wired or Wi-Fi
connection that the classroom computers can reach.

```bash
npm ci                 # install the exact dependency versions
npm run build          # build the app (a few minutes)
npm run user:create -- --role admin --username admin.school --name "School administrator"
npm run user:create -- --role teacher --username n.beridze --name "ნინო ბერიძე"
```

Each `user:create` prints a temporary password once; write it on a slip for
that person. They are asked to choose their own after signing in.

Create a file `.env.local` next to `package.json` (copy `.env.example`) and
check these lines:

```
DEMO_MODE=false
SEED_DEMO=false
SELF_REGISTRATION=false
DEFAULT_LANGUAGE=ka
# PUBLIC_BASE_URL=http://192.168.1.10:3000   ← the address students type
# ANTHROPIC_API_KEY=                          ← optional; everything works without it
```

Then run `npm run doctor`. It must end with "No blocking problems found".

## 2. Start and keep it running

```bash
npm start -- -p 3000
```

Students open `http://<server address>:3000` (for example
`http://192.168.1.10:3000`). Find the address with `ipconfig` (Windows) or
`ip addr` (Linux). Write it on the board next to the classroom code.

To start it automatically after a reboot, register it with the operating
system's service manager:

- **Linux (systemd)** — `/etc/systemd/system/future-classroom.service`:

  ```ini
  [Unit]
  Description=Future Classroom
  After=network.target

  [Service]
  WorkingDirectory=/opt/future-classroom
  ExecStart=/usr/bin/npm start -- -p 3000
  Restart=always
  User=futureclassroom

  [Install]
  WantedBy=multi-user.target
  ```

  then `sudo systemctl enable --now future-classroom`.
- **Windows** — Task Scheduler: a task "At startup" that runs `npm start -- -p 3000`
  in the Future Classroom folder, restarting on failure.

Run exactly **one** copy of the server. Stopping it (Ctrl+C, `systemctl stop`)
takes up to about 3 seconds; lessons in progress keep their answers and
continue when it is back (students' screens show "Reconnecting…" meanwhile).

## 3. Backups

```bash
npm run backup                     # into ./backups, keeps the newest 14
npm run backup -- --to E:\fc-backups   # e.g. a USB disk (or set BACKUP_DIR)
```

- Safe while lessons run. The backup is checked after it is written.
- Run it **every school day** (add it to the service manager / Task Scheduler
  at, say, 17:00) and copy the `backups` folder to a USB disk or another
  computer **every week**. A backup on the same disk does not survive a broken
  disk.
- Backups contain student names, work and password hashes: keep them where
  students cannot reach them.

### Restore

1. Stop the server.
2. `npm run restore -- backups/future-classroom-2026-10-01-17-00`
3. Start the server.

The data that was there before is moved to `data/before-restore-…`, never
deleted. Answers given after the backup was made are lost.

## 4. Accounts and passwords

| Situation | What to do |
| --- | --- |
| New teacher | `npm run user:create -- --role teacher --username … --name "…"` |
| New students | The teacher opens their class → **Add students** → one name per line → prints the slips. |
| A student forgot their password | The teacher opens the class → **New password** next to the student's name → gives the new slip. |
| A teacher or administrator forgot their password | `npm run user:password -- --username …` prints a new temporary password. |
| List all accounts | `npm run user:password -- --list` |
| "Too many attempts" at sign-in | Wait 15 minutes, or a teacher resets the student's password (this clears it). |
| A student left the school | The teacher removes them from the class; their account and work stay until the school decides otherwise. |

## 5. When something goes wrong

| Symptom | Check |
| --- | --- |
| Nobody can open the site | Is the server computer on and the service running? Does `http://localhost:3000` open **on the server itself**? If yes, the problem is the network or a firewall (allow port 3000). |
| Students see "Offline" / "Reconnecting…" | Their computer lost the network. Answers are kept on their computer and sent when the connection returns; they do not need to retype. |
| The lesson screen is stuck | Reload the page (F5). Answers already sent are kept. |
| Someone joined with a silly name | In the teacher console, the ✕ next to the name removes them. |
| The server crashed | The service manager restarts it. If it keeps crashing, run `npm run doctor` and look at the service log. |
| The database is damaged (`doctor` reports an integrity problem) | Stop the server, restore the newest backup (section 3). |
| The disk is full | `npm run doctor` shows free space. Move old backups off the computer. |

## 6. Updates

1. `npm run backup`
2. Stop the server.
3. Get the new version (e.g. `git pull`), then `npm ci` and `npm run build`.
4. Start the server. Database changes are applied automatically at start-up.
5. `npm run doctor`.

If the new version misbehaves: stop it, go back to the previous version
(`git checkout <previous tag>`, `npm ci`, `npm run build`) and restore the
backup from step 1.

Check for security fixes once a month: `npm audit --omit=dev`. Update
dependencies only together with a full test run (`npm run check`,
`npm run test:e2e`) on a copy, never directly on the school server during term.

New built-in lessons arrive with updates and are installed at start-up. Lessons
teachers wrote or copied are never changed by an update.

## 7. Checklists

**Before the first lesson**
- [ ] `npm run doctor` shows no problems; demo mode, demo data and self-registration are off.
- [ ] One administrator account and all teacher accounts exist; the initial passwords were changed.
- [ ] Each class exists with its students; the slips are printed.
- [ ] The address works from a classroom computer and from the projector computer.
- [ ] A test lesson was run with two or three computers (see `docs/PILOT.md`).
- [ ] A backup was made and restored once on a spare computer.

**Every day** — the backup ran (the service log, or `npm run doctor`).

**Every week** — copy `backups/` off the server; glance at free disk space.

**Every month** — `npm audit --omit=dev`; check that the restore instructions still work.

**Every term** — remove accounts of students who left (ask the school first); update the platform during a holiday, not during term.

## 8. Handing over

The school should never depend on one person. Keep a printed copy of this page
with the server, together with:

- where the server is and how to log in to the computer itself,
- the administrator account name (not the password — keep that in the school's
  password safe),
- where the weekly backup copies are kept.

Anyone who can follow this page can keep the system running. Developers are
only needed for new features or if a bug appears; the code, its tests and
`README.md` describe how it works.
