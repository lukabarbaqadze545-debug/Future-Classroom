import type { DB } from "./index";
import { newId } from "@/lib/domain/ids";
import { findBuiltInProblem } from "@/lib/labs/programming/catalog";
import type { CodeProblem } from "@/lib/labs/programming/types";
import { findExercise } from "@/lib/labs/critical/catalog";
import { grade } from "@/lib/labs/critical/grade";
import type { ItemExercise } from "@/lib/labs/critical/types";
import { SEED_LIBRARY } from "@/lib/labs/library/catalog-seed";

/*
 * Demo data for the laboratories: classes, assignments in every state,
 * programming submissions, critical-thinking attempts, STEM records and a
 * project, a research project with real, checkable sources and the
 * students' own survey data, the library catalogue with shelf copies and
 * loans, university research cards (deliberately without admission facts),
 * portfolios, goals and skills. Written with plain SQL so it also runs from
 * scripts outside Next.js.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function seedLabs(db: DB, users: Map<string, string>, materialIds: Map<string, string>, start: number): void {
  const u = (key: string) => users.get(key)!;
  const at = (daysAgo: number, hour = 12) => start - daysAgo * DAY + (hour - 12) * HOUR;
  const json = (v: unknown) => JSON.stringify(v);

  db.transaction(() => {
    // ------------------------------------------------------------ Classes
    const insertClass = db.prepare("INSERT INTO classes (id, teacher_id, name, created_at) VALUES (?, ?, ?, ?)");
    const insertMember = db.prepare("INSERT INTO class_members (class_id, student_id) VALUES (?, ?)");
    const classes = [
      { id: "cls-11a", teacher: "nino", name: "11A", members: ["mariam", "giorgi", "ana", "luka"] },
      { id: "cls-11b", teacher: "nino", name: "11B", members: ["saba", "elene", "nika", "tamar"] },
      { id: "cls-phys", teacher: "davit", name: "Physics 9–10", members: ["mariam", "giorgi", "ana", "luka", "saba", "elene", "nika", "tamar"] },
    ];
    for (const c of classes) {
      insertClass.run(c.id, u(c.teacher), c.name, at(40));
      for (const m of c.members) insertMember.run(c.id, u(m));
    }

    // ------------------------------------------------------------ Programming
    const insertSubmission = db.prepare(
      `INSERT INTO programming_submissions (id, user_id, problem_id, language, code, answer, verdict, passed, total, checker, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const solvedBy: Record<string, string[]> = {
      mariam: ["l1-hello", "l1-greeting", "l1-rectangle", "l1-even-odd", "l1-max-of-three", "l1-sum-to-n", "l1-types-predict", "l2-list-max-min", "l2-count-vowels", "l2-palindrome", "l2-debug-average", "l3-sort"],
      giorgi: ["l1-hello", "l1-greeting", "l1-even-odd", "l1-sum-to-n", "l1-times-table", "l2-gcd"],
      ana: ["l1-hello", "l1-greeting", "l1-rectangle", "l1-types-predict"],
      luka: ["l1-hello", "l1-even-odd"],
      saba: ["l1-hello", "l1-greeting", "l1-rectangle", "l1-even-odd", "l1-sum-to-n", "l2-reverse-words", "l3-binary-search", "l3-prefix-sums", "l4-missing-number"],
      elene: ["l1-hello", "l1-sum-to-n"],
    };
    const submissionIds = new Map<string, string>();
    for (const [student, problems] of Object.entries(solvedBy)) {
      problems.forEach((pid, i) => {
        const problem = findBuiltInProblem(pid);
        if (!problem) return;
        const when = at(30 - i * 2, 15);
        const id = newId();
        submissionIds.set(`${student}:${pid}`, id);
        if (problem.kind === "code") {
          const code = problem as CodeProblem;
          const language = student === "saba" && i % 2 === 1 ? "cpp" : "python";
          // An earlier wrong attempt on some problems, then the accepted one.
          if (i % 3 === 1) {
            insertSubmission.run(newId(), u(student), pid, language, code.starter[language], "", "wrong_answer", Math.max(0, code.tests.length - 2), code.tests.length, language === "python" ? "browser" : "self", "[]", when - HOUR);
          }
          const details = code.tests.map((t, index) => ({ index, sample: t.sample, passed: true, status: "passed", input: t.sample ? t.input : null, expected: t.sample ? t.output : null, actual: t.sample ? t.output : null, error: null }));
          insertSubmission.run(id, u(student), pid, language, code.solution[language], "", "accepted", code.tests.length, code.tests.length, language === "python" ? "browser" : "self", json(details), when);
        } else {
          const answer = problem.kind === "predict" ? problem.expected.python : problem.correct;
          insertSubmission.run(id, u(student), pid, "python", "", answer, "correct", 1, 1, "answer", "[]", when);
        }
      });
    }
    // A student who is stuck (useful for the teacher view).
    insertSubmission.run(newId(), u("luka"), "l1-sum-to-n", "python", "n = int(input())\nprint(n + 1)\n", "", "wrong_answer", 0, 4, "browser", "[]", at(1, 10));

    // ------------------------------------------------------------ Critical thinking
    const insertAttempt = db.prepare("INSERT INTO ct_attempts (id, user_id, exercise_id, kind, answers, result, score, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const ctAttemptIds = new Map<string, string>();
    const fallacySet = findExercise("ct-fallacies-1") as ItemExercise;
    const wrongPattern: Record<string, number[]> = { mariam: [6], giorgi: [1, 4, 8], ana: [2, 9], saba: [0, 3, 5, 7], elene: [] };
    for (const [student, wrong] of Object.entries(wrongPattern)) {
      const items: Record<string, string> = {};
      fallacySet.items.forEach((item, i) => {
        if (item.type !== "choice") return;
        items[item.id] = wrong.includes(i) ? item.options.find((o) => o.id !== item.correct)!.id : item.correct;
      });
      const result = grade(fallacySet, { items });
      const id = newId();
      ctAttemptIds.set(student, id);
      insertAttempt.run(id, u(student), fallacySet.id, "fallacy", json({ items }), json(result), result.score, result.max, at(6, 11));
    }
    const builder = findExercise("ct-builder-1")!;
    const builderAnswers = {
      questionId: "phones",
      claim: "Students should be allowed to use phones during breaks, with clear rules about where and how.",
      reasons: [
        { text: "Breaks are students' free time and a chance to rest", evidence: "Our class survey: 21 of 28 students said they use breaks to message family or listen to music", evidenceType: "statistic" },
        { text: "Phones can help with safety and organisation", evidence: "Parents use messages to change pick-up times, according to the school office", evidenceType: "example" },
      ],
      counter: "Phones can reduce face-to-face time and lead to more distraction in the next lesson.",
      rebuttal: "A rule that phones stay in bags during lessons keeps the benefit of breaks while protecting learning time.",
      conclusion: "A clear break-time phone rule is fairer and more realistic than a full ban in our school.",
    };
    const builderResult = grade(builder, builderAnswers);
    insertAttempt.run(newId(), u("mariam"), builder.id, "builder", json(builderAnswers), json(builderResult), builderResult.score, builderResult.max, at(9, 14));

    // ------------------------------------------------------------ STEM
    const insertRecord = db.prepare(
      "INSERT INTO stem_records (id, user_id, item_kind, item_id, data, status, score, max_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const pendulumRecord = newId();
    insertRecord.run(
      pendulumRecord,
      u("giorgi"),
      "experiment",
      "pendulum",
      json({
        prediction: "A longer pendulum will swing more slowly, because the mass has further to travel.",
        table: [
          ["20", "9.1", "0.91"],
          ["40", "12.8", "1.28"],
          ["60", "15.4", "1.54"],
          ["80", "17.9", "1.79"],
        ],
        observations: "The period grew with length, but not in proportion: 4× the length gave about 2× the period. Changing the mass (one vs two washers) made no visible difference.",
        conclusion: "The period depends on the length of the pendulum, not on the mass. Our results match T ≈ 2π√(L/g) within about 3%.",
        reflection: ["Timing ten swings makes our reaction-time error ten times smaller per swing.", "We kept the mass, the angle and the string the same so only the length changed.", "Old clocks and playground swings."],
      }),
      "submitted",
      null,
      null,
      at(4, 13),
      at(4, 13),
    );
    const projectileRecord = newId();
    insertRecord.run(projectileRecord, u("mariam"), "simulation", "projectile", json({ answers: {}, result: { score: 2, max: 3, items: [] } }), "submitted", 2, 3, at(3, 12), at(3, 12));
    insertRecord.run(newId(), u("saba"), "challenge", "ohm-practice", json({ answers: {}, result: { score: 5, max: 5, items: [] } }), "submitted", 5, 5, at(8, 12), at(8, 12));
    insertRecord.run(newId(), u("ana"), "simulation", "probability", json({ answers: {}, result: { score: 3, max: 3, items: [] } }), "submitted", 3, 3, at(2, 12), at(2, 12));

    const bridgeProject = "stem-luka-bridge";
    db.prepare("INSERT INTO stem_projects (id, user_id, template_id, kind, title, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      bridgeProject,
      u("luka"),
      "paper-bridge",
      "experiment",
      "Paper bridge: folding for strength",
      json({
        problem: "Build a bridge from five A4 sheets that spans 20 cm and holds as many coins as possible.",
        users: "Our class (a design challenge).",
        constraints: "5 sheets of A4, 30 cm of tape, 20 cm gap between two stacks of books.",
        criteria: "Number of 1-tetri coins held before the bridge sags more than 1 cm.",
        research: "Folded paper resists bending much better than flat paper. Corrugated cardboard uses the same idea.",
        ideas: ["Flat sheets stacked", "Rolled tubes taped together", "Accordion (zig-zag) folds"],
        solution: "Accordion folds, with a flat sheet taped on top as a deck.",
        justification: "In a quick test the accordion held far more than the flat sheets and needed less tape than the tubes.",
        design: "Three sheets folded into 1 cm accordion pleats, side by side; one flat sheet as the deck; one sheet rolled into two side rails.",
        materials: "Paper, tape, ruler, coins",
        iterations: [
          { title: "Version 1 — flat sheets", change: "Five flat sheets stacked", result: "Held 6 coins", next: "Try folding the paper" },
          { title: "Version 2 — accordion", change: "Accordion folds, 2 cm pleats", result: "Held 58 coins", next: "Make the pleats smaller" },
          { title: "Version 3 — 1 cm pleats and rails", change: "1 cm pleats, side rails", result: "Held 112 coins", next: "Test how the deck spreads the load" },
        ],
        results: "Final design held 112 coins (about 0.4 kg) — 18 times more than the flat design.",
        reflection: "Shape mattered more than the amount of paper. Next time I would measure the sag more precisely with a ruler behind the bridge.",
      }),
      "submitted",
      at(12),
      at(5),
    );
    db.prepare("INSERT INTO stem_projects (id, user_id, template_id, kind, title, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "stem-mariam-filter",
      u("mariam"),
      "water-filter",
      "experiment",
      "Water filter from a plastic bottle",
      json({ problem: "Make muddy water as clear as possible using only everyday materials.", constraints: "Must fit in one 1.5 L bottle.", ideas: ["Sand and gravel layers", "Coffee filter plus cotton"], iterations: [] }),
      "draft",
      at(2),
      at(1),
    );

    // ------------------------------------------------------------ Research
    const researchId = "research-mariam-sleep";
    db.prepare("INSERT INTO research_projects (id, user_id, title, subject, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      researchId,
      u("mariam"),
      "How much do students in our school sleep?",
      "Biology",
      json({
        topic: "Sleep and school",
        question: "How many hours do grade 11 students in our school sleep on school nights, and how does that compare with health recommendations?",
        questionType: "descriptive",
        why: "Many of us feel tired in first lessons. If most students sleep less than recommended, the school council could discuss homework timing or start times.",
        scope: "Grade 11 students (classes 11A and 11B), school nights, October.",
        subQuestions: ["Does screen use after 22:00 relate to sleep time?"],
        hypothesis: "If we survey grade 11 students, then most will report less than 8 hours of sleep on school nights, because of homework and late screen use.",
        independent: "Screen use after 22:00 (yes/no)",
        dependent: "Hours of sleep on a school night",
        controlled: "Same week, same anonymous questionnaire, same wording",
        method: "Anonymous paper questionnaire in both classes (with the teacher's permission); compare the results with the recommendation from a health organisation.",
        analysis: "",
        findings: [],
        conclusion: "",
        limitations: "",
        nextSteps: "",
        audience: "Classmates and the school council",
        keyMessage: "",
      }),
      "submitted",
      at(14),
      at(2),
    );
    const insertSource = db.prepare("INSERT INTO research_sources (id, project_id, data, created_at) VALUES (?, ?, ?, ?)");
    const src = (fields: Record<string, unknown>) => ({
      type: "website",
      authors: "",
      organisation: "",
      year: "",
      publisher: "",
      url: "",
      accessed: "",
      primary: "unsure",
      authorKnown: "unsure",
      recent: "unsure",
      evidenceShown: "unsure",
      balanced: "unsure",
      corroborated: "unsure",
      libraryResourceId: null,
      notes: "",
      ...fields,
    });
    const aasm = newId();
    insertSource.run(
      aasm,
      researchId,
      json(
        src({
          type: "article",
          title: "Recommended amount of sleep for pediatric populations: a consensus statement of the American Academy of Sleep Medicine",
          authors: "Paruthi, S., Brooks, L. J., D'Ambrosio, C., et al.",
          organisation: "American Academy of Sleep Medicine",
          year: "2016",
          publisher: "Journal of Clinical Sleep Medicine, 12(6), 785–786",
          url: "https://doi.org/10.5664/jcsm.5866",
          accessed: new Date(at(10)).toISOString().slice(0, 10),
          primary: "secondary",
          authorKnown: "yes",
          recent: "yes",
          evidenceShown: "yes",
          balanced: "yes",
          corroborated: "unsure",
          notes: "Expert panel recommendation, based on a review of research.",
        }),
      ),
      at(10),
    );
    const survey = newId();
    insertSource.run(
      survey,
      researchId,
      json(
        src({
          type: "dataset",
          title: "Grade 11 sleep questionnaire (our own survey)",
          authors: "Mariam L.",
          year: "2026",
          publisher: "Class survey, 11A and 11B",
          primary: "primary",
          authorKnown: "yes",
          recent: "yes",
          evidenceShown: "yes",
          balanced: "unsure",
          corroborated: "no",
          notes: "24 anonymous answers. Self-reported, so people may round their sleep times.",
        }),
      ),
      at(6),
    );
    const biologyBook = newId();
    insertSource.run(
      biologyBook,
      researchId,
      json(
        src({
          type: "book",
          title: "Biology 2e",
          authors: "Clark, M. A., Douglas, M., Choi, J.",
          year: "2018",
          publisher: "OpenStax",
          url: "https://openstax.org/details/books/biology-2e",
          primary: "secondary",
          authorKnown: "yes",
          recent: "yes",
          evidenceShown: "yes",
          balanced: "yes",
          corroborated: "yes",
          libraryResourceId: "lib-openstax-biology",
        }),
      ),
      at(9),
    );
    const insertNote = db.prepare("INSERT INTO research_notes (id, project_id, source_id, kind, content, page, stance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insertNote.run(newId(), researchId, aasm, "evidence", "The AASM consensus recommends 8–10 hours of sleep per 24 hours for teenagers aged 13–18.", "", "supports", at(10));
    insertNote.run(newId(), researchId, survey, "evidence", "In our survey, 17 of 24 students reported less than 8 hours on a typical school night.", "", "supports", at(5));
    insertNote.run(newId(), researchId, survey, "evidence", "Students without screens after 22:00 did not all sleep more — two of them reported under 7 hours because of early bus times.", "", "contradicts", at(5));
    insertNote.run(newId(), researchId, null, "note", "Ask the teacher whether we can repeat the survey after the winter break to compare.", "", null, at(4));
    const rows: string[][] = [];
    const sleep = [6.5, 7, 7.5, 6, 8, 7, 6.5, 8.5, 7, 6, 7.5, 9, 6.5, 7, 8, 5.5, 7, 6.5, 8, 7.5, 6, 7, 8.5, 6.5];
    sleep.forEach((h, i) => rows.push([i % 2 ? "11B" : "11A", h >= 8 || i % 5 === 0 ? "no" : "yes", String(h)]));
    db.prepare("INSERT INTO research_datasets (id, project_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
      newId(),
      researchId,
      json({
        name: "Sleep survey",
        description: "Hours of sleep on a typical school night, and screen use after 22:00.",
        collection: "Anonymous paper questionnaire, 11A and 11B, one week in October (24 answers).",
        columns: [
          { name: "Class", type: "text" },
          { name: "Screen after 22:00", type: "text" },
          { name: "Hours of sleep", type: "number" },
        ],
        rows,
      }),
      at(5),
      at(5),
    );

    // ------------------------------------------------------------ Library
    const insertResource = db.prepare("INSERT INTO library_resources (id, data, material_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
    const insertCopy = db.prepare("INSERT INTO library_copies (id, resource_id, code, shelf, status, borrower_id, due_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    let copyNumber = 0;
    const loans = [
      { borrower: "luka", due: start + 5 * DAY },
      { borrower: "nika", due: start - 2 * DAY },
      { borrower: "elene", due: start + 9 * DAY },
    ];
    let loanIndex = 0;
    SEED_LIBRARY.forEach((resource, i) => {
      const { id, materialKey, copies, ...data } = resource;
      insertResource.run(id, json(data), materialKey ? (materialIds.get(materialKey) ?? null) : null, u("admin"), at(60 - i), at(60 - i));
      for (const copy of copies) {
        copyNumber += 1;
        const loan = copy.status === "on_loan" ? loans[loanIndex++ % loans.length] : null;
        insertCopy.run(newId(), id, `LIB-${String(copyNumber).padStart(4, "0")}`, copy.shelf, copy.status, loan ? u(loan.borrower) : null, loan?.due ?? null, at(20));
      }
    });
    const insertReading = db.prepare("INSERT INTO reading_progress (user_id, resource_id, status, percent, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
    insertReading.run(u("mariam"), "lib-think-python", "reading", 40, "Chapter 5 on conditionals helped with the even-or-odd problem.", at(1));
    insertReading.run(u("mariam"), "lib-origin", "want", 0, "", at(7));
    insertReading.run(u("ana"), "lib-alice", "finished", 100, "The Mad Hatter's tea party chapter is my favourite.", at(3));
    insertReading.run(u("giorgi"), "lib-openstax-physics", "reading", 15, "", at(5));
    insertReading.run(u("saba"), "lib-cph", "reading", 30, "", at(2));
    const physicsLesson = db.prepare("SELECT id FROM lessons WHERE subject = 'physics' ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
    if (physicsLesson) {
      db.prepare("INSERT INTO lesson_resources (lesson_id, resource_id) VALUES (?, ?)").run(physicsLesson.id, "lib-newton-notes");
      db.prepare("INSERT INTO lesson_resources (lesson_id, resource_id) VALUES (?, ?)").run(physicsLesson.id, "lib-openstax-physics");
    }

    // ------------------------------------------------------------ Career & portfolio
    const insertCard = db.prepare("INSERT INTO university_cards (id, owner_id, shared, data, checked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const card = (fields: Record<string, unknown>) => ({
      university: "",
      country: "Georgia",
      city: "Tbilisi",
      program: "",
      degree: "bachelor",
      language: "",
      fieldId: null,
      admission: "",
      tuition: "",
      scholarships: "",
      deadlines: "",
      website: "",
      sourceUrl: "",
      notes: "",
      interest: 0,
      ...fields,
    });
    const sharedNote =
      "Starting point prepared by the career teacher. Admission to bachelor programmes in Georgia goes through the Unified National Examinations — find this year's subjects, fees, scholarships and dates on the official websites.";
    for (const [id, name, url] of [
      ["uni-tsu", "Ivane Javakhishvili Tbilisi State University", "https://www.tsu.ge"],
      ["uni-gtu", "Georgian Technical University", "https://gtu.ge"],
      ["uni-iliauni", "Ilia State University", "https://iliauni.edu.ge"],
      ["uni-freeuni", "Free University of Tbilisi", "https://freeuni.edu.ge"],
    ] as const) {
      insertCard.run(id, u("eka"), 1, json(card({ university: name, website: url, notes: sharedNote })), null, at(30), at(30));
    }
    insertCard.run(
      "uni-mariam-1",
      u("mariam"),
      0,
      json(
        card({
          university: "Free University of Tbilisi",
          program: "Computer Science",
          fieldId: "computer_science",
          website: "https://freeuni.edu.ge",
          notes: "Ask at the open day about first-year programming courses and scholarships.",
          interest: 3,
        }),
      ),
      start - 400 * DAY,
      at(400),
      at(20),
    );
    insertCard.run("uni-mariam-2", u("mariam"), 0, json(card({ university: "Georgian Technical University", program: "Computer Engineering", fieldId: "engineering", website: "https://gtu.ge", interest: 2 })), at(15), at(15), at(15));

    const insertItem = db.prepare(
      "INSERT INTO portfolio_items (id, user_id, title, category, data, item_date, source_kind, source_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    insertItem.run(
      newId(),
      u("mariam"),
      "Sum from 1 to n",
      "programming",
      json({ description: "Solved the programming problem “Sum from 1 to n” (level 1) in Python.", link: "", evidence: "/labs/programming/l1-sum-to-n", skills: ["programming", "problem_solving"], reflection: "I first used a loop, then learned the formula n(n+1)/2." }),
      day(at(20)),
      "programming",
      "l1-sum-to-n",
      at(20),
      at(20),
    );
    insertItem.run(
      newId(),
      u("mariam"),
      "How much do students in our school sleep?",
      "research",
      json({ description: "A survey of 24 grade 11 students compared with the sleep recommendation for teenagers.", link: "", evidence: `/labs/research/${researchId}`, skills: ["research", "data_analysis", "communication"], reflection: "Designing an anonymous questionnaire was harder than I expected." }),
      day(at(2)),
      "research",
      researchId,
      at(2),
      at(2),
    );
    insertItem.run(
      newId(),
      u("mariam"),
      "Volunteering at the school book swap",
      "volunteer",
      json({ description: "Helped organise the spring book swap: sorting donated books and running the exchange table.", link: "", evidence: "", skills: ["collaboration", "self_management"], reflection: "" }),
      day(at(120)),
      null,
      null,
      at(120),
      at(120),
    );
    insertItem.run(
      newId(),
      u("luka"),
      "Paper bridge: folding for strength",
      "stem",
      json({ description: "Designed and tested three versions of a paper bridge; the final one held 112 coins.", link: "", evidence: `/labs/stem/projects/${bridgeProject}`, skills: ["engineering_design", "problem_solving", "creativity"], reflection: "Shape mattered more than the amount of paper." }),
      day(at(5)),
      "stem_project",
      bridgeProject,
      at(5),
      at(5),
    );
    const insertGoal = db.prepare("INSERT INTO development_goals (id, user_id, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
    insertGoal.run(
      newId(),
      u("mariam"),
      json({ title: "Solve all level 2 programming problems", why: "I want to be ready for the school programming club.", skillId: "programming", targetDate: day(start + 30 * DAY), steps: [{ text: "Finish strings problems", done: true }, { text: "Learn about complexity", done: false }, { text: "Try one level 3 problem", done: false }], reflection: "" }),
      "active",
      at(10),
      at(1),
    );
    insertGoal.run(
      newId(),
      u("mariam"),
      json({ title: "Present my research to the school council", why: "Practise speaking to adults with evidence.", skillId: "communication", targetDate: null, steps: [{ text: "Make the slides", done: false }], reflection: "" }),
      "active",
      at(3),
      at(3),
    );
    const insertSkill = db.prepare("INSERT INTO skill_ratings (user_id, skill_id, level, updated_at) VALUES (?, ?, ?, ?)");
    for (const [skill, level] of [
      ["programming", 3],
      ["problem_solving", 3],
      ["research", 2],
      ["communication", 2],
      ["leadership", 3],
      ["languages", 3],
    ] as const)
      insertSkill.run(u("mariam"), skill, level, at(8));

    const insertBookmark = db.prepare("INSERT INTO bookmarks (user_id, kind, ref_id, created_at) VALUES (?, ?, ?, ?)");
    insertBookmark.run(u("mariam"), "programming", "l3-binary-search", at(4));
    insertBookmark.run(u("mariam"), "library", "lib-think-python", at(4));
    insertBookmark.run(u("mariam"), "career", "software-developer", at(9));

    const insertFeedback = db.prepare("INSERT INTO feedback (id, target_kind, target_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    insertFeedback.run(newId(), "stem_project", bridgeProject, u("davit"), "Excellent iteration log — each version tests one change. Add a photo of version 3 and a sentence on why pleats resist bending.", at(4));
    insertFeedback.run(newId(), "stem_record", pendulumRecord, u("davit"), "Clear data and a well-supported conclusion. Try plotting period against √length to see the straight line.", at(3));

    // ------------------------------------------------------------ Assignments
    const insertAssignment = db.prepare(
      "INSERT INTO assignments (id, teacher_id, kind, ref_id, title, instructions, due_at, class_id, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
    );
    const insertRecipient = db.prepare(
      `INSERT INTO assignment_recipients (assignment_id, student_id, status, work_ref, score, max_score, response, submitted_at, feedback, feedback_by, feedback_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    type R = { status: string; workRef?: string | null; score?: number | null; max?: number | null; response?: Record<string, string>; submittedAt?: number | null; feedback?: string; by?: string };
    const addAssignment = (a: { id: string; teacher: string; kind: string; ref: string | null; title: string; instructions: string; due: number | null; classId: string | null; created: number }, recipients: Record<string, R>) => {
      insertAssignment.run(a.id, u(a.teacher), a.kind, a.ref, a.title, a.instructions, a.due, a.classId, a.created);
      for (const [student, r] of Object.entries(recipients)) {
        insertRecipient.run(
          a.id,
          u(student),
          r.status,
          r.workRef ?? null,
          r.score ?? null,
          r.max ?? null,
          json({ text: "", link: "", workTitle: "", ...r.response }),
          r.submittedAt ?? null,
          r.feedback ?? "",
          r.feedback ? u(r.by ?? a.teacher) : null,
          r.feedback ? at(1) : null,
          r.submittedAt ?? a.created,
        );
      }
    };
    const solved = (student: string, pid: string): R =>
      submissionIds.has(`${student}:${pid}`) ? { status: "completed", workRef: submissionIds.get(`${student}:${pid}`)!, score: 1, max: 1, submittedAt: at(20) } : { status: "assigned" };
    addAssignment(
      { id: "asg-sum", teacher: "nino", kind: "programming", ref: "l1-sum-to-n", title: "Sum from 1 to n", instructions: "Solve it with a loop first. Then try the formula and compare.", due: start + 3 * DAY, classId: "cls-11a", created: at(8) },
      { mariam: solved("mariam", "l1-sum-to-n"), giorgi: solved("giorgi", "l1-sum-to-n"), ana: { status: "assigned" }, luka: { status: "in_progress" } },
    );
    const ctResult = (student: string): R => {
      const id = ctAttemptIds.get(student);
      if (!id) return { status: "assigned" };
      const row = db.prepare("SELECT score, max_score FROM ct_attempts WHERE id = ?").get(id) as { score: number; max_score: number };
      return { status: "completed", workRef: id, score: row.score, max: row.max_score, submittedAt: at(6, 11) };
    };
    addAssignment(
      { id: "asg-fallacies", teacher: "nino", kind: "critical", ref: "ct-fallacies-1", title: "Spot the fallacy", instructions: "Read each situation carefully. After checking, read the fairer way to make each point.", due: start - DAY, classId: "cls-11a", created: at(9) },
      { mariam: ctResult("mariam"), giorgi: ctResult("giorgi"), ana: ctResult("ana"), luka: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-research", teacher: "nino", kind: "research", ref: null, title: "Mini research project", instructions: "Choose a question about our school. Use at least two sources and collect some data of your own.", due: start + 10 * DAY, classId: "cls-11a", created: at(15) },
      {
        mariam: { status: "submitted", workRef: researchId, response: { text: "My project is ready for feedback — I still need to write the conclusion.", workTitle: "How much do students in our school sleep?" }, submittedAt: at(2) },
        giorgi: { status: "in_progress" },
        ana: { status: "assigned" },
        luka: { status: "assigned" },
      },
    );
    addAssignment(
      { id: "asg-pendulum", teacher: "davit", kind: "experiment", ref: "pendulum", title: "Pendulum investigation", instructions: "Work in pairs. Each of you submits your own record with your table and conclusion.", due: start + 5 * DAY, classId: "cls-phys", created: at(7) },
      {
        mariam: { status: "assigned" },
        giorgi: { status: "reviewed", workRef: pendulumRecord, submittedAt: at(4, 13), feedback: "Clear data and a well-supported conclusion. Try plotting period against √length.", by: "davit" },
        ana: { status: "in_progress" },
        luka: { status: "assigned" },
        saba: { status: "assigned" },
        elene: { status: "assigned" },
        nika: { status: "assigned" },
        tamar: { status: "assigned" },
      },
    );
    addAssignment(
      { id: "asg-bridge", teacher: "davit", kind: "stem_project", ref: "paper-bridge", title: "Paper bridge challenge", instructions: "Test at least two versions and record every result.", due: start + 2 * DAY, classId: null, created: at(12) },
      { luka: { status: "submitted", workRef: bridgeProject, response: { workTitle: "Paper bridge: folding for strength" }, submittedAt: at(5) }, mariam: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-alice", teacher: "eka", kind: "library", ref: "lib-alice", title: "Read: Alice's Adventures in Wonderland (chapters 1–3)", instructions: "Read online or borrow a copy. Mark the book as finished when you are done.", due: start + 14 * DAY, classId: "cls-11b", created: at(5) },
      { saba: { status: "assigned" }, elene: { status: "assigned" }, nika: { status: "assigned" }, tamar: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-reflection", teacher: "nino", kind: "custom", ref: null, title: "Weekly reflection", instructions: "In 3–5 sentences: what did you learn this week, and what will you practise next?", due: at(3), classId: "cls-11a", created: at(10) },
      {
        mariam: { status: "reviewed", response: { text: "I learned how to use prefix sums to answer range questions quickly. Next I will practise binary search." }, submittedAt: at(4), feedback: "Great, specific reflection. Try l3-binary-search next.", by: "nino" },
        giorgi: { status: "submitted", response: { text: "I understood conditions better and finished the even/odd problem." }, submittedAt: at(3, 18) },
        ana: { status: "assigned" },
        luka: { status: "assigned" },
      },
    );
  })();
}
