import "server-only";
import { getDb, parseJson } from "@/lib/db";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";
import { isStaff, type CurrentUser } from "@/lib/auth/session";
import { lessonContentSchema } from "@/lib/domain/schemas";
import { ftsQuery, isTypoOf, surfaceForms, textLanguage, uniqueTerms } from "@/lib/knowledge/language";
import { expandTerms, type ExpandedTerm } from "@/lib/knowledge/synonyms";
import { ingestDocument, type Confidence, type Span } from "@/lib/knowledge/ingest";
import { extractKnowledge, type KnowledgeType, type RelationKind } from "@/lib/knowledge/knowledge";
import { visibilityClause } from "./material-access";

/**
 * Search over everything a person may learn from: the materials they may see
 * and the published lessons (their explanations and examples — never
 * activities, answers or solutions).
 *
 * Scope is applied before scoring, so "only this material" is a guarantee,
 * not a preference. Candidates come from the FTS5 index over stemmed terms
 * (materials) and an in-memory index (lessons); both are then scored the same
 * way: BM25 over stems, how much of the question a passage covers, a boost
 * when the question names the passage's section, the passage's extraction
 * quality, and a slight preference for the question's language.
 */

export type SourceKind = "material" | "lesson";

export interface Passage {
  id: string;
  kind: SourceKind;
  sourceId: string;
  sourceTitle: string;
  subject: Subject;
  section: string | null;
  chapter: string | null;
  /** Only ever a page printed in the source; null when it has none. */
  pageStart: number | null;
  pageEnd: number | null;
  text: string;
  spans: Span[];
  language: string | null;
  quality: Confidence;
  href: string;
  score: number;
  /** Query stems this passage contains. */
  matched: string[];
  /** Share of the question's words (or their equivalents) this passage contains. */
  coverage: number;
}

export interface KnowledgeHit {
  id: string;
  type: KnowledgeType;
  term: string | null;
  content: string;
  confidence: Confidence;
  passageId: string;
  kind: SourceKind;
  sourceId: string;
  sourceTitle: string;
  subject: Subject;
  section: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  href: string;
  relation: RelationKind | null;
  /** The item this one answers, challenges or illustrates. */
  relatedTo: { type: KnowledgeType; content: string } | null;
  /** Found because it responds to a matching item, not by its own words. */
  viaRelation: boolean;
}

export interface QueryTerm {
  stem: string;
  surface: string;
  found: boolean;
}

export interface SearchResult {
  passages: Passage[];
  knowledge: KnowledgeHit[];
  terms: QueryTerm[];
  searched: { materials: number; lessons: number };
}

export interface SearchScope {
  subject?: Subject;
  materialIds?: string[];
  /** Include published lessons (default: yes, unless materials are named). */
  includeLessons?: boolean;
}

const K1 = 1.5;
const B = 0.75;
const QUALITY: Record<Confidence, number> = { high: 1, medium: 0.85, low: 0.55 };

/* ------------------------------ lesson index ------------------------------ */

interface IndexedUnit {
  passage: Omit<Passage, "score" | "matched" | "href" | "coverage">;
  terms: string[];
  tf: Map<string, number>;
  bigrams: Set<string>;
  sectionTerms: Set<string>;
}

interface LessonKnowledge {
  id: string;
  passageId: string;
  type: KnowledgeType;
  term: string | null;
  content: string;
  confidence: Confidence;
  section: string | null;
  terms: string[];
  relatesTo: string | null;
  relation: RelationKind | null;
}

interface LessonIndex {
  signature: string;
  units: IndexedUnit[];
  knowledge: LessonKnowledge[];
  df: Map<string, number>;
  totalLength: number;
}

const g = globalThis as typeof globalThis & { __fcLessonIndex?: LessonIndex };

function unitFrom(passage: IndexedUnit["passage"], terms: string[]): IndexedUnit {
  const tf = new Map<string, number>();
  for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
  const bigrams = new Set<string>();
  for (let i = 0; i + 1 < terms.length; i++) bigrams.add(`${terms[i]} ${terms[i + 1]}`);
  return { passage, terms, tf, bigrams, sectionTerms: new Set(uniqueTerms(`${passage.section ?? ""} ${passage.chapter ?? ""}`)) };
}

