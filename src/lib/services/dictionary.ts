import "server-only";
import { getDb } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";
import type { Subject } from "@/lib/domain/catalog";
import { DictionaryIndex, HEADWORD_LINE, looksSpanish, parseDictionary, type DictEntry, type Level, type MatchKind } from "@/lib/knowledge/dictionary";
import { isGeorgian } from "@/lib/knowledge/language";
import type { TargetLanguage } from "@/lib/knowledge/intent";
import { visibilityClause } from "./material-access";
import { locate, readerOutline, type ReaderSection } from "./material-reader";

/**
 * The dictionaries a person may see, ready to look words up in.
 *
 * A dictionary here is any indexed material written as dictionary entries
 * (headword line, then Spanish / Meaning / Example …); the school's own book is
 * the only one built in, but a teacher's upload in the same layout works too.
 * Visibility is the material's: a dictionary a person cannot open is never
 * searched for them. The parsed index is cached per material and rebuilt when
 * the material's passages change.
 */

export interface WordCard {
  word: string;
  headword: string;
  ipa: string;
  pos: string[];
  level: Level;
  /** The Spanish line as the book prints it. */
  spanish: string;
  translations: { text: string; note: string | null }[];
  meaning: string;
  example: string;
  exampleEs: string;
  common: string[];
  note: string | null;
  source: { materialId: string; title: string; href: string | null };
}

export interface DictionaryMatch {
  card: WordCard;
  how: MatchKind;
  via: string | null;
}

export interface DictionaryResult {
  /** What was looked up. */
  query: string;
  /** "en-es": an English word was typed; "es-en": a Spanish one. */
  direction: "en-es" | "es-en";
  matches: DictionaryMatch[];
  /** Close spellings, when nothing matched. */
  suggestions: { word: string; spanish: string; level: Level }[];
}

export interface WordSuggestion {
  /** What to show: the English headword or the Spanish translation that starts with the typed text. */
  text: string;
  language: "en" | "es";
  word: string;
  spanish: string;
  level: Level;
}

interface Loaded {
  materialId: string;
  title: string;
  subject: Subject;
  resourceId: string | null;
  signature: string;
  index: DictionaryIndex | null;
}

const store = globalThis as typeof globalThis & { __fcDictionaries?: Map<string, Loaded> };
const cache = (store.__fcDictionaries ??= new Map());

/** Test hook: forget every parsed dictionary. */
export function resetDictionariesForTests(): void {
  cache.clear();
}

const MIN_ENTRIES = 20;

function build(materialId: string): DictionaryIndex | null {
  const db = getDb();
  // A quick look at the start first, so a long ordinary book is not parsed to learn that it is not a dictionary.
  const probe = db.prepare("SELECT content FROM material_chunks WHERE material_id = ? ORDER BY position LIMIT 80").all(materialId) as { content: string }[];
  const headwords = probe.flatMap((r) => r.content.split(/\n{2,}/)).filter((p) => HEADWORD_LINE.test(p.replace(/\s+/g, " ").trim())).length;
  if (headwords < 3) return null;
  const chunks = db.prepare("SELECT position, content FROM material_chunks WHERE material_id = ? ORDER BY position").all(materialId) as { position: number; content: string }[];
  const entries = parseDictionary(chunks);
  return entries.length >= MIN_ENTRIES ? new DictionaryIndex(entries) : null;
}

