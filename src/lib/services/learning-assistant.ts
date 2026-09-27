import "server-only";
import { z } from "zod";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { SUBJECTS, type Subject } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { getAIProvider, withAIStatus } from "@/lib/ai";
import { EDUCATIONAL_GUARDRAILS, detectLanguage, languageInstruction } from "@/lib/ai/prompts";
import { clip, hasNegation, splitSentences, stem, tokens, uniqueTerms } from "@/lib/knowledge/language";
import { checkUnderstanding, validateClaims, type CheckedClaim, type UnderstandingStatus } from "@/lib/knowledge/grounding";
import { assumptionsFor, soundsLikeOpinion, statementTypes, type AssumptionId, type StatementType } from "@/lib/knowledge/reasoning";
import { suggestQuestions, type QuestionKind } from "@/lib/knowledge/questions";
import type { KnowledgeType } from "@/lib/knowledge/knowledge";
import { searchKnowledge, type KnowledgeHit, type Passage, type QueryTerm } from "./knowledge-search";
import { getMaterial } from "./materials";
import { addItem, createResearchProject } from "@/lib/labs/research/service";

/**
 * The Learning Assistant: learning tasks over the school's own materials
 * and lessons.
 *
 * Every task works without AI. What is shown as coming from the material is
 * always the material's own text, with its source, section and — only when
 * the source has them — pages. When AI is configured, "explain" may add a
 * short explanation; each of its sentences is checked against the passages
 * and labelled accordingly, and a sentence the passages do not carry is shown
 * as such. With nothing found, nothing is generated.
 */

export const ASSISTANT_MODES = ["explain", "locate", "evidence", "check", "questions", "research"] as const;
export type AssistantMode = (typeof ASSISTANT_MODES)[number];

export const assistantRequestSchema = z.object({
  mode: z.enum(ASSISTANT_MODES),
  /** The question, topic or statement; for "check", what the student understood. */
  text: z.string().trim().min(2).max(2000),
  /** For "check": the topic the understanding is about (optional). */
  topic: z.string().trim().max(300).default(""),
  materialId: z.string().trim().max(40).optional(),
  subject: z.enum(SUBJECTS).optional(),
  useAI: z.boolean().default(true),
});
export type AssistantRequest = z.input<typeof assistantRequestSchema>;

export interface SourceRef {
  kind: Passage["kind"];
  sourceId: string;
  sourceTitle: string;
  subject: Subject;
  section: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  href: string;
}

export interface NumberedPassage extends SourceRef {
  n: number;
  text: string;
  /** The sentence that best matches the question (at most 280 characters). */
  excerpt: string;
  /** Words in the excerpt that match the question, for highlighting. */
  highlights: string[];
}

export interface KeyItem {
  type: KnowledgeType;
  term: string | null;
  content: string;
  n: number;
  pageStart: number | null;
  pageEnd: number | null;
  relatedTo: { type: KnowledgeType; content: string } | null;
}

export interface ExplainAI {
  status: "used" | "off" | "failed" | "not_needed";
  claims: (Omit<CheckedClaim, "evidence"> & { sources: number[] })[];
  covered: boolean;
  checkQuestion: string;
}

export interface AssistantResult {
  mode: AssistantMode;
  query: string;
  scope: { materialId: string | null; materialTitle: string | null; subject: Subject | null };
  searched: { materials: number; lessons: number };
  terms: QueryTerm[];
  found: boolean;
  passages: NumberedPassage[];
  key: KeyItem[];
  ai: ExplainAI | null;
  statement: { types: StatementType[]; assumptions: AssumptionId[]; opinion: boolean; supporting: { n: number; sentence: string; mayContradict: boolean }[]; otherViews: KeyItem[] } | null;
  checks: { sentence: string; status: UnderstandingStatus; match: { n: number; text: string } | null }[] | null;
  questions: { kind: QuestionKind; subject: string; n: number | null }[] | null;
  research: { questions: { kind: ResearchQuestionKind; subject: string }[]; sources: (SourceRef & { passages: number[] })[]; gaps: string[] } | null;
}

export type ResearchQuestionKind = "what_known" | "how_works" | "why_matters" | "compare_views" | "evidence_strength";

