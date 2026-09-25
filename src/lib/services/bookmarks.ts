import "server-only";
import { getDb, now } from "@/lib/db";

/** Bookmarks work the same way in every lab: (kind, ref) pairs per user. */
export type BookmarkKind = "programming" | "library" | "career" | "experiment" | "simulation" | "critical";

export function isBookmarked(userId: string, kind: BookmarkKind, refId: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND kind = ? AND ref_id = ?").get(userId, kind, refId));
}

export function setBookmark(userId: string, kind: BookmarkKind, refId: string, on: boolean): boolean {
  const db = getDb();
  if (on) db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, kind, ref_id, created_at) VALUES (?, ?, ?, ?)").run(userId, kind, refId, now());
  else db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND kind = ? AND ref_id = ?").run(userId, kind, refId);
  return on;
}

export function listBookmarks(userId: string, kind?: BookmarkKind): { kind: BookmarkKind; refId: string; createdAt: number }[] {
  const rows = kind
    ? getDb().prepare("SELECT kind, ref_id, created_at FROM bookmarks WHERE user_id = ? AND kind = ? ORDER BY created_at DESC").all(userId, kind)
    : getDb().prepare("SELECT kind, ref_id, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  return (rows as { kind: BookmarkKind; ref_id: string; created_at: number }[]).map((r) => ({ kind: r.kind, refId: r.ref_id, createdAt: r.created_at }));
}