/** The dictionaries this person may open (optionally only one material or subject), parsed. */
function dictionariesFor(user: CurrentUser, scope: { materialId?: string; subject?: Subject } = {}): Loaded[] {
  const vis = visibilityClause(user);
  const where = [vis.sql, "m.text_status = 'indexed'"];
  const params: string[] = [...vis.params];
  if (scope.materialId) {
    where.push("m.id = ?");
    params.push(scope.materialId);
  }
  if (scope.subject) {
    where.push("m.subject = ?");
    params.push(scope.subject);
  }
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.title, m.subject,
              (SELECT COUNT(*) || ':' || COALESCE(MAX(c.id), 0) FROM material_chunks c WHERE c.material_id = m.id) AS signature,
              (SELECT r.id FROM library_resources r WHERE r.material_id = m.id LIMIT 1) AS resource_id
         FROM materials m WHERE ${where.join(" AND ")} ORDER BY m.title`,
    )
    .all(...params) as { id: string; title: string; subject: Subject; signature: string; resource_id: string | null }[];
  const out: Loaded[] = [];
  for (const row of rows) {
    let loaded = cache.get(row.id);
    if (!loaded || loaded.signature !== row.signature) {
      loaded = { materialId: row.id, title: row.title, subject: row.subject, resourceId: row.resource_id, signature: row.signature, index: build(row.id) };
      cache.set(row.id, loaded);
    }
    if (loaded.index) out.push(loaded);
  }
  return out;
}

/** Whether this person has a dictionary to look words up in. */
export function hasDictionary(user: CurrentUser): boolean {
  return dictionariesFor(user).length > 0;
}

/* ------------------------------- the cards -------------------------------- */

interface Outlines {
  get(materialId: string): ReaderSection[];
}

function outlinesFor(user: CurrentUser): Outlines {
  const memo = new Map<string, ReaderSection[]>();
  return {
    get(materialId) {
      let outline = memo.get(materialId);
      if (!outline) {
        try {
          outline = readerOutline(materialId, user);
        } catch {
          outline = [];
        }
        memo.set(materialId, outline);
      }
      return outline;
    },
  };
}

/** The page of the book an entry is on, as a link the reader scrolls to the word on. */
function readerHref(dictionary: Loaded, entry: DictEntry, outlines: Outlines): string | null {
  if (!dictionary.resourceId) return null;
  const outline = outlines.get(dictionary.materialId);
  if (outline.length === 0) return null;
  const at = locate(outline, entry.position);
  const query = new URLSearchParams({ view: "text", s: String(at.s), p: String(at.p), hl: entry.headword });
  return `/library/${dictionary.resourceId}/read?${query}#hit`;
}

function cardOf(dictionary: Loaded, entry: DictEntry, outlines: Outlines): WordCard {
  return {
    word: entry.word,
    headword: entry.headword,
    ipa: entry.ipa,
    pos: entry.pos,
    level: entry.level,
    spanish: entry.spanish,
    translations: entry.translations.map((t) => ({ text: t.text, note: t.note })),
    meaning: entry.meaning,
    example: entry.example,
    exampleEs: entry.exampleEs,
    common: entry.common,
    note: entry.note,
    source: { materialId: dictionary.materialId, title: dictionary.title, href: readerHref(dictionary, entry, outlines) },
  };
}

/* -------------------------------- lookups --------------------------------- */

const MAX_MATCHES = 6;
const MAX_QUERY = 60;

export interface LookupOptions {
  /** The language asked for, when the question names one ("… in Spanish"). */
  target?: TargetLanguage | null;
  /** Show words that are only used inside other entries' examples (for a plain look-up, not for a topic). */
  allowMentions?: boolean;
  materialId?: string;
  subject?: Subject;
  limit?: number;
}

/**
 * Look a word or short phrase up. Null when there is nothing to look in (no
 * dictionary the person may see) or nothing to look up (too long, Georgian,
 * empty); an empty `matches` means the dictionaries were searched and the word is not in them.
 */
