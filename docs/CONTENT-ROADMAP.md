# Content roadmap

Status on 2026-09-26. Counts come from the code (`src/lib/content/lessons/`,
`src/lib/labs/`), not estimates. Every built-in lesson starts as **Draft** in
the review workflow; none has been reviewed by a subject teacher or a native
Georgian editor yet (see `docs/PILOT.md`, "Before the pilot").

## Principles

- Depth before breadth: a topic is "covered" when it has a lesson with
  activities that are graded on the server, a hint ladder, a quiz and a way to
  practise (lab item, simulation or experiment) — not when it has a title.
- Bilingual from the start (Georgian and English side by side), Georgian
  examples, Georgian units, terminology from `src/lib/i18n/terminology.ts`.
- Each new lesson goes through the review workflow before it is marked
  Classroom ready. Content written by the developer is a first draft.
- No copying from textbooks or websites; sources are listed only when real and
  checkable.

## Current coverage

51 lesson topics (99 lesson records in two languages), 529 activities,
352 quiz questions; 30 programming problems, 17 critical-thinking exercises,
8 classroom experiments, 7 simulations, 6 engineering project templates.

| Subject | Lessons (grade) | Other practice | Main gaps |
| --- | --- | --- | --- |
| Mathematics | Linear equations (7), Functions and graphs (8), Probability basics (8), Quadratic equations (11) | 3 simulations, programming problems | Fractions/ratio and percentages (foundation), geometry (none at all), systems of equations, statistics beyond basics, trigonometry |
| Physics | Speed and motion graphs (7), Energy (8), Simple circuits (8), Newton's laws (9), **Waves (9), Light: reflection and refraction (9)** — new | 4 experiments, 3 simulations, electronics lab | Pressure and density (lesson; there is an experiment), heat and temperature, magnetism, momentum, lenses and the eye (beyond the introduction), modern physics |
| Chemistry | Inside the atom (8), Periodic table (8), Chemical reactions (8) | 1 experiment | Mixtures and separation (foundation), bonding, acids and bases lesson, moles and quantities, organic chemistry basics |
| Biology | Cell structure (7), Ecosystems (7), Genetics basics (9) | 2 experiments, population model | Human body systems, photosynthesis and respiration, evolution lesson, microorganisms and health |
| Computer science | Computational thinking (6), Algorithms (8), Python basics (8), C++ basics (9), **How the internet works (8), Cybersecurity basics (8), AI literacy (9)** — new | 30 programming problems (4 levels), robotics guides | Databases (none), data representation (binary, text, images), functions and lists in Python, sorting/searching lesson, recursion |
| Programming lab | Level 1: 8, Level 2: 8, Level 3: 7, Level 4: 7 problems (23 write-code, 3 predict-output, 4 multiple-choice) | Python in the browser; C++ with Judge0 or self-check | Level 5 (olympiad-style: greedy, DP, graphs), more C++-specific problems, string processing, a progression map from Level 1 to olympiad |
| Georgian language and literature | Vepkhistkaosani: friendship (9), Argumentative essay (10), Commas in complex sentences (8) — Georgian only | — | Only three topics; needs a Georgian teacher as author, not translation |
| English | Present perfect vs past simple (8), Formal email (10) | — | Reading comprehension, vocabulary sets, speaking tasks |
| History | Working with sources (7), David IV and Didgori (8), Democratic Republic 1918–1921 (10) | — | Antiquity (Colchis, Iberia), Golden Age (Tamar), Soviet period, independence 1991 |
| Geography | Map reading (6), Georgia's landforms and climate (8), Climate graphs (9) | — | Population and cities, natural hazards (earthquakes, landslides), resources and economy |
| Civics | Rights and responsibilities (7), Separation of powers (9) | — | Elections and local government, media and democracy |
| Economics | Personal budget (8), Saving and interest (9), Inflation (10) | — | Supply and demand, taxes, banking and loans |
| Critical thinking | Claim vs evidence (8), Logical fallacies (9), Evaluating online information (8) | 17 exercises (claims, fallacies, media, debate, decisions, bias) | Statistics in the news, correlation vs causation, AI-generated content |
| Research skills | Research question (9), Evaluating sources (9), Citations (10) | Research lab (full project workflow) | Designing a survey, basic data analysis, presenting findings |
| Arts, engineering, entrepreneurship, career, health | 1–2 lessons each | Engineering projects, career lab | Deliberately light for now |

## Next steps (in this order)

### 1. Review what exists (before writing more)
- Subject teachers review the mathematics, physics and computer-science
  lessons used in the pilot; a native Georgian editor reviews their Georgian
  versions. Target: 10 lessons **Classroom ready** before the pilot.
- Fix what reviewers find; the review queue shows progress.

### 2. Close foundational gaps (grades 6–8)
| Subject | Lessons |
| --- | --- |
| Mathematics | Fractions and percentages; Ratio and proportion; Area and perimeter; Angles and triangles |
| Physics | Density and pressure (pairs with the existing experiment); Heat and temperature |
| Chemistry | Mixtures and separation |
| Biology | Photosynthesis and respiration; The human body: digestion and circulation |
| Computer science | Data representation: binary, text and images |

### 3. Deepen priority areas (grades 8–10)
| Area | Lessons | Practice to add |
| --- | --- | --- |
| Computer science | Databases: tables and queries; Python functions and lists; Searching and sorting | SQL-style exercises that run in the browser (needs a small in-browser SQLite/WASM decision first); Python problems on lists and functions |
| Cybersecurity | Privacy and personal data; Encryption basics (Caesar cipher → why HTTPS works) | Programming problem: Caesar cipher |
| AI literacy | Bias in data (hands-on with a small dataset); How recommendation systems work | Critical-thinking exercise on AI-generated content |
| Physics | Magnetism and electromagnets; Sound and hearing; Lenses and the eye | Simulation: ray diagram for mirrors and lenses |
| Programming | Level 5 problem set (greedy, prefix sums on 2D, BFS on a grid, simple DP) with a published progression map Level 1 → 5 | C++-first problems for olympiad preparation |
| Research | Designing a survey; Analysing results with the Research lab's statistics | Sample dataset with a guided analysis |
| Critical thinking | Correlation vs causation; Statistics in the news | 3 new exercises |

### 4. Later
Geometry and trigonometry sequence, chemistry quantities (moles), history
periods, Georgian literature (with a Georgian teacher as author).

## How a new lesson is added

1. Write it in `src/lib/content/lessons/<area>.ts` as a bilingual `BiLesson`
   (see an existing lesson of the same subject). Every exercise and
   multiple-choice activity needs at least two hints; the first hint must not
   contain the answer.
2. Add it to the subject catalog (`src/lib/content/subjects.ts`) under a topic
   and, if it belongs there, the learning path.
3. `npm run check` (validates the content, the Georgian terminology and the
   catalog links).
4. After deployment it is installed as **Draft**; reviewers take it to
   **Classroom ready**.
