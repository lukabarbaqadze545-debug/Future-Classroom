# Future Classroom

A modern digital learning platform built for Georgian schools — Georgian first, English alongside — for a school with ~16 desktop learning workstations and one interactive touchscreen. AI helps where it is useful; nothing depends on it.

> Technology should improve the learning environment, not replace the teacher.

**Teacher → Lesson → Classroom session → Student activities → Hints → Feedback → Progress**

- **Teachers** draft a lesson (with AI, or from built-in lessons when AI is off), edit everything, and run it live: students join with a code like `FC-4821`, the teacher launches activities one by one and sees answers arrive in real time.
- **Students** answer on their workstation and get **hint-first help**: a conceptual nudge first, more specific hints next, and the full solution only as the last step (and only if the teacher allows it). Outside class they practise, take quizzes, review mistakes and ask the school library questions.
- **School materials** (PDF, DOCX, TXT, Markdown) are indexed so students can ask questions and get answers with cited passages.
- **Six laboratories** that work without AI: Programming (Python and C++), STEM, Research, Critical Thinking, the School Library and Career & University — tied together by teacher assignments, a student portfolio and one learning profile per student.
- **18 subjects** with a catalogue (`/subjects`): 46 built-in lessons with practice, hint ladders and quizzes, each linked to the lab activities, simulations, books and career pages that fit it.
- **Georgian and English** throughout: the interface, the built-in lessons, the lab content and the demo school. Georgian is the default.

---

## Quick start

Requirements: Node.js 20.9+ (22 LTS recommended).

```bash
npm install
npm run dev          # http://localhost:3000
```

On first start in development (`npm run dev`) the app creates `data/future-classroom.db`, installs the built-in lessons and seeds a demo school (teachers, students, two finished sessions, quiz results, materials, lab work and assignments), written in the school's language — Georgian unless `DEFAULT_LANGUAGE=en`. No other setup is needed.

Demo accounts (password `demo1234`), or use the one-click buttons on the home page:

| Role | Username | Notes |
| --- | --- | --- |
| Teacher | `nino` | Mathematics, economics, research, critical thinking; owns the demo sessions |
| Teachers | `davit`, `eka` | Physics, computer science, engineering · Chemistry, biology, geography, health |
| Teachers | `manana`, `irakli`, `natia` | Georgian, arts · History, civics · English, career |
| Student | `mariam` | Has progress history |
| Students | `giorgi`, `ana`, `luka`, `saba`, `elene`, `nika`, `tamar` | |
| Admin | `admin` | Can open any teacher's content |

