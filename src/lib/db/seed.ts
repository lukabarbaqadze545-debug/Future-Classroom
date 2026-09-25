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

/**
 * Demo school: three teachers, eight students, published lessons, quizzes,
 * two finished classroom sessions and school materials — enough history that
 * dashboards and progress pages feel real on first launch.
 *
 * All demo accounts use the password "demo1234". Disable with SEED_DEMO=false.
 */
export const DEMO_PASSWORD = "demo1234";

const DAY = 86_400_000;
const MINUTE = 60_000;

export const DEMO_USERS = [
  { key: "nino", role: "teacher", username: "nino", displayName: "Nino Beridze" },
  { key: "davit", role: "teacher", username: "davit", displayName: "Davit Kapanadze" },
  { key: "eka", role: "teacher", username: "eka", displayName: "Eka Chkheidze" },
  { key: "admin", role: "admin", username: "admin", displayName: "School Administrator" },
  { key: "mariam", role: "student", username: "mariam", displayName: "Mariam L." },
  { key: "giorgi", role: "student", username: "giorgi", displayName: "Giorgi T." },
  { key: "ana", role: "student", username: "ana", displayName: "Ana K." },
  { key: "luka", role: "student", username: "luka", displayName: "Luka M." },
  { key: "saba", role: "student", username: "saba", displayName: "Saba G." },
  { key: "elene", role: "student", username: "elene", displayName: "Elene D." },
  { key: "nika", role: "student", username: "nika", displayName: "Nika J." },
  { key: "tamar", role: "student", username: "tamar", displayName: "Tamar A." },
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

function wrongAnswerFor(activity: Activity, rand: () => number): Answer {
  if (activity.type === "multiple_choice") {
    const wrong = activity.options.filter((o) => !activity.correctOptionIds.includes(o.id));
    return { optionIds: [wrong[Math.floor(rand() * wrong.length)].id], text: "" };
  }
  const commonMistakes: Record<string, string[]> = {
    "x² − 5x + 6 = 0": ["-2, -3", "2, -3", "6, 1"],
    "2x² + 3x − 2 = 0": ["2, -1/2", "-1/2, 2", "1, -2"],
  };
  const key = Object.keys(commonMistakes).find((k) => activity.prompt.includes(k));
  const options = key ? commonMistakes[key] : ["I am not sure"];
  return { optionIds: [], text: options[Math.floor(rand() * options.length)] };
}

function correctAnswerFor(activity: Activity): Answer {
  if (activity.type === "multiple_choice") return { optionIds: activity.correctOptionIds, text: "" };
  return { optionIds: [], text: activity.acceptedAnswers[0] ?? "" };
}

const OPEN_ANSWERS: Record<string, string[]> = {
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
};

export function seedDemoSchool(db: DB): void {
  const start = Date.now();
  const rand = prng(20260925);
  const users = new Map<string, string>();
  const insertUser = db.prepare(
    "INSERT INTO users (id, role, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const insertLesson = db.prepare(
    `INSERT INTO lessons (id, teacher_id, title, subject, grade, topic, duration_min, objective, difficulty, language, status, origin, ai_model, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'template', NULL, ?, ?, ?)`,
  );
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (id, teacher_id, lesson_id, title, subject, grade, topic, status, origin, feedback_mode, questions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 'template', 'full', ?, ?, ?)`,
  );
  const insertEvent = db.prepare(
    `INSERT INTO learning_events (id, user_id, kind, subject, topic, lesson_id, ref_id, correct, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    for (const u of DEMO_USERS) {
      const id = newId();
      users.set(u.key, id);
      insertUser.run(id, u.role, u.username, u.displayName, passwordHash, start - 60 * DAY);
    }

    // ---- Lessons and quizzes ------------------------------------------------
    const owners: Record<string, string> = {
      "quadratic-en": "nino",
      "quadratic-ka": "nino",
      "newton-en": "davit",
      "algorithms-en": "davit",
      "ecosystems-en": "eka",
      "map-reading-en": "eka",
    };
    const lessonIds = new Map<string, string>();
    const quizIds = new Map<string, string>();
    CURATED_LESSONS.forEach((lesson, i) => {
      const id = newId();
      lessonIds.set(lesson.key, id);
      const created = start - (40 - i * 3) * DAY;
      insertLesson.run(
        id,
        users.get(owners[lesson.key])!,
        lesson.title,
        lesson.subject,
        lesson.grade,
        lesson.topic,
        lesson.durationMin,
        lesson.objective,
        lesson.difficulty,
        lesson.language,
        JSON.stringify(lesson.content),
        created,
        created + 2 * DAY,
      );
      if (lesson.key !== "quadratic-ka") {
        const quizId = newId();
        quizIds.set(lesson.key, quizId);
        insertQuiz.run(quizId, users.get(owners[lesson.key])!, id, lesson.quiz.title, lesson.subject, lesson.grade, lesson.topic, JSON.stringify(lesson.quiz.questions), created + DAY, created + DAY);
      }
    });

    const students = DEMO_USERS.filter((u) => u.role === "student").map((u) => u.key);

    // ---- Two finished classroom sessions (Nino, quadratic equations) ----------
    const quadratic = CURATED_LESSONS.find((l) => l.key === "quadratic-en")!;
    seedSession(db, {
      teacherId: users.get("nino")!,
      lessonId: lessonIds.get("quadratic-en")!,
      lesson: quadratic,
      classLabel: "11A",
      startedAt: start - 6 * DAY - 3 * 60 * MINUTE,
      participants: [
        ...students.map((key) => ({ name: DEMO_USERS.find((u) => u.key === key)!.displayName, userId: users.get(key)! })),
        { name: "Irakli", userId: null },
        { name: "Salome", userId: null },
      ],
      skill: 0.7,
      rand,
      insertEvent,
    });
    seedSession(db, {
      teacherId: users.get("nino")!,
      lessonId: lessonIds.get("quadratic-en")!,
      lesson: quadratic,
      classLabel: "11B",
      startedAt: start - 2 * DAY - 5 * 60 * MINUTE,
      participants: ["Levan", "Keti", "Sandro", "Natia", "Dato", "Mariami", "Beka"].map((name) => ({ name, userId: null })),
      skill: 0.6,
      rand,
      insertEvent,
    });

    // ---- Quiz attempts -----------------------------------------------------
    const insertAttempt = db.prepare(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, answers, results, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const attemptQuiz = (lessonKey: string, studentKey: string, skill: number, daysAgo: number) => {
      const lesson = CURATED_LESSONS.find((l) => l.key === lessonKey)!;
      const answers: Record<string, Answer> = {};
      const results = lesson.quiz.questions.map((q: QuizQuestion) => {
        const answer = rand() < skill ? correctQuizAnswer(q) : wrongQuizAnswer(q);
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
    students.forEach((key, i) => attemptQuiz("quadratic-en", key, skill[key], 5 - (i % 3)));
    ["mariam", "giorgi", "ana", "luka"].forEach((key, i) => attemptQuiz("newton-en", key, skill[key], 9 - i));
    ["mariam", "elene"].forEach((key, i) => attemptQuiz("ecosystems-en", key, 0.8, 12 - i));

    // ---- Self-study practice history for the demo student (Mariam) ---------
    const practiceLessons = ["newton-en", "algorithms-en", "quadratic-en", "ecosystems-en"];
    for (let day = 9; day >= 1; day--) {
      if (day === 7) continue; // a realistic gap in the week
      const lesson = CURATED_LESSONS.find((l) => l.key === practiceLessons[day % practiceLessons.length])!;
      const gradable = lesson.content.activities.filter((a) => a.type !== "discussion" && a.type !== "poll" && a.type !== "exit_ticket");
      for (const activity of gradable.slice(0, 2 + (day % 2))) {
        const correct = rand() < 0.75;
        const answer = correct ? correctAnswerFor(activity) : wrongAnswerFor(activity, rand);
        insertEvent.run(newId(), users.get("mariam")!, "practice", lesson.subject, lesson.topic, lessonIds.get(lesson.key)!, lessonIds.get(lesson.key)!, correct ? 1 : 0, JSON.stringify({ prompt: activity.prompt, given: describeAnswer(answer, activity.options), activityId: activity.id }), start - day * DAY + 16 * 60 * MINUTE);
      }
    }
  })();

  seedMaterials(db, users);
}

function correctQuizAnswer(q: QuizQuestion): Answer {
  if (q.type === "numerical") return { optionIds: [], text: String(q.numericAnswer) };
  if (q.type === "short_answer") return { optionIds: [], text: q.acceptedAnswers[0] };
  return { optionIds: q.correctOptionIds, text: "" };
}

function wrongQuizAnswer(q: QuizQuestion): Answer {
  if (q.type === "numerical") return { optionIds: [], text: String((q.numericAnswer ?? 0) + 1) };
  if (q.type === "short_answer") return { optionIds: [], text: "not sure" };
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
        const pool = OPEN_ANSWERS[activity.type];
        answer = { optionIds: [], text: pool[Math.floor(rand() * pool.length)] };
      } else {
        const correct = rand() < input.skill;
        hints = correct ? (rand() < 0.4 ? 1 + Math.floor(rand() * 2) : 0) : 1 + Math.floor(rand() * 3);
        answer = correct ? correctAnswerFor(activity) : wrongAnswerFor(activity, rand);
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

function seedMaterials(db: DB, users: Map<string, string>): void {
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
}
