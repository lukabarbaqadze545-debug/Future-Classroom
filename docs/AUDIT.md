# Pilot-readiness audit

Date: 2026-09-26. Scope: the state of the `claude/future-classroom-architecture-q9jp7a`
branch after the pilot-readiness work (7 commits after `c2f8095`, about 110
files, about 6 500 lines added). Written by the developer; every "tested" below names
the test or measurement. Measurements were taken in a Linux container with 4
CPUs and 16 GB of memory, with **no AI key configured**.

**Short answer:** ready for a supervised first pilot with one class, following
`docs/PILOT.md`, after the pilot lesson has been read by a mathematics teacher.
Not yet proven in a real classroom: no real school network, school computers,
students or teacher have used it.

---

## 1. Architecture

- One Next.js 16 process (App Router, React 19, TypeScript), SQLite through
  `better-sqlite3` (WAL), uploads on disk. Server-only service layer in
  `src/lib/services`; API routes are thin wrappers (`handler()`: same-origin
  check, zod validation, error mapping).
- Live lessons: an in-process event bus pushes version numbers over
  Server-Sent Events; clients re-fetch only the view they may see; polling
  takes over when the stream drops.
- Added in this phase, without rewriting existing modules:
  - class rosters with account creation and printable slips
    (`services/accounts.ts`, `services/classes.ts`, `/teacher/classes/[id]`);
  - class-linked live lessons and a single "start a lesson" page
    (`/teacher/sessions/new`);
  - idempotent answers and a browser-side answer queue;
  - staff-only event audience;
  - content review workflow (`domain/review.ts`, `services/lesson-review.ts`,
    lesson preview with answer key, review queue);
  - operations scripts (`backup`, `restore`, `user:password`, `doctor`,
    `drill`, `classroom-sim`) and clean shutdown during lessons.
- Schema changes are one additive migration (4); existing data is kept.

## 2. Pilot readiness

| Requirement | State | Evidence |
| --- | --- | --- |
| Teacher signs in, picks class and lesson, starts | Done | e2e *classroom pilot* |
| Students join with a code or from their home page | Done | e2e *classroom pilot*, *complete classroom demo flow* |
| Launch activities, see responses live, move on, end | Done | same; simulator with 16 and 32 students |
| Results saved and visible afterwards (class page, student progress) | Done | e2e *classroom pilot* (class progress row, "profile-live-lessons") |
| Works without AI, API key or paid provider | Done | every test ran without a key; see section 7 |
| Operable by a teacher without the developer | Not proven | Needs the pilot itself; `docs/PILOT.md` is written for that teacher |
| Maintainable without the developer | Partly | `docs/OPERATIONS.md`, `npm run doctor`, backup/restore scripts; the Linux service setup and Windows Task Scheduler steps were **not** tried on a real machine |

Existing tests at the start of this phase: 229 unit tests and the e2e suite
passed. Now: **254 unit tests** in 14 files (two new: `pilot.test.ts`,
`security.test.ts`) and **28 e2e tests** in 6 files (new: `pilot.spec.ts`), all passing (`npm run check`,
`npm run test:e2e`).

## 3. Classroom workflow

- From the teacher dashboard: **Start a lesson** → choose the lesson (search
  field) → **Start the lesson** = 3 clicks and a few typed letters; from a class
  page the class is preselected; from a subject page the lesson is.
- Console: joined / not-yet-joined lists, per-student status (waiting,
  answered, correct, wrong), live answer counts, show/hide results, timer,
  pause, remove a participant, end with summary.
- Projector view: large type, 64-px touch targets, timer, activity position,
  answer progress bar, results without names, join address and code. Checked
  by screenshots at 1920×1080, 1366×768, 1280×800 and 1024×768 in Georgian and
  English (32 views): no horizontal or vertical scrolling after the fix below.
- Problems found and fixed in this audit:
  - the projector told students to open `localhost:…/join` whenever the
    teacher's browser used `localhost` — now the server's network address (or
    `PUBLIC_BASE_URL`) is shown; the same fix applies to slips and QR labels;
  - the projector's control row wrapped on 1024×768 projectors.
