import type { DB } from "./index";
import { newId } from "@/lib/domain/ids";
import { findBuiltInProblem } from "@/lib/labs/programming/catalog";
import type { CodeProblem } from "@/lib/labs/programming/types";
import { findExercise } from "@/lib/labs/critical/catalog";
import { grade } from "@/lib/labs/critical/grade";
import type { ItemExercise } from "@/lib/labs/critical/types";
import { SEED_LIBRARY } from "@/lib/labs/library/catalog-seed";
import type { ContentLanguage } from "@/lib/domain/catalog";

/*
 * Demo data for the laboratories: classes, assignments in every state,
 * programming submissions, critical-thinking attempts, STEM records and a
 * project, a research project with real, checkable sources and the
 * students' own survey data, the library catalogue with shelf copies and
 * loans, university research cards (deliberately without admission facts),
 * portfolios, goals and skills. Written with plain SQL so it also runs from
 * scripts outside Next.js. Everything a person would have typed is written
 * in the school's language (see `demoLanguage()` in seed.ts).
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function seedLabs(db: DB, users: Map<string, string>, materialIds: Map<string, string>, start: number, language: ContentLanguage): void {
  const u = (key: string) => users.get(key)!;
  const t = (en: string, ka: string) => (language === "ka" ? ka : en);
  const problemTitle = (id: string) => findBuiltInProblem(id)!.title[language];
  const at = (daysAgo: number, hour = 12) => start - daysAgo * DAY + (hour - 12) * HOUR;
  const json = (v: unknown) => JSON.stringify(v);

  db.transaction(() => {
    // ------------------------------------------------------------ Classes
    const insertClass = db.prepare("INSERT INTO classes (id, teacher_id, name, created_at) VALUES (?, ?, ?, ?)");
    const insertMember = db.prepare("INSERT INTO class_members (class_id, student_id) VALUES (?, ?)");
    const classes = [
      { id: "cls-11a", teacher: "nino", name: t("11A", "11ა"), members: ["mariam", "giorgi", "ana", "luka"] },
      { id: "cls-11b", teacher: "nino", name: t("11B", "11ბ"), members: ["saba", "elene", "nika", "tamar"] },
      { id: "cls-phys", teacher: "davit", name: t("Physics 9–10", "ფიზიკა 9–10"), members: ["mariam", "giorgi", "ana", "luka", "saba", "elene", "nika", "tamar"] },
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
      claim: t("Students should be allowed to use phones during breaks, with clear rules about where and how.", "მოსწავლეებს დასვენებაზე ტელეფონის გამოყენების უფლება უნდა ჰქონდეთ — მკაფიო წესებით, სად და როგორ."),
      reasons: [
        {
          text: t("Breaks are students' free time and a chance to rest", "დასვენება მოსწავლის თავისუფალი დროა, როცა ძალას იკრებს"),
          evidence: t("Our class survey: 21 of 28 students said they use breaks to message family or listen to music", "ჩვენი კლასის გამოკითხვა: 28-დან 21 მოსწავლე ამბობს, რომ დასვენებაზე ოჯახს სწერს ან მუსიკას უსმენს"),
          evidenceType: "statistic",
        },
        {
          text: t("Phones can help with safety and organisation", "ტელეფონი უსაფრთხოებასა და ორგანიზებაში გვეხმარება"),
          evidence: t("Parents use messages to change pick-up times, according to the school office", "სკოლის კანცელარიის თქმით, მშობლები შეტყობინებით ცვლიან, როდის წაიყვანენ ბავშვს"),
          evidenceType: "example",
        },
      ],
      counter: t("Phones can reduce face-to-face time and lead to more distraction in the next lesson.", "ტელეფონმა შეიძლება პირისპირ ურთიერთობის დრო შეამციროს და მომდევნო გაკვეთილზე ყურადღება გაფანტოს."),
      rebuttal: t("A rule that phones stay in bags during lessons keeps the benefit of breaks while protecting learning time.", "წესი, რომ გაკვეთილზე ტელეფონი ჩანთაში რჩება, დასვენების სარგებელს ინარჩუნებს და სწავლის დროსაც იცავს."),
      conclusion: t("A clear break-time phone rule is fairer and more realistic than a full ban in our school.", "ჩვენს სკოლაში დასვენებაზე ტელეფონის მკაფიო წესი სრულ აკრძალვაზე უფრო სამართლიანი და რეალისტურია."),
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
        prediction: t("A longer pendulum will swing more slowly, because the mass has further to travel.", "გრძელი ქანქარა უფრო ნელა ირხევა, რადგან სხეულს მეტი მანძილის გავლა უწევს."),
        table: [
          ["20", "9.1", "0.91"],
          ["40", "12.8", "1.28"],
          ["60", "15.4", "1.54"],
          ["80", "17.9", "1.79"],
        ].map((row) => row.map((cell) => t(cell, cell.replace(".", ",")))),
        observations: t(
          "The period grew with length, but not in proportion: 4× the length gave about 2× the period. Changing the mass (one vs two washers) made no visible difference.",
          "რხევის პერიოდი სიგრძესთან ერთად იზრდებოდა, მაგრამ არა პროპორციულად: 4-ჯერ მეტმა სიგრძემ დაახლოებით 2-ჯერ მეტი პერიოდი მოგვცა. მასის შეცვლამ (ერთი ან ორი საყელური) შესამჩნევი განსხვავება არ გამოიწვია.",
        ),
        conclusion: t("The period depends on the length of the pendulum, not on the mass. Our results match T ≈ 2π√(L/g) within about 3%.", "პერიოდი ქანქარის სიგრძეზეა დამოკიდებული და არა მასაზე. ჩვენი შედეგები T ≈ 2π√(L/g) ფორმულას დაახლოებით 3%-ის სიზუსტით ემთხვევა."),
        reflection: [
          t("Timing ten swings makes our reaction-time error ten times smaller per swing.", "ათი რხევის ერთად გაზომვა ჩვენი რეაქციის დროით გამოწვეულ ცდომილებას ერთ რხევაზე ათჯერ ამცირებს."),
          t("We kept the mass, the angle and the string the same so only the length changed.", "მასა, კუთხე და ძაფი უცვლელი დავტოვეთ, რომ მხოლოდ სიგრძე შეცვლილიყო."),
          t("Old clocks and playground swings.", "ძველი ქანქარიანი საათები და ეზოს საქანელები."),
        ],
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
    const bridgeTitle = t("Paper bridge: folding for strength", "ქაღალდის ხიდი: სიმტკიცე ნაკეცებით");
    db.prepare("INSERT INTO stem_projects (id, user_id, template_id, kind, title, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      bridgeProject,
      u("luka"),
      "paper-bridge",
      "experiment",
      bridgeTitle,
      json({
        problem: t("Build a bridge from five A4 sheets that spans 20 cm and holds as many coins as possible.", "ააგე ხიდი ხუთი A4 ფურცლისგან, რომელიც 20 სმ-იან ღიობს გადაფარავს და რაც შეიძლება მეტ მონეტას გაუძლებს."),
        users: t("Our class (a design challenge).", "ჩვენი კლასი (საინჟინრო გამოწვევა)."),
        constraints: t("5 sheets of A4, 30 cm of tape, 20 cm gap between two stacks of books.", "5 ფურცელი A4, 30 სმ წებოვანი ლენტი, 20 სმ მანძილი წიგნების ორ დასტას შორის."),
        criteria: t("Number of 1-tetri coins held before the bridge sags more than 1 cm.", "1-თეთრიანი მონეტების რაოდენობა, სანამ ხიდი 1 სმ-ზე მეტად ჩაიღუნება."),
        research: t("Folded paper resists bending much better than flat paper. Corrugated cardboard uses the same idea.", "დაკეცილი ქაღალდი ღუნვას ბრტყელზე გაცილებით უკეთ უძლებს. გოფრირებული მუყაოც იმავე პრინციპს იყენებს."),
        ideas: [t("Flat sheets stacked", "ერთმანეთზე დაწყობილი ბრტყელი ფურცლები"), t("Rolled tubes taped together", "ერთმანეთზე მიწებებული დახვეული მილები"), t("Accordion (zig-zag) folds", "გარმონისებრი (ზიგზაგისებრი) ნაკეცები")],
        solution: t("Accordion folds, with a flat sheet taped on top as a deck.", "გარმონისებრი ნაკეცები, ზემოდან მიწებებული ბრტყელი ფურცლით — სავალი ნაწილისთვის."),
        justification: t("In a quick test the accordion held far more than the flat sheets and needed less tape than the tubes.", "სწრაფ ტესტში გარმონმა ბრტყელ ფურცლებზე გაცილებით მეტს გაუძლო და მილებზე ნაკლები ლენტი დასჭირდა."),
        design: t(
          "Three sheets folded into 1 cm accordion pleats, side by side; one flat sheet as the deck; one sheet rolled into two side rails.",
          "სამი ფურცელი 1 სმ-იან გარმონისებრ ნაკეცებად, გვერდიგვერდ; ერთი ბრტყელი ფურცელი — სავალი ნაწილი; ერთი ფურცელი ორ გვერდით მოაჯირად დახვეული.",
        ),
        materials: t("Paper, tape, ruler, coins", "ქაღალდი, წებოვანი ლენტი, სახაზავი, მონეტები"),
        iterations: [
          {
            title: t("Version 1 — flat sheets", "ვერსია 1 — ბრტყელი ფურცლები"),
            change: t("Five flat sheets stacked", "ხუთი ბრტყელი ფურცელი ერთმანეთზე"),
            result: t("Held 6 coins", "გაუძლო 6 მონეტას"),
            next: t("Try folding the paper", "ვცდი ქაღალდის დაკეცვას"),
          },
          {
            title: t("Version 2 — accordion", "ვერსია 2 — გარმონი"),
            change: t("Accordion folds, 2 cm pleats", "გარმონისებრი ნაკეცები, 2 სმ"),
            result: t("Held 58 coins", "გაუძლო 58 მონეტას"),
            next: t("Make the pleats smaller", "ნაკეცებს დავაპატარავებ"),
          },
          {
            title: t("Version 3 — 1 cm pleats and rails", "ვერსია 3 — 1 სმ ნაკეცები და მოაჯირები"),
            change: t("1 cm pleats, side rails", "1 სმ ნაკეცები, გვერდითი მოაჯირები"),
            result: t("Held 112 coins", "გაუძლო 112 მონეტას"),
            next: t("Test how the deck spreads the load", "შევამოწმებ, როგორ ანაწილებს დატვირთვას სავალი ნაწილი"),
          },
        ],
        results: t("Final design held 112 coins (about 0.4 kg) — 18 times more than the flat design.", "საბოლოო კონსტრუქციამ 112 მონეტას გაუძლო (დაახლოებით 0,4 კგ) — ბრტყელზე 18-ჯერ მეტს."),
        reflection: t(
          "Shape mattered more than the amount of paper. Next time I would measure the sag more precisely with a ruler behind the bridge.",
          "ფორმამ ქაღალდის რაოდენობაზე მეტი როლი ითამაშა. შემდეგ ჯერზე ჩაღუნვას უფრო ზუსტად გავზომავდი — ხიდის უკან დადგმული სახაზავით.",
        ),
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
      t("Water filter from a plastic bottle", "წყლის ფილტრი პლასტმასის ბოთლისგან"),
      json({
        problem: t("Make muddy water as clear as possible using only everyday materials.", "ტალახიანი წყალი რაც შეიძლება გამჭვირვალე გახადე მხოლოდ ყოველდღიური მასალებით."),
        constraints: t("Must fit in one 1.5 L bottle.", "უნდა ჩაეტიოს ერთ 1,5-ლიტრიან ბოთლში."),
        ideas: [t("Sand and gravel layers", "ქვიშისა და ხრეშის ფენები"), t("Coffee filter plus cotton", "ყავის ფილტრი და ბამბა")],
        iterations: [],
      }),
      "draft",
      at(2),
      at(1),
    );

    // ------------------------------------------------------------ Research
    const researchId = "research-mariam-sleep";
    const researchTitle = t("How much do students in our school sleep?", "რამდენს სძინავთ ჩვენი სკოლის მოსწავლეებს?");
    db.prepare("INSERT INTO research_projects (id, user_id, title, subject, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      researchId,
      u("mariam"),
      researchTitle,
      t("Biology", "ბიოლოგია"),
      json({
        topic: t("Sleep and school", "ძილი და სკოლა"),
        question: t(
          "How many hours do grade 11 students in our school sleep on school nights, and how does that compare with health recommendations?",
          "რამდენ საათს სძინავთ ჩვენი სკოლის მე-11 კლასის მოსწავლეებს სასწავლო დღეების წინა ღამით და როგორ შეესაბამება ეს ჯანმრთელობის რეკომენდაციებს?",
        ),
        questionType: "descriptive",
        why: t(
          "Many of us feel tired in first lessons. If most students sleep less than recommended, the school council could discuss homework timing or start times.",
          "ბევრი ჩვენგანი პირველ გაკვეთილებზე დაღლილია. თუ მოსწავლეების უმეტესობას რეკომენდებულზე ნაკლები სძინავს, სკოლის საბჭოს შეუძლია განიხილოს საშინაო დავალებების დრო ან გაკვეთილების დაწყების საათი.",
        ),
        scope: t("Grade 11 students (classes 11A and 11B), school nights, October.", "მე-11 კლასის მოსწავლეები (11ა და 11ბ), სასწავლო დღეების წინა ღამეები, ოქტომბერი."),
        subQuestions: [t("Does screen use after 22:00 relate to sleep time?", "უკავშირდება თუ არა 22:00-ის შემდეგ ეკრანის გამოყენება ძილის ხანგრძლივობას?")],
        hypothesis: t(
          "If we survey grade 11 students, then most will report less than 8 hours of sleep on school nights, because of homework and late screen use.",
          "თუ მე-11 კლასის მოსწავლეებს გამოვკითხავთ, მაშინ მათი უმეტესობა სასწავლო დღეების წინა ღამით 8 საათზე ნაკლებ ძილს დაასახელებს, რადგან საშინაო დავალებები და გვიანობამდე ეკრანთან ჯდომა ძილის დროს ამცირებს.",
        ),
        independent: t("Screen use after 22:00 (yes/no)", "ეკრანის გამოყენება 22:00-ის შემდეგ (კი/არა)"),
        dependent: t("Hours of sleep on a school night", "ძილის საათები სასწავლო დღის წინა ღამით"),
        controlled: t("Same week, same anonymous questionnaire, same wording", "ერთი და იგივე კვირა, ერთი და იგივე ანონიმური კითხვარი და ფორმულირება"),
        method: t(
          "Anonymous paper questionnaire in both classes (with the teacher's permission); compare the results with the recommendation from a health organisation.",
          "ანონიმური ქაღალდის კითხვარი ორივე კლასში (მასწავლებლის ნებართვით); შედეგების შედარება ჯანმრთელობის ორგანიზაციის რეკომენდაციასთან.",
        ),
        analysis: "",
        findings: [],
        conclusion: "",
        limitations: "",
        nextSteps: "",
        audience: t("Classmates and the school council", "თანაკლასელები და სკოლის საბჭო"),
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
          notes: t("Expert panel recommendation, based on a review of research.", "ექსპერტთა ჯგუფის რეკომენდაცია, რომელიც კვლევების მიმოხილვას ეყრდნობა."),
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
          title: t("Grade 11 sleep questionnaire (our own survey)", "მე-11 კლასის კითხვარი ძილზე (ჩვენი გამოკითხვა)"),
          authors: "მარიამ ლ.",
          year: "2026",
          publisher: t("Class survey, 11A and 11B", "კლასის გამოკითხვა, 11ა და 11ბ"),
          primary: "primary",
          authorKnown: "yes",
          recent: "yes",
          evidenceShown: "yes",
          balanced: "unsure",
          corroborated: "no",
          notes: t("24 anonymous answers. Self-reported, so people may round their sleep times.", "24 ანონიმური პასუხი. პასუხები მოსწავლეებმა თავად მიუთითეს, ამიტომ ძილის დრო შეიძლება დამრგვალებული იყოს."),
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
    insertNote.run(newId(), researchId, aasm, "evidence", t("The AASM consensus recommends 8–10 hours of sleep per 24 hours for teenagers aged 13–18.", "AASM-ის კონსენსუსი 13–18 წლის მოზარდებს 24 საათში 8–10 საათ ძილს ურჩევს."), "", "supports", at(10));
    insertNote.run(newId(), researchId, survey, "evidence", t("In our survey, 17 of 24 students reported less than 8 hours on a typical school night.", "ჩვენს გამოკითხვაში 24-დან 17 მოსწავლემ ჩვეულებრივი სასწავლო დღის წინა ღამისთვის 8 საათზე ნაკლები ძილი მიუთითა."), "", "supports", at(5));
    insertNote.run(newId(), researchId, survey, "evidence", t("Students without screens after 22:00 did not all sleep more — two of them reported under 7 hours because of early bus times.", "22:00-ის შემდეგ ეკრანის გარეშე დარჩენილ ყველა მოსწავლეს მეტი არ სძინავს — ორმა მათგანმა ადრეული ავტობუსის გამო 7 საათზე ნაკლები მიუთითა."), "", "contradicts", at(5));
    insertNote.run(newId(), researchId, null, "note", t("Ask the teacher whether we can repeat the survey after the winter break to compare.", "ვკითხო მასწავლებელს, შეგვიძლია თუ არა ზამთრის არდადეგების შემდეგ გამოკითხვის გამეორება შესადარებლად."), "", null, at(4));
    const rows: string[][] = [];
    const sleep = [6.5, 7, 7.5, 6, 8, 7, 6.5, 8.5, 7, 6, 7.5, 9, 6.5, 7, 8, 5.5, 7, 6.5, 8, 7.5, 6, 7, 8.5, 6.5];
    sleep.forEach((h, i) => rows.push([i % 2 ? t("11B", "11ბ") : t("11A", "11ა"), h >= 8 || i % 5 === 0 ? t("no", "არა") : t("yes", "კი"), t(String(h), String(h).replace(".", ","))]));
    db.prepare("INSERT INTO research_datasets (id, project_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
      newId(),
      researchId,
      json({
        name: t("Sleep survey", "ძილის გამოკითხვა"),
        description: t("Hours of sleep on a typical school night, and screen use after 22:00.", "ძილის საათები ჩვეულებრივი სასწავლო დღის წინა ღამით და ეკრანის გამოყენება 22:00-ის შემდეგ."),
        collection: t("Anonymous paper questionnaire, 11A and 11B, one week in October (24 answers).", "ანონიმური ქაღალდის კითხვარი, 11ა და 11ბ, ოქტომბრის ერთი კვირა (24 პასუხი)."),
        columns: [
          { name: t("Class", "კლასი"), type: "text" },
          { name: t("Screen after 22:00", "ეკრანი 22:00-ის შემდეგ"), type: "text" },
          { name: t("Hours of sleep", "ძილის საათები"), type: "number" },
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
    insertReading.run(u("mariam"), "lib-think-python", "reading", 40, t("Chapter 5 on conditionals helped with the even-or-odd problem.", "მე-5 თავი პირობებზე ლუწი-კენტის ამოცანაში დამეხმარა."), at(1));
    insertReading.run(u("mariam"), "lib-origin", "want", 0, "", at(7));
    insertReading.run(u("ana"), "lib-alice", "finished", 100, t("The Mad Hatter's tea party chapter is my favourite.", "ყველაზე მეტად მექუდის ჩაის სმის თავი მომეწონა."), at(3));
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
      country: t("Georgia", "საქართველო"),
      city: t("Tbilisi", "თბილისი"),
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
    const sharedNote = t(
      "Starting point prepared by the career teacher. Admission to bachelor programmes in Georgia goes through the Unified National Examinations — find this year's subjects, fees, scholarships and dates on the official websites.",
      "საწყისი ბარათი, რომელიც კარიერის მასწავლებელმა მოამზადა. საქართველოში საბაკალავრო პროგრამებზე ჩარიცხვა ერთიანი ეროვნული გამოცდებით ხდება — წლევანდელი საგნები, საფასური, სტიპენდიები და ვადები ოფიციალურ ვებგვერდებზე მოძებნე.",
    );
    const freeUni = t("Free University of Tbilisi", "თბილისის თავისუფალი უნივერსიტეტი");
    const gtu = t("Georgian Technical University", "საქართველოს ტექნიკური უნივერსიტეტი");
    for (const [id, name, url] of [
      ["uni-tsu", t("Ivane Javakhishvili Tbilisi State University", "ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი"), "https://www.tsu.ge"],
      ["uni-gtu", gtu, "https://gtu.ge"],
      ["uni-iliauni", t("Ilia State University", "ილიას სახელმწიფო უნივერსიტეტი"), "https://iliauni.edu.ge"],
      ["uni-freeuni", freeUni, "https://freeuni.edu.ge"],
    ] as const) {
      insertCard.run(id, u("eka"), 1, json(card({ university: name, website: url, notes: sharedNote })), null, at(30), at(30));
    }
    insertCard.run(
      "uni-mariam-1",
      u("mariam"),
      0,
      json(
        card({
          university: freeUni,
          program: t("Computer Science", "კომპიუტერული მეცნიერება"),
          fieldId: "computer_science",
          website: "https://freeuni.edu.ge",
          notes: t("Ask at the open day about first-year programming courses and scholarships.", "ღია კარის დღეზე ვიკითხო პირველი კურსის პროგრამირების საგნებსა და სტიპენდიებზე."),
          interest: 3,
        }),
      ),
      start - 400 * DAY,
      at(400),
      at(20),
    );
    insertCard.run("uni-mariam-2", u("mariam"), 0, json(card({ university: gtu, program: t("Computer Engineering", "კომპიუტერული ინჟინერია"), fieldId: "engineering", website: "https://gtu.ge", interest: 2 })), at(15), at(15), at(15));

    const insertItem = db.prepare(
      "INSERT INTO portfolio_items (id, user_id, title, category, data, item_date, source_kind, source_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    insertItem.run(
      newId(),
      u("mariam"),
      problemTitle("l1-sum-to-n"),
      "programming",
      json({
        description: t(`Solved the programming problem “${problemTitle("l1-sum-to-n")}” (level 1) in Python.`, `ამოვხსენი საპროგრამო ამოცანა „${problemTitle("l1-sum-to-n")}“ (დონე 1) Python-ზე.`),
        link: "",
        evidence: "/labs/programming/l1-sum-to-n",
        skills: ["programming", "problem_solving"],
        reflection: t("I first used a loop, then learned the formula n(n+1)/2.", "ჯერ ციკლი გამოვიყენე, მერე n(n+1)/2 ფორმულა ვისწავლე."),
      }),
      day(at(20)),
      "programming",
      "l1-sum-to-n",
      at(20),
      at(20),
    );
    insertItem.run(
      newId(),
      u("mariam"),
      researchTitle,
      "research",
      json({
        description: t("A survey of 24 grade 11 students compared with the sleep recommendation for teenagers.", "მე-11 კლასის 24 მოსწავლის გამოკითხვა, შედარებული მოზარდებისთვის ძილის რეკომენდაციასთან."),
        link: "",
        evidence: `/labs/research/${researchId}`,
        skills: ["research", "data_analysis", "communication"],
        reflection: t("Designing an anonymous questionnaire was harder than I expected.", "ანონიმური კითხვარის შედგენა მოსალოდნელზე რთული აღმოჩნდა."),
      }),
      day(at(2)),
      "research",
      researchId,
      at(2),
      at(2),
    );
    insertItem.run(
      newId(),
      u("mariam"),
      t("Volunteering at the school book swap", "მოხალისეობა სკოლის წიგნების გაცვლაზე"),
      "volunteer",
      json({
        description: t("Helped organise the spring book swap: sorting donated books and running the exchange table.", "დავეხმარე წიგნების გაზაფხულის გაცვლის ორგანიზებას: ვახარისხებდი შემოწირულ წიგნებს და გაცვლის მაგიდას ვუძღვებოდი."),
        link: "",
        evidence: "",
        skills: ["collaboration", "self_management"],
        reflection: "",
      }),
      day(at(120)),
      null,
      null,
      at(120),
      at(120),
    );
    insertItem.run(
      newId(),
      u("luka"),
      bridgeTitle,
      "stem",
      json({
        description: t("Designed and tested three versions of a paper bridge; the final one held 112 coins.", "დავაპროექტე და გამოვცადე ქაღალდის ხიდის სამი ვერსია; საბოლოომ 112 მონეტას გაუძლო."),
        link: "",
        evidence: `/labs/stem/projects/${bridgeProject}`,
        skills: ["engineering_design", "problem_solving", "creativity"],
        reflection: t("Shape mattered more than the amount of paper.", "ფორმამ ქაღალდის რაოდენობაზე მეტი როლი ითამაშა."),
      }),
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
      json({
        title: t("Solve all level 2 programming problems", "ყველა მე-2 დონის საპროგრამო ამოცანის ამოხსნა"),
        why: t("I want to be ready for the school programming club.", "მინდა სკოლის პროგრამირების წრისთვის მზად ვიყო."),
        skillId: "programming",
        targetDate: day(start + 30 * DAY),
        steps: [
          { text: t("Finish strings problems", "სტრიქონების ამოცანების დასრულება"), done: true },
          { text: t("Learn about complexity", "ალგორითმის სირთულის შესწავლა"), done: false },
          { text: t("Try one level 3 problem", "ერთი მე-3 დონის ამოცანის ცდა"), done: false },
        ],
        reflection: "",
      }),
      "active",
      at(10),
      at(1),
    );
    insertGoal.run(
      newId(),
      u("mariam"),
      json({
        title: t("Present my research to the school council", "ჩემი კვლევის წარდგენა სკოლის საბჭოზე"),
        why: t("Practise speaking to adults with evidence.", "ზრდასრულების წინაშე მტკიცებულებებზე დაყრდნობით საუბრის ვარჯიში."),
        skillId: "communication",
        targetDate: null,
        steps: [{ text: t("Make the slides", "სლაიდების მომზადება"), done: false }],
        reflection: "",
      }),
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
    insertFeedback.run(newId(), "stem_project", bridgeProject, u("davit"), t("Excellent iteration log — each version tests one change. Add a photo of version 3 and a sentence on why pleats resist bending.", "შესანიშნავი ვერსიების ჟურნალია — ყოველი ვერსია ერთ ცვლილებას ამოწმებს. დაამატე მე-3 ვერსიის ფოტო და ერთი წინადადება იმაზე, რატომ უძლებს ნაკეცი ღუნვას."), at(4));
    insertFeedback.run(newId(), "stem_record", pendulumRecord, u("davit"), t("Clear data and a well-supported conclusion. Try plotting period against √length to see the straight line.", "მკაფიო მონაცემები და კარგად დასაბუთებული დასკვნა. სცადე, ააგო პერიოდის გრაფიკი √სიგრძის მიმართ — წრფე უნდა მიიღო."), at(3));

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
      { id: "asg-sum", teacher: "nino", kind: "programming", ref: "l1-sum-to-n", title: problemTitle("l1-sum-to-n"), instructions: t("Solve it with a loop first. Then try the formula and compare.", "ჯერ ციკლით ამოხსენი, შემდეგ ფორმულა სცადე და შეადარე."), due: start + 3 * DAY, classId: "cls-11a", created: at(8) },
      { mariam: solved("mariam", "l1-sum-to-n"), giorgi: solved("giorgi", "l1-sum-to-n"), ana: { status: "assigned" }, luka: { status: "in_progress" } },
    );
    const ctResult = (student: string): R => {
      const id = ctAttemptIds.get(student);
      if (!id) return { status: "assigned" };
      const row = db.prepare("SELECT score, max_score FROM ct_attempts WHERE id = ?").get(id) as { score: number; max_score: number };
      return { status: "completed", workRef: id, score: row.score, max: row.max_score, submittedAt: at(6, 11) };
    };
    addAssignment(
      { id: "asg-fallacies", teacher: "nino", kind: "critical", ref: "ct-fallacies-1", title: t("Spot the fallacy", "იპოვე ლოგიკური შეცდომა"), instructions: t("Read each situation carefully. After checking, read the fairer way to make each point.", "ყურადღებით წაიკითხე თითოეული სიტუაცია. შემოწმების შემდეგ წაიკითხე, როგორ შეიძლებოდა იგივე აზრის სამართლიანად თქმა."), due: start - DAY, classId: "cls-11a", created: at(9) },
      { mariam: ctResult("mariam"), giorgi: ctResult("giorgi"), ana: ctResult("ana"), luka: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-research", teacher: "nino", kind: "research", ref: null, title: t("Mini research project", "მინი-კვლევითი პროექტი"), instructions: t("Choose a question about our school. Use at least two sources and collect some data of your own.", "აირჩიე კითხვა ჩვენი სკოლის შესახებ. გამოიყენე მინიმუმ ორი წყარო და შეაგროვე საკუთარი მონაცემებიც."), due: start + 10 * DAY, classId: "cls-11a", created: at(15) },
      {
        mariam: { status: "submitted", workRef: researchId, response: { text: t("My project is ready for feedback — I still need to write the conclusion.", "პროექტი უკუკავშირისთვის მზადაა — დასკვნა ჯერ კიდევ დასაწერი მაქვს."), workTitle: researchTitle }, submittedAt: at(2) },
        giorgi: { status: "in_progress" },
        ana: { status: "assigned" },
        luka: { status: "assigned" },
      },
    );
    addAssignment(
      { id: "asg-pendulum", teacher: "davit", kind: "experiment", ref: "pendulum", title: t("Pendulum investigation", "ქანქარის კვლევა"), instructions: t("Work in pairs. Each of you submits your own record with your table and conclusion.", "იმუშავეთ წყვილებში. თითოეულმა ჩააბარეთ საკუთარი ჩანაწერი — ცხრილითა და დასკვნით."), due: start + 5 * DAY, classId: "cls-phys", created: at(7) },
      {
        mariam: { status: "assigned" },
        giorgi: { status: "reviewed", workRef: pendulumRecord, submittedAt: at(4, 13), feedback: t("Clear data and a well-supported conclusion. Try plotting period against √length.", "მკაფიო მონაცემები და კარგად დასაბუთებული დასკვნა. სცადე, ააგო პერიოდის გრაფიკი √სიგრძის მიმართ."), by: "davit" },
        ana: { status: "in_progress" },
        luka: { status: "assigned" },
        saba: { status: "assigned" },
        elene: { status: "assigned" },
        nika: { status: "assigned" },
        tamar: { status: "assigned" },
      },
    );
    addAssignment(
      { id: "asg-bridge", teacher: "davit", kind: "stem_project", ref: "paper-bridge", title: t("Paper bridge challenge", "ქაღალდის ხიდის გამოწვევა"), instructions: t("Test at least two versions and record every result.", "გამოცადე მინიმუმ ორი ვერსია და ყველა შედეგი ჩაიწერე."), due: start + 2 * DAY, classId: null, created: at(12) },
      { luka: { status: "submitted", workRef: bridgeProject, response: { workTitle: bridgeTitle }, submittedAt: at(5) }, mariam: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-alice", teacher: "eka", kind: "library", ref: "lib-alice", title: t("Read: Alice's Adventures in Wonderland (chapters 1–3)", "წაიკითხე: Alice's Adventures in Wonderland (1–3 თავები)"), instructions: t("Read online or borrow a copy. Mark the book as finished when you are done.", "წაიკითხე ონლაინ ან აიღე ეგზემპლარი ბიბლიოთეკაში. როცა დაასრულებ, წიგნი მონიშნე როგორც „წავიკითხე“."), due: start + 14 * DAY, classId: "cls-11b", created: at(5) },
      { saba: { status: "assigned" }, elene: { status: "assigned" }, nika: { status: "assigned" }, tamar: { status: "assigned" } },
    );
    addAssignment(
      { id: "asg-reflection", teacher: "nino", kind: "custom", ref: null, title: t("Weekly reflection", "კვირის რეფლექსია"), instructions: t("In 3–5 sentences: what did you learn this week, and what will you practise next?", "3–5 წინადადებით: რა ისწავლე ამ კვირაში და რაში ივარჯიშებ შემდეგ?"), due: at(3), classId: "cls-11a", created: at(10) },
      {
        mariam: { status: "reviewed", response: { text: t("I learned how to use prefix sums to answer range questions quickly. Next I will practise binary search.", "ვისწავლე, როგორ ვუპასუხო შუალედებზე კითხვებს სწრაფად პრეფიქსული ჯამებით. შემდეგ ორობით ძებნაში ვივარჯიშებ.") }, submittedAt: at(4), feedback: t(`Great, specific reflection. Try “${problemTitle("l3-binary-search")}” next.`, `შესანიშნავი, კონკრეტული რეფლექსიაა. შემდეგ სცადე ამოცანა „${problemTitle("l3-binary-search")}“.`), by: "nino" },
        giorgi: { status: "submitted", response: { text: t("I understood conditions better and finished the even/odd problem.", "პირობები უკეთ გავიგე და ლუწი-კენტის ამოცანა დავასრულე.") }, submittedAt: at(3, 18) },
        ana: { status: "assigned" },
        luka: { status: "assigned" },
      },
    );
  })();
}
