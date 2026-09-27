import { contentTerms, textLanguage, type TextLanguage } from "./language";

/**
 * From extracted text to retrievable passages.
 *
 *   clean      running heads and feet, page-number lines, words split across
 *              a line break, and a per-page score of how much it reads like
 *              prose (a scanned PDF or letter soup is reported, not indexed
 *              as knowledge);
 *   structure  the author's own headings — chapters, numbered sections,
 *              Markdown headings, and short caseless lines that Mkhedruli
 *              headings are (Georgian has no capital letters to go by);
 *   chunk      paragraphs grouped to about 900 characters inside one
 *              section, each passage keeping the exact pages it came from.
 *
 * Page numbers come only from the document. A text without pages (DOCX,
 * TXT, Markdown) keeps `null` and is cited by section instead: a page number
 * that is not in the source is never produced.
 */

export type DocumentFormat = "pdf" | "markdown" | "plain";
export type ExtractionQuality = "good" | "fair" | "poor" | "failed";
export type Confidence = "high" | "medium" | "low";

export interface SourcePage {
  page: number | null;
  text: string;
}

export interface IngestWarning {
  code: "empty_pages" | "low_quality_pages" | "needs_ocr" | "running_text_removed";
  pages?: number[];
  sample?: string[];
}

export interface Span {
  start: number;
  end: number;
  pageStart: number | null;
  pageEnd: number | null;
}

export interface IngestedChunk {
  position: number;
  text: string;
  section: string | null;
  chapter: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  quality: Confidence;
  /** Stemmed content words of the text, its section and its running head. */
  terms: string[];
  spans: Span[];
}

export interface IngestReport {
  pageCount: number | null;
  emptyPages: number[];
  lowQualityPages: number[];
  qualityScore: number;
  quality: ExtractionQuality;
  warnings: IngestWarning[];
  dehyphenated: number;
  sections: number;
}

export interface IngestResult {
  chunks: IngestedChunk[];
  report: IngestReport;
  language: TextLanguage;
}

const TARGET = 900;
const MAX = 1500;
const MIN = 120;

/* -------------------------------- cleaning -------------------------------- */

/** 0..1 — how much a page reads like prose rather than extraction noise. */
export function pageQuality(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length < 20) return 0;
  const chars = [...trimmed];
  const letters = chars.filter((c) => /\p{L}/u.test(c)).length;
  const words = trimmed.split(/\s+/u).filter(Boolean);
  if (words.length < 5) return 0.2;
  const singleLetterWords = words.filter((w) => w.length === 1 && /\p{L}/u.test(w)).length / words.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const digits = chars.filter((c) => /\d/.test(c)).length / chars.length;
  let score = 1;
  // Letter-spaced extraction: „T h i s  i s".
  if (singleLetterWords > 0.3) score -= 0.6;
  else if (singleLetterWords > 0.15) score -= 0.25;
  if (letters / chars.length < 0.55) score -= 0.35;
  if (avgWordLength < 2 || avgWordLength > 18) score -= 0.3;
  if (digits > 0.35) score -= 0.3;
  return Math.max(0, Math.min(1, score));
}

function isPageNumberLine(line: string): boolean {
  return /^[\s—–\-|[\]().]*\d{1,4}[\s—–\-|[\]().]*$/u.test(line) || /^(page|p\.|გვ\.?|გვერდი)\s*\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/iu.test(line.trim());
}

const runningKey = (line: string) => line.trim().toLowerCase().replace(/\d+/g, "#");

/**
 * Lines repeated at the top or bottom of many pages are running heads or
 * feet. The threshold is bounded at both ends: a short extract has few pages
 * to repeat on, and in an anthology each author's head covers only a part.
 */
function findRunningText(pages: readonly SourcePage[]): Set<string> {
  const counts = new Map<string, number>();
  const bump = (line: string) => {
    const key = runningKey(line);
    if (key.length < 3 || key.length > 90) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const page of pages) {
    const lines = page.text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    bump(lines[0]);
    if (lines.length > 1) bump(lines[lines.length - 1]);
    if (lines.length > 2) bump(lines[1]);
  }
  const nonEmpty = pages.filter((p) => p.text.trim()).length;
  if (nonEmpty < 3) return new Set();
  const threshold = nonEmpty <= 5 ? Math.max(2, nonEmpty - 1) : Math.min(12, Math.max(4, Math.ceil(nonEmpty * 0.3)));
  return new Set([...counts].filter(([, n]) => n >= threshold).map(([key]) => key));
}

