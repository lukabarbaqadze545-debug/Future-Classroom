import fs from "node:fs";
import path from "node:path";
import type { DB } from "./index";
import { hashPassword } from "@/lib/auth/password";
import { hashToken, newId, newToken } from "@/lib/domain/ids";
import { gradeActivity, gradeQuizQuestion, describeAnswer } from "@/lib/domain/grading";
import type { Activity, Answer, LessonContent, QuizQuestion } from "@/lib/domain/schemas";
import { CURATED_LESSONS, type CuratedLesson } from "@/lib/ai/templates";
import { chunkPages } from "@/lib/files/chunk";
import { SEED_MATERIALS } from "./seed-materials";
import { seedLabs } from "./seed-labs";
import { syncBuiltInContent } from "./builtin";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";

/**
 * Demo school: six teachers, eight students, published lessons, quizzes,
 * two finished classroom sessions and school materials — enough history that
 * dashboards and progress pages feel real on first launch.
 *
 * All demo accounts use the password "demo1234". Disable with SEED_DEMO=false.
 * What people "typed" (answers, projects, notes) is in the school's language.
 */
export const DEMO_PASSWORD = "demo1234";

const DAY = 86_400_000;
const MINUTE = 60_000;

export const DEMO_USERS = [
  { key: "nino", role: "teacher", username: "nino", displayName: "ნინო ბერიძე" },
  { key: "davit", role: "teacher", username: "davit", displayName: "დავით კაპანაძე" },
  { key: "eka", role: "teacher", username: "eka", displayName: "ეკა ჩხეიძე" },
  { key: "manana", role: "teacher", username: "manana", displayName: "მანანა გელაშვილი" },
  { key: "irakli", role: "teacher", username: "irakli", displayName: "ირაკლი წიკლაური" },
  { key: "natia", role: "teacher", username: "natia", displayName: "ნატია აბაშიძე" },
  { key: "admin", role: "admin", username: "admin", displayName: "სკოლის ადმინისტრატორი" },
  { key: "mariam", role: "student", username: "mariam", displayName: "მარიამ ლ." },
  { key: "giorgi", role: "student", username: "giorgi", displayName: "გიორგი ტ." },
  { key: "ana", role: "student", username: "ana", displayName: "ანა კ." },
  { key: "luka", role: "student", username: "luka", displayName: "ლუკა მ." },
  { key: "saba", role: "student", username: "saba", displayName: "საბა გ." },
  { key: "elene", role: "student", username: "elene", displayName: "ელენე დ." },
  { key: "nika", role: "student", username: "nika", displayName: "ნიკა ჯ." },
  { key: "tamar", role: "student", username: "tamar", displayName: "თამარ ა." },
] as const;

/** Deterministic PRNG (mulberry32) so the demo data is the same on every install. */
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

/** The demo school's language: the one it teaches in by default (DEFAULT_LANGUAGE), Georgian unless set to English. */
export function demoLanguage(): ContentLanguage {
  return process.env.DEFAULT_LANGUAGE?.trim() === "en" ? "en" : "ka";
}

const NOT_SURE: Record<ContentLanguage, string> = { en: "I am not sure", ka: "არ ვიცი" };

function wrongAnswerFor(activity: Activity, rand: () => number, language: ContentLanguage): Answer {
  if (activity.type === "multiple_choice") {
    const wrong = activity.options.filter((o) => !activity.correctOptionIds.includes(o.id));
    return { optionIds: [wrong[Math.floor(rand() * wrong.length)].id], text: "" };
  }
  const commonMistakes: Record<string, string[]> = {
    "x² − 5x + 6 = 0": ["-2, -3", "2, -3", "6, 1"],
    "2x² + 3x − 2 = 0": ["2, -1/2", "-1/2, 2", "1, -2"],
  };
  const key = Object.keys(commonMistakes).find((k) => activity.prompt.includes(k));
  const options = key ? commonMistakes[key] : [NOT_SURE[language]];
  return { optionIds: [], text: options[Math.floor(rand() * options.length)] };
}

function correctAnswerFor(activity: Activity): Answer {
  if (activity.type === "multiple_choice") return { optionIds: activity.correctOptionIds, text: "" };
  return { optionIds: [], text: activity.acceptedAnswers[0] ?? "" };
}

