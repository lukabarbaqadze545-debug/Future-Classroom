# Pilot lesson script: Mathematics → Quadratic Equations (45 minutes)

For a teacher running Future Classroom for the first time with one class of
15–16 students, a touchscreen or projector and one computer per student. No
knowledge of the code is needed. Button names are given in English and
Georgian as they appear on screen.

The lesson is the built-in **Quadratic Equations / კვადრატული განტოლებები**
(grade 11, 7 activities). It works fully without AI.

---

## A. One week before (IT person + teacher, 30 minutes)

1. The server runs as described in `docs/OPERATIONS.md`; `npm run doctor`
   shows no problems. Demo mode, demo data and self-registration are off.
2. The teacher signs in with their own account and changes the temporary
   password (**My account / ჩემი ანგარიში**).
3. **Classes / კლასები → New class / ახალი კლასი**, e.g. "11ა".
4. On the class page: **Add students / მოსწავლეების დამატება** → type one name
   per line → **Add to class / კლასში დამატება** → **Print slips /
   ბარათების ბეჭდვა**. Cut the slips; each has the address, a username and a
   temporary password.
5. Open the lesson: **Subjects → Mathematics → Quadratic Equations**. A
   built-in lesson opens as a preview with the answer key (**Preview with
   answers / გადახედვა პასუხებით**). Read the seven activities and the answers. If something is wrong, note it in the review panel
   (**Send back to draft**) and tell the person who maintains the content.
6. Test run with two or three computers: start the lesson for the class, let
   two "students" join, launch one activity, answer, end. Delete nothing; the
   test session simply stays in the list.
7. Write the server address on a card for the board, e.g.
   `192.168.1.10:3000` (it is also printed on the slips and shown on the
   projector).

## B. Ten minutes before the lesson

| Check | How |
| --- | --- |
| Server reachable | Open the address on the projector computer. |
| Projector view readable from the back row | Open it now (step C3) and look from the back. Use the moon icon for the dark theme if the room is bright. |
| Student computers on | Browser open on the sign-in page. |
| Slips | One per student; spares for students who lost theirs (new password: class page → **New password / ახალი პაროლი**). |
| Plan B ready | The paper copy of the seven activities (print the preview page). |

## C. The lesson

| Min | Teacher does | Students see / do |
| --- | --- | --- |
| 0–3 | **Classes → 11ა → Start a lesson / გაკვეთილის დაწყება** → search "quadratic" / "კვადრატ" → choose the lesson → **Start the lesson / გაკვეთილის დაწყება**. | — |
| 0–3 | On the console: **Presentation view / პრეზენტაციის რეჟიმი** → move that window to the projector, full screen. | The projector shows the join address and the code (e.g. FC-4821). |
| 3–7 | Students sign in with their slip. The console lists who has joined; **Not joined yet / ჯერ არ შემოსულა** lists who is missing. | Home page shows the live lesson → **Join the lesson / გაკვეთილზე შესვლა**. A yellow banner asks them to choose their own password — **after** the lesson. Students without an account can join at `/join` with the code and their first name. |
| 7–12 | Teach the warm-up and standard form from the lesson (your own board work or the lesson preview). | Waiting screen. |
| 12–15 | **Launch first activity / პირველი აქტივობის გაშვება** — Activity 1, *Spot the quadratic* (multiple choice). Optional: **Timer / ტაიმერი** 1 minute. | Choose an answer, **Submit answer**. They see right/wrong immediately. |
| 15–17 | Watch "answered" reach 16/16. **Show results to class / შედეგების ჩვენება კლასისთვის** — the bar chart appears on the projector (no names). Discuss the wrong options. | Class results on their screen. |
| 17–25 | Teach factoring. **Next activity / შემდეგი აქტივობა** — Activity 2, *Factor and solve* x² − 5x + 6 = 0. | Type the roots (e.g. `2, 3`, `x = 2 ან x = 3`). Hints open one by one; the full solution only after a first answer. |
| 25–27 | On the console, the student list shows who is correct / wrong / still working. Help the ones marked wrong. Show results. | — |
| 27–35 | Teach the discriminant and the formula. Activities 3 (*Read the discriminant*) and 4 (*Use the formula*, 2x² + 3x − 2 = 0). | Georgian decimals are accepted: `0,5 და -2`, `x₁ = 0,5, x₂ = −2`, `1/2; −2`. |
| 35–39 | Activity 5 (*Discuss a mistake*): an open question — read some answers aloud from the console, then show them on the projector (no names). | Write a sentence. |
| 39–41 | Activity 6 (*Confidence check*, poll) — show the result. | One tap. |
| 41–44 | Activity 7 (*Exit ticket*). | One or two sentences. |
| 44–45 | **End session / სესიის დასრულება** → confirm. The summary appears. | "Session finished" with their own results. |

