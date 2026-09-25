import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import {
  lessonContentSchema,
  type LessonContent,
  type LessonMeta,
} from "@/lib/domain/schemas";
import type { Subject } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

export type LessonStatus = "draft" | "published";
export type ContentOrigin = "ai" | "template" | "manual";

export interface LessonRecord extends LessonMeta {
  id: string;
  teacherId: string;
  teacherName: string;
  status: LessonStatus;
  origin: ContentOrigin;
  aiModel: string | null;
  content: LessonContent;
  materialIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type LessonSummary = Omit<LessonRecord, "content" | "materialIds"> & {
  activityCount: number;
  sectionCount: number;
};

interface LessonRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  subject: Subject;
  grade: number;
  topic: string;
  duration_min: number;
  objective: string;
  difficulty: LessonMeta["difficulty"];
  language: LessonMeta["language"];
  status: LessonStatus;
  origin: ContentOrigin;
  ai_model: string | null;
  content: string;
  created_at: number;
  updated_at: number;
}

const SELECT = `SELECT l.*, u.display_name AS teacher_name FROM lessons l JOIN users u ON u.id = l.teacher_id`;

function toSummary(row: LessonRow): LessonSummary {
  const content = parseContent(row.content);
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    title: row.title,
    subject: row.subject,
    grade: row.grade,
    topic: row.topic,
    durationMin: row.duration_min,
    objective: row.objective,
    difficulty: row.difficulty,
    language: row.language,
    status: row.status,
    origin: row.origin,
    aiModel: row.ai_model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activityCount: content.activities.length,
    sectionCount: content.sections.length,
  };
}

function parseContent(raw: string): LessonContent {
  const parsed = lessonContentSchema.safeParse(parseJson(raw, {}));
  return parsed.success ? parsed.data : lessonContentSchema.parse({});
}

function toRecord(row: LessonRow): LessonRecord {
  const { activityCount: _a, sectionCount: _s, ...summary } = toSummary(row);
  void _a;
  void _s;
  const materialIds = (
    getDb().prepare("SELECT material_id FROM lesson_materials WHERE lesson_id = ?").all(row.id) as {
      material_id: string;
    }[]
  ).map((r) => r.material_id);
  return { ...summary, content: parseContent(row.content), materialIds };
}

export function createLesson(input: {
  teacherId: string;
  meta: LessonMeta;
  content: LessonContent;
  origin: ContentOrigin;
  aiModel?: string | null;
  status?: LessonStatus;
  id?: string;
  createdAt?: number;
}): LessonRecord {
  const id = input.id ?? newId();
  const timestamp = input.createdAt ?? now();
  const content = lessonContentSchema.parse(input.content);
  getDb()
    .prepare(
      `INSERT INTO lessons (id, teacher_id, title, subject, grade, topic, duration_min, objective, difficulty, language,
                            status, origin, ai_model, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.teacherId,
      input.meta.title,
      input.meta.subject,
      input.meta.grade,
      input.meta.topic,
      input.meta.durationMin,
      input.meta.objective,
      input.meta.difficulty,
      input.meta.language,
      input.status ?? "draft",
      input.origin,
      input.aiModel ?? null,
      JSON.stringify(content),
      timestamp,
      timestamp,
    );
  return getLessonOrThrow(id);
}

export function getLesson(id: string): LessonRecord | null {
  const row = getDb().prepare(`${SELECT} WHERE l.id = ?`).get(id) as LessonRow | undefined;
  return row ? toRecord(row) : null;
}

function getLessonOrThrow(id: string): LessonRecord {
  const lesson = getLesson(id);
  if (!lesson) throw new ApiError(404, "not_found");
  return lesson;
}

/** Teachers may edit their own lessons; admins may edit any. */
export function getLessonForEditor(id: string, user: CurrentUser): LessonRecord {
  const lesson = getLessonOrThrow(id);
  if (lesson.teacherId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return lesson;
}

export function listLessonsForTeacher(teacherId: string): LessonSummary[] {
  return (getDb().prepare(`${SELECT} WHERE l.teacher_id = ? ORDER BY l.updated_at DESC`).all(teacherId) as LessonRow[]).map(
    toSummary,
  );
}

export function listPublishedLessons(filter?: { subject?: Subject }): LessonSummary[] {
  const rows = filter?.subject
    ? (getDb()
        .prepare(`${SELECT} WHERE l.status = 'published' AND l.subject = ? ORDER BY l.grade, l.title`)
        .all(filter.subject) as LessonRow[])
    : (getDb().prepare(`${SELECT} WHERE l.status = 'published' ORDER BY l.subject, l.grade, l.title`).all() as LessonRow[]);
  return rows.map(toSummary);
}

/** Students only ever see published lessons. */
export function getPublishedLesson(id: string): LessonRecord {
  const lesson = getLessonOrThrow(id);
  if (lesson.status !== "published") throw new ApiError(404, "not_found");
  return lesson;
}

export function updateLesson(
  id: string,
  user: CurrentUser,
  update: { meta: LessonMeta; content: LessonContent; materialIds?: string[] },
): LessonRecord {
  getLessonForEditor(id, user);
  const content = lessonContentSchema.parse(update.content);
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `UPDATE lessons SET title = ?, subject = ?, grade = ?, topic = ?, duration_min = ?, objective = ?, difficulty = ?,
                          language = ?, content = ?, updated_at = ? WHERE id = ?`,
    ).run(
      update.meta.title,
      update.meta.subject,
      update.meta.grade,
      update.meta.topic,
      update.meta.durationMin,
      update.meta.objective,
      update.meta.difficulty,
      update.meta.language,
      JSON.stringify(content),
      now(),
      id,
    );
    if (update.materialIds) setLessonMaterials(id, update.materialIds);
  })();
  return getLessonOrThrow(id);
}

export function setLessonMaterials(lessonId: string, materialIds: string[]): void {
  const db = getDb();
  db.prepare("DELETE FROM lesson_materials WHERE lesson_id = ?").run(lessonId);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO lesson_materials (lesson_id, material_id) SELECT ?, id FROM materials WHERE id = ?",
  );
  for (const materialId of new Set(materialIds)) insert.run(lessonId, materialId);
}

/** Links one more material to a lesson (keeps existing links). */
export function addLessonMaterial(lessonId: string, user: CurrentUser, materialId: string): void {
  getLessonForEditor(lessonId, user);
  getDb()
    .prepare("INSERT OR IGNORE INTO lesson_materials (lesson_id, material_id) SELECT ?, id FROM materials WHERE id = ?")
    .run(lessonId, materialId);
}

export function setLessonStatus(id: string, user: CurrentUser, status: LessonStatus): LessonRecord {
  getLessonForEditor(id, user);
  getDb().prepare("UPDATE lessons SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), id);
  return getLessonOrThrow(id);
}

export function deleteLesson(id: string, user: CurrentUser): void {
  getLessonForEditor(id, user);
  getDb().prepare("DELETE FROM lessons WHERE id = ?").run(id);
}

export function duplicateLesson(id: string, user: CurrentUser): LessonRecord {
  const source = getLessonOrThrow(id);
  if (source.status !== "published" && source.teacherId !== user.id && user.role !== "admin") {
    throw new ApiError(403, "forbidden");
  }
  const { title, subject, grade, topic, durationMin, objective, difficulty, language } = source;
  return createLesson({
    teacherId: user.id,
    meta: { title: `${title} (copy)`, subject, grade, topic, durationMin, objective, difficulty, language },
    content: source.content,
    origin: source.origin,
    aiModel: source.aiModel,
  });
}
