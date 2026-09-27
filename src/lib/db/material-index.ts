import fs from "node:fs";
import path from "node:path";
import type { DB } from "./index";
import { newId } from "@/lib/domain/ids";
import { ingestDocument, type DocumentFormat, type IngestResult, type SourcePage } from "@/lib/knowledge/ingest";
import { extractKnowledge } from "@/lib/knowledge/knowledge";

/**
 * Writing a material's passages and knowledge to the database.
 *
 * Kept free of request context so the demo seed, uploads, the start-up
 * upgrade and `npm run materials:reindex` all index the same way.
 */

/** Bump when the pipeline changes enough that stored passages should be rebuilt. */
export const INDEX_VERSION = 1;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

export function formatFor(fileName: string, mime: string): DocumentFormat {
  if (/\.pdf$/i.test(fileName) || mime === "application/pdf") return "pdf";
  if (/\.(md|markdown)$/i.test(fileName) || mime.startsWith("text/markdown")) return "markdown";
  return "plain";
}

export interface IndexSummary {
  chunks: number;
  knowledge: number;
  quality: IngestResult["report"]["quality"];
}

/** Replace a material's passages and knowledge with a fresh index of `pages`. */
export function indexMaterial(db: DB, materialId: string, pages: readonly SourcePage[], format: DocumentFormat): IndexSummary {
  const result = ingestDocument(pages, format);
  const items = extractKnowledge(result.chunks);
  const insertChunk = db.prepare(
    `INSERT INTO material_chunks (material_id, position, page, page_end, section, chapter, quality, content, stems, term_count, spans)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertItem = db.prepare(
    `INSERT INTO material_knowledge (id, material_id, chunk_id, type, term, content, confidence, section, page_start, page_end, stems, relates_to, relation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  db.transaction(() => {
    db.prepare("DELETE FROM material_chunks WHERE material_id = ?").run(materialId);
    const chunkIds = new Map<number, number>();
    for (const chunk of result.chunks) {
      const info = insertChunk.run(
        materialId,
        chunk.position,
        chunk.pageStart,
        chunk.pageEnd,
        chunk.section,
        chunk.chapter,
        chunk.quality,
        chunk.text,
        chunk.terms.join(" "),
        chunk.terms.length,
        JSON.stringify(chunk.spans),
      );
      chunkIds.set(chunk.position, Number(info.lastInsertRowid));
    }
    const itemIds = items.map(() => newId());
    items.forEach((item, i) => {
      const chunkId = chunkIds.get(item.chunkPosition);
      if (chunkId === undefined) return;
      insertItem.run(
        itemIds[i],
        materialId,
        chunkId,
        item.type,
        item.term,
        item.content,
        item.confidence,
        item.section,
        item.pageStart,
        item.pageEnd,
        item.terms.join(" "),
        item.relatesTo !== null && item.relatesTo < i ? itemIds[item.relatesTo] : null,
        item.relatesTo !== null && item.relatesTo < i ? item.relation : null,
      );
    });
    db.prepare(
      `UPDATE materials SET index_version = ?, language = ?, extraction_quality = ?, quality_score = ?, warnings = ?,
         page_count = COALESCE(?, page_count) WHERE id = ?`,
    ).run(INDEX_VERSION, result.language, result.report.quality, result.report.qualityScore, JSON.stringify(result.report.warnings), format === "pdf" ? result.report.pageCount : null, materialId);
  })();
  return { chunks: result.chunks.length, knowledge: items.length, quality: result.report.quality };
}

interface StaleMaterial {
  id: string;
  file_name: string;
  stored_name: string;
  mime_type: string;
  text_status: string;
}

/**
 * Bring materials indexed by an older pipeline up to date, without losing
 * anything: text and Markdown files are re-read from disk; PDFs and Word
 * files are rebuilt from their stored passages (page numbers kept), since
 * reading those again is slow and asynchronous — `npm run materials:reindex`
 * does it properly. Runs once per material, at start-up.
 */
export function upgradeMaterialIndexes(db: DB): number {
  const stale = db
    .prepare("SELECT id, file_name, stored_name, mime_type, text_status FROM materials WHERE index_version < ? AND text_status = 'indexed'")
    .all(INDEX_VERSION) as StaleMaterial[];
  for (const material of stale) {
    try {
      const format = formatFor(material.file_name, material.mime_type);
      const file = path.join(uploadDir(), path.basename(material.stored_name));
      if (format !== "pdf" && !/\.docx$/i.test(material.file_name) && fs.existsSync(file)) {
        indexMaterial(db, material.id, [{ page: null, text: fs.readFileSync(file, "utf-8") }], format);
        continue;
      }
      const rows = db.prepare("SELECT page, content FROM material_chunks WHERE material_id = ? ORDER BY position").all(material.id) as { page: number | null; content: string }[];
      const pages: SourcePage[] = [];
      for (const row of rows) {
        const last = pages[pages.length - 1];
        if (last && last.page === row.page) last.text += `\n\n${row.content}`;
        else pages.push({ page: row.page, text: row.content });
      }
      indexMaterial(db, material.id, pages, format === "markdown" ? "markdown" : "plain");
    } catch (error) {
      // A material that cannot be upgraded keeps working as before; it is retried next start.
      console.warn("[materials] re-indexing failed", material.id, error instanceof Error ? error.message : error);
    }
  }
  return stale.length;
}