/* ------------------------------- helpers -------------------------------- */

/** The sentence of a passage that best matches the question, and the words to highlight. */
export function bestExcerpt(text: string, queryStems: ReadonlySet<string>, cap = 280): { excerpt: string; highlights: string[] } {
  const sentences = splitSentences(text, { min: 8, max: 2000 });
  const pool = sentences.length ? sentences : [text];
  let best = pool[0];
  let bestScore = -1;
  for (const sentence of pool) {
    const score = uniqueTerms(sentence).filter((t) => queryStems.has(t)).length;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  const excerpt = clip(best, cap);
  const highlights = [...new Set(tokens(excerpt).filter((t) => t.length > 1 && queryStems.has(stem(t))))];
  return { excerpt, highlights };
}

function refOf(p: Passage | KnowledgeHit): SourceRef {
  return { kind: p.kind, sourceId: p.sourceId, sourceTitle: p.sourceTitle, subject: p.subject, section: p.section, pageStart: p.pageStart, pageEnd: p.pageEnd, href: p.href };
}

const KEY_ORDER: KnowledgeType[] = ["definition", "formula", "example", "argument", "claim", "distinction", "thought_experiment", "objection", "reply", "counterargument"];

interface Gathered {
  passages: NumberedPassage[];
  byPassageId: Map<string, number>;
  knowledge: KnowledgeHit[];
  terms: QueryTerm[];
  searched: AssistantResult["searched"];
  stems: Set<string>;
  all: Passage[];
}

function gather(user: CurrentUser, query: string, scope: { materialId?: string; subject?: Subject }, limit: number): Gathered {
  const result = searchKnowledge(user, query, { subject: scope.subject, materialIds: scope.materialId ? [scope.materialId] : undefined }, { limit: limit + 4 });
  const stems = new Set(uniqueTerms(query));
  for (const t of result.terms) stems.add(t.stem);
  const passages: NumberedPassage[] = [];
  const byPassageId = new Map<string, number>();
  const add = (p: Passage) => {
    if (byPassageId.has(p.id)) return byPassageId.get(p.id)!;
    const n = passages.length + 1;
    byPassageId.set(p.id, n);
    passages.push({ ...refOf(p), n, text: p.text, ...bestExcerpt(p.text, stems) });
    return n;
  };
  for (const p of result.passages.slice(0, limit)) add(p);
  // Knowledge found in a passage outside the first few still needs its passage shown.
  const extra = new Map(result.passages.map((p) => [p.id, p]));
  for (const item of result.knowledge) {
    if (!byPassageId.has(item.passageId) && extra.has(item.passageId) && passages.length < limit + 2) add(extra.get(item.passageId)!);
  }
  const knowledge = result.knowledge.filter((k) => byPassageId.has(k.passageId));
  return { passages, byPassageId, knowledge, terms: result.terms, searched: result.searched, stems, all: result.passages };
}

function keyItems(g: Gathered, types: KnowledgeType[], max: number): KeyItem[] {
  return g.knowledge
    .filter((k) => types.includes(k.type))
    .sort((a, b) => KEY_ORDER.indexOf(a.type) - KEY_ORDER.indexOf(b.type))
    .slice(0, max)
    .map((k) => ({ type: k.type, term: k.term, content: k.content, n: g.byPassageId.get(k.passageId)!, pageStart: k.pageStart, pageEnd: k.pageEnd, relatedTo: k.relatedTo }));
}

/* ---------------------------------- AI ---------------------------------- */

const explainSchema = z.object({
  sentences: z
    .array(
      z.object({
        text: z.string().describe("One sentence of the explanation."),
        status: z.enum(["grounded", "inferred", "uncertain"]).describe("grounded: the cited passages say it; inferred: a conclusion from them; uncertain: the passages do not settle it."),
        evidence: z.array(z.string()).describe('Passage ids the sentence rests on, e.g. ["E1"].'),
      }),
    )
    .describe("The explanation, 2–6 short sentences."),
  covered: z.boolean().describe("False when the passages do not explain the topic."),
  checkQuestion: z.string().describe("One short question the student can answer from the passages to test their understanding."),
});

async function explainWithAI(query: string, passages: NumberedPassage[]): Promise<ExplainAI> {
  const language = detectLanguage(query);
  const evidence = passages.slice(0, 6).map((p) => ({ id: `E${p.n}`, text: clip(p.text, 1400) }));
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: [
        EDUCATIONAL_GUARDRAILS,
        "You help a school student understand a topic using ONLY the numbered passages from the school's materials and lessons.",
        "Explain in your own words at a school student's level; do not just copy the passages. Define difficult words using the passages.",
        "For every sentence set its status honestly and cite the passage ids it rests on. Never add facts, names, dates or numbers that are not in the passages.",
        "If the passages do not explain the topic, set covered to false and say in one sentence what is missing.",
        languageInstruction(language),
      ].join("\n\n"),
      prompt: `Topic or question: ${query}\n\nPassages:\n${evidence.map((e) => `[${e.id}] ${e.text}`).join("\n\n")}`,
      schema: explainSchema,
      maxTokens: 2500,
      effort: "low",
      timeoutMs: 45_000,
    }),
  );
  const checked = validateClaims(
    result.sentences.slice(0, 8).map((s) => ({ text: s.text.trim(), status: s.status, evidence: s.evidence })),
    evidence,
  );
  return {
    status: "used",
    covered: result.covered,
    checkQuestion: result.checkQuestion.trim().slice(0, 300),
    claims: checked
      .filter((c) => c.text)
      .map((c) => ({ text: c.text, status: c.status, support: c.support, sources: c.evidence.map((id) => Number(id.slice(1))).filter((n) => passages.some((p) => p.n === n)) })),
  };
}