const OPEN_ANSWERS: Record<ContentLanguage, Record<string, string[]>> = {
  en: {
    discussion: [
      "(−2)² is 4, not −4, so x = −2 does not work. The graph y = x² + 4 is always above the x-axis.",
      "A square is never negative, so x² + 4 is at least 4.",
      "I would show them that (−2)·(−2) = 4.",
    ],
    exit_ticket: [
      "When the numbers do not factor nicely, the formula always works.",
      "If I can't find two numbers for the product and sum quickly, I use the formula.",
      "The formula is safer with decimals or big numbers.",
    ],
  },
  ka: {
    discussion: [
      "(−2)² არის 4 და არა −4, ამიტომ x = −2 არ გამოდგება. y = x² + 4 გრაფიკი ყოველთვის x ღერძის ზემოთაა.",
      "კვადრატი უარყოფითი არასოდეს არის, ამიტომ x² + 4 სულ მცირე 4-ია.",
      "ვაჩვენებდი, რომ (−2)·(−2) = 4.",
    ],
    exit_ticket: [
      "როცა რიცხვები მოხერხებულად არ იშლება, ფორმულა ყოველთვის მუშაობს.",
      "თუ ნამრავლისა და ჯამისთვის ორ რიცხვს სწრაფად ვერ ვპოულობ, ფორმულას ვიყენებ.",
      "ათწილადებთან ან დიდ რიცხვებთან ფორმულა უფრო საიმედოა.",
    ],
  },
};

const GUESTS: Record<ContentLanguage, string[]> = {
  en: ["Levan", "Keti", "Sandro", "Natia", "Dato", "Mariami", "Beka"],
  ka: ["ლევანი", "ქეთი", "სანდრო", "ნატია", "დათო", "მარიამი", "ბექა"],
};

