/**
 * Reads the sources of the C++ problem book (content/books-src/cpp-problems/*.md).
 *
 * A source file is a chapter:
 *
 *   # თავი 3. Title
 *   weeks: 3
 *   <intro paragraphs>
 *   ## Problem title
 *   level: 1..5
 *   tags: a, b
 *   kind: solve | predict | debug      (default solve)
 *   <statement>
 *   ### შეყვანა / გამოტანა / შეზღუდვები
 *   ### მაგალითი                        (```in and ```out fences, then notes)
 *   ### მინიშნებები                     (a numbered list: direction, idea, plan)
 *   ### ამოხსნა                         (```cpp fence, then the explanation)
 *   ### შემოწმება                       (extra ```in / ```out pairs, checked only)
 *   ### სტრესი                          (```brute and ```gen, compared on random inputs)
 *
 * Files 00-*.md and 9*-*.md are the front and back matter: a `#` title and
 * `##` sections holding paragraphs, lists and code.
 */
import fs from "node:fs";
import path from "node:path";

export type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] } | { kind: "code"; lang: string; code: string };

export interface Example {
  input: string;
  output: string;
  note: Block[];
}

export interface Problem {
  id: string;
  title: string;
  level: number;
  tags: string[];
  kind: "solve" | "predict" | "debug";
  statement: Block[];
  input: Block[];
  output: Block[];
  limits: Block[];
  examples: Example[];
  hints: string[];
  solution: { code: string | null; answer: string | null; text: Block[] };
  extra: { input: string; output: string }[];
  stress: { brute: string; gen: string } | null;
  /** The code of the statement that is to be run (predict problems) or shown as faulty (debug problems). */
  given: string | null;
  statementInput: string | null;
}

export interface Chapter {
  number: number;
  title: string;
  weeks: string;
  intro: Block[];
  problems: Problem[];
  file: string;
}

export interface Matter {
  file: string;
  title: string;
  sections: { title: string; blocks: Block[] }[];
  lead: Block[];
}

export interface Book {
  front: Matter[];
  chapters: Chapter[];
  back: Matter[];
}

