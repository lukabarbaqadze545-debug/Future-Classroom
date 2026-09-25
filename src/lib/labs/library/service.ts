import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import type { Subject } from "@/lib/domain/catalog";
import { recordLabProgress } from "@/lib/services/assignments";
import { tr } from "../localized";
import { resourceSchema, type CopyStatus, type ReadingStatus, type ResourceInput } from "./model";

export interface LibraryResource extends ResourceInput {
  id: string;
  materialId: string | null;
  materialTitle: string | null;
  copies: { total: number; available: number };
  createdAt: number;
  updatedAt: number;
}

export interface LibraryCopy {
  id: string;
  resourceId: string;
  code: string;
  shelf: string;
  status: CopyStatus;
  borrowerId: string | null;
  borrowerName: string | null;
  dueAt: number | null;
  updatedAt: number;
}

interface ResourceRow {
  id: string;
  data: string;
  material_id: string | null;
  material_title: string | null;
  total: number;
  available: number;
  created_at: number;
  updated_at: number;
}

const SELECT_RESOURCE = `SELECT r.*, m.title AS material_title,
  (SELECT COUNT(*) FROM library_copies c WHERE c.resource_id = r.id) AS total,
  (SELECT COUNT(*) FROM library_copies c WHERE c.resource_id = r.id AND c.status = 'available') AS available
  FROM library_resources r LEFT JOIN materials m ON m.id = r.material_id`;

