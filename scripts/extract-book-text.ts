/**
 * Writes the text of a built-in library book (content/books/*.docx) next to
 * it as Markdown, using the same extractor as uploads. The start-up sync
 * indexes that text, so it needs no asynchronous file parsing.
 *
 *   npx tsx scripts/extract-book-text.ts content/books/<file>.docx
 */
import fs from "node:fs";
import { extractText } from "../src/lib/files/extract";

async function main() {
  for (const file of process.argv.slice(2)) {
    const { pages } = await extractText("docx", new Uint8Array(fs.readFileSync(file)), file);
    const out = file.replace(/\.docx$/i, ".md");
    fs.writeFileSync(out, `${pages.map((p) => p.text).join("\n\n").trim()}\n`);
    console.log(`${out}: ${fs.statSync(out).size} bytes`);
  }
}

void main();