export function lookupWord(user: CurrentUser, text: string, options: LookupOptions = {}): DictionaryResult | null {
  const query = text.replace(/\s+/g, " ").replace(/^["'„“”«»‹›]+|["'„“”«»‹›?!.,;:]+$/g, "").trim();
  if (!query || query.length > MAX_QUERY || query.split(" ").length > 4 || isGeorgian(query)) return null;
  const dictionaries = dictionariesFor(user, { materialId: options.materialId, subject: options.subject });
  if (dictionaries.length === 0) return null;

  const spanishFirst = options.target === "en" || (options.target !== "es" && looksSpanish(query));
  const outlines = outlinesFor(user);
  const limit = options.limit ?? MAX_MATCHES;
  const seen = new Set<string>();
  const primary: DictionaryMatch[] = [];
  const secondary: DictionaryMatch[] = [];
  const mentions: DictionaryMatch[] = [];
  const suggestions: DictionaryResult["suggestions"] = [];

  for (const dictionary of dictionaries) {
    const index = dictionary.index!;
    const english = index.lookupEnglish(query);
    const spanish = index.lookupSpanish(query);
    const take = (matches: typeof english.matches, into: DictionaryMatch[]) => {
      for (const m of matches) {
        if (seen.has(m.entry.word)) continue;
        seen.add(m.entry.word);
        into.push({ card: cardOf(dictionary, m.entry, outlines), how: m.how, via: m.via });
      }
    };
    const englishFound = english.matches.filter((m) => m.how !== "mention");
    take(spanishFirst ? spanish.matches : englishFound, primary);
    take(spanishFirst ? englishFound : spanish.matches, secondary);
    take(english.matches.filter((m) => m.how === "mention"), mentions);
    for (const entry of english.suggestions) suggestions.push({ word: entry.word, spanish: entry.spanish, level: entry.level });
  }

  const matches = [...primary, ...secondary];
  if (matches.length === 0 && options.allowMentions) matches.push(...mentions);
  // The direction is the one the first match was found in, whichever language was tried first.
  const first = matches[0]?.how;
  return {
    query,
    direction: first === "translation" || first === "contains" ? "es-en" : "en-es",
    matches: matches.slice(0, limit),
    suggestions: matches.length === 0 ? suggestions.slice(0, 5) : [],
  };
}

/** Words and Spanish translations that start with what has been typed. */
export function suggestWords(user: CurrentUser, prefix: string, limit = 8): WordSuggestion[] {
  const q = prefix.replace(/\s+/g, " ").trim();
  if (!q || q.length > MAX_QUERY || isGeorgian(q)) return [];
  const out: WordSuggestion[] = [];
  const seen = new Set<string>();
  for (const dictionary of dictionariesFor(user)) {
    for (const s of dictionary.index!.suggest(q, limit)) {
      const key = `${s.language}:${s.text}:${s.entry.word}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ text: s.text, language: s.language, word: s.entry.word, spanish: s.entry.translations[0]?.text ?? s.entry.spanish, level: s.entry.level });
    }
  }
  return out.slice(0, limit);
}

/** The cards of these words, in the order asked; words the person's dictionaries do not have are left out. */
export function wordCards(user: CurrentUser, words: string[]): WordCard[] {
  const dictionaries = dictionariesFor(user);
  if (dictionaries.length === 0) return [];
  const outlines = outlinesFor(user);
  const out: WordCard[] = [];
  for (const word of words.slice(0, 200)) {
    for (const dictionary of dictionaries) {
      const entry = dictionary.index!.get(word);
      if (entry) {
        out.push(cardOf(dictionary, entry, outlines));
        break;
      }
    }
  }
  return out;
}

/* ------------------------------ words of the day -------------------------- */

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small seeded generator, so the same day gives everyone the same words. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAILY_LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

/** Words that are in a dictionary for good reason but are not what a school's front page should open the day with. */
const NOT_FOR_THE_DAY = new Set(
  "kill murder rape suicide sex sexual drug drugs alcohol drunk gun weapon bomb terrorist terrorism corpse abuse assault violence violent prison crime criminal kidnap torture slave".split(" "),
);

/**
 * The same few words for everyone on a given day (`day` is the school's date,
 * "2026-10-09"): the first is the word of the day. Only words that read well on
 * their own: a plain headword, a translation and an example.
 */
export function wordsOfTheDay(user: CurrentUser, day: string, count = 3): WordCard[] {
  const dictionaries = dictionariesFor(user);
  if (dictionaries.length === 0) return [];
  const dictionary = dictionaries[0];
  const pool = dictionary.index!.entries.filter((e) => DAILY_LEVELS.includes(e.level) && /^[a-z]+$/.test(e.word) && !NOT_FOR_THE_DAY.has(e.word) && e.example.length > 10);
  if (pool.length === 0) return [];
  const random = seeded(hashOf(`words:${day}`));
  const chosen: DictEntry[] = [];
  const taken = new Set<number>();
  for (let guard = 0; chosen.length < Math.min(count, pool.length) && guard < 500; guard++) {
    // The first is an easier word, the rest are spread across the levels.
    const i = Math.floor(random() * pool.length);
    if (taken.has(i)) continue;
    taken.add(i);
    chosen.push(pool[i]);
  }
  const outlines = outlinesFor(user);
  return chosen.map((e) => cardOf(dictionary, e, outlines));
}