function toResource(row: ResourceRow): LibraryResource | null {
  const parsed = resourceSchema.safeParse(parseJson(row.data, {}));
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    id: row.id,
    materialId: row.material_id,
    materialTitle: row.material_title,
    copies: { total: row.total, available: row.available },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface LibraryFilters {
  q?: string;
  category?: string;
  subject?: Subject;
  grade?: number;
  language?: string;
  kind?: string;
  availability?: "digital" | "physical" | "available";
}

export function listResources(filters: LibraryFilters = {}): LibraryResource[] {
  const rows = getDb().prepare(`${SELECT_RESOURCE} ORDER BY r.created_at`).all() as ResourceRow[];
  const q = filters.q?.trim().toLowerCase();
  return rows
    .map(toResource)
    .filter((r): r is LibraryResource => r !== null)
    .filter((r) => {
      if (q) {
        const hay = [r.title, r.authors, r.description.en, r.description.ka, r.publisher, r.isbn].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
      }
      if (filters.category && !(r.categories as string[]).includes(filters.category)) return false;
      if (filters.subject && !r.subjects.includes(filters.subject)) return false;
      if (filters.grade && r.gradeFrom !== null && r.gradeTo !== null && (filters.grade < r.gradeFrom || filters.grade > r.gradeTo)) return false;
      if (filters.language && r.language !== filters.language) return false;
      if (filters.kind && r.kind !== filters.kind) return false;
      if (filters.availability === "digital" && !r.digitalUrl && !r.materialId) return false;
      if (filters.availability === "physical" && r.copies.total === 0) return false;
      if (filters.availability === "available" && r.copies.available === 0) return false;
      return true;
    });
}

export function getResource(id: string): LibraryResource | null {
  const row = getDb().prepare(`${SELECT_RESOURCE} WHERE r.id = ?`).get(id) as ResourceRow | undefined;
  return row ? toResource(row) : null;
}

export function getResourceOrThrow(id: string): LibraryResource {
  const resource = getResource(id);
  if (!resource) throw new ApiError(404, "not_found");
  return resource;
}

function checkMaterial(materialId: string | null) {
  if (!materialId) return;
  const row = getDb().prepare("SELECT 1 FROM materials WHERE id = ?").get(materialId);
  if (!row) throw new ApiError(400, "invalid_input", "Unknown material.");
}

export function createResource(user: CurrentUser | null, raw: ResourceInput, materialId: string | null = null, options: { id?: string; at?: number } = {}): LibraryResource {
  const data = resourceSchema.parse(raw);
  checkMaterial(materialId);
  const id = options.id ?? `lib-${newId(8)}`;
  const at = options.at ?? now();
  getDb()
    .prepare("INSERT INTO library_resources (id, data, material_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, JSON.stringify(data), materialId, user?.id ?? null, at, at);
  return getResource(id)!;
}

export function updateResource(id: string, raw: ResourceInput, materialId: string | null): LibraryResource {
  getResourceOrThrow(id);
  const data = resourceSchema.parse(raw);
  checkMaterial(materialId);
  getDb().prepare("UPDATE library_resources SET data = ?, material_id = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(data), materialId, now(), id);
  return getResource(id)!;
}

export function deleteResource(id: string): void {
  getResourceOrThrow(id);
  getDb().prepare("DELETE FROM library_resources WHERE id = ?").run(id);
}

// ---------------------------------------------------------------- Copies and QR codes

interface CopyRow {
  id: string;
  resource_id: string;
  code: string;
  shelf: string;
  status: CopyStatus;
  borrower_id: string | null;
  borrower_name: string | null;
  due_at: number | null;
  updated_at: number;
}

const SELECT_COPY = "SELECT c.*, u.display_name AS borrower_name FROM library_copies c LEFT JOIN users u ON u.id = c.borrower_id";

function toCopy(row: CopyRow): LibraryCopy {
  return {
    id: row.id,
    resourceId: row.resource_id,
    code: row.code,
    shelf: row.shelf,
    status: row.status,
    borrowerId: row.borrower_id,
    borrowerName: row.borrower_name,
    dueAt: row.due_at,
    updatedAt: row.updated_at,
  };
}

export function listCopies(resourceId: string): LibraryCopy[] {
  return (getDb().prepare(`${SELECT_COPY} WHERE c.resource_id = ? ORDER BY c.code`).all(resourceId) as CopyRow[]).map(toCopy);
}

export function listAllCopies(): (LibraryCopy & { title: string })[] {
  const titles = new Map(listResources().map((r) => [r.id, r.title]));
  return (getDb().prepare(`${SELECT_COPY} ORDER BY c.code`).all() as CopyRow[]).map((row) => ({ ...toCopy(row), title: titles.get(row.resource_id) ?? "" }));
}

export function findCopyByCode(code: string): LibraryCopy | null {
  const row = getDb().prepare(`${SELECT_COPY} WHERE c.code = ?`).get(code.trim().toUpperCase()) as CopyRow | undefined;
  return row ? toCopy(row) : null;
}

/** Copy codes are short, printable and unique: LIB-0001, LIB-0002, … */
function nextCode(): string {
  const row = getDb().prepare("SELECT code FROM library_copies WHERE code LIKE 'LIB-%' ORDER BY code DESC LIMIT 1").get() as { code: string } | undefined;
  const n = row ? Number(row.code.slice(4)) + 1 : 1;
  return `LIB-${String(n).padStart(4, "0")}`;
}

export function addCopy(resourceId: string, input: { shelf: string; status?: CopyStatus }, options: { at?: number } = {}): LibraryCopy {
  getResourceOrThrow(resourceId);
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM library_copies WHERE resource_id = ?").get(resourceId) as { n: number };
  if (count.n >= 100) throw new ApiError(400, "invalid_input", "Too many copies.");
  const id = newId();
  getDb()
    .prepare("INSERT INTO library_copies (id, resource_id, code, shelf, status, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, resourceId, nextCode(), input.shelf.trim().slice(0, 80), input.status ?? "available", options.at ?? now());
  return toCopy(getDb().prepare(`${SELECT_COPY} WHERE c.id = ?`).get(id) as CopyRow);
}

export function updateCopy(copyId: string, patch: { shelf?: string; status?: CopyStatus; borrowerId?: string | null; dueAt?: number | null }): LibraryCopy {
  const row = getDb().prepare(`${SELECT_COPY} WHERE c.id = ?`).get(copyId) as CopyRow | undefined;
  if (!row) throw new ApiError(404, "not_found");
  const status = patch.status ?? row.status;
  let borrower = patch.borrowerId === undefined ? row.borrower_id : patch.borrowerId;
  let due = patch.dueAt === undefined ? row.due_at : patch.dueAt;
  if (status !== "on_loan") {
    borrower = null;
    due = null;
  }
  if (borrower) {
    const ok = getDb().prepare("SELECT 1 FROM users WHERE id = ?").get(borrower);
    if (!ok) throw new ApiError(400, "invalid_input");
  }
  getDb()
    .prepare("UPDATE library_copies SET shelf = ?, status = ?, borrower_id = ?, due_at = ?, updated_at = ? WHERE id = ?")
    .run((patch.shelf ?? row.shelf).trim().slice(0, 80), status, borrower, due, now(), copyId);
  return toCopy(getDb().prepare(`${SELECT_COPY} WHERE c.id = ?`).get(copyId) as CopyRow);
}

export function deleteCopy(copyId: string): void {
  getDb().prepare("DELETE FROM library_copies WHERE id = ?").run(copyId);
}

/** Loans for one student (their own "borrowed" list). */
export function loansFor(userId: string): (LibraryCopy & { title: string })[] {
  return (getDb().prepare(`${SELECT_COPY} WHERE c.borrower_id = ? AND c.status = 'on_loan' ORDER BY c.due_at`).all(userId) as CopyRow[]).map((row) => ({
    ...toCopy(row),
    title: getResource(row.resource_id)?.title ?? "",
  }));
}

// ---------------------------------------------------------------- Reading progress

export interface ReadingEntry {
  resourceId: string;
  status: ReadingStatus;
  percent: number;
  note: string;
  updatedAt: number;
}

export function getReading(userId: string, resourceId: string): ReadingEntry | null {
  const row = getDb().prepare("SELECT * FROM reading_progress WHERE user_id = ? AND resource_id = ?").get(userId, resourceId) as
    | { resource_id: string; status: ReadingStatus; percent: number; note: string; updated_at: number }
    | undefined;
  return row ? { resourceId: row.resource_id, status: row.status, percent: row.percent, note: row.note, updatedAt: row.updated_at } : null;
}

export function listReading(userId: string): (ReadingEntry & { title: string })[] {
  const rows = getDb().prepare("SELECT * FROM reading_progress WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as {
    resource_id: string;
    status: ReadingStatus;
    percent: number;
    note: string;
    updated_at: number;
  }[];
  return rows.map((row) => ({ resourceId: row.resource_id, status: row.status, percent: row.percent, note: row.note, updatedAt: row.updated_at, title: getResource(row.resource_id)?.title ?? "" }));
}

export function setReading(user: CurrentUser, resourceId: string, input: { status: ReadingStatus | null; percent?: number; note?: string }, options: { at?: number } = {}): ReadingEntry | null {
  getResourceOrThrow(resourceId);
  const db = getDb();
  if (input.status === null) {
    db.prepare("DELETE FROM reading_progress WHERE user_id = ? AND resource_id = ?").run(user.id, resourceId);
    return null;
  }
  const percent = input.status === "finished" ? 100 : Math.max(0, Math.min(100, Math.round(input.percent ?? 0)));
  const note = (input.note ?? "").slice(0, 2000);
  db.prepare(
    `INSERT INTO reading_progress (user_id, resource_id, status, percent, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, resource_id) DO UPDATE SET status = excluded.status, percent = excluded.percent, note = excluded.note, updated_at = excluded.updated_at`,
  ).run(user.id, resourceId, input.status, percent, note, options.at ?? now());
  if (user.role === "student") {
    if (input.status === "finished") recordLabProgress(user.id, "library", resourceId, { status: "completed", workRef: resourceId });
    else if (input.status === "reading") recordLabProgress(user.id, "library", resourceId, { status: "in_progress", workRef: resourceId });
  }
  return getReading(user.id, resourceId);
}

export function libraryProgress(userId: string) {
  const rows = listReading(userId);
  return { finished: rows.filter((r) => r.status === "finished").length, reading: rows.filter((r) => r.status === "reading").length, want: rows.filter((r) => r.status === "want").length };
}

// ---------------------------------------------------------------- Lessons (cross-module)

export function lessonsForResource(resourceId: string): { id: string; title: string; teacherId: string }[] {
  return getDb()
    .prepare("SELECT l.id, l.title, l.teacher_id AS teacherId FROM lesson_resources lr JOIN lessons l ON l.id = lr.lesson_id WHERE lr.resource_id = ? ORDER BY l.title")
    .all(resourceId) as { id: string; title: string; teacherId: string }[];
}

export function resourcesForLesson(lessonId: string): LibraryResource[] {
  const ids = getDb().prepare("SELECT resource_id FROM lesson_resources WHERE lesson_id = ?").all(lessonId) as { resource_id: string }[];
  return ids.map((r) => getResource(r.resource_id)).filter((r): r is LibraryResource => r !== null);
}

export function setLessonResource(user: CurrentUser, lessonId: string, resourceId: string, attached: boolean): void {
  const lesson = getDb().prepare("SELECT teacher_id FROM lessons WHERE id = ?").get(lessonId) as { teacher_id: string } | undefined;
  if (!lesson) throw new ApiError(404, "not_found");
  if (lesson.teacher_id !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getResourceOrThrow(resourceId);
  if (attached) getDb().prepare("INSERT OR IGNORE INTO lesson_resources (lesson_id, resource_id) VALUES (?, ?)").run(lessonId, resourceId);
  else getDb().prepare("DELETE FROM lesson_resources WHERE lesson_id = ? AND resource_id = ?").run(lessonId, resourceId);
}

// ---------------------------------------------------------------- Research integration

const KIND_TO_SOURCE: Record<ResourceInput["kind"], "book" | "article" | "website" | "report" | "video" | "other"> = {
  book: "book",
  textbook: "book",
  guide: "report",
  worksheet: "other",
  reference: "book",
  website: "website",
  video: "video",
};

/** Library entries a student can copy into a research project as a source. */
export function libraryOptionsForResearch() {
  return listResources().map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors,
    year: r.year,
    publisher: r.publisher,
    url: r.digitalUrl,
    type: KIND_TO_SOURCE[r.kind],
  }));
}

export function resourceDescription(resource: LibraryResource, locale: Locale) {
  return tr(resource.description, locale);
}
