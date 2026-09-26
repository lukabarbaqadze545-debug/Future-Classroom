import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import { sanitizeFileName, validateAttachment } from "@/lib/files/validate";
import type { CurrentUser } from "@/lib/auth/session";
import { uploadDir } from "./materials";
import { canViewWork } from "./classes";

/** Photos and documents students attach to projects, experiments and portfolio items. */
export type AttachmentTarget = "stem_project" | "stem_record" | "portfolio" | "research" | "assignment";

export interface AttachmentRecord {
  id: string;
  ownerId: string;
  targetKind: AttachmentTarget;
  targetId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isImage: boolean;
  createdAt: number;
}

interface Row {
  id: string;
  owner_id: string;
  target_kind: AttachmentTarget;
  target_id: string;
  file_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: number;
}

function toRecord(row: Row): AttachmentRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    targetKind: row.target_kind,
    targetId: row.target_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    isImage: row.mime_type.startsWith("image/"),
    createdAt: row.created_at,
  };
}

function dir() {
  return path.join(uploadDir(), "attachments");
}

export const ATTACHMENT_TARGETS: readonly AttachmentTarget[] = ["stem_project", "stem_record", "portfolio", "research", "assignment"];

const OWNER_QUERIES: Record<Exclude<AttachmentTarget, "assignment">, string> = {
  stem_project: "SELECT user_id FROM stem_projects WHERE id = ?",
  stem_record: "SELECT user_id FROM stem_records WHERE id = ?",
  portfolio: "SELECT user_id FROM portfolio_items WHERE id = ?",
  research: "SELECT user_id FROM research_projects WHERE id = ?",
};

/** Who owns the item a file is attached to (assignment targets are "<assignmentId>:<studentId>"). */
export function attachmentTargetOwner(targetKind: AttachmentTarget, targetId: string): string | null {
  if (targetKind === "assignment") {
    const [assignmentId, studentId] = targetId.split(":");
    const row = getDb().prepare("SELECT student_id FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?").get(assignmentId, studentId ?? "") as
      | { student_id: string }
      | undefined;
    return row?.student_id ?? null;
  }
  const row = getDb().prepare(OWNER_QUERIES[targetKind]).get(targetId) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

/** Students attach files only to their own work. */
export function assertCanAttach(user: CurrentUser, targetKind: AttachmentTarget, targetId: string): void {
  const owner = attachmentTargetOwner(targetKind, targetId);
  if (!owner) throw new ApiError(404, "not_found");
  if (owner !== user.id) throw new ApiError(403, "forbidden");
}

export function createAttachment(owner: CurrentUser, targetKind: AttachmentTarget, targetId: string, fileName: string, bytes: Uint8Array): AttachmentRecord {
  assertCanAttach(owner, targetKind, targetId);
  const { mime, extension } = validateAttachment(fileName, bytes);
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM attachments WHERE target_kind = ? AND target_id = ?").get(targetKind, targetId) as { n: number };
  if (count.n >= 12) throw new ApiError(400, "invalid_input", "Too many files on this item.");
  const id = newId();
  const storedName = `${id}.${extension}`;
  fs.mkdirSync(dir(), { recursive: true });
  fs.writeFileSync(path.join(dir(), storedName), bytes, { mode: 0o640 });
  getDb()
    .prepare(
      "INSERT INTO attachments (id, owner_id, target_kind, target_id, file_name, stored_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, owner.id, targetKind, targetId, sanitizeFileName(fileName), storedName, mime, bytes.byteLength, now());
  return listAttachments(targetKind, targetId).find((a) => a.id === id)!;
}

export function listAttachments(targetKind: AttachmentTarget, targetId: string): AttachmentRecord[] {
  return (getDb().prepare("SELECT * FROM attachments WHERE target_kind = ? AND target_id = ? ORDER BY created_at").all(targetKind, targetId) as Row[]).map(toRecord);
}

/** Owners and staff may open an attachment; other students may not. */
export function getAttachmentFile(id: string, user: CurrentUser): { path: string; record: AttachmentRecord } {
  const row = getDb().prepare("SELECT * FROM attachments WHERE id = ?").get(id) as Row | undefined;
  if (!row) throw new ApiError(404, "not_found");
  // Students see their own files; staff see the files of students they teach.
  if (!canViewWork(user, row.owner_id)) throw new ApiError(404, "not_found");
  return { path: path.join(dir(), path.basename(row.stored_name)), record: toRecord(row) };
}

export function deleteAttachment(id: string, user: CurrentUser): void {
  const { path: file, record } = getAttachmentFile(id, user);
  if (record.ownerId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM attachments WHERE id = ?").run(id);
  fs.rmSync(file, { force: true });
}
