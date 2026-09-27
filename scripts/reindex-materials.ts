/**
 * Re-reads every uploaded material from its stored file and rebuilds its
 * passages and knowledge (structure, page ranges, definitions…).
 *
 *   npm run materials:reindex            # materials indexed by an older version
 *   npm run materials:reindex -- --all   # every material
 *
 * Safe to run while the server is stopped or running: each material is
 * replaced in one transaction. Nothing is deleted when a file cannot be read.
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { databasePath, openDatabase } from "../src/lib/db";
import {
  INDEX_VERSION,
  indexMaterial,
  uploadDir,
} from "../src/lib/db/material-index";
import { extractText } from "../src/lib/files/extract";
import { validateUpload } from "../src/lib/files/validate";

const all = process.argv.includes("--all");
const db = openDatabase(databasePath());
const rows = db
  .prepare(
    `SELECT id, title, file_name, stored_name FROM materials ${all ? "" : "WHERE index_version < ? OR text_status != 'indexed'"} ORDER BY created_at`,
  )
  .all(...(all ? [] : [INDEX_VERSION])) as {
  id: string;
  title: string;
  file_name: string;
  stored_name: string;
}[];

async function main() {
  let done = 0;
  for (const row of rows) {
    const file = path.join(uploadDir(), path.basename(row.stored_name));
    if (!fs.existsSync(file)) {
      console.warn(`skip  ${row.title}: file not found`);
      continue;
    }
    try {
      const bytes = new Uint8Array(fs.readFileSync(file));
      const { kind } = validateUpload(row.file_name, bytes);
      const extracted = await extractText(kind, bytes, row.file_name);
      const hasText = extracted.pages.some((p) => p.text.trim().length > 20);
      const summary = hasText
        ? indexMaterial(db, row.id, extracted.pages, extracted.format)
        : null;
      db.prepare(
        "UPDATE materials SET text_status = ?, page_count = COALESCE(?, page_count) WHERE id = ?",
      ).run(
        summary && summary.chunks > 0 ? "indexed" : "no_text",
        extracted.pageCount,
        row.id,
      );
      console.log(
        `ok    ${row.title}: ${summary ? `${summary.chunks} passages, ${summary.knowledge} knowledge items, extraction ${summary.quality}` : "no text (scanned?)"}`,
      );
      done++;
    } catch (error) {
      console.warn(
        `fail  ${row.title}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  console.log(`${done} of ${rows.length} materials re-indexed.`);
  db.close();
}

void main();