interface CleanedPage extends SourcePage {
  quality: number;
  heads: string[];
}

function cleanPdfPages(pages: readonly SourcePage[]) {
  const running = findRunningText(pages);
  const removed = new Set<string>();
  let dehyphenated = 0;
  const cleaned: CleanedPage[] = pages.map((page) => {
    const kept: string[] = [];
    const heads: string[] = [];
    for (const raw of page.text.split("\n")) {
      const line = raw.replace(/\s+/g, " ").trim();
      if (!line || isPageNumberLine(line)) continue;
      if (running.has(runningKey(line))) {
        removed.add(line);
        if (!heads.includes(line)) heads.push(line);
        continue;
      }
      kept.push(line);
    }
    // „determin-\nism" → „determinism"; a capitalised continuation is a real compound.
    const text = kept.join("\n").replace(/(\p{L})-\n(\p{Ll})/gu, (_m, a: string, b: string) => {
      dehyphenated++;
      return `${a}${b}`;
    });
    return { page: page.page, text, quality: pageQuality(text), heads };
  });
  return { cleaned, removed: [...removed], dehyphenated };
}

/* -------------------------------- structure -------------------------------- */

interface Line {
  page: number | null;
  text: string;
}

interface Paragraph {
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
}

interface Section {
  title: string | null;
  chapter: string | null;
  lines: Line[];
  /** Pre-built paragraphs (Markdown and plain text); PDFs build them from lines. */
  paragraphs?: Paragraph[];
}