/* --------------------------------- tasks -------------------------------- */

function researchQuestions(g: Gathered, topic: string): { kind: ResearchQuestionKind; subject: string }[] {
  const subject = clip(topic.replace(/[?？]+$/, ""), 120);
  const term = g.knowledge.find((k) => k.type === "definition" && k.term)?.term ?? subject;
  const out: { kind: ResearchQuestionKind; subject: string }[] = [{ kind: "what_known", subject }];
  out.push({ kind: "how_works", subject: term });
  out.push({ kind: "why_matters", subject: term });
  if (g.knowledge.some((k) => ["objection", "counterargument", "claim", "argument"].includes(k.type)) || new Set(g.passages.map((p) => p.sourceId)).size > 1) {
    out.push({ kind: "compare_views", subject });
  }
  out.push({ kind: "evidence_strength", subject });
  return out;
}

export async function runAssistant(user: CurrentUser, raw: AssistantRequest): Promise<AssistantResult> {
  const input = assistantRequestSchema.parse(raw);
  // Only materials this person may see can be named as a scope.
  const material = input.materialId ? getMaterial(input.materialId, user) : null;
  const scope = { materialId: material?.id, subject: material ? undefined : input.subject };
  const query = input.mode === "check" && input.topic ? input.topic : input.text;
  const g = gather(user, input.mode === "check" && input.topic ? `${input.topic} ${input.text}` : query, scope, input.mode === "locate" ? 6 : 5);
  const found = g.passages.length > 0;

  const result: AssistantResult = {
    mode: input.mode,
    query,
    scope: { materialId: material?.id ?? null, materialTitle: material?.title ?? null, subject: scope.subject ?? null },
    searched: g.searched,
    terms: g.terms,
    found,
    passages: g.passages,
    key: [],
    ai: null,
    statement: null,
    checks: null,
    questions: null,
    research: null,
  };

  switch (input.mode) {
    case "explain": {
      result.key = keyItems(g, ["definition", "formula", "example", "argument", "claim", "distinction"], 4);
      if (!found) {
        result.ai = { status: "not_needed", claims: [], covered: false, checkQuestion: "" };
        break;
      }
      if (!input.useAI || !getAIProvider()) {
        result.ai = { status: "off", claims: [], covered: true, checkQuestion: "" };
        break;
      }
      try {
        result.ai = await explainWithAI(query, g.passages);
      } catch {
        result.ai = { status: "failed", claims: [], covered: true, checkQuestion: "" };
      }
      break;
    }
    case "locate":
      break;
    case "evidence": {
      const statementTerms = new Set(uniqueTerms(input.text));
      const supporting: { n: number; sentence: string; mayContradict: boolean; ratio: number }[] = [];
      for (const p of g.passages) {
        for (const sentence of splitSentences(p.text, { min: 8 })) {
          const terms = uniqueTerms(sentence);
          const shared = terms.filter((t) => statementTerms.has(t)).length;
          const ratio = statementTerms.size ? shared / statementTerms.size : 0;
          if (shared >= Math.min(2, statementTerms.size) && ratio >= 0.4) {
            supporting.push({ n: p.n, sentence, mayContradict: hasNegation(sentence) !== hasNegation(input.text), ratio });
          }
        }
      }
      supporting.sort((a, b) => b.ratio - a.ratio);
      result.statement = {
        types: statementTypes(input.text),
        assumptions: assumptionsFor(input.text),
        opinion: soundsLikeOpinion(input.text),
        supporting: supporting.slice(0, 4).map(({ n, sentence, mayContradict }) => ({ n, sentence, mayContradict })),
        otherViews: keyItems(g, ["objection", "counterargument", "reply", "claim", "argument"], 4),
      };
      break;
    }
    case "check": {
      const checks = checkUnderstanding(
        input.text,
        g.passages.map((p) => p.text),
      );
      result.checks = checks.map((c) => ({
        sentence: c.sentence,
        status: c.status,
        match: c.match ? { n: g.passages[c.match.passage].n, text: c.match.text } : null,
      }));
      break;
    }
    case "questions": {
      const sections = [...new Map(g.passages.filter((p) => p.section).map((p) => [p.section!, p.n])).entries()].map(([title, passage]) => ({ title, passage }));
      const suggested = suggestQuestions(
        g.knowledge.map((k) => ({ type: k.type, term: k.term, content: k.content, section: k.section, passage: g.byPassageId.get(k.passageId) ?? null })),
        sections,
      );
      result.questions = [...suggested.map((q) => ({ kind: q.kind, subject: q.subject, n: q.passage })), { kind: "not_covered" as const, subject: clip(query, 120), n: null }];
      break;
    }
    case "research": {
      const sources = new Map<string, SourceRef & { passages: number[] }>();
      for (const p of g.passages) {
        const existing = sources.get(p.sourceId);
        if (existing) existing.passages.push(p.n);
        else sources.set(p.sourceId, { ...p, section: null, pageStart: null, pageEnd: null, passages: [p.n] });
      }
      result.research = {
        questions: researchQuestions(g, query),
        sources: [...sources.values()].map(({ kind, sourceId, sourceTitle, subject, section, pageStart, pageEnd, href, passages }) => ({ kind, sourceId, sourceTitle, subject, section, pageStart, pageEnd, href, passages })),
        gaps: g.terms.filter((t) => !t.found).map((t) => t.surface),
      };
      break;
    }
  }
  return result;
}