### Enabling AI (optional)

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY=... (and optionally AI_MODEL, default claude-opus-5)
```

Without a key everything still works in **offline mode**, and the UI says so everywhere it matters (header badge, lesson notices, hint labels, library notes). The app never presents template content as AI output. The six laboratories use no AI at all: checking, feedback and hints are deterministic or teacher-written.

## The 5-minute demo

1. **Teacher** (normal window): *Continue as demo teacher* → **Create lesson** → Mathematics, Grade 11, “Quadratic equations” → **Generate lesson**.
2. Review the lesson: tabs for structure (with a parabola graph), activities (each with a 4-step hint ladder and solution), discussion & homework. Edit anything, then **Start classroom session** → the join code appears.
3. **Student** (private window or another workstation): open `/join`, enter the code and a first name.
4. Teacher: **Launch first activity**. Student answers the multiple-choice question.
5. Teacher: **Next activity** (“Solve x² − 5x + 6 = 0”). Student clicks **Get a hint** twice (“What two numbers multiply to 6 and add to −5?”), submits a wrong answer, then the right one.
6. Teacher sees the answer, attempts and hints used, clicks **Show results to class**, optionally opens **Presentation view** on the touchscreen.
7. **End session** → the session summary (participation, correct %, common wrong answers, per-student table).

Also worth showing: *Class overview* (teacher insights), the student dashboard/progress, and the student **Library** (“What does our physics material say about Newton’s second law?”).

## Subjects and built-in lessons

**Subjects** (`/subjects`) is the entry point for students and teachers: 18 subjects in six groups, filterable by grade and activity type. Each subject page has a recommended learning path, topics that link to real content (lessons, quizzes, programming problems, simulations, experiments, projects, library books, careers), the student's progress on each item and the lessons the school's own teachers have published. Teachers can preview or duplicate a lesson, assign any item, run it in a live session or start a new lesson for the subject.

| | |
| --- | --- |
| Built-in lessons | 51 topics in all 18 subjects (`src/lib/content/lessons/`), written in Georgian and English side by side (Georgian literature in Georgian only): objectives, sections, 529 activities with hint ladders and solutions, 352 quiz questions (both languages counted). Georgian lessons use Georgian examples (lari, cities, history, literature) and Georgian units. |
| Installation | Built-in lessons are installed into every database at startup, including an empty one, and updated when the platform is updated (`src/lib/db/builtin.ts`). Teachers duplicate a lesson to adapt it. |
| Language | Each reader sees the version in their interface language; a link opens the other version. The interface language comes from the switcher, then `DEFAULT_LANGUAGE`, then the browser; Georgian is the fallback. |
| Terminology | `src/lib/i18n/terminology.ts` fixes the Georgian terms (and rules out calques such as „დაშბორდი“); `tests/unit/terminology.test.ts` checks every dictionary and every Georgian lesson and lab text against it. |
| Universities | No admission facts are stored as permanent truth: cards say when they were checked, warn after a year and link to official sites. |

## The laboratories

All six labs are reachable from **Labs** in the navigation (`/labs`), plus **Library** (`/library`) and **Career & portfolio** (`/career`).

| Lab | What students do | How work is checked |
| --- | --- | --- |
| **Programming** (`/labs/programming`) | 30 bilingual problems in four levels (basics → algorithms), plus teacher-written ones: write code, predict output, find the bug. Python and C++. | Python runs in the student's browser (Pyodide/WebAssembly in a Web Worker, served from the school server — no internet needed). The server holds the test cases and compares outputs; hidden tests never reach the browser. C++ uses an optional [Judge0](https://judge0.com) sandbox (`JUDGE0_URL`), otherwise students compile locally and paste their outputs (labelled *self-checked*). |
| **STEM** (`/labs/stem`) | 8 classroom experiments (materials, safety, procedure, data table, conclusion), 7 simulations (projectile, motion, circuits, probability, linear model, growth, grid robot), electronics and robotics guides, engineering design projects. | Challenge questions are graded on the server with tolerances; experiment records reveal the expected results only after submission. Every item is labelled *Simulation*, *Classroom experiment* or *Physical project*. |
| **Research** (`/labs/research`) | Question → hypothesis → sources → notes → evidence → data → analysis → findings → conclusion → presentation. Source quality checklist, quotations with attribution, evidence table, datasets with statistics and charts, generated bibliography, presentation mode. | Teacher feedback; quotations must be linked to a source (enforced on the server). |
| **Critical Thinking** (`/labs/critical-thinking`) | Claim analysis, argument builder, fallacy identification (10 fallacies, taught for recognition, not manipulation), media literacy, debate mode with timer, intellectual humility. | Deterministic rubric feedback; progress per fallacy. |
| **School Library** (`/library`) | Catalogue with filters, digital (openly licensed or school-owned) and physical copies, bookmarks, reading progress, questions answered from school materials. | Librarians print QR labels (`/library/labels`); scanning one opens the book page for that copy. Loans are recorded by staff. |
| **Career & University** (`/career`) | Career explorer, fields of study, university research cards, skills self-assessment, goals, portfolio. | University cards show when they were last checked and warn after a year — admission facts are never presented as permanent. |

**Teachers** assign any lab item to a class or to students (`/teacher/assignments`), see who has started, handed in or finished, review work with feedback, and open each student's learning profile (`/teacher/students`). Lab items can also be run as a live classroom session (`/teacher/sessions/labs`).

## Running it in a classroom

The app is designed to run as **one Node.js process on a school computer or small server** on the classroom network; workstations and the touchscreen open it in a browser.

```bash
npm run build
npm start -- -p 3000        # then open http://<server-ip>:3000
npm run user:create -- --role teacher --username nbe --name "Nino Beridze"
npm run doctor              # checks settings, database, backups, disk
```

A production build (`npm start`) has demo sign-in, demo accounts and student self-registration **off** unless `DEMO_MODE`, `SEED_DEMO` or `SELF_REGISTRATION` is set to `true`. Teachers create student accounts on their class page and print sign-in slips.

**Guides:** [docs/OPERATIONS.md](docs/OPERATIONS.md) (install, service, backups, accounts, updates, checklists) · [docs/PILOT.md](docs/PILOT.md) (a 45-minute pilot lesson, minute by minute) · [docs/SECURITY-REVIEW.md](docs/SECURITY-REVIEW.md) · [docs/DATA-ARCHITECTURE.md](docs/DATA-ARCHITECTURE.md) (SQLite assessment, PostgreSQL plan) · [docs/CONTENT-ROADMAP.md](docs/CONTENT-ROADMAP.md) · [docs/LIBRARY-AND-UNIVERSITY-DATA.md](docs/LIBRARY-AND-UNIVERSITY-DATA.md) · [docs/AUDIT.md](docs/AUDIT.md) (pilot-readiness audit).

- Data lives in `data/` (SQLite database + uploaded files). `npm run backup` makes a checked copy while lessons run; `npm run restore` brings one back.
- Real-time updates use Server-Sent Events with automatic polling fallback, so sessions keep working behind proxies or on unstable Wi-Fi; student drafts are kept in the browser.
- Serve over HTTPS if the network allows it (`COOKIE_SECURE=true`).
- Run a single instance (the real-time channel and rate limiter are in-process).
- Set `PUBLIC_BASE_URL` (e.g. `http://192.168.1.10:3000`) so the join address on the projector, account slips and library QR labels show the address workstations and phones actually use. Without it the server uses the request's address, replacing `localhost` with its own network address.
- C++ checking on the server needs a Judge0 instance you run yourself (`JUDGE0_URL`, optionally `JUDGE0_TOKEN`). Student code is never executed by the Future Classroom server itself.

