# Security review (pilot readiness)

Date: 2026-09-26. Scope: the code in this repository as deployed with
`npm run build && npm start` on one school computer. Method: reading every API
route and the service functions they call, targeted unit tests
(`tests/unit/security.test.ts`, `tests/unit/pilot.test.ts`) and end-to-end
tests (`tests/e2e/*.spec.ts`), `npm audit --omit=dev`.

**This is a self-review by the developer, not a penetration test.** Passing
tests show that the specific cases they check behave as intended; they do not
show that the system is secure. Nobody outside the project has reviewed it.

## Findings

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | High | Demo sign-in and demo accounts were on unless turned off. A school that started the server without `DEMO_MODE=false SEED_DEMO=false` got one-click teacher sign-in on the home page and an administrator account whose password (`demo1234`) is in the README. | **Fixed.** Both are off in a production build unless set to `true` (`src/lib/config.ts`). Test: *demo sign-in, demo accounts and self-registration are opt-in for production builds*. |
| 2 | High | The last rung of the hint ladder is the teacher's full solution, which contains the answer. A student could open it before answering: five hint clicks in a live lesson, or `level: 5` sent straight to `/api/practice/hint`. | **Fixed.** The server refuses the solution rung until the student has answered once (`attempt_first`); the hint panel says so. Test: *hides the answer key before reveal and opens the solution only after a first attempt*. |
| 3 | Medium | Any teacher could open any student's learning profile and portfolio page, and — knowing an ID — any student's research project, STEM project/record, critical-thinking attempt, portfolio item, private university card or uploaded file. | **Fixed.** Teachers see the work of students they teach (a class of theirs or an assignment they gave); administrators see everything (`canViewWork`, `canViewStudent` in `src/lib/services/classes.ts`). Tests: *student A never reads student B's work*, *teachers read the work of students they teach*. |
| 4 | Medium | Join codes have four digits (9,000 values). Anyone on the network can guess a live code and join anonymously under any name; the name is shown on the projector lobby and in the teacher console. Guests never receive answers, only prompts. | **Mitigated.** The teacher can remove a participant (their answers go too) and the student screen says so. Joining is rate-limited per client address. **Open:** there is no "lock this lesson" switch and codes stay short so young students can type them. |
| 5 | Medium | Rate limits are keyed by `X-Forwarded-For`. When the app is reached directly (no reverse proxy), a client can set this header and get a fresh limit for every request. | **Mitigated for sign-in:** failed sign-ins are also counted per username (10 per 15 minutes) whatever the address. **Open** for joining and registration. Put the app behind a reverse proxy that overwrites the header, or keep it on the school network only. |
| 6 | Low | The per-username failure limit can be used to lock a classmate out for 15 minutes by typing wrong passwords. | Accepted. A teacher's password reset clears the counter. |
| 7 | Low | Anyone who could reach the server could create a student account on `/register`. | **Fixed.** Self-registration is off in a production build unless `SELF_REGISTRATION=true`; teachers create accounts from the class page. |
| 8 | Low | Temporary passwords are 8 characters from a 31-symbol alphabet (about 40 bits). Changing them is asked for (banner), not forced. | Accepted for a pilot with the sign-in limits above. |
| 9 | Low | No Content-Security-Policy on pages. React escapes all output and there is no HTML built from user input (the two `dangerouslySetInnerHTML` uses render QR-code SVG generated on the server). | Open. |
| 10 | Low (deployment) | Plain HTTP on the school network sends passwords and session cookies in clear text. | Open — depends on the school's setup. Use HTTPS (e.g. a Caddy reverse proxy) where possible; `COOKIE_SECURE=true` then. |

## What was checked and found in order

- **Authentication.** Passwords: scrypt (N=16384, 64-byte key, random salt), compared in constant time. Sessions: random token, only its hash stored, 12-hour lifetime, httpOnly + SameSite=Lax cookies, Secure on HTTPS. Changing a password signs out other devices; a teacher reset signs the student out everywhere.
- **Role separation.** The role comes from the database on every request (`getCurrentUser`), never from the client. Every `/api` route calls `requireApiUser(...)` with the allowed roles, or `requireParticipant` for live-lesson routes; teacher pages are behind a layout that requires a staff role. The e2e test *students cannot reach teacher pages or APIs* checks a sample of both.
- **Live lessons.** Each joined lesson has its own httpOnly participant cookie; its token is valid for that session only. Only the session's teacher (or an administrator) can control it or read the console view. The event stream sends version numbers only, and students receive only events that change their own screen.
- **Answers.** The student lesson view is built field by field and never includes correct options, accepted answers or solutions; correct answers appear after the teacher reveals results. Practice, quizzes, programming (hidden tests stay on the server), STEM challenges and critical-thinking exercises are graded on the server. Expected experiment results are shown after submission.
- **Content review states** are staff-only (`getLessonForStaff`), never included in student views.
- **Input validation.** Every JSON body is parsed with a zod schema (`readJson`); size limits on strings and lists.
- **SQL.** Prepared statements throughout; the two places that build SQL text use column/table names from fixed maps, never input.
- **CSRF.** Non-GET requests with a foreign `Origin` are rejected (`assertSameOrigin`); cookies are SameSite=Lax.
- **Uploads.** Extension and content (magic bytes) must agree; 15 MB (materials) and 10 MB (attachments) limits; stored outside `public/` under random names; served with `nosniff`, a sandboxing CSP and `attachment` disposition except for images and PDFs.
- **Secrets.** The AI key is read on the server only (no `NEXT_PUBLIC_` variables); `.env*` files other than `.env.example` are not tracked. `npm audit --omit=dev`: 0 known vulnerabilities on 2026-09-26.
- **Security headers.** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, a restrictive `Permissions-Policy`; the `X-Powered-By` header is off.

## Not covered

- An independent penetration test.
- Denial of service (one Node process; a flood of requests will slow the lesson).
- Physical access to the server or to a signed-in workstation. Students must sign out on shared computers; drafts are stored per account (e2e: *shared workstation*).
- The security of the school network, the operating system and backups. The database file contains password hashes and student work: keep `data/` and its backups readable only by the service account and the administrator.
- Vulnerabilities in Next.js, React or other dependencies that are not yet published.

## Before the pilot

1. Start with `DEMO_MODE`, `SEED_DEMO` and `SELF_REGISTRATION` unset or `false` (see `docs/OPERATIONS.md`).
2. Create one administrator and the teachers with `npm run user:create`; teachers create student accounts from their class page.
3. Keep the server on the school network; use HTTPS if the network allows it.
4. Tell teachers how to remove a participant and how to reset a student's password.