Skip or reorder activities by unticking them on the start page or with the
activity list on the console. Pausing (**Pause / პაუზა**) freezes every screen
("Eyes on the teacher").

## D. If something goes wrong

| Problem | Do this | Why it is safe |
| --- | --- | --- |
| A student cannot sign in | Class page → **New password** → give the new slip. Or let them join at `/join` with the code and a first name. | Anonymous answers still count in the session; they are not linked to the student's progress. |
| "Too many attempts" at sign-in | **New password** for that student (clears the lock). | — |
| A student's screen shows "Offline" or "Reconnecting…" | Nothing, or reload the page (F5). | Answers typed during the outage are kept on that computer and sent automatically when the connection returns ("Connection is back — your answer has been sent."). |
| The whole class loses the network | Continue on the board with the paper copy; when the network is back, students reload. | Everything already submitted is on the server. |
| The server restarts or crashes | Wait until it is back (the service restarts it), then reload the console. | Tested: queued answers are sent, all screens reconnect, the lesson continues where it was (`npm run drill`). |
| Someone joins with a silly name | Console → ✕ next to the name → **Remove from the lesson / გაკვეთილიდან წაშლა**. | Their answers in this lesson are removed; they can rejoin properly. |
| A student opened the lesson in two tabs | Nothing. | The same answer counts once. |
| The projector shows the wrong address | Set `PUBLIC_BASE_URL` in `.env.local` (IT person) and restart. Meanwhile write the address on the board. | — |
| A student answered but the teacher count did not move | Ask the student to reload; the count updates within a few seconds. | Retried answers are never counted twice. |

## E. After the lesson (10 minutes)

1. The session summary (**Classroom sessions / საკლასო სესიები** → the
   lesson) shows, per activity, the correct rate, the answer distribution and
   the students' answers, plus the hints used.
2. The class page shows the lesson under sessions and each student's
   correct/total answers.
3. Students choose their own password under **My account** (homework or next
   lesson).
4. Fill in the pilot notes below; send them with any screenshots.

## F. What to record (pilot notes)

| Question | Answer |
| --- | --- |
| Students present / joined within 5 minutes | __ / __ |
| Minutes from "Start the lesson" to the first activity | |
| Answers lost or counted twice (should be 0) | |
| Screens that went offline; did they recover without help? | |
| Activities where many students were wrong (from the console) | |
| Was the projector readable from the back row? | |
| Anything in the Georgian text that sounded wrong | |
| What the teacher had to ask the IT person / developer | |
| Would the teacher run the next lesson alone? | yes / no |

The pilot succeeds when the last two rows read "nothing" and "yes".

---

## What has been tested, and what has not

Tested automatically in this repository (see `docs/AUDIT.md` for details):

- The whole flow above with real browsers: create a class and accounts,
  sign in with a slip, start the lesson for the class, join from the home page,
  answer, a network drop with a queued answer, a late joiner, removing a
  participant, ending, results on the class page and in the student's
  progress, changing the temporary password (`tests/e2e/pilot.spec.ts`).
- 16 and 32 simulated students answering the full 7-activity lesson at the
  same time: no lost answers, activity on every screen in under 0.12 s (p95)
  (`scripts/classroom-sim.mjs`).
- Server restart, slow network, duplicate tabs, reloads
  (`scripts/resilience-drill.mjs`).
- The projector view at 1920×1080, 1366×768, 1280×800 and 1024×768 in both
  languages.

Not yet tested: a real classroom with real students, real school Wi-Fi,
old or slow student computers, and a teacher who has never seen the platform.
That is what this pilot is for.