/* --------------------------- research hand-off --------------------------- */

export const startResearchSchema = z.object({
  topic: z.string().trim().min(2).max(300),
  question: z.string().trim().min(2).max(600),
  questionType: z.enum(["descriptive", "comparative", "causal", "evaluative"]).default("descriptive"),
  materialId: z.string().trim().max(40).optional(),
  subject: z.enum(SUBJECTS).optional(),
});

const pageLabel = (start: number | null, end: number | null) => (start === null ? "" : end !== null && end !== start ? `${start}–${end}` : String(start));

/**
 * Start a Research Lab project from a topic: the question the student chose,
 * the sources the search found, and the best passages as quotations with the
 * pages they are really on. The passages are looked up again here, so only
 * real text from sources the student may see can become a quotation.
 */
export function startResearch(user: CurrentUser, raw: z.input<typeof startResearchSchema>): { projectId: string } {
  const input = startResearchSchema.parse(raw);
  const material = input.materialId ? getMaterial(input.materialId, user) : null;
  const g = gather(user, input.topic, { materialId: material?.id, subject: material ? undefined : input.subject }, 5);
  const subject = material?.subject ?? input.subject ?? g.passages[0]?.subject ?? "";
  const project = createResearchProject(user, { title: clip(input.topic, 150), subject, data: { topic: input.topic, question: input.question, questionType: input.questionType } });
  const sourceIds = new Map<string, string>();
  for (const p of g.passages) {
    if (sourceIds.has(p.sourceId) || sourceIds.size >= 4) continue;
    const libraryResource = p.kind === "material" ? (getDb().prepare("SELECT id FROM library_resources WHERE material_id = ? LIMIT 1").get(p.sourceId) as { id: string } | undefined) : undefined;
    const author = p.kind === "material" ? ((getDb().prepare("SELECT author FROM materials WHERE id = ?").get(p.sourceId) as { author: string } | undefined)?.author ?? "") : "";
    sourceIds.set(p.sourceId, addItem(project.id, user, "sources", { type: "other", title: p.sourceTitle, authors: author, libraryResourceId: libraryResource?.id ?? null }));
  }
  for (const p of g.passages.slice(0, 3)) {
    const sourceId = sourceIds.get(p.sourceId);
    if (!sourceId) continue;
    addItem(project.id, user, "notes", { kind: "quote", content: p.excerpt, sourceId, page: pageLabel(p.pageStart, p.pageEnd) });
  }
  return { projectId: project.id };
}