- Not tested: a real interactive panel (touch was emulated), browsers other
  than Chromium, and the printed slips on a real printer.

## 4. Security

Full findings in `docs/SECURITY-REVIEW.md`. Fixed in this phase, each with a
test:

- demo sign-in, demo accounts and self-registration were on by default in
  production → now opt-in;
- the last hint rung (the full solution, which contains the answer) could be
  opened before answering → now only after a first attempt;
- any teacher could read any student's work, files and profile → now only the
  student's own teachers (class or assignment) and administrators;
- no way to remove an intruder or a prank name from a live lesson → added.

Open: 4-digit join codes can be guessed on the school network (mitigated by
removal and rate limits), rate limits trust `X-Forwarded-For` when the app is
exposed directly, no page-level CSP, temporary passwords are not forced to
change, plain HTTP on most school networks. This is a self-review, not a
penetration test.

## 5. Performance

`scripts/classroom-sim.mjs`: a teacher console, a projector view and N students,
each with its own event stream, run the whole 7-activity Quadratic Equations
lesson; students answer within 1–3 s of each activity opening.

| | 16 students | 32 students |
| --- | --- | --- |
| Requests for the lesson | 664 | 1 264 |
| Activity visible on every screen (p50 / p95 / max) | 49 / 83 / 104 ms | 57 / 95 / 99 ms |
| Submitting an answer (p50 / p95) | 6 / 8 ms | 5 / 9 ms |
| Student screen refresh (p50 / p95) | 28 / 53 ms | 41 / 78 ms |
| Lost or double-counted answers | 0 | 0 |
| Server memory (RSS) after the run | 234 MB | 282 MB |

One bottleneck was demonstrated and fixed: every answer used to make every
student re-fetch (for 16 students, 2 401 requests and 1 993 student refreshes
per lesson). Students are now notified only of changes that affect their
screen (664 requests, 256 refreshes). Nothing else was optimised.

Not measured: a slow school Wi-Fi access point with 16 laptops, old student
computers, or the server on low-end hardware.

## 6. Network resilience

| Situation | Result | Evidence |
| --- | --- | --- |
| Student offline while answering | Answer queued on the computer, sent automatically, counted once | e2e *classroom pilot*; drill |
| Student reloads mid-activity | Activity and own answer restored; a half-typed answer too | e2e; drill *reload* |
| Teacher reloads the console | Same state | e2e; drill |
| Same student in two tabs | Consistent; answer counted once | drill *duplicate tab* |
| Slow network (4 s delay) | Answer counted once | drill *slow network* |
| Server restart mid-activity | Stops in ~3 s, screens show "Reconnecting…", queued answer sent afterwards, lesson continues | drill *server restart* |
| Lab work offline | Kept locally, saved when back | e2e *network interruption* |

Found and fixed: `next start` did not stop while live event streams were open
(a service restart would hang); browsers gave up their event stream after an
error response. The platform is **not** offline-capable: without the server,
students cannot receive new activities; they keep what is on screen and their
unsent answers.

## 7. AI-free operation

No AI key was set anywhere in this work. Under that condition: all 254 unit
tests, all 28 e2e tests (including the complete pilot flow and every lab), the
resilience drill and both simulations passed. The e2e test *labs work with AI
disabled* checks that no screen says a feature is unavailable. The new lessons
need no AI; the AI-literacy lesson works on paper. Where AI would add
something (lesson drafts, extra hints, the tutor), the interface says it is
off and offers the built-in path.

## 8. Georgian localization

- Interface strings exist in both languages (type-checked); the terminology
  test found no ruled-out wordings across the interface, lessons and lab
  catalogues.
- Fixed in this audit: the pilot lesson addressed students with the formal
  „თქვენ“ in activities, homework and the quiz; now „შენ“ (pair and group
  instructions keep the plural).
- All new strings (classes, accounts, review workflow, pilot screens) and the
  five new lessons were written in Georgian by the developer, with Georgian
  units and decimal commas. **No native Georgian editor or subject teacher has
  reviewed them yet.** The review workflow's "Georgian language reviewed" step
  exists for exactly this.
