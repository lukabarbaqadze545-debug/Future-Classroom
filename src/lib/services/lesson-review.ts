import "server-only";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { isReviewStatus, nextReviewStatus, REVIEW_STATUSES, type ReviewEntry, type ReviewStatus } from "@/lib/domain/review";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";
import { getLesson, lessonContentHash, type LessonRecord } from "./lessons";

/*
 * Human review of lesson content (Draft → Technically reviewed → Georgian
 * language reviewed → Subject reviewed → Classroom ready). Staff only; the
 * states never reach student pages or student APIs.
 */

/** Staff may read their own lessons and every published lesson; admins may read any lesson. */
export function getLessonForStaff(id: string, user: CurrentUser): LessonRecord {
  if (user.role === "student") throw new ApiError(403, "forbidden");
  const lesson = getLesson(id);
  if (!lesson || (lesson.teacherId !== user.id && lesson.status !== "published" && user.role !== "admin")) throw new ApiError(404, "not_found");
  return lesson;
}

export function reviewHistory(lessonId: string): ReviewEntry[] {
  const rows = getDb()
    .prepare(
      `SELECT r.id, r.status, r.kind, r.note, r.created_at, u.display_name AS user_name
       FROM lesson_reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.lesson_id = ? ORDER BY r.created_at DESC, r.rowid DESC`,
    )
    .all(lessonId) as { id: string; status: string; kind: string; note: string; created_at: number; user_name: string | null }[];
  return rows.map((r) => ({
    id: r.id,
    status: isReviewStatus(r.status) ? r.status : "draft",
    kind: r.kind === "edited" ? "edited" : "review",
    userName: r.user_name,
    note: r.note,
    createdAt: r.created_at,
  }));
}

/**
 * Records one review step. A lesson moves forward one step at a time (the
 * language step applies to Georgian lessons only) or back to draft with a
 * note saying what needs fixing.
 */
export function recordReview(lessonId: string, user: CurrentUser, input: { status: ReviewStatus; note: string }): LessonRecord {
  const lesson = getLessonForStaff(lessonId, user);
  const note = input.note.trim();
  if (input.status === "draft") {
    if (lesson.reviewStatus === "draft") throw new ApiError(409, "conflict");
    if (!note) throw new ApiError(400, "invalid_input");
  } else if (input.status !== nextReviewStatus(lesson.reviewStatus, lesson.language)) {
    throw new ApiError(409, "conflict");
  }
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE lessons SET review_status = ?, reviewed_hash = ? WHERE id = ?").run(input.status, input.status === "draft" ? null : lessonContentHash(lesson), lessonId);
    db.prepare("INSERT INTO lesson_reviews (id, lesson_id, status, kind, user_id, note, created_at) VALUES (?, ?, ?, 'review', ?, ?, ?)").run(newId(), lessonId, input.status, user.id, note, now());
  })();
  return getLesson(lessonId)!;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  subject: Subject;
  grade: number;
  language: ContentLanguage;
  status: ReviewStatus;
  mine: boolean;
  builtIn: boolean;
  lastReviewAt: number | null;
}

/** Lessons a teacher can review: their own and every published lesson, each language version separately. */
export function reviewQueue(user: CurrentUser): { items: ReviewQueueItem[]; counts: Record<ReviewStatus, number> } {
  if (user.role === "student") throw new ApiError(403, "forbidden");
  const rows = getDb()
    .prepare(
      `SELECT l.id, l.title, l.subject, l.grade, l.language, l.review_status, l.teacher_id, l.content_key,
              (SELECT MAX(created_at) FROM lesson_reviews r WHERE r.lesson_id = l.id) AS last_review_at
       FROM lessons l WHERE l.status = 'published' OR l.teacher_id = ? OR ? = 'admin'
       ORDER BY l.subject, l.grade, l.title, l.language`,
    )
    .all(user.id, user.role) as {
    id: string;
    title: string;
    subject: Subject;
    grade: number;
    language: ContentLanguage;
    review_status: string;
    teacher_id: string;
    content_key: string | null;
    last_review_at: number | null;
  }[];
  const counts = Object.fromEntries(REVIEW_STATUSES.map((s) => [s, 0])) as Record<ReviewStatus, number>;
  const items = rows.map((r) => {
    const status = isReviewStatus(r.review_status) ? r.review_status : "draft";
    counts[status] += 1;
    return {
      id: r.id,
      title: r.title,
      subject: r.subject,
      grade: r.grade,
      language: r.language,
      status,
      mine: r.teacher_id === user.id,
      builtIn: r.content_key !== null,
      lastReviewAt: r.last_review_at,
    };
  });
  return { items, counts };
}
