# C++ course (`/courses`)

A programming course in Georgian for students who have never programmed. Students read a lesson, change and run small programs **in the browser**, and solve tasks that the server checks on hidden tests. No account and nothing to install.

## Status

| Part | State |
| --- | --- |
| Module 1 "First steps" (8 lessons, 38 tasks, checkpoint project) | written and checked |
| Module 2 "Decisions" | lesson 1 (comparison and logic, 7 tasks) written; `if`/`else`/`switch` lessons next |
| Modules 3–14 | on the map as *planned*, with the problem-book chapter to practise meanwhile |
| English lesson text | not yet (titles and UI are bilingual; lesson bodies are Georgian with a notice) |

## How it works

```
author (server only)  ->  src/lib/courses/cpp/**      lessons, solutions, wrong-answer mutants
build script          ->  scripts/build-course.ts      runs every solution with real g++, writes generated.json
student view          ->  src/lib/courses/service.ts   lesson without answers/solutions/hidden tests
check (server)        ->  /api/courses/check           runs the student's code on the hidden tests
run (browser)         ->  src/lib/cpp/worker.ts        Web Worker, own C++ interpreter
```

* **The interpreter** (`src/lib/cpp`) is a C++17 subset written in TypeScript: lexer, parser, typed compiler, VM with step/memory/output/recursion limits. It never touches files, the network or processes. Time limits are counted in interpreter steps, not seconds, so a verdict does not depend on how busy the server is. Kid-friendly messages for every diagnostic live in `src/lib/i18n/courses-{ka,en}.ts` (`cppErrors`).
* **Fidelity to g++** is tested: 43 golden programs (`tests/fixtures/cpp`, outputs made by g++), the 177 solutions of the problem book, and the diagnostics tests.
* **Hidden tests** are inputs only; their outputs are produced by running the reference solution with g++ in `scripts/build-course.ts` and stored in `src/lib/courses/cpp/generated.json` (with signature hashes, so a stale file is detected).
* **Nothing secret reaches the browser.** Answers of quizzes and "what will it print" items, hints beyond the one asked for, solutions and hidden tests are only returned by the API routes: `quiz`, `predict`, `hint` (after at least one check), `solution` (after the task is solved), `check`.
* **Progress** is kept on the device (localStorage); drafts of the student's code too. Solving tasks gives XP and badges in the "Today" system (`code` and `lesson` events). The API is rate-limited per client.

## Writing a lesson

Lessons are TypeScript, in `src/lib/courses/cpp/mN/lK.ts`, built with the helpers of `src/lib/courses/author.ts` (`p`, `h`, `code`, `predict`, `quiz`, `exercise`, `lesson`, ...). Each lesson has goals, explanation blocks with runnable examples, 2–3 questions, 3–7 tasks (each with three hints, optional "wrong" solutions the tests must reject), common mistakes and a summary.

```
npx tsx scripts/build-course.ts     # needs g++; checks everything below, then rewrites generated.json
npx vitest run tests/unit/courses.test.ts
```

The build and the tests enforce: every example prints exactly what the lesson says; every reference solution passes in the interpreter **and** in g++; the starter code of a "write" task does not pass; every listed wrong solution is rejected; `error:` examples produce the stated diagnostic; Georgian text has no mixed-script words, no avoided wordings and a decimal comma (code is exempt).

Task design rules: tests must include boundaries (zero, negative numbers, maximum values) and must catch the typical mistake of the lesson (integer overflow, integer division, `n % 2 == 1` on negatives, ...). Avoid inputs whose answer depends on how a tie is rounded, so that every correct formula agrees.

## Limits to be honest about

* `unordered_*` containers iterate in insertion order, not in libstdc++'s order; `<random>`, files, threads and exceptions are not supported (the runner says so instead of failing silently).
* The interpreter is about 90 times slower than native code on tight loops (25–40 million steps a second). Tasks are sized for that; a task that needs more says so in its time limit.
* The server runs student code inline in the interpreter (not in worker threads). That is fine at school scale; for a large audience run `judge()` in a pool of workers or a separate service.
