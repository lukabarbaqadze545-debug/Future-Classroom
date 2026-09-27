import fs from "node:fs";
import path from "node:path";
import type { DB } from "./index";
import { BUILT_IN_BOOKS } from "@/lib/content/books";
import { resourceSchema } from "@/lib/labs/library/model";
import { ensureSystemUser } from "./builtin";
import { indexMaterial, uploadDir } from "./material-index";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function booksDir(): string {
  return process.env.BOOKS_DIR || path.join(process.cwd(), "content", "books");
}

/**
 * Installs built-in library books a school does not have yet: the book file
 * as a school material visible to students (indexed for the Learning
 * Assistant) and a library catalogue entry pointing to it. A book the school
 * removed (its catalogue entry or its file) is not brought back.
 */
export function syncBuiltInBooks(db: DB): number {
  let added = 0;
  for (const book of BUILT_IN_BOOKS) {
    const materialId = `book-${book.key}`;
    if (db.prepare("SELECT 1 FROM library_resources WHERE id = ? UNION SELECT 1 FROM materials WHERE id = ?").get(book.id, materialId)) continue;
    const source = path.join(booksDir(), book.file);
    const textFile = source.replace(/\.docx$/i, ".md");
    if (!fs.existsSync(source) || !fs.existsSync(textFile)) continue;
    const bytes = fs.readFileSync(source);
    const text = fs.readFileSync(textFile, "utf-8");
    const resource = resourceSchema.parse(book.resource);
    const owner = ensureSystemUser(db);
    const at = Date.now();
    fs.mkdirSync(uploadDir(), { recursive: true });
    fs.writeFileSync(path.join(uploadDir(), `${materialId}.docx`), bytes, { mode: 0o640 });
    db.transaction(() => {
      db.prepare(
        `INSERT INTO materials (id, owner_id, title, subject, grade, author, tags, visibility, file_name, stored_name, mime_type, size_bytes, text_status, page_count, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, 'students', ?, ?, ?, ?, 'indexed', NULL, ?)`,
      ).run(materialId, owner, resource.title, book.subject, resource.authors, JSON.stringify(book.tags), book.file, `${materialId}.docx`, DOCX, bytes.byteLength, at);
      indexMaterial(db, materialId, [{ page: null, text }], "markdown");
      db.prepare("INSERT INTO library_resources (id, data, material_id, created_by, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)").run(book.id, JSON.stringify(resource), materialId, at, at);
    })();
    added++;
  }
  return added;
}