export function seedDemoSchool(db: DB, language: ContentLanguage = demoLanguage()): void {
  const version = (group: string) => `${group}-${language}`;
  const classLabel = (en: string, ka: string) => (language === "ka" ? ka : en);
  const start = Date.now();
  const rand = prng(20260925);
  const users = new Map<string, string>();
  const insertUser = db.prepare(
    "INSERT INTO users (id, role, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const insertEvent = db.prepare(
    `INSERT INTO learning_events (id, user_id, kind, subject, topic, lesson_id, ref_id, correct, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    for (const u of DEMO_USERS) {
      const id = newId();
      users.set(u.key, id);
      insertUser.run(id, u.role, u.username, u.displayName, passwordHash, start - 60 * DAY);
    }

    // ---- Built-in lessons and quizzes, owned by the demo teacher of each subject
    const teacherFor: Partial<Record<Subject, string>> = {
      mathematics: "nino",
      economics: "nino",
      critical_thinking: "nino",
      research: "nino",
      entrepreneurship: "nino",
      physics: "davit",
      computer_science: "davit",
      engineering: "davit",
      chemistry: "eka",
      biology: "eka",
      geography: "eka",
      health: "eka",
      georgian: "manana",
      arts: "manana",
      history: "irakli",
      civics: "irakli",
      english: "natia",
      career: "natia",
    };
    const installed = syncBuiltInContent(db, (lesson) => users.get(teacherFor[lesson.subject] ?? "nino"));
    const lessonIds = new Map([...installed].map(([key, v]) => [key, v.lessonId]));
    const quizIds = new Map([...installed].filter(([, v]) => v.quizId).map(([key, v]) => [key, v.quizId!]));

    const students = DEMO_USERS.filter((u) => u.role === "student").map((u) => u.key);

    // ---- Two finished classroom sessions (Nino, quadratic equations) ----------
    const quadratic = CURATED_LESSONS.find((l) => l.key === version("quadratic"))!;
    seedSession(db, {
      teacherId: users.get("nino")!,
      lessonId: lessonIds.get(quadratic.key)!,
      lesson: quadratic,
      classLabel: classLabel("11A", "11ა"),
      startedAt: start - 6 * DAY - 3 * 60 * MINUTE,
      participants: [
        ...students.map((key) => ({ name: DEMO_USERS.find((u) => u.key === key)!.displayName, userId: users.get(key)! })),
        { name: classLabel("Irakli", "ირაკლი"), userId: null },
        { name: classLabel("Salome", "სალომე"), userId: null },
      ],
      skill: 0.7,
      rand,
      insertEvent,
      language,
    });
    seedSession(db, {
      teacherId: users.get("nino")!,
      lessonId: lessonIds.get(quadratic.key)!,
      lesson: quadratic,
      classLabel: classLabel("11B", "11ბ"),
      startedAt: start - 2 * DAY - 5 * 60 * MINUTE,
      participants: GUESTS[language].map((name) => ({ name, userId: null })),
      skill: 0.6,
      rand,
      insertEvent,
      language,
    });

    // ---- Quiz attempts -----------------------------------------------------
    const insertAttempt = db.prepare(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, answers, results, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const attemptQuiz = (group: string, studentKey: string, skill: number, daysAgo: number) => {
      const lessonKey = version(group);
      const lesson = CURATED_LESSONS.find((l) => l.key === lessonKey)!;
      const answers: Record<string, Answer> = {};
      const results = lesson.quiz.questions.map((q: QuizQuestion) => {
        const answer = rand() < skill ? correctQuizAnswer(q) : wrongQuizAnswer(q, language);
        answers[q.id] = answer;
        const correct = gradeQuizQuestion(q, answer);
        return { questionId: q.id, correct, points: q.points, earned: correct ? q.points : 0, prompt: q.prompt, given: describeAnswer(answer, q.options) };
      });
      const submittedAt = start - daysAgo * DAY + Math.floor(rand() * 5 * 60) * MINUTE;
      const score = results.reduce((s, r) => s + r.earned, 0);
      const max = results.reduce((s, r) => s + r.points, 0);
      insertAttempt.run(
        newId(),
        quizIds.get(lessonKey)!,
        users.get(studentKey)!,
        JSON.stringify(answers),
        JSON.stringify(results.map(({ questionId, correct, points, earned }) => ({ questionId, correct, points, earned }))),
        score,
        max,
        submittedAt,
      );
      for (const r of results) {
        insertEvent.run(newId(), users.get(studentKey)!, "quiz", lesson.subject, lesson.topic, lessonIds.get(lessonKey)!, quizIds.get(lessonKey)!, r.correct ? 1 : 0, JSON.stringify({ prompt: r.prompt, given: r.given, quizTitle: lesson.quiz.title }), submittedAt);
      }
    };
    // Skill levels vary per student so class results look realistic.
    const skill: Record<string, number> = { mariam: 0.85, giorgi: 0.7, ana: 0.8, luka: 0.55, saba: 0.6, elene: 0.75, nika: 0.5, tamar: 0.65 };
    students.forEach((key, i) => attemptQuiz("quadratic", key, skill[key], 5 - (i % 3)));
    ["mariam", "giorgi", "ana", "luka"].forEach((key, i) => attemptQuiz("newton", key, skill[key], 9 - i));
    ["mariam", "elene"].forEach((key, i) => attemptQuiz("ecosystems", key, 0.8, 12 - i));

    // ---- Self-study practice history for the demo student (Mariam) ---------
    const practiceLessons = ["newton", "algorithms", "quadratic", "ecosystems"].map(version);
    for (let day = 9; day >= 1; day--) {
      if (day === 7) continue; // a realistic gap in the week
      const lesson = CURATED_LESSONS.find((l) => l.key === practiceLessons[day % practiceLessons.length])!;
      const gradable = lesson.content.activities.filter((a) => a.type !== "discussion" && a.type !== "poll" && a.type !== "exit_ticket");
      for (const activity of gradable.slice(0, 2 + (day % 2))) {
        const correct = rand() < 0.75;
        const answer = correct ? correctAnswerFor(activity) : wrongAnswerFor(activity, rand, language);
        insertEvent.run(newId(), users.get("mariam")!, "practice", lesson.subject, lesson.topic, lessonIds.get(lesson.key)!, lessonIds.get(lesson.key)!, correct ? 1 : 0, JSON.stringify({ prompt: activity.prompt, given: describeAnswer(answer, activity.options), activityId: activity.id }), start - day * DAY + 16 * 60 * MINUTE);
      }
    }
  })();

  const materialIds = seedMaterials(db, users);
  seedLabs(db, users, materialIds, start, language);
}

function correctQuizAnswer(q: QuizQuestion): Answer {
  if (q.type === "numerical") return { optionIds: [], text: String(q.numericAnswer) };
  if (q.type === "short_answer") return { optionIds: [], text: q.acceptedAnswers[0] };
  return { optionIds: q.correctOptionIds, text: "" };
}

function wrongQuizAnswer(q: QuizQuestion, language: ContentLanguage): Answer {
  if (q.type === "numerical") return { optionIds: [], text: String((q.numericAnswer ?? 0) + 1) };
  if (q.type === "short_answer") return { optionIds: [], text: NOT_SURE[language] };
  const wrong = q.options.find((o) => !q.correctOptionIds.includes(o.id));
  return { optionIds: wrong ? [wrong.id] : [], text: "" };
}

function seedSession(
  db: DB,
  input: {
    teacherId: string;
    lessonId: string;
    lesson: CuratedLesson;
    classLabel: string;
    startedAt: number;
    participants: { name: string; userId: string | null }[];
    skill: number;
    rand: () => number;
    insertEvent: { run: (...params: unknown[]) => unknown };
    language: ContentLanguage;
  },
): void {
  const { lesson, rand } = input;
  const sessionId = newId();
  const content: LessonContent = lesson.content;
  const activities = content.activities;
  const launchedCount = activities.length;
  const endedAt = input.startedAt + 42 * MINUTE;
  db.prepare(
    `INSERT INTO classroom_sessions (id, teacher_id, lesson_id, join_code, title, subject, grade, class_label, status, paused, current_activity_id, version, created_at, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ended', 0, NULL, 1, ?, ?, ?)`,
  ).run(sessionId, input.teacherId, input.lessonId, `FC-${1000 + Math.floor(rand() * 8999)}`, lesson.title, lesson.subject, lesson.grade, input.classLabel, input.startedAt - 5 * MINUTE, input.startedAt, endedAt);

  const participantIds = input.participants.map((p, i) => {
    const id = newId();
    db.prepare(
      `INSERT INTO session_participants (id, session_id, user_id, display_name, token_hash, joined_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, sessionId, p.userId, p.name, hashToken(newToken()), input.startedAt - (5 - (i % 4)) * MINUTE, endedAt);
    return id;
  });

  activities.forEach((activity, position) => {
    const activityId = newId();
    const launchedAt = input.startedAt + position * 6 * MINUTE;
    db.prepare(
      `INSERT INTO session_activities (id, session_id, position, data, state, revealed, launched_at, closed_at) VALUES (?, ?, ?, ?, 'closed', 1, ?, ?)`,
    ).run(activityId, sessionId, position, JSON.stringify(activity), launchedAt, launchedAt + 5 * MINUTE);
    if (position >= launchedCount) return;

    input.participants.forEach((participant, i) => {
      if (rand() < 0.08) return; // a few students miss an activity
      const participantId = participantIds[i];
      let answer: Answer;
      let hints = 0;
      if (activity.type === "poll") {
        answer = { optionIds: [activity.options[Math.min(activity.options.length - 1, Math.floor(rand() * activity.options.length))].id], text: "" };
      } else if (activity.type === "discussion" || activity.type === "exit_ticket") {
        const pool = OPEN_ANSWERS[input.language][activity.type];
        answer = { optionIds: [], text: pool[Math.floor(rand() * pool.length)] };
      } else {
        const correct = rand() < input.skill;
        hints = correct ? (rand() < 0.4 ? 1 + Math.floor(rand() * 2) : 0) : 1 + Math.floor(rand() * 3);
        answer = correct ? correctAnswerFor(activity) : wrongAnswerFor(activity, rand, input.language);
      }
      const isCorrect = gradeActivity(activity, answer);
      const submittedAt = launchedAt + Math.floor(30 + rand() * 240) * 1000;
      if (hints > 0) {
        db.prepare("INSERT INTO activity_progress (session_activity_id, participant_id, hints_used) VALUES (?, ?, ?)").run(activityId, participantId, hints);
      }
      db.prepare(
        `INSERT INTO responses (id, session_activity_id, participant_id, answer, is_correct, attempts, hints_used, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(newId(), activityId, participantId, JSON.stringify(answer), isCorrect === null ? null : isCorrect ? 1 : 0, 1 + (isCorrect === false ? Math.floor(rand() * 2) : 0), hints, submittedAt);
      const userId = input.participants[i].userId;
      if (userId && isCorrect !== null) {
        input.insertEvent.run(newId(), userId, "session", lesson.subject, lesson.title, input.lessonId, sessionId, isCorrect ? 1 : 0, JSON.stringify({ prompt: activity.prompt, given: describeAnswer(answer, activity.options), activityId }), submittedAt);
      }
    });
  });
}

function seedMaterials(db: DB, users: Map<string, string>): Map<string, string> {
  const ids = new Map<string, string>();
  const dir = uploadDir();
  fs.mkdirSync(dir, { recursive: true });
  const insertMaterial = db.prepare(
    `INSERT INTO materials (id, owner_id, title, subject, grade, author, tags, visibility, file_name, stored_name, mime_type, size_bytes, text_status, page_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'text/markdown; charset=utf-8', ?, 'indexed', NULL, ?)`,
  );
  const insertChunk = db.prepare("INSERT INTO material_chunks (material_id, position, page, content) VALUES (?, ?, ?, ?)");
  db.transaction(() => {
    for (const material of SEED_MATERIALS) {
      const id = newId();
      ids.set(material.key, id);
      const storedName = `${id}.md`;
      const bytes = Buffer.from(material.text, "utf-8");
      fs.writeFileSync(path.join(dir, storedName), bytes);
      insertMaterial.run(
        id,
        users.get(material.owner)!,
        material.title,
        material.subject,
        material.grade,
        material.author,
        JSON.stringify(material.tags),
        material.visibility,
        material.fileName,
        storedName,
        bytes.byteLength,
        Date.now() - material.daysAgo * DAY,
      );
      chunkPages([{ page: null, text: material.text }]).forEach((chunk, i) => insertChunk.run(id, i, chunk.page, chunk.content));
    }
  })();
  return ids;
}