- The grader accepts Georgian answer styles (`0,5 და -2`,
  `x₁ = 0,5, x₂ = −2`, `1/2; −2`), checked against the pilot lesson.

## 9. Content quality

51 lesson topics in 18 subjects (99 lesson records), 529 activities, 352 quiz
questions; 30 programming problems, 17 critical-thinking exercises, 8
experiments, 7 simulations. Added: waves; light (reflection and refraction);
how the internet works; cybersecurity basics; AI literacy — each with graded
activities, hint ladders, a quiz, discussion and homework. Every lesson passes
the content checks (valid answer keys, at least two hints, first hint does not
contain the answer). All lessons are **Draft**: none has passed a teacher's
review. Gaps and order: `docs/CONTENT-ROADMAP.md` (geometry, fractions and
percentages, databases, chemistry quantities and Georgian literature are the
largest).

## 10. SQLite or PostgreSQL

Keep SQLite for the pilot and for one school (`docs/DATA-ARCHITECTURE.md`):
measured load is far below its limits; the in-process event bus, not SQLite,
is what limits the app to one process. PostgreSQL becomes worthwhile for
several processes, several schools on one service, or live reporting; the
main cost is making the synchronous service layer asynchronous. A 5-step plan
is written down; nothing was migrated.

## 11. Backup and maintenance

- `npm run backup`: online, checked, pruned; tested on a demo database
  (1.8 MB, integrity ok).
- `npm run restore`: refuses while the server runs (PID file + lock check),
  keeps the replaced data; tested: backup → change a password → restore → the
  change is gone and uploads are back.
- `npm run doctor`: flags demo passwords on staff accounts, demo/registration
  flags, schema version, integrity, backup age, disk space.
- `npm run user:password` for staff; teachers reset students' passwords on the
  class page (tested in unit and e2e tests).
- `docs/OPERATIONS.md`: install, service, daily/weekly/monthly checklists,
  updates and rollback, incidents, hand-over. The service-manager steps were
  written but not executed on a real server.

## 12. Risks

| Risk | Likelihood | Effect | Mitigation now |
| --- | --- | --- | --- |
| School Wi-Fi drops or is slow with 16 laptops | Medium | Delays, "Reconnecting…" | Answer queue, polling fallback; paper copy of activities (PILOT.md) |
| Lesson content has a mistake in front of the class | Medium | Loss of trust | Review workflow; teacher reads the preview a week before |
| Georgian wording sounds unnatural | Medium | Distraction, credibility | Native review step; terminology test |
| Teacher gets stuck on an unfamiliar screen | Medium | Lesson stalls | Minute-by-minute script, fallback table, test run a week before |
| Server computer switched off or asleep | Medium | No lesson | Service with restart; `doctor`; checklist before the lesson |
| Browser differences on school computers | Unknown | Layout or event-stream problems | Not tested beyond Chromium — test on the actual machines first |
| Data loss (disk failure) | Low | Lost work | Daily checked backups; weekly copy off the machine |
| Prank or intruder in a lesson | Low–medium | Disruption | Remove participant; class-linked lessons show who is missing |
| Dependence on one developer | High today | Stalls when something breaks | OPERATIONS.md, scripts, tests; needs a named second person at the school |

## 13. Next priorities

1. Run the pilot as scripted in `docs/PILOT.md`, with the developer present
   only as an observer; collect the pilot notes.
2. Before it: a mathematics teacher reviews the Quadratic Equations lesson in
   Georgian and marks it through the review steps; test the flow on the
   school's own computers, browsers and Wi-Fi (`npm run drill` and
   `scripts/classroom-sim.mjs` from a student computer).
3. Rehearse the deployment on the school's server: service start, daily
   backup, one restore; name a second person who can follow OPERATIONS.md.
4. Fix only what the pilot shows. Then review the other pilot-relevant lessons
   (target: 10 Classroom ready).
5. After that, the foundational content in `docs/CONTENT-ROADMAP.md`, and the
   open security items (lesson lock, forced password change, CSP) if the pilot
   shows they matter.
