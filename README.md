# Future Classroom

An AI-assisted digital learning environment for modern classrooms — built for a school with ~16 desktop learning workstations and one interactive touchscreen.

> Technology should improve the learning environment, not replace the teacher.

**Teacher → Lesson → Classroom session → Student activities → Hints → Feedback → Progress**

- **Teachers** draft a lesson (with AI, or from built-in lessons when AI is off), edit everything, and run it live: students join with a code like `FC-4821`, the teacher launches activities one by one and sees answers arrive in real time.
- **Students** answer on their workstation and get **hint-first help**: a conceptual nudge first, more specific hints next, and the full solution only as the last step (and only if the teacher allows it). Outside class they practise, take quizzes, review mistakes and ask the school library questions.
- **School materials** (PDF, DOCX, TXT, Markdown) are indexed so students can ask questions and get answers with cited passages.
- **English and Georgian** throughout the interface.

---

## Quick start

Requirements: Node.js 20.9+ (22 LTS recommended).

```bash
npm install
npm run dev          # http://localhost:3000
```

On first start the app creates `data/future-classroom.db` and seeds a demo school (teachers, students, lessons, two finished sessions, quizzes and materials). No other setup is needed.

Demo accounts (password `demo1234`), or use the one-click buttons on the home page:

| Role | Username | Notes |
| --- | --- | --- |
| Teacher | `nino` | Mathematics, owns the demo sessions |
| Teacher | `davit`, `eka` | Physics/CS, Biology/Geography |
| Student | `mariam` | Has progress history |
| Students | `giorgi`, `ana`, `luka`, `saba`, `elene`, `nika`, `tamar` | |
| Admin | `admin` | Can open any teacher's content |

### Enabling AI (optional)

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY=... (and optionally AI_MODEL, default claude-opus-5)
```

Without a key everything still works in **offline mode**, and the UI says so everywhere it matters (header badge, lesson notices, hint labels, library notes). The app never presents template content as AI output.

## The 5-minute demo

1. **Teacher** (normal window): *Continue as demo teacher* → **Create lesson** → Mathematics, Grade 11, “Quadratic equations” → **Generate lesson**.
2. Review the lesson: tabs for structure (with a parabola graph), activities (each with a 4-step hint ladder and solution), discussion & homework. Edit anything, then **Start classroom session** → the join code appears.
3. **Student** (private window or another workstation): open `/join`, enter the code and a first name.
4. Teacher: **Launch first activity**. Student answers the multiple-choice question.
5. Teacher: **Next activity** (“Solve x² − 5x + 6 = 0”). Student clicks **Get a hint** twice (“What two numbers multiply to 6 and add to −5?”), submits a wrong answer, then the right one.
6. Teacher sees the answer, attempts and hints used, clicks **Show results to class**, optionally opens **Presentation view** on the touchscreen.
7. **End session** → the session summary (participation, correct %, common wrong answers, per-student table).

Also worth showing: *Class overview* (teacher insights), the student dashboard/progress, and the student **Library** (“What does our physics material say about Newton’s second law?”).

## Running it in a classroom

The app is designed to run as **one Node.js process on a school computer or small server** on the classroom network; workstations and the touchscreen open it in a browser.

```bash
npm run build
DEMO_MODE=false SEED_DEMO=false npm start -- -p 3000   # then open http://<server-ip>:3000
npm run user:create -- --role teacher --username nbe --name "Nino Beridze"
```

- Data lives in `data/` (SQLite database + uploaded files). Back up this folder.
- Real-time updates use Server-Sent Events with automatic polling fallback, so sessions keep working behind proxies or on unstable Wi-Fi; student drafts are kept in the browser.
- Serve over HTTPS if the network allows it (`COOKIE_SECURE=true`).
- Run a single instance (the real-time channel and rate limiter are in-process).

## Architecture

| Layer | Choice |
| --- | --- |
| Web app | Next.js 16 (App Router, React 19, TypeScript, Turbopack), Tailwind CSS v4 |
| Data | SQLite via `better-sqlite3` (WAL), schema migrations in `src/lib/db/schema.ts` |
| Search | SQLite FTS5 (BM25 + phrase/coverage re-ranking), Georgian-aware prefix matching |
| Real-time | Server-Sent Events + in-process event bus; clients re-fetch their own view |
| AI | Provider-neutral `AIProvider` interface; Anthropic implementation via the official SDK (structured outputs) |
| Auth | Username/password (scrypt), server-side sessions in SQLite, httpOnly cookies; roles from the database only |
| Tests | Vitest (unit + service tests on in-memory SQLite), Playwright (end-to-end demo flow) |

```
src/
  app/                  routes (pages + /api route handlers)
    teacher/            dashboard, lessons, sessions (live console), quizzes, materials, insights
    student/            dashboard, learn (topic: learn/practice/quiz/ask), progress, library
    session/[id]        student live-session screen
    present/            touchscreen presentation (live session, lesson slides)
  components/           UI (ui/ primitives, lesson editor, session console, student views, …)
  lib/
    ai/                 AIProvider, Anthropic provider, lesson/quiz generators, hint service,
                        tutor, library Q&A, built-in lesson templates (EN + KA)
    services/           lessons, quizzes, sessions, materials, progress, users
    domain/             zod schemas, grading, ids/join codes, safe math-expression parser
    db/                 connection, schema, demo seed
    i18n/               en.ts (source of truth), ka.ts (type-checked against en), helpers
    files/              upload validation, text extraction (PDF/DOCX), chunking, search query
    http/, auth/, realtime/
