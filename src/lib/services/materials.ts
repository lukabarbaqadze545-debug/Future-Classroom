import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { materialMetaSchema, type MaterialMeta } from "@/lib/domain/schemas";
import type { MaterialVisibility, Subject } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { extractText, type ExtractedPage } from "@/lib/files/extract";
import { chunkPages } from "@/lib/files/chunk";
import { sanitizeFileName, validateUpload } from "@/lib/files/validate";
import { buildFtsQuery, relevanceBoost } from "@/lib/files/search-query";

export interface MaterialRecord extends MaterialMeta {
  id: string;
  ownerId: string;
  ownerName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  textStatus: "indexed" | "no_text" | "failed";
  pageCount: number | null;
  chunkCount: number;
  createdAt: number;
}

interface MaterialRow {
  id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  subject: Subject;
  grade: number | null;
  author: string;
  tags: string;
  visibility: MaterialVisibility;
  file_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  text_status: MaterialRecord["textStatus"];
  page_count: number | null;
  chunk_count: number;
  created_at: number;
}

const SELECT = `SELECT m.*, u.display_name AS owner_name,
  (SELECT COUNT(*) FROM material_chunks c WHERE c.material_id = m.id) AS chunk_count
  FROM materials m JOIN users u ON u.id = m.owner_id`;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

function toRecord(row: MaterialRow): MaterialRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    title: row.title,
    subject: row.subject,
    grade: row.grade,
    author: row.author,
    tags: parseJson<string[]>(row.tags, []),
    visibility: row.visibility,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    textStatus: row.text_status,
    pageCount: row.page_count,
    chunkCount: row.chunk_count,
    createdAt: row.created_at,
  };
}

/**
 * Visibility rules: students see materials marked "students"; teachers see
 * everything shared with teachers or students plus their own private files.
 */
function visibilityClause(user: CurrentUser): { sql: string; params: string[] } {
  if (user.role === "admin") return { sql: "1 = 1", params: [] };
  if (user.role === "teacher") return { sql: "(m.visibility IN ('teachers','students') OR m.owner_id = ?)", params: [user.id] };
  return { sql: "m.visibility = 'students'", params: [] };
}

export function canView(material: MaterialRecord, user: CurrentUser): boolean {
  if (user.role === "admin" || material.ownerId === user.id) return true;
  if (user.role === "teacher") return material.visibility !== "private";
  return material.visibility === "students";
}