## Architecture

| Layer | Choice |
| --- | --- |
| Web app | Next.js 16 (App Router, React 19, TypeScript, Turbopack), Tailwind CSS v4 |
| Data | SQLite via `better-sqlite3` (WAL), schema migrations in `src/lib/db/schema.ts` |
| Search | SQLite FTS5 (BM25 + phrase/coverage re-ranking), Georgian-aware prefix matching |
| Real-time | Server-Sent Events + in-process event bus; clients re-fetch their own view |
| AI | Provider-neutral `AIProvider` interface; Anthropic implementation via the official SDK (structured outputs) |
| Auth | Username/password (scrypt), server-side sessions in SQLite, httpOnly cookies; roles from the database only |
| Tests | Vitest (unit + service tests on in-memory SQLite), Playwright (end-to-end flows for every lab, offline, multi-tab and screen widths) |

```
src/
  app/                  routes (pages + /api route handlers)
    teacher/            dashboard, lessons, sessions (live console), quizzes, materials, insights
    subjects/           subject catalogue and subject pages
    student/            dashboard, learn (topic: learn/practice/quiz/ask), progress, library
    session/[id]        student live-session screen
    present/            touchscreen presentation (live session, lesson slides, research)
    labs/               lab hub, programming, stem, research, critical-thinking
    library/, career/   School Library (catalogue, QR labels) and Career & University
    portfolio/[userId]  portfolio overview for teachers and mentors
  components/           UI (ui/ primitives, lesson editor, session console, student views, …)
  lib/
    ai/                 AIProvider, Anthropic provider, lesson/quiz generators, hint service,
                        tutor, library Q&A, built-in lesson templates (EN + KA)
    services/           lessons, quizzes, sessions, materials, progress, users,
                        assignments, classes, portfolio, feedback, attachments, learning profile
    labs/               one folder per lab (content catalogues, graders, services),
                        session bridge and assignment registry
    domain/             zod schemas, grading, ids/join codes, safe math-expression parser
    db/                 connection, schema, demo seed
    content/            built-in lessons (EN + KA), subject catalogue and its resolver
    i18n/               en.ts (source of truth), ka.ts (type-checked against en), terminology
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
| `npm run test:e2e` | Builds, starts a fresh demo server with AI disabled and runs the Playwright suites (set `PLAYWRIGHT_CHROMIUM_PATH` to use a system Chromium, `E2E_SKIP_BUILD=1` to reuse the last build) |
| `npm run db:reset` | Recreate the database with demo data (`-- --empty` for none) |
| `npm run user:create` | Create a teacher/student/admin account |
| `npm run user:password` | New temporary password for an account (`-- --username x`), or `-- --list` |
| `npm run backup` / `restore` | Checked backup of database and uploads (safe while running) / restore one (server stopped) |
| `npm run doctor` | Health check: settings, database integrity, demo passwords, backup age, disk space |
| `npm run drill` | Real browsers against a throwaway server: duplicate tabs, slow network, reloads, server restart mid-lesson |
| `node scripts/classroom-sim.mjs --base <url> --students 16` | Simulates a teacher, a projector and N students running a whole lesson over HTTP/SSE; prints latencies |

## Configuration

See `.env.example`: `ANTHROPIC_API_KEY`, `AI_MODEL`, `DATABASE_PATH`, `UPLOAD_DIR`, `SEED_DEMO`, `DEMO_MODE`, `SELF_REGISTRATION`, `BACKUP_DIR`, `DEFAULT_LANGUAGE` (`ka` or `en`: the school's default interface language and the language of the demo data), `COOKIE_SECURE`, `PUBLIC_BASE_URL`, `JUDGE0_URL`, `JUDGE0_TOKEN`, `JUDGE0_PYTHON_ID`, `JUDGE0_CPP_ID`.

## Known limitations

- Library search is keyword-based (FTS5); semantic search is prepared (`material_chunks.embedding`) but not implemented. Scanned PDFs without a text layer are stored but not searchable.
- Classes are simple rosters (add/remove students, create accounts, reset passwords, class progress); there is no full school-administration console, no timetable and no gradebook export.
- Programming tests check output only (no memory or strict performance limits beyond a per-test time limit in the browser). Without Judge0, C++ results are self-reported and labelled as such.
- STEM simulations are simplified models for teaching (no air resistance, ideal components); physical experiments and robotics projects need real materials and kits the school provides.
- Single-process deployment (in-memory event bus and rate limits).
- The Georgian texts were reviewed for natural wording and consistent terminology, but subject teachers who are native speakers should still read the built-in lessons before classroom use, especially literature and history.
- Starter content is a base, not a full curriculum: most subjects have 2–4 built-in lessons (computer science 7, physics 6), and arts, engineering, entrepreneurship and career one each. No built-in lesson has been through the school's review workflow yet; see docs/CONTENT-ROADMAP.md for gaps and order.
- The demo library catalogue and university cards are demo data; a real school enters its own.
- University cards contain only what students and teachers enter; the four shared demo cards have no admission figures on purpose.
