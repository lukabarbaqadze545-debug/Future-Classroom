import type { DB } from "./index";
import { newId } from "@/lib/domain/ids";
import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import type { CuratedLesson } from "@/lib/ai/templates/types";

/**
 * Owner of built-in content in schools without demo data. It is an account
 * nobody can sign in to (the password hash is not a valid hash).
 */
export const SYSTEM_USER_ID = "system-content";

function ensureSystemUser(db: DB): string {
  db.prepare(
    "INSERT OR IGNORE INTO users (id, role, username, display_name, password_hash, created_at) VALUES (?, 'admin', 'future-classroom', 'Future Classroom', '!', ?)",
  ).run(SYSTEM_USER_ID, Date.now());
  return SYSTEM_USER_ID;
}

/**
 * Installs built-in lessons (and their quizzes) that the database does not
 * have yet, so new starter content reaches existing schools on the next
 * start. Lessons already installed are never touched — teachers work on
 * copies — and nothing is ever deleted.
 */
export function syncBuiltInContent(db: DB, ownerFor?: (lesson: CuratedLesson) => string | undefined): Map<string, { lessonId: string; quizId: string | null }> {
  const installed = new Map<string, { lessonId: string; quizId: string | null }>();
  const rows = db.prepare("SELECT l.id, l.content_key, q.id AS quiz_id FROM lessons l LEFT JOIN quizzes q ON q.content_key = l.content_key WHERE l.content_key IS NOT NULL").all() as {
    id: string;
    content_key: string;
    quiz_id: string | null;
  }[];
  for (const row of rows) installed.set(row.content_key, { lessonId: row.id, quizId: row.quiz_id });

  const legacy = db.prepare("SELECT id FROM lessons WHERE content_key IS NULL AND origin = 'template' AND title = ? AND language = ? ORDER BY created_at LIMIT 1");
  const tagLegacy = db.prepare("UPDATE lessons SET content_key = ?, content_group = ? WHERE id = ?");
  const insertLesson = db.prepare(
    `INSERT INTO lessons (id, teacher_id, title, subject, grade, topic, duration_min, objective, difficulty, language, status, origin, ai_model, content, content_key, content_group, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'template', NULL, ?, ?, ?, ?, ?)`,
  );
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (id, teacher_id, lesson_id, title, subject, grade, topic, status, origin, feedback_mode, questions, content_key, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 'template', 'full', ?, ?, ?, ?)`,
  );

  let systemUser: string | null = null;
  const at = Date.now();
  db.transaction(() => {
    for (const lesson of BUILT_IN_LESSONS) {
      if (installed.has(lesson.key)) continue;
      // Databases seeded before lessons had keys: adopt the matching lesson.
      const old = legacy.get(lesson.title, lesson.language) as { id: string } | undefined;
      if (old) {
        tagLegacy.run(lesson.key, lesson.group, old.id);
        installed.set(lesson.key, { lessonId: old.id, quizId: null });
        continue;
      }
      const owner = ownerFor?.(lesson) ?? (systemUser ??= ensureSystemUser(db));
      const lessonId = newId();
      insertLesson.run(lessonId, owner, lesson.title, lesson.subject, lesson.grade, lesson.topic, lesson.durationMin, lesson.objective, lesson.difficulty, lesson.language, JSON.stringify(lesson.content), lesson.key, lesson.group, at, at);
      let quizId: string | null = null;
      if (lesson.quiz.questions.length) {
        quizId = newId();
        insertQuiz.run(quizId, owner, lessonId, lesson.quiz.title, lesson.subject, lesson.grade, lesson.topic, JSON.stringify(lesson.quiz.questions), lesson.key, at, at);
      }
      installed.set(lesson.key, { lessonId, quizId });
    }
  })();
  return installed;
}