/* ----------------------------- saved questions ---------------------------- */

export const saveQuestionSchema = z.object({
  mode: z.enum(ASSISTANT_MODES),
  question: z.string().trim().min(2).max(2000),
  materialId: z.string().trim().max(40).nullable().default(null),
  subject: z.enum(SUBJECTS).nullable().default(null),
  note: z.string().trim().max(2000).default(""),
});

export interface SavedQuestion {
  id: string;
  mode: AssistantMode;
  question: string;
  materialId: string | null;
  materialTitle: string | null;
  subject: Subject | null;
  note: string;
  createdAt: number;
}

export function listSaved(user: CurrentUser): SavedQuestion[] {
  const rows = getDb()
    .prepare("SELECT s.*, m.title AS material_title FROM assistant_saved s LEFT JOIN materials m ON m.id = s.material_id WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 100")
    .all(user.id) as { id: string; mode: AssistantMode; question: string; material_id: string | null; material_title: string | null; subject: Subject | null; note: string; created_at: number }[];
  return rows.map((r) => {
    // A material that is no longer visible to this person is not named.
    let visible = r.material_id !== null;
    if (r.material_id) {
      try {
        getMaterial(r.material_id, user);
      } catch {
        visible = false;
      }
    }
    return {
      id: r.id,
      mode: r.mode,
      question: r.question,
      materialId: visible ? r.material_id : null,
      materialTitle: visible ? r.material_title : null,
      subject: r.subject,
      note: r.note,
      createdAt: r.created_at,
    };
  });
}

export function saveQuestion(user: CurrentUser, raw: z.input<typeof saveQuestionSchema>): SavedQuestion {
  const input = saveQuestionSchema.parse(raw);
  if (input.materialId) getMaterial(input.materialId, user);
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS n FROM assistant_saved WHERE user_id = ?").get(user.id) as { n: number };
  if (count.n >= 200) throw new ApiError(400, "invalid_input", "Too many saved questions.");
  const id = newId();
  db.prepare("INSERT INTO assistant_saved (id, user_id, mode, question, material_id, subject, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    id,
    user.id,
    input.mode,
    input.question,
    input.materialId,
    input.subject,
    input.note,
    now(),
  );
  return listSaved(user).find((s) => s.id === id)!;
}

export function updateSavedNote(user: CurrentUser, id: string, note: string): void {
  const info = getDb().prepare("UPDATE assistant_saved SET note = ? WHERE id = ? AND user_id = ?").run(note.trim().slice(0, 2000), id, user.id);
  if (info.changes === 0) throw new ApiError(404, "not_found");
}

export function deleteSaved(user: CurrentUser, id: string): void {
  const info = getDb().prepare("DELETE FROM assistant_saved WHERE id = ? AND user_id = ?").run(id, user.id);
  if (info.changes === 0) throw new ApiError(404, "not_found");
}