const CHAPTER = [/^(chapter|part|unit|book)\s+([0-9]{1,3}|[ivxlcdm]{1,7})\b/i, /^(თავი|ნაწილი|წიგნი|თემა)\s+([0-9]{1,3}|[ivxlcdm]{1,7})\b/iu, /^([0-9]{1,2})\.\s+\p{Lu}/u];
const NUMBERED_SECTION = [/^([0-9]{1,2}\.[0-9]{1,2})\.?\s+\S/u, /^§\s*[0-9]+/u];
const SENTENCE_END = /[.!?:;»"”'’)\]]\s*$/u;

function looksLikeHeading(line: string): boolean {
  const text = line.trim();
  if (text.length < 3 || text.length > 80 || SENTENCE_END.test(text) || /[,;=]/.test(text)) return false;
  const words = text.split(/\s+/u);
  if (words.length > 12) return false;
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  if (letters.length === 0) return false;
  const upper = letters.filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length;
  if (upper / letters.length > 0.7 && letters.length > 3) return true;
  const capitalised = words.filter((w) => /^\p{Lu}/u.test(w)).length;
  return words.length >= 2 && capitalised / words.length >= 0.6;
}

/** Mkhedruli has no capitals: a short unpunctuated line stands in for a heading. */
function isCaselessHeading(line: string): boolean {
  const text = line.trim();
  if (text.length < 3 || text.length > 50 || SENTENCE_END.test(text) || /[,;=]/.test(text)) return false;
  if (text.split(/\s+/u).length > 5) return false;
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  return letters.length > 0 && letters.every((c) => c === c.toUpperCase() && c === c.toLowerCase());
}

/** A heading of any kind, including a single capitalised word („Energy"). */
function titleLike(line: string): boolean {
  return looksLikeHeading(line) || isCaselessHeading(line) || /^\p{Lu}[\p{L}'’-]{2,30}$/u.test(line.trim());
}

function chapterOf(text: string): boolean {
  return CHAPTER.some((p) => p.test(text));
}

/** PDF: headings from lines, or from running heads when those organise the book. */
function pdfSections(pages: readonly CleanedPage[]): Section[] {
  const lines: Line[] = pages.flatMap((p) =>
    p.text
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ page: p.page, text })),
  );
  if (lines.length === 0) return [];

  // An anthology's structure lives in its running heads (the author on each page).
  const byHeads = sectionsFromHeads(pages, lines);
  if (byHeads.length > 0) return byHeads;

  const sections: Section[] = [];
  let current: Section = { title: null, chapter: null, lines: [] };
  let chapter: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    const previous = lines[i - 1];
    const isChapter = chapterOf(line.text);
    // A lone capitalised word is a heading only between a finished sentence and a new one.
    const singleWord = /^\p{Lu}[\p{L}'’-]{2,30}$/u.test(line.text) && (!previous || SENTENCE_END.test(previous.text)) && Boolean(next && /^\p{Lu}/u.test(next.text));
    const isHeading = isChapter || NUMBERED_SECTION.some((p) => p.test(line.text)) || looksLikeHeading(line.text) || isCaselessHeading(line.text) || singleWord;
    if (!isHeading || !next) {
      current.lines.push(line);
      continue;
    }
    let title = line.text;
    // „Chapter 4" alone is a label; the title is usually the next line.
    if (isChapter && title.length < 24 && next.page === line.page && titleLike(next.text)) {
      title = `${title} — ${next.text}`;
      i++;
    }
    if (isChapter) chapter = title;
    if (current.lines.length > 0) sections.push(current);
    current = { title, chapter, lines: [] };
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function sectionsFromHeads(pages: readonly CleanedPage[], lines: readonly Line[]): Section[] {
  const withText = pages.filter((p) => p.text.trim());
  if (withText.length < 3) return [];
  const covered = withText.filter((p) => p.heads.length > 0).length;
  const distinct = new Set(withText.flatMap((p) => p.heads));
  // Heads must organise most of the book and must vary (one repeated head is the book's title).
  if (covered / withText.length < 0.5 || distinct.size < 2) return [];

  const headAt = (page: CleanedPage | undefined) => (page ? ([...page.heads].sort((a, b) => b.length - a.length)[0] ?? null) : null);
  const ranges: { head: string | null; from: number; to: number }[] = [];
  let current: { head: string | null; from: number; to: number; seen: Set<string> } | null = null;
  withText.forEach((page, i) => {
    const head = headAt(page);
    const n = page.page ?? i + 1;
    if (!current) {
      current = { head, from: n, to: n, seen: new Set(head ? [head] : []) };
      return;
    }
    // Verso and recto heads alternate; a new head must hold for two pages to start a section.
    if (head && !current.seen.has(head) && headAt(withText[i + 1]) === head) {
      ranges.push(current);
      current = { head, from: n, to: n, seen: new Set([head]) };
      return;
    }
    if (head) current.seen.add(head);
    current.to = n;
  });
  if (current) ranges.push(current);
  return ranges.map((range) => ({
    title: range.head,
    chapter: range.head,
    lines: lines.filter((l) => l.page !== null && l.page >= range.from && l.page <= range.to),
  }));
}

/** Join PDF lines into paragraphs, keeping the pages each paragraph spans. */
function pdfParagraphs(lines: readonly Line[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let buffer: string[] = [];
  let pageStart: number | null = null;
  let pageEnd: number | null = null;
  const flush = () => {
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (text) paragraphs.push({ text, pageStart, pageEnd });
    buffer = [];
  };
  lines.forEach((line, i) => {
    if (buffer.length === 0) pageStart = line.page;
    pageEnd = line.page;
    buffer.push(line.text);
    const next = lines[i + 1];
    const endsSentence = SENTENCE_END.test(line.text);
    const shortAndFinished = endsSentence && line.text.length < 72;
    // A finished sentence at a page break ends the paragraph, so citations stay one page wide.
    const pageBreak = Boolean(next && next.page !== line.page && endsSentence);
    if (!next || shortAndFinished || pageBreak || buffer.join(" ").length > 1400) flush();
  });
  flush();
  return paragraphs;
}

/** Remove Markdown syntax that would be noise in a quoted passage. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|[.,;:!?]|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/**
 * Markdown and plain text: blank lines separate paragraphs, a line break
 * after a finished sentence separates items, and headings are `#` lines
 * (Markdown) or short heading-like lines standing alone (plain text).
 */
function textSections(pages: readonly SourcePage[], markdown: boolean): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: null, chapter: null, lines: [], paragraphs: [] };
  let chapter: string | null = null;
  let topLevelSeen = false;

  const startSection = (title: string, isChapter: boolean) => {
    if (isChapter) chapter = title;
    if ((current.paragraphs ?? []).length > 0) sections.push(current);
    current = { title, chapter, lines: [], paragraphs: [] };
  };

  for (const page of pages) {
    const blocks = page.text.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
    blocks.forEach((block, blockIndex) => {
      const rawLines = block.split("\n").map((l) => l.replace(/\s+$/g, "")).filter((l) => l.trim());
      let buffer: string[] = [];
      const flush = () => {
        const text = stripInlineMarkdown(buffer.join(" ").replace(/\s+/g, " ").trim());
        if (text) current.paragraphs!.push({ text, pageStart: page.page, pageEnd: page.page });
        buffer = [];
      };
      rawLines.forEach((raw, i) => {
        const line = raw.trim();
        const heading = markdown ? /^#{1,6}\s+(.+?)\s*#*$/.exec(line) : null;
        if (heading) {
          flush();
          const level = line.match(/^#+/)![0].length;
          const title = stripInlineMarkdown(heading[1]);
          // The first top-level heading is the document's title; later ones are chapters.
          const isChapter = level === 1 && topLevelSeen;
          if (level === 1) topLevelSeen = true;
          startSection(title, isChapter);
          return;
        }
        const isList = /^([-*+•]|\d{1,2}[.)])\s+/.test(line);
        if (!markdown && rawLines.length === 1 && blockIndex < blocks.length - 1 && (chapterOf(line) || looksLikeHeading(line) || isCaselessHeading(line))) {
          startSection(line, chapterOf(line));
          return;
        }
        if (isList) {
          flush();
          buffer.push(line.replace(/^([-*+•]|\d{1,2}[.)])\s+/, ""));
          flush();
          return;
        }
        buffer.push(line);
        if (SENTENCE_END.test(line) && rawLines[i + 1] !== undefined && /^[-*+•\d\p{L}„"(]/u.test(rawLines[i + 1].trim())) flush();
      });
      flush();
    });
  }
  if ((current.paragraphs ?? []).length > 0) sections.push(current);
  return sections;
}

/* --------------------------------- chunks --------------------------------- */

function chunkSection(section: Section, qualityByPage: Map<number, number> | null, headsByPage: Map<number, string[]>, start: number): IngestedChunk[] {
  const paragraphs = section.paragraphs ?? pdfParagraphs(section.lines);
  const chunks: IngestedChunk[] = [];
  const headingTerms = contentTerms(`${section.title ?? ""} ${section.chapter && section.chapter !== section.title ? section.chapter : ""}`);
  let buffer: Paragraph[] = [];
  let size = 0;

  const build = (items: Paragraph[]): IngestedChunk => {
    const spans: Span[] = [];
    let offset = 0;
    for (const p of items) {
      spans.push({ start: offset, end: offset + p.text.length, pageStart: p.pageStart, pageEnd: p.pageEnd });
      offset += p.text.length + 2;
    }
    const text = items.map((p) => p.text).join("\n\n");
    const pagesKnown = items.map((p) => p.pageStart).filter((n): n is number => n !== null);
    const pageStart = pagesKnown.length ? Math.min(...pagesKnown) : null;
    const pageEnd = pagesKnown.length ? Math.max(...items.map((p) => p.pageEnd ?? p.pageStart ?? 0)) : null;
    const headTerms: string[] = [];
    let quality: Confidence = "high";
    if (qualityByPage && pageStart !== null && pageEnd !== null) {
      const values: number[] = [];
      for (let p = pageStart; p <= pageEnd; p++) {
        const q = qualityByPage.get(p);
        if (q !== undefined) values.push(q);
        for (const head of headsByPage.get(p) ?? []) headTerms.push(...contentTerms(head));
      }
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0.5;
      quality = avg >= 0.75 ? "high" : avg >= 0.5 ? "medium" : "low";
    }
    return {
      position: 0,
      text,
      section: section.title,
      chapter: section.chapter && section.chapter !== section.title ? section.chapter : null,
      pageStart,
      pageEnd,
      quality,
      terms: [...contentTerms(text), ...headingTerms, ...headTerms],
      spans,
    };
  };

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.map((p) => p.text).join("\n\n");
    // A short leftover joins the passage before it rather than standing alone.
    if (text.length < MIN && chunks.length > 0) {
      const previous = chunks.pop()!;
      const merged = build([...previousParagraphs(previous), ...buffer]);
      chunks.push(merged);
    } else chunks.push(build(buffer));
    buffer = [];
    size = 0;
  };

  for (const paragraph of paragraphs) {
    // An oversized paragraph becomes its own passage rather than being cut mid-sentence.
    if (paragraph.text.length > MAX && buffer.length > 0) flush();
    buffer.push(paragraph);
    size += paragraph.text.length;
    if (size >= TARGET) flush();
  }
  flush();
  return chunks.map((chunk, i) => ({ ...chunk, position: start + i }));
}