/** Published lessons as searchable passages; rebuilt only when lessons change. */
function lessonIndex(): LessonIndex {
  const db = getDb();
  const sig = db.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(updated_at), 0) AS u, COALESCE(SUM(LENGTH(content)), 0) AS s FROM lessons WHERE status = 'published'").get() as { n: number; u: number; s: number };
  const signature = `${sig.n}:${sig.u}:${sig.s}`;
  if (g.__fcLessonIndex?.signature === signature) return g.__fcLessonIndex;

  const rows = db.prepare("SELECT id, title, subject, language, content FROM lessons WHERE status = 'published'").all() as { id: string; title: string; subject: Subject; language: ContentLanguage; content: string }[];
  const units: IndexedUnit[] = [];
  const knowledge: LessonKnowledge[] = [];
  for (const row of rows) {
    const content = lessonContentSchema.safeParse(parseJson(row.content, {}));
    if (!content.success) continue;
    // Only what students read in the lesson: section titles and texts.
    const text = [`# ${row.title}`, ...content.data.sections.filter((s) => s.body.trim()).map((s) => `## ${s.title.replace(/\n/g, " ")}\n\n${s.body}`)].join("\n\n");
    const { chunks } = ingestDocument([{ page: null, text }], "markdown");
    const items = extractKnowledge(chunks);
    const passageIds = new Map<number, string>();
    for (const chunk of chunks) {
      const id = `l:${row.id}:${chunk.position}`;
      passageIds.set(chunk.position, id);
      units.push(
        unitFrom(
          {
            id,
            kind: "lesson",
            sourceId: row.id,
            sourceTitle: row.title,
            subject: row.subject,
            section: chunk.section === row.title ? null : chunk.section,
            chapter: null,
            pageStart: null,
            pageEnd: null,
            text: chunk.text,
            spans: chunk.spans,
            language: row.language,
            quality: "high",
          },
          chunk.terms,
        ),
      );
    }
    const itemIds = items.map((_, i) => `lk:${row.id}:${i}`);
    items.forEach((item, i) => {
      knowledge.push({
        id: itemIds[i],
        passageId: passageIds.get(item.chunkPosition)!,
        type: item.type,
        term: item.term,
        content: item.content,
        confidence: item.confidence,
        section: item.section === row.title ? null : item.section,
        terms: item.terms,
        relatesTo: item.relatesTo !== null ? itemIds[item.relatesTo] : null,
        relation: item.relation,
      });
    });
  }
  const df = new Map<string, number>();
  let totalLength = 0;
  for (const unit of units) {
    totalLength += unit.terms.length;
    for (const t of unit.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }
  g.__fcLessonIndex = { signature, units, knowledge, df, totalLength };
  return g.__fcLessonIndex;
}

/** Test hook: forget the cached lesson index. */
export function resetLessonIndexForTests(): void {
  g.__fcLessonIndex = undefined;
}

/* -------------------------------- search -------------------------------- */

interface MaterialRow {
  id: number;
  material_id: string;
  title: string;
  subject: Subject;
  mime_type: string;
  language: string | null;
  page: number | null;
  page_end: number | null;
  section: string | null;
  chapter: string | null;
  quality: Confidence;
  content: string;
  stems: string;
  spans: string;
}

function materialHref(row: { material_id: string; mime_type: string; page: number | null }): string {
  const base = `/api/materials/${row.material_id}/file`;
  return row.mime_type === "application/pdf" && row.page ? `${base}#page=${row.page}` : base;
}

function lessonHref(user: CurrentUser, lessonId: string): string {
  return isStaff(user) ? `/teacher/lessons/${lessonId}/preview` : `/student/learn/${lessonId}`;
}