export function parseBlocks(lines: string[], where: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ kind: "p", text: paragraph.join(" ").trim() });
    paragraph = [];
    if (list) blocks.push(list);
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) throw new Error(`${where}: a code block is not closed`);
      blocks.push({ kind: "code", lang: fence[1] || "text", code: body.join("\n").replace(/\s+$/, "") });
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    const item = /^(-|\d+\.)\s+(.*)$/.exec(line);
    if (item) {
      const kind = item[1] === "-" ? "ul" : "ol";
      if (paragraph.length > 0 || (list && list.kind !== kind)) flush();
      if (!list) list = { kind, items: [] };
      list.items.push(item[2].trim());
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (list) flush();
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

function codeOf(blocks: Block[], lang: string): string | null {
  const found = blocks.find((b) => b.kind === "code" && b.lang === lang);
  return found && found.kind === "code" ? found.code : null;
}

const SECTION = { შეყვანა: "input", გამოტანა: "output", შეზღუდვები: "limits", მინიშნებები: "hints", ამოხსნა: "solution", შემოწმება: "extra", სტრესი: "stress" } as const;

function parseProblem(title: string, lines: string[], id: string, where: string): Problem {
  const meta: Record<string, string> = {};
  let at = 0;
  while (at < lines.length && /^(level|tags|kind):\s*/.test(lines[at])) {
    const m = /^(\w+):\s*(.*)$/.exec(lines[at])!;
    meta[m[1]] = m[2].trim();
    at++;
  }
  const level = Number(meta.level);
  if (!Number.isInteger(level) || level < 1 || level > 5) throw new Error(`${where}: level must be 1–5`);
  const kind = (meta.kind || "solve") as Problem["kind"];
  if (!["solve", "predict", "debug"].includes(kind)) throw new Error(`${where}: unknown kind ${kind}`);

  const parts = new Map<string, string[]>();
  const examples: string[][] = [];
  const statementLines: string[] = [];
  let current: string[] = statementLines;
  let inFence = false;
  for (const line of lines.slice(at)) {
    if (/^```/.test(line)) inFence = !inFence;
    const head = inFence ? null : /^### (.+?)\s*$/.exec(line);
    if (head) {
      const name = head[1];
      if (name === "განმარტება") {
        if (examples.length === 0) throw new Error(`${where}: "განმარტება" belongs after an example`);
        current = examples[examples.length - 1];
      } else if (name.startsWith("მაგალითი")) {
        current = [];
        examples.push(current);
      } else if (name in SECTION) {
        const key = SECTION[name as keyof typeof SECTION];
        if (parts.has(key)) throw new Error(`${where}: section "${name}" appears twice`);
        current = [];
        parts.set(key, current);
      } else {
        throw new Error(`${where}: unknown section "${name}"`);
      }
      continue;
    }
    current.push(line);
  }
  const blocksOf = (key: string) => parseBlocks(parts.get(key) ?? [], `${where} / ${key}`);

  const statement = parseBlocks(statementLines, `${where} / statement`);
  const exampleList: Example[] = examples.map((ex, i) => {
    const blocks = parseBlocks(ex, `${where} / example ${i + 1}`);
    const input = codeOf(blocks, "in");
    const output = codeOf(blocks, "out");
    if (output === null) throw new Error(`${where}: example ${i + 1} has no \`\`\`out block`);
    return { input: input ?? "", output, note: blocks.filter((b) => !(b.kind === "code" && (b.lang === "in" || b.lang === "out"))) };
  });

  const solutionBlocks = blocksOf("solution");
  const code = codeOf(solutionBlocks, "cpp");
  const answer = codeOf(solutionBlocks, "out");
  const text = solutionBlocks.filter((b) => !(b.kind === "code" && (b.lang === "cpp" || b.lang === "out")));

  const hintBlock = blocksOf("hints").find((b) => b.kind === "ol");
  const hints = hintBlock && hintBlock.kind === "ol" ? hintBlock.items : [];

  const extraBlocks = blocksOf("extra").filter((b) => b.kind === "code");
  const extra: Problem["extra"] = [];
  for (let i = 0; i + 1 < extraBlocks.length; i += 2) {
    const a = extraBlocks[i];
    const b = extraBlocks[i + 1];
    if (a.kind === "code" && b.kind === "code" && a.lang === "in" && b.lang === "out") extra.push({ input: a.code, output: b.code });
    else throw new Error(`${where}: "შემოწმება" needs pairs of \`\`\`in and \`\`\`out blocks`);
  }

  const stressBlocks = blocksOf("stress");
  const brute = codeOf(stressBlocks, "brute");
  const gen = codeOf(stressBlocks, "gen");
  if ((brute === null) !== (gen === null)) throw new Error(`${where}: "სტრესი" needs both \`\`\`brute and \`\`\`gen`);

  const problem: Problem = {
    id,
    title,
    level,
    tags: (meta.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    kind,
    statement,
    input: blocksOf("input"),
    output: blocksOf("output"),
    limits: blocksOf("limits"),
    examples: exampleList,
    hints,
    solution: { code, answer, text },
    extra,
    stress: brute !== null && gen !== null ? { brute, gen } : null,
    given: kind === "predict" ? codeOf(statement, "cpp") : kind === "debug" ? codeOf(statement, "buggy") : null,
    statementInput: codeOf(statement, "in"),
  };
  validateProblem(problem, where);
  return problem;
}

function validateProblem(p: Problem, where: string): void {
  if (p.tags.length === 0) throw new Error(`${where}: no tags`);
  if (p.statement.length === 0) throw new Error(`${where}: empty statement`);
  if (p.kind === "predict") {
    if (!p.given) throw new Error(`${where}: a "predict" problem needs a \`\`\`cpp block in the statement`);
    if (p.solution.answer === null) throw new Error(`${where}: a "predict" problem needs an \`\`\`out block in "ამოხსნა"`);
    if (p.hints.length < 1) throw new Error(`${where}: needs at least one hint`);
    return;
  }
  if (p.kind === "debug" && !p.given) throw new Error(`${where}: a "debug" problem needs a \`\`\`buggy block in the statement`);
  if (p.input.length === 0 || p.output.length === 0) throw new Error(`${where}: input and output must be described`);
  if (p.examples.length === 0) throw new Error(`${where}: no example`);
  if (p.hints.length !== 3) throw new Error(`${where}: exactly 3 hints are needed (direction, idea, plan), found ${p.hints.length}`);
  if (p.solution.code === null) throw new Error(`${where}: no \`\`\`cpp solution`);
}

function parseChapter(file: string, text: string): Chapter {
  const lines = text.split("\n");
  const title = /^# (.+)$/.exec(lines[0] ?? "");
  const match = title && /^თავი (\d+)\.\s*(.+)$/.exec(title[1]);
  if (!match) throw new Error(`${file}: the first line must be "# თავი N. Title"`);
  const number = Number(match[1]);
  let at = 1;
  const meta: Record<string, string> = {};
  while (at < lines.length && /^weeks:\s*/.test(lines[at])) {
    meta.weeks = lines[at].replace(/^weeks:\s*/, "").trim();
    at++;
  }
  const introLines: string[] = [];
  const problems: Problem[] = [];
  let inFence = false;
  let heading: { title: string; lines: string[] } | null = null;
  const closeProblem = () => {
    if (!heading) return;
    const id = `${number}.${problems.length + 1}`;
    problems.push(parseProblem(heading.title, heading.lines, id, `${path.basename(file)} / ${id} ${heading.title}`));
  };
  for (const line of lines.slice(at)) {
    if (/^```/.test(line)) inFence = !inFence;
    const head = inFence ? null : /^## (.+?)\s*$/.exec(line);
    if (head) {
      closeProblem();
      heading = { title: head[1], lines: [] };
      continue;
    }
    (heading ? heading.lines : introLines).push(line);
  }
  closeProblem();
  return { number, title: match[2].trim(), weeks: meta.weeks ?? "", intro: parseBlocks(introLines, `${file} / intro`), problems, file };
}

function parseMatter(file: string, text: string): Matter {
  const lines = text.split("\n");
  const title = /^# (.+)$/.exec(lines[0] ?? "");
  if (!title) throw new Error(`${file}: the first line must be "# Title"`);
  const lead: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let inFence = false;
  for (const line of lines.slice(1)) {
    if (/^```/.test(line)) inFence = !inFence;
    const head = inFence ? null : /^## (.+?)\s*$/.exec(line);
    if (head) sections.push({ title: head[1], lines: [] });
    else (sections.length > 0 ? sections[sections.length - 1].lines : lead).push(line);
  }
  return {
    file,
    title: title[1].trim(),
    lead: parseBlocks(lead, `${file} / lead`),
    sections: sections.map((s) => ({ title: s.title, blocks: parseBlocks(s.lines, `${file} / ${s.title}`) })),
  };
}

export function readBook(dir: string, only?: string): Book {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const book: Book = { front: [], chapters: [], back: [] };
  for (const f of files) {
    const full = path.join(dir, f);
    const text = fs.readFileSync(full, "utf-8").replace(/\r\n/g, "\n");
    if (f.startsWith("00-")) book.front.push(parseMatter(f, text));
    else if (/^9\d-/.test(f)) book.back.push(parseMatter(f, text));
    else if (!only || f.includes(only)) book.chapters.push(parseChapter(full, text));
  }
  return book;
}
