import "server-only";
import { getDb } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";
import { getMaterial } from "./materials";

/**
 * Reading a school material on the site, from the passages that were indexed
 * for the Learning Assistant: a table of contents, pages, and a search inside
 * the one book. Access follows the material's visibility (`getMaterial`).
 */

/** How many stored passages make one reader page. */
export const READER_PAGE_CHUNKS = 10;
/** A page may run on into the next passages so a dictionary entry is never cut in two. */
const RUN_ON_CHUNKS = 2;

export interface ReaderSection {
  index: number;
  chapter: string | null;
  section: string | null;
  firstPosition: number;
  chunks: number;
  parts: number;
}

export interface ReaderLocation {
  s: number;
  p: number;
}

export interface ReaderPage extends ReaderLocation {
  section: ReaderSection;
  parts: number;
  /** Paragraphs of the page, in order. */
  paragraphs: string[];
  prev: ReaderLocation | null;
  next: ReaderLocation | null;
}

export interface ReaderHit {
  position: number;
  snippet: string;
  chapter: string | null;
  section: string | null;
  at: ReaderLocation;
}

interface ChunkMeta {
  position: number;
  chapter: string | null;
  section: string | null;
}

/** A dictionary entry starts with its headword line: `AFTERNOON /ˌæftərˈnuːn/ • noun • A1`. */
export const HEADWORD_LINE = /^(.+?) (\/.*?) • ([^•]+) • ([ABC][12])$/;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The sections of a material in reading order (consecutive passages with the same chapter and section). */
export function readerOutline(materialId: string, user: CurrentUser): ReaderSection[] {
  getMaterial(materialId, user);
  const rows = getDb().prepare("SELECT position, chapter, section FROM material_chunks WHERE material_id = ? ORDER BY position").all(materialId) as ChunkMeta[];
  const sections: ReaderSection[] = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.chapter === row.chapter && last.section === row.section) {
      last.chunks++;
    } else {
      sections.push({ index: sections.length, chapter: row.chapter, section: row.section, firstPosition: row.position, chunks: 1, parts: 1 });
    }
  }
  for (const s of sections) s.parts = Math.max(1, Math.ceil(s.chunks / READER_PAGE_CHUNKS));
  return sections;
}

function neighbours(outline: ReaderSection[], at: ReaderLocation): { prev: ReaderLocation | null; next: ReaderLocation | null } {
  const section = outline[at.s];
  const prev: ReaderLocation | null = at.p > 0 ? { s: at.s, p: at.p - 1 } : at.s > 0 ? { s: at.s - 1, p: outline[at.s - 1].parts - 1 } : null;
  const next: ReaderLocation | null = at.p < section.parts - 1 ? { s: at.s, p: at.p + 1 } : at.s < outline.length - 1 ? { s: at.s + 1, p: 0 } : null;
  return { prev, next };
}

/** Where a passage position falls in the outline. */
export function locate(outline: ReaderSection[], position: number): ReaderLocation {
  for (let i = outline.length - 1; i >= 0; i--) {
    const s = outline[i];
    if (position >= s.firstPosition) return { s: i, p: Math.min(s.parts - 1, Math.floor((position - s.firstPosition) / READER_PAGE_CHUNKS)) };
  }
  return { s: 0, p: 0 };
}

/** One page of a material. Out-of-range locations are clamped, so a stale link still opens something. */
export function readerPage(materialId: string, user: CurrentUser, wanted: ReaderLocation): ReaderPage | null {
  const outline = readerOutline(materialId, user);
  if (outline.length === 0) return null;
  const s = Math.min(Math.max(0, Math.floor(wanted.s) || 0), outline.length - 1);
  const section = outline[s];
  const p = Math.min(Math.max(0, Math.floor(wanted.p) || 0), section.parts - 1);
  const first = section.firstPosition + p * READER_PAGE_CHUNKS;
  const lastOfSection = section.firstPosition + section.chunks - 1;
  const last = Math.min(lastOfSection, first + READER_PAGE_CHUNKS - 1);
  const read = (from: number, to: number) =>
    (
      getDb().prepare("SELECT content FROM material_chunks WHERE material_id = ? AND position BETWEEN ? AND ? ORDER BY position").all(materialId, from, to) as { content: string }[]
    ).flatMap((r) => splitParagraphs(r.content));

  let paragraphs = read(first, last);
  const entryMode = paragraphs.filter((x) => HEADWORD_LINE.test(x)).length >= 3;
  if (entryMode) {
    // The previous page ran on to finish its last entry, so this one starts at a headword.
    if (p > 0) {
      const start = paragraphs.findIndex((x) => HEADWORD_LINE.test(x));
      if (start > 0) paragraphs = paragraphs.slice(start);
    }
    // Finish the last entry with the start of the next passages of the same section.
    const extra = read(last + 1, Math.min(lastOfSection, last + RUN_ON_CHUNKS));
    const end = extra.findIndex((x) => HEADWORD_LINE.test(x));
    paragraphs = paragraphs.concat(end === -1 ? extra : extra.slice(0, end));
  }
  return { s, p, section, parts: section.parts, paragraphs, ...neighbours(outline, { s, p }) };
}

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Passages of one material that contain the text; headword matches of a dictionary come first. */
export function searchInMaterial(materialId: string, user: CurrentUser, query: string, limit = 40): ReaderHit[] {
  const q = query.trim().replace(/\s+/g, " ");
  if (q.length < 2 || q.length > 80) return [];
  const outline = readerOutline(materialId, user);
  const rows = getDb()
    .prepare("SELECT position, chapter, section, content FROM material_chunks WHERE material_id = ? AND LOWER(content) LIKE ? ESCAPE '\\' ORDER BY position LIMIT 300")
    .all(materialId, `%${escapeLike(q.toLowerCase())}%`) as (ChunkMeta & { content: string })[];
  const headword = new RegExp(`(^|\\n)${escapeRegExp(q)}[ /(]`, "i");
  const ranked = rows
    .map((r) => ({ r, rank: headword.test(r.content) ? 0 : 1 }))
    .sort((a, b) => a.rank - b.rank || a.r.position - b.r.position)
    .slice(0, limit);
  return ranked.map(({ r }) => {
    const head = headword.exec(r.content);
    const text = (head ? r.content.slice(head.index + head[1].length) : r.content).replace(/\s+/g, " ");
    const at = Math.max(0, text.toLowerCase().indexOf(q.toLowerCase()));
    const start = head ? 0 : Math.max(0, at - 70);
    const snippet = `${start > 0 ? "…" : ""}${text.slice(start, at + q.length + 110)}${at + q.length + 110 < text.length ? "…" : ""}`;
    return { position: r.position, snippet, chapter: r.chapter, section: r.section, at: locate(outline, r.position) };
  });
}