tests/unit, tests/e2e
```

### Key design decisions

- **Teacher control.** AI output is always a draft. Regenerating a section/activity replaces it in the editor only (with undo) until the teacher saves. Publishing an AI lesson requires confirming it was reviewed.
- **Hint-first.** `lib/ai/hint-service.ts` serves teacher-written hints first, then AI hints (cached per activity and level, so a whole class asking costs one model call), then clearly-labelled generic strategies. Level 5 (full solution) exists only if the teacher allows it.
- **No answer leaks.** Students' session and practice payloads never include answer keys, hints they have not unlocked or solutions; answers are checked on the server.
- **Honest AI.** Every AI-dependent feature has an offline path and says which path was used. The library answers only from retrieved passages and returns the passages themselves when AI is off. AI never fills the lesson *sources* field.
- **Snapshots.** A classroom session copies its activities at start, so editing a lesson later never changes past results.
- **Privacy.** Students need only a first name; tutor conversations are not stored; the only behavioural data kept is which questions were answered and whether correctly (see `/privacy`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm run check` | All three of the above |
| `npm run test:e2e` | Builds, starts a fresh demo server and runs the Playwright demo flow (set `PLAYWRIGHT_CHROMIUM_PATH` to use a system Chromium) |
| `npm run db:reset` | Recreate the database with demo data (`-- --empty` for none) |
| `npm run user:create` | Create a teacher/student/admin account |

## Configuration

See `.env.example`: `ANTHROPIC_API_KEY`, `AI_MODEL`, `DATABASE_PATH`, `UPLOAD_DIR`, `SEED_DEMO`, `DEMO_MODE`, `COOKIE_SECURE`.

## Known limitations

- Library search is keyword-based (FTS5); semantic search is prepared (`material_chunks.embedding`) but not implemented. Scanned PDFs without a text layer are stored but not searchable.
- No class rosters or admin console yet: sessions carry a free-text class label, and accounts are created with `npm run user:create` or student self-registration.
- Single-process deployment (in-memory event bus and rate limits).
- Georgian UI strings and the Georgian demo lesson should be reviewed by a native-speaking teacher.
- Future modules (Programming Lab, STEM Lab, Research Lab, Critical Thinking Lab, School Library, Career) are shown as *planned* and not implemented.