export function searchKnowledge(user: CurrentUser, query: string, scope: SearchScope = {}, options: { limit?: number } = {}): SearchResult {
  const db = getDb();
  const limit = options.limit ?? 6;
  const queryTerms = uniqueTerms(query).slice(0, 16);
  const surfaces = surfaceForms(query);
  const includeLessons = scope.includeLessons ?? !scope.materialIds?.length;
  const empty: SearchResult = { passages: [], knowledge: [], terms: queryTerms.map((stem) => ({ stem, surface: surfaces.get(stem) ?? stem, found: false })), searched: { materials: 0, lessons: 0 } };

  // --- which sources are in scope ------------------------------------------
  const vis = visibilityClause(user);
  const where = [vis.sql, "m.text_status = 'indexed'"];
  const params: (string | number)[] = [...vis.params];
  if (scope.subject) {
    where.push("m.subject = ?");
    params.push(scope.subject);
  }
  if (scope.materialIds?.length) {
    where.push(`m.id IN (${scope.materialIds.map(() => "?").join(",")})`);
    params.push(...scope.materialIds);
  }
  const materialCount = (db.prepare(`SELECT COUNT(*) AS n FROM materials m WHERE ${where.join(" AND ")}`).get(...params) as { n: number }).n;
  const lessons = includeLessons ? lessonIndex() : null;
  const lessonUnits = lessons ? lessons.units.filter((u) => !scope.subject || u.passage.subject === scope.subject) : [];
  const searched = { materials: materialCount, lessons: new Set(lessonUnits.map((u) => u.passage.sourceId)).size };
  if (queryTerms.length === 0) return { ...empty, searched };

  // --- expand the question: typos, then equivalents in the other language ----
  const vocabDf = (terms: string[]) => {
    const out = new Map<string, number>();
    if (terms.length === 0) return out;
    const rows = db.prepare(`SELECT term, doc FROM material_stems_vocab WHERE term IN (${terms.map(() => "?").join(",")})`).all(...terms) as { term: string; doc: number }[];
    for (const r of rows) out.set(r.term, r.doc);
    return out;
  };
  const knownDf = vocabDf(queryTerms);
  const expanded: ExpandedTerm[] = expandTerms(queryTerms);
  for (const term of queryTerms) {
    if ((knownDf.get(term) ?? 0) > 0 || (lessons?.df.get(term) ?? 0) > 0 || term.length < 5) continue;
    const prefix = term.slice(0, 2);
    const candidates = new Set<string>();
    for (const r of db.prepare("SELECT term FROM material_stems_vocab WHERE term >= ? AND term < ? LIMIT 800").all(prefix, `${prefix}￿`) as { term: string }[]) candidates.add(r.term);
    if (lessons) for (const t of lessons.df.keys()) if (t.startsWith(prefix)) candidates.add(t);
    for (const candidate of candidates) {
      if (candidate !== term && isTypoOf(term, candidate) && !expanded.some((e) => e.term === candidate)) expanded.push({ term: candidate, weight: 0.8, source: term });
    }
  }
  const allTerms = expanded.map((e) => e.term);
  const materialDf = vocabDf(allTerms);
  const stats = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(term_count), 0) AS len FROM material_chunks").get() as { n: number; len: number };
  const total = stats.n + (lessons?.units.length ?? 0);
  const avgLength = Math.max(1, (stats.len + (lessons?.totalLength ?? 0)) / Math.max(1, total));
  const idf = (term: string) => {
    const df = (materialDf.get(term) ?? 0) + (lessons?.df.get(term) ?? 0);
    return Math.log(1 + (total - df + 0.5) / (df + 0.5));
  };

  // --- candidates ---------------------------------------------------------------
  const units: IndexedUnit[] = [];
  const hrefs = new Map<string, string>();
  const fts = materialCount > 0 ? ftsQuery(allTerms) : null;
  if (fts) {
    const rows = db
      .prepare(
        `SELECT c.id, c.material_id, m.title, m.subject, m.mime_type, m.language, c.page, c.page_end, c.section, c.chapter, c.quality, c.content, c.stems, c.spans
           FROM material_chunks_fts f
           JOIN material_chunks c ON c.id = f.rowid
           JOIN materials m ON m.id = c.material_id
          WHERE material_chunks_fts MATCH ? AND ${where.join(" AND ")}
          ORDER BY bm25(material_chunks_fts) LIMIT 80`,
      )
      .all(fts, ...params) as MaterialRow[];
    for (const row of rows) {
      const id = `m:${row.id}`;
      hrefs.set(id, materialHref(row));
      units.push(
        unitFrom(
          {
            id,
            kind: "material",
            sourceId: row.material_id,
            sourceTitle: row.title,
            subject: row.subject,
            section: row.section,
            chapter: row.chapter,
            pageStart: row.page,
            pageEnd: row.page_end ?? row.page,
            text: row.content,
            spans: parseJson<Span[]>(row.spans, []),
            language: row.language,
            quality: row.quality,
          },
          row.stems.split(" ").filter(Boolean),
        ),
      );
    }
  }
  const termSet = new Set(allTerms);
  for (const unit of lessonUnits) {
    if (unit.terms.some((t) => termSet.has(t))) {
      units.push(unit);
      hrefs.set(unit.passage.id, lessonHref(user, unit.passage.sourceId));
    }
  }

  // --- scoring ------------------------------------------------------------------
  const questionLanguage = textLanguage(query);
  const bySource = new Map<string, ExpandedTerm[]>();
  for (const e of expanded) bySource.set(e.source, [...(bySource.get(e.source) ?? []), e]);
  const queryBigrams = queryTerms.slice(0, -1).map((t, i) => `${t} ${queryTerms[i + 1]}`);

  const scored = units
    .map((unit) => {
      let raw = 0;
      const matchedSources = new Set<string>();
      const matched: string[] = [];
      const norm = 1 - B + B * (unit.terms.length / avgLength);
      for (const e of expanded) {
        const tf = unit.tf.get(e.term) ?? 0;
        if (tf === 0) continue;
        matched.push(e.term);
        matchedSources.add(e.source);
        raw += e.weight * idf(e.term) * ((tf * (K1 + 1)) / (tf + K1 * norm));
      }
      if (raw === 0) return null;
      const coverage = matchedSources.size / queryTerms.length;
      let score = raw * (0.5 + coverage) * QUALITY[unit.passage.quality];
      if (queryTerms.some((t) => unit.sectionTerms.has(t))) score *= 1.3;
      score *= 1 + 0.15 * Math.min(2, queryBigrams.filter((b) => unit.bigrams.has(b)).length);
      if ((questionLanguage === "ka" || questionLanguage === "en") && unit.passage.language && unit.passage.language !== questionLanguage && unit.passage.language !== "mixed") score *= 0.85;
      return { unit, score, matched, coverage };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score);

  // Relevance is judged against the best hit: an absolute floor would reject
  // everything in a small library and admit noise in a large one.
  const top = scored[0]?.score ?? 0;
  const kept = scored.filter((s) => s.score >= top * 0.3);
  const passages: Passage[] = kept
    .slice(0, limit)
    .map(({ unit, score, matched, coverage }) => ({ ...unit.passage, href: hrefs.get(unit.passage.id)!, score: Math.round(score * 100) / 100, matched, coverage: Math.round(coverage * 100) / 100 }));

  // --- knowledge items in the candidate passages ------------------------------------
  const knowledge = scoreKnowledge(kept.slice(0, 30).map((k) => k.unit), expanded, queryTerms, idf, lessons, hrefs);

  const foundTerms = new Set([...passages.flatMap((p) => p.matched), ...knowledge.flatMap((k) => uniqueTerms(`${k.content} ${k.section ?? ""}`))]);
  const terms = queryTerms.map((stem) => ({
    stem,
    surface: surfaces.get(stem) ?? stem,
    found: (bySource.get(stem) ?? []).some((e) => foundTerms.has(e.term)),
  }));
  return { passages, knowledge, terms, searched };
}