/** The paragraphs a chunk was built from, recovered from its spans. */
function previousParagraphs(chunk: IngestedChunk): Paragraph[] {
  return chunk.spans.map((span) => ({ text: chunk.text.slice(span.start, span.end), pageStart: span.pageStart, pageEnd: span.pageEnd }));
}

/* ------------------------------- the pipeline ------------------------------ */

export function ingestDocument(pages: readonly SourcePage[], format: DocumentFormat): IngestResult {
  const allText = pages.map((p) => p.text).join("\n");
  const language = textLanguage(allText);

  if (format === "pdf") {
    const { cleaned, removed, dehyphenated } = cleanPdfPages(pages);
    const qualityByPage = new Map(cleaned.filter((p) => p.page !== null).map((p) => [p.page as number, p.quality]));
    const headsByPage = new Map(cleaned.filter((p) => p.page !== null && p.heads.length).map((p) => [p.page as number, p.heads]));
    // Letter soup is reported below, not indexed as if it were knowledge.
    const sections = pdfSections(cleaned.map((p) => (p.quality < 0.35 ? { ...p, text: "" } : p)));
    const chunks: IngestedChunk[] = [];
    for (const section of sections) chunks.push(...chunkSection(section, qualityByPage, headsByPage, chunks.length));

    const emptyPages = cleaned.filter((p) => !p.text.trim()).map((p) => p.page as number);
    const lowQualityPages = cleaned.filter((p) => p.text.trim() && p.quality < 0.5).map((p) => p.page as number);
    const qualityScore = cleaned.length ? cleaned.reduce((sum, p) => sum + p.quality, 0) / cleaned.length : 0;
    const quality: ExtractionQuality = qualityScore >= 0.75 ? "good" : qualityScore >= 0.5 ? "fair" : qualityScore > 0.15 ? "poor" : "failed";
    const warnings: IngestWarning[] = [];
    if (emptyPages.length) warnings.push({ code: "empty_pages", pages: emptyPages.slice(0, 50) });
    if (lowQualityPages.length) warnings.push({ code: "low_quality_pages", pages: lowQualityPages.slice(0, 50) });
    if (quality === "poor" || quality === "failed") warnings.push({ code: "needs_ocr" });
    if (removed.length) warnings.push({ code: "running_text_removed", sample: removed.slice(0, 3) });
    return {
      chunks,
      language,
      report: { pageCount: pages.length, emptyPages, lowQualityPages, qualityScore, quality, warnings, dehyphenated, sections: sections.filter((s) => s.title).length },
    };
  }

  const markdown = format === "markdown" || pages.some((p) => /^#{1,6}\s+\S/m.test(p.text));
  const sections = textSections(pages, markdown);
  const chunks: IngestedChunk[] = [];
  for (const section of sections) chunks.push(...chunkSection(section, null, new Map(), chunks.length));
  const usable = allText.replace(/\s+/g, " ").trim().length > 20;
  return {
    chunks,
    language,
    report: {
      pageCount: pages.every((p) => p.page === null) ? null : pages.length,
      emptyPages: [],
      lowQualityPages: [],
      qualityScore: usable ? 1 : 0,
      quality: usable ? "good" : "failed",
      warnings: [],
      dehyphenated: 0,
      sections: sections.filter((s) => s.title).length,
    },
  };
}

/**
 * The pages a sentence inside a chunk actually occupies — tighter than the
 * chunk's own range when the chunk spans two pages.
 */
export function pagesForSentence(chunk: Pick<IngestedChunk, "text" | "spans" | "pageStart" | "pageEnd">, sentence: string): { pageStart: number | null; pageEnd: number | null } {
  const offset = chunk.text.indexOf(sentence.slice(0, 40));
  if (offset < 0 || chunk.spans.length === 0) return { pageStart: chunk.pageStart, pageEnd: chunk.pageEnd };
  const end = offset + sentence.length;
  const touched = chunk.spans.filter((span) => span.start < end && span.end > offset && span.pageStart !== null);
  if (touched.length === 0) return { pageStart: chunk.pageStart, pageEnd: chunk.pageEnd };
  return {
    pageStart: Math.min(...touched.map((s) => s.pageStart as number)),
    pageEnd: Math.max(...touched.map((s) => (s.pageEnd ?? s.pageStart) as number)),
  };
}
