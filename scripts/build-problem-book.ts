/**
 * Builds the C++ problem book for the library from its sources
 * (content/books-src/cpp-problems/*.md): checks every solution, then writes
 * content/books/cpp-problems-1.docx and the .md text next to it.
 * Requires g++ and python3 on the developer's machine. Never runs in the app.
 *
 *   npx tsx scripts/build-problem-book.ts verify [file-name-part]   check only
 *   npx tsx scripts/build-problem-book.ts build                     check, then write the book
 */
import fs from "node:fs";
import path from "node:path";
import { extractText } from "../src/lib/files/extract";
import { buildDocx } from "./problem-book/docx";
import { readBook } from "./problem-book/parse";
import { verifyProblem } from "./problem-book/verify";

const SOURCES = path.join(process.cwd(), "content", "books-src", "cpp-problems");
const OUT = path.join(process.cwd(), "content", "books", "cpp-problems-1.docx");

async function main() {
  const [command = "verify", filter] = process.argv.slice(2);
  const book = readBook(SOURCES, command === "build" ? undefined : filter);

  let problems = 0;
  let failed = 0;
  const warned: string[] = [];
  for (const chapter of book.chapters) {
    for (const p of chapter.problems) {
      problems++;
      const report = verifyProblem(p);
      if (report.errors.length > 0) {
        failed++;
        console.error(`✗ ${p.id} ${p.title}`);
        for (const e of report.errors) console.error(`    ${e.replace(/\n/g, "\n    ")}`);
      }
      for (const w of report.warnings) warned.push(`${p.id} ${w}`);
    }
    console.log(`თავი ${chapter.number}: ${chapter.problems.length} problems`);
  }
  for (const w of warned) console.warn(`⚠ ${w}`);
  console.log(`${problems} problems checked, ${failed} failed, ${warned.length} with compiler warnings`);
  if (failed > 0) process.exit(1);
  if (command !== "build") return;

  const total = book.chapters.reduce((n, c) => n + c.problems.length, 0);
  const bytes = await buildDocx(book, {
    title: `${total} ამოცანა C++-ში`,
    subtitle: "პირველი ნაბიჯებიდან ოლიმპიადამდე — მინიშნებებითა და გადამოწმებული ამოხსნებით",
    edition: "ტომი I",
  });
  fs.writeFileSync(OUT, bytes);
  const { pages } = await extractText("docx", bytes, OUT);
  const text = OUT.replace(/\.docx$/i, ".md");
  fs.writeFileSync(text, `${pages.map((p) => p.text).join("\n\n").trim()}\n`);
  console.log(`${OUT}: ${fs.statSync(OUT).size} bytes; ${text}: ${fs.statSync(text).size} bytes`);
}

void main();
