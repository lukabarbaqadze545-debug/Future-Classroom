import "server-only";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";

/** Teacher comments on a student's research project, STEM project, portfolio item, etc. */
export const FEEDBACK_TARGETS = ["research", "stem_project", "stem_record", "portfolio", "ct_attempt", "university"] as const;
export type FeedbackTarget = (typeof FEEDBACK_TARGETS)[number];

export interface FeedbackRecord {
  id: string;
  authorName: string;
  body: string;
  createdAt: number;
}

export function addFeedback(targetKind: FeedbackTarget, targetId: string, authorId: string, body: string): FeedbackRecord {
  const text = body.trim().slice(0, 4000);
  if (!text) throw new ApiError(400, "invalid_input");
  const id = newId();
  getDb().prepare("INSERT INTO feedback (id, target_kind, target_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, targetKind, targetId, authorId, text, now());
  return listFeedback(targetKind, targetId).find((f) => f.id === id)!;
}

export function listFeedback(targetKind: FeedbackTarget, targetId: string): FeedbackRecord[] {
  return getDb()
    .prepare(
      `SELECT f.id, u.display_name AS authorName, f.body, f.created_at AS createdAt FROM feedback f JOIN users u ON u.id = f.author_id
        WHERE f.target_kind = ? AND f.target_id = ? ORDER BY f.created_at`,
    )
    .all(targetKind, targetId) as FeedbackRecord[];
}