interface KnowledgeRow {
  id: string;
  chunk_id: number;
  type: KnowledgeType;
  term: string | null;
  content: string;
  confidence: Confidence;
  section: string | null;
  page_start: number | null;
  page_end: number | null;
  stems: string;
  relates_to: string | null;
  relation: RelationKind | null;
}

function scoreKnowledge(
  units: IndexedUnit[],
  expanded: ExpandedTerm[],
  queryTerms: string[],
  idf: (term: string) => number,
  lessons: LessonIndex | null,
  hrefs: Map<string, string>,
): KnowledgeHit[] {
  const db = getDb();
  const unitById = new Map(units.map((u) => [u.passage.id, u]));
  const materialChunkIds = units.filter((u) => u.passage.kind === "material").map((u) => Number(u.passage.id.slice(2)));
  const candidates: { hit: Omit<KnowledgeHit, "relatedTo" | "viaRelation">; terms: string[]; relatesTo: string | null }[] = [];

  const fromRow = (row: KnowledgeRow) => {
    const unit = unitById.get(`m:${row.chunk_id}`);
    if (!unit) return null;
    return {
      hit: {
        id: row.id,
        type: row.type,
        term: row.term,
        content: row.content,
        confidence: row.confidence,
        passageId: unit.passage.id,
        kind: "material" as const,
        sourceId: unit.passage.sourceId,
        sourceTitle: unit.passage.sourceTitle,
        subject: unit.passage.subject,
        section: row.section,
        pageStart: row.page_start,
        pageEnd: row.page_end,
        href: hrefs.get(unit.passage.id)!,
        relation: row.relation,
      },
      terms: row.stems.split(" ").filter(Boolean),
      relatesTo: row.relates_to,
    };
  };

  const rowsById = new Map<string, KnowledgeRow>();
  if (materialChunkIds.length) {
    const rows = db.prepare(`SELECT * FROM material_knowledge WHERE chunk_id IN (${materialChunkIds.map(() => "?").join(",")})`).all(...materialChunkIds) as KnowledgeRow[];
    for (const row of rows) {
      rowsById.set(row.id, row);
      const c = fromRow(row);
      if (c) candidates.push(c);
    }
  }
  const lessonItems = new Map<string, LessonKnowledge>();
  if (lessons) {
    for (const item of lessons.knowledge) {
      lessonItems.set(item.id, item);
      const unit = unitById.get(item.passageId);
      if (!unit) continue;
      candidates.push({
        hit: {
          id: item.id,
          type: item.type,
          term: item.term,
          content: item.content,
          confidence: item.confidence,
          passageId: item.passageId,
          kind: "lesson",
          sourceId: unit.passage.sourceId,
          sourceTitle: unit.passage.sourceTitle,
          subject: unit.passage.subject,
          section: item.section,
          pageStart: null,
          pageEnd: null,
          href: hrefs.get(item.passageId)!,
          relation: item.relation,
        },
        terms: item.terms,
        relatesTo: item.relatesTo,
      });
    }
  }

  const confidenceRank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  const scored = candidates
    .map((c) => {
      const set = new Set(c.terms);
      const sources = new Set<string>();
      let score = 0;
      for (const e of expanded) {
        if (!set.has(e.term)) continue;
        sources.add(e.source);
        score += e.weight * idf(e.term);
      }
      // Naming an item's section is a stronger signal than sharing a word with it.
      if (c.hit.section && queryTerms.some((t) => uniqueTerms(c.hit.section!).includes(t))) score *= 2;
      return { c, score, coverage: sources.size / queryTerms.length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || confidenceRank[a.c.hit.confidence] - confidenceRank[b.c.hit.confidence]);

  const top = scored[0]?.score ?? 0;
  const chosen = scored.filter((x) => x.coverage >= 0.34 || x.score >= top * 0.6).slice(0, 12);
  const chosenIds = new Set(chosen.map((x) => x.c.hit.id));

  const related = (id: string | null): KnowledgeHit["relatedTo"] => {
    if (!id) return null;
    const row = rowsById.get(id) ?? (db.prepare("SELECT * FROM material_knowledge WHERE id = ?").get(id) as KnowledgeRow | undefined);
    if (row) return { type: row.type, content: row.content };
    const item = lessonItems.get(id);
    return item ? { type: item.type, content: item.content } : null;
  };

  const out: KnowledgeHit[] = chosen.map((x) => ({ ...x.c.hit, relatedTo: related(x.c.relatesTo), viaRelation: false }));
  // Objections, replies and examples that answer a chosen item come along even without shared words.
  for (const c of candidates) {
    if (out.length >= 16) break;
    if (!chosenIds.has(c.hit.id) && c.relatesTo && chosenIds.has(c.relatesTo)) out.push({ ...c.hit, relatedTo: related(c.relatesTo), viaRelation: true });
  }
  return out;
}