export function listMaterials(
  user: CurrentUser,
  filter: { subject?: Subject; grade?: number; q?: string } = {},
): MaterialRecord[] {
  const vis = visibilityClause(user);
  const where = [vis.sql];
  const params: (string | number)[] = [...vis.params];
  if (filter.subject) {
    where.push("m.subject = ?");
    params.push(filter.subject);
  }
  if (filter.grade) {
    where.push("(m.grade = ? OR m.grade IS NULL)");
    params.push(filter.grade);
  }
  if (filter.q?.trim()) {
    const like = `%${filter.q.trim().toLowerCase().replace(/[%_]/g, "")}%`;
    const fts = buildFtsQuery(filter.q);
    where.push(
      `(LOWER(m.title) LIKE ? OR LOWER(m.tags) LIKE ? OR LOWER(m.author) LIKE ?${
        fts ? " OR m.id IN (SELECT c.material_id FROM material_chunks_fts f JOIN material_chunks c ON c.id = f.rowid WHERE material_chunks_fts MATCH ?)" : ""
      })`,
    );
    params.push(like, like, like);
    if (fts) params.push(fts);
  }
  const rows = getDb()
    .prepare(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY m.created_at DESC`)
    .all(...params) as MaterialRow[];
  return rows.map(toRecord);
}

export function getMaterial(id: string, user: CurrentUser): MaterialRecord {
  const row = getDb().prepare(`${SELECT} WHERE m.id = ?`).get(id) as MaterialRow | undefined;
  if (!row) throw new ApiError(404, "not_found");
  const record = toRecord(row);
  if (!canView(record, user)) throw new ApiError(404, "not_found");
  return record;
}

export function getMaterialPreview(id: string, user: CurrentUser, limit = 6): { chunks: { page: number | null; content: string }[] } {
  getMaterial(id, user);
  const chunks = getDb()
    .prepare("SELECT page, content FROM material_chunks WHERE material_id = ? ORDER BY position LIMIT ?")
    .all(id, limit) as { page: number | null; content: string }[];
  return { chunks };
}

export function getMaterialFile(id: string, user: CurrentUser): { path: string; record: MaterialRecord } {
  const record = getMaterial(id, user);
  const row = getDb().prepare("SELECT stored_name FROM materials WHERE id = ?").get(id) as { stored_name: string };
  // stored_name is generated by the server, but basename() keeps reads inside the upload folder regardless.
  return { path: path.join(uploadDir(), path.basename(row.stored_name)), record };
}

function indexChunks(materialId: string, pages: ExtractedPage[]): number {
  const db = getDb();
  const chunks = chunkPages(pages);
  const insert = db.prepare("INSERT INTO material_chunks (material_id, position, page, content) VALUES (?, ?, ?, ?)");
  db.transaction(() => {
    db.prepare("DELETE FROM material_chunks WHERE material_id = ?").run(materialId);
    chunks.forEach((chunk, i) => insert.run(materialId, i, chunk.page, chunk.content));
  })();
  return chunks.length;
}

/** Stores a validated upload outside the public folder and indexes its text. */
export async function createMaterial(input: {
  owner: CurrentUser;
  meta: MaterialMeta;
  fileName: string;
  bytes: Uint8Array;
  id?: string;
  createdAt?: number;
}): Promise<MaterialRecord> {
  const meta = materialMetaSchema.parse(input.meta);
  const { kind, mime, extension } = validateUpload(input.fileName, input.bytes);
  const id = input.id ?? newId();
  const storedName = `${id}.${extension}`;
  fs.mkdirSync(uploadDir(), { recursive: true });
  fs.writeFileSync(path.join(uploadDir(), storedName), input.bytes, { mode: 0o640 });

  let textStatus: MaterialRecord["textStatus"] = "no_text";
  let pageCount: number | null = null;
  let pages: ExtractedPage[] = [];
  try {
    const extracted = await extractText(kind, input.bytes);
    pages = extracted.pages;
    pageCount = extracted.pageCount;
    textStatus = pages.some((p) => p.text.trim().length > 20) ? "indexed" : "no_text";
  } catch (error) {
    console.warn("[materials] text extraction failed", error instanceof Error ? error.message : error);
    textStatus = "failed";
  }

  getDb()
    .prepare(
      `INSERT INTO materials (id, owner_id, title, subject, grade, author, tags, visibility, file_name, stored_name, mime_type, size_bytes, text_status, page_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.owner.id,
      meta.title,
      meta.subject,
      meta.grade,
      meta.author,
      JSON.stringify(meta.tags),
      meta.visibility,
      sanitizeFileName(input.fileName),
      storedName,
      mime,
      input.bytes.byteLength,
      textStatus,
      pageCount,
      input.createdAt ?? now(),
    );
  if (textStatus === "indexed") indexChunks(id, pages);
  return getMaterial(id, input.owner);
}

export function updateMaterial(id: string, user: CurrentUser, meta: MaterialMeta): MaterialRecord {
  const record = getMaterial(id, user);
  if (record.ownerId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  const parsed = materialMetaSchema.parse(meta);
  getDb()
    .prepare("UPDATE materials SET title = ?, subject = ?, grade = ?, author = ?, tags = ?, visibility = ? WHERE id = ?")
    .run(parsed.title, parsed.subject, parsed.grade, parsed.author, JSON.stringify(parsed.tags), parsed.visibility, id);
  return getMaterial(id, user);
}

export function deleteMaterial(id: string, user: CurrentUser): void {
  const { path: filePath, record } = getMaterialFile(id, user);
  if (record.ownerId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM materials WHERE id = ?").run(id);
  fs.rmSync(filePath, { force: true });
}

export interface RetrievedPassage {
  materialId: string;
  materialTitle: string;
  subject: Subject;
  page: number | null;
  content: string;
  score: number;
}

/**
 * Keyword retrieval (SQLite FTS5 + BM25) over materials the user may see.
 * This is real retrieval, not a simulation; semantic (embedding) search can
 * later be added behind the same function using `material_chunks.embedding`.
 */
export function searchPassages(user: CurrentUser, query: string, options: { subject?: Subject; limit?: number; materialIds?: string[] } = {}): RetrievedPassage[] {
  const fts = buildFtsQuery(query);
  if (!fts) return [];
  const vis = visibilityClause(user);
  const where = [vis.sql, "material_chunks_fts MATCH ?"];
  const params: (string | number)[] = [...vis.params, fts];
  if (options.subject) {
    where.push("m.subject = ?");
    params.push(options.subject);
  }
  if (options.materialIds?.length) {
    where.push(`m.id IN (${options.materialIds.map(() => "?").join(",")})`);
    params.push(...options.materialIds);
  }
  // Fetch a wider candidate set by BM25, then re-rank (see relevanceBoost).
  params.push(40);
  const rows = getDb()
    .prepare(
      `SELECT m.id AS material_id, m.title AS material_title, m.subject AS subject, c.page AS page, c.content AS content,
              bm25(material_chunks_fts) AS score
         FROM material_chunks_fts
         JOIN material_chunks c ON c.id = material_chunks_fts.rowid
         JOIN materials m ON m.id = c.material_id
        WHERE ${where.join(" AND ")}
        ORDER BY score LIMIT ?`,
    )
    .all(...params) as { material_id: string; material_title: string; subject: Subject; page: number | null; content: string; score: number }[];
  return rows
    .map((r) => ({
      materialId: r.material_id,
      materialTitle: r.material_title,
      subject: r.subject,
      page: r.page,
      content: r.content,
      // bm25() is lower-is-better; flip it and add the re-ranking boost.
      score: relevanceBoost(query, r.content) - r.score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 5);
}

export function listMaterialsForLesson(lessonId: string, user: CurrentUser): MaterialRecord[] {
  const ids = (getDb().prepare("SELECT material_id FROM lesson_materials WHERE lesson_id = ?").all(lessonId) as { material_id: string }[]).map(
    (r) => r.material_id,
  );
  return ids
    .map((id) => {
      try {
        return getMaterial(id, user);
      } catch {
        return null;
      }
    })
    .filter((m): m is MaterialRecord => m !== null);
}
