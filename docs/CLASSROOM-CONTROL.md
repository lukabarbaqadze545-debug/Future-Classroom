# Classroom control

Status: implemented. One teacher's computer can see and guide a whole class
(18–20 students) from the browser, on the school network, with no software to
install on the students' computers.

## What the teacher can do

Open a class and choose **Live classroom** (`/teacher/classes/<id>/live`).

- **See every student at once.** Each card shows the part of the platform the
  student has open ("STEM Lab", "Library"…), the page's title, how long ago they
  opened it, and a status: *working*, *not active* (no mouse or keyboard use for
  2 minutes), *another window* (the platform is open but something else is in
  front) or *offline*. Counts are shown at the top.
- **See who needs help.** A student presses **Ask for help** (with an optional
  note). Their card turns red and moves to the top, in the order they asked. The
  teacher presses *I'm coming* (the student sees "Your teacher is on the way")
  and then *Done*.
- **Send a message** to the class or to chosen students. It appears on their
  screen until they close it; the teacher sees *shown* and *read*.
- **Open a page** for the class or chosen students (a library page, a lab, any
  page of the platform). Browsers follow within a few seconds. A request that
  nobody followed within 5 minutes is dropped, so a student who was away is not
  pulled to an old page later.
- **Pause screens** with an optional message ("Eyes on the board"): students
  get a full-screen notice and cannot use the page behind it until the teacher
  resumes. A pause ends by itself after 45 minutes, so a forgotten pause cannot
  keep a student locked out.
- **See one student's day:** pages opened today with times and durations, recent
  practice/quiz/lesson activity, and the messages sent to them.

Select students with the checkboxes to act on only them; with none selected,
actions go to the whole class. Only the class's own teacher (or an
administrator) can see or control a class.

## What it can and cannot see

It sees the **platform only**. For each signed-in student the server stores the
*path* and title of the Future Classroom page they have open (never the query
string), whether the tab is in front and when they last used the keyboard,
mouse or touch. It cannot see other websites, other programs or the screen, and
the privacy page says so to students. Page visits are kept for 14 days.

Because it runs inside a web page it **cannot** stop a student from closing the
browser or opening a game. That is the job of the computers themselves — see
below.

## Blocking games and other websites on the computers

Do this on the student computers or the school network, not in the platform:

1. **Allow-list in the browser (strongest).** Chrome and Edge support the
   `URLBlocklist` and `URLAllowlist` policies. Blocking everything and allowing
   only the school server (and whatever else students need) leaves nothing to
   block one by one. Linux: a JSON file in `/etc/opt/chrome/policies/managed/`
   (Chromium: `/etc/chromium/policies/managed/`); Windows: group policy or
   registry. Example:

   ```json
   { "URLBlocklist": ["*"], "URLAllowlist": ["future-classroom.school.local", "fonts.googleapis.com"] }
   ```

   Use the address students actually type to reach the platform. Test on one
   computer first.
2. **Filtering DNS or a school firewall** to block games and adult sites for
   the whole network, as a second layer.
3. **Student accounts without administrator rights** on the computers, so
   students cannot install games or change these settings, and **one fixed
   browser** (remove or lock the others).

If you also need to see or take over whole screens, a free, school-oriented tool
such as Veyon can run beside the platform; the platform does not depend on it.

## How it works

| Part | Where |
| --- | --- |
| Tables `student_presence`, `page_visits`, `classroom_commands` | migration 6, `src/lib/db/schema.ts` |
| Rules (status, commands, expiry, permissions) | `src/lib/services/classroom.ts` |
| Page → area, allowed paths | `src/lib/classroom/areas.ts` |
| API | `src/app/api/classroom/` (`heartbeat`, `leave`, `help`, `messages`, `[classId]/…`) |
| Student side (heartbeat every 6 s, help button, messages, paused screen) | `src/components/classroom/student-presence.tsx`, mounted for students in `src/app/layout.tsx` |
| Teacher side (polls every 4 s while the page is visible) | `src/components/classroom/live-classroom.tsx` |
| Strings | `src/lib/i18n/classroom-en.ts`, `classroom-ka.ts` |

Load: 20 students send one small request every 6 seconds and the teacher's page
one every 4 seconds — a few requests per second on the school server.

## Safety rules, and where they are enforced

- A teacher can only act on students who are **in the class**: other students'
  ids are ignored, and a class that is not theirs is refused (403).
- "Open a page" accepts **paths on this platform only** — no other sites,
  `//host`, `javascript:` or `/api/…` — checked on the server.
- Messages and pauses are sent only to the **tab the student is looking at**,
  so two open tabs never both act, and a student cannot read or close another
  student's message.
- A paused screen covers the page, takes focus, and makes the rest of the page
  inert (keyboard and screen readers cannot reach it).
- Students cannot call any teacher endpoint (403), and teachers' own browsers
  send no heartbeats.

## Tests

`tests/unit/classroom.test.ts` (statuses, tabs, timeline, raised hands, pauses
and their expiry, messages, page requests, permissions) and
`tests/e2e/classroom-control.spec.ts` (a teacher with two real student browsers:
where they are, help, message, open a page, pause and resume, tab closed; other
teacher and student refused; Georgian on a phone).

## Not done

- Not a remote desktop: no live view of students' screens.
- Cannot block other programs or websites (see above).
- The pause is a notice inside the platform, not a lock on the computer.
- Class-wide "same page for everyone" is a one-time request, not a mode that
  keeps students on a page.
