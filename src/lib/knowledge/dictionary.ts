/**
 * A learner's dictionary read from a school book, and looked up in both directions.
 *
 * The book is the source of truth: nothing here knows a word that the book does
 * not define. What this module adds is *finding* — "went" leads to GO, "la
 * tarde" to AFTERNOON, "recieve" to RECEIVE — and every result says how it was
 * found, so a form, a Spanish translation and a spelling guess are never passed
 * off as an exact entry.
 *
 * Pure: it parses text it is given and never touches a database, so it can be
 * tested against the real book and reused anywhere.
 */

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

/** `AFTERNOON /ˌæftərˈnuːn/ • noun • A1` — the line that starts an entry (spaces already collapsed). */
export const HEADWORD_LINE = /^(.+?) (\/.*?) • ([^•]+) • ([ABC][12])$/;

export interface Translation {
  /** As printed, without any note in brackets: "la tarde". */
  text: string;
  /** Without the article: "tarde". */
  plain: string;
  article: string | null;
  /** A note the book puts in brackets: "Latin America", "un examen". */
  note: string | null;
}

export interface DictEntry {
  /** Lower case: "afternoon". */
  word: string;
  /** As printed: "AFTERNOON". */
  headword: string;
  ipa: string;
  pos: string[];
  level: Level;
  /** The Spanish line as printed: "la tarde; …". */
  spanish: string;
  translations: Translation[];
  meaning: string;
  example: string;
  exampleEs: string;
  common: string[];
  note: string | null;
  /** The passage (chunk) the entry starts in. */
  position: number;
}

/* -------------------------------- folding -------------------------------- */

/** Lower case, no accents, no stray punctuation: the form two spellings of one word share. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lower case with accents kept: Spanish "año" and "ano" are different words, and an exact match should win. */
function lower(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ARTICLE = /^(el|la|los|las|un|una|unos|unas|lo)\s+/;

/* --------------------------------- parsing -------------------------------- */

/** "correcto/a; derecho/a; a la derecha" → the translations the book gives. */
export function parseTranslations(line: string): Translation[] {
  return line
    .split(/\s*;\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const note = [...part.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim()).join("; ") || null;
      const text = part.replace(/\s*\([^)]*\)/g, "").trim();
      const article = ARTICLE.exec(text.toLowerCase())?.[1] ?? null;
      return { text, plain: article ? text.slice(article.length).trim() : text, article, note };
    })
    .filter((t) => t.text);
}

const FIELD = /^(Spanish|Meaning|Example|Common|Note):\s*([\s\S]*)$/;

/**
 * The entries of a dictionary, from its passages in reading order. An entry may
 * start in one passage and finish in the next, so the passages are walked as one
 * stream of paragraphs.
 */
export function parseDictionary(chunks: { position: number; content: string }[]): DictEntry[] {
  const entries: DictEntry[] = [];
  let open: { entry: Partial<DictEntry> & { fields: Record<string, string> }; translation: string[] } | null = null;

  const close = () => {
    if (!open) return;
    const f = open.entry.fields;
    if (f.Spanish && f.Meaning) {
      const translations = parseTranslations(f.Spanish);
      if (translations.length) {
        entries.push({
          word: open.entry.word!,
          headword: open.entry.headword!,
          ipa: open.entry.ipa!,
          pos: open.entry.pos!,
          level: open.entry.level!,
          spanish: f.Spanish,
          translations,
          meaning: f.Meaning,
          example: f.Example ?? "",
          exampleEs: open.translation.join(" "),
          common: (f.Common ?? "")
            .split(/\s*•\s*/)
            .map((c) => c.trim())
            .filter(Boolean),
          note: f.Note || null,
          position: open.entry.position!,
        });
      }
    }
    open = null;
  };

  for (const chunk of [...chunks].sort((a, b) => a.position - b.position)) {
    for (const raw of chunk.content.split(/\n{2,}/)) {
      const text = raw.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const head = HEADWORD_LINE.exec(text);
      if (head) {
        close();
        open = {
          entry: {
            headword: head[1],
            word: head[1].toLowerCase(),
            ipa: head[2],
            pos: head[3].split(/\s*;\s*/).map((p) => p.trim()).filter(Boolean),
            level: head[4] as Level,
            position: chunk.position,
            fields: {},
          },
          translation: [],
        };
        continue;
      }
      if (!open) continue;
      const field = FIELD.exec(text);
      if (field) open.entry.fields[field[1]] = field[2].trim();
      else if (text.startsWith("→")) open.translation.push(text.replace(/^→\s*/, ""));
      else close(); // something that is not part of an entry: a heading, an introduction
    }
  }
  close();
  return entries;
}

/* ------------------------------ word forms -------------------------------- */

/** Irregular forms → the base word. Only ever used when the base word is in the book. */
const IRREGULAR = new Map<string, string[]>();
(
  "be:am,is,are,was,were,been,being;have:has,had,having;do:does,did,done,doing;go:goes,went,gone,going;" +
  "see:saw,seen;take:took,taken;give:gave,given;know:knew,known;get:got,gotten;make:made;come:came;say:said;" +
  "buy:bought;bring:brought;think:thought;find:found;tell:told;leave:left;feel:felt;keep:kept;run:ran;sit:sat;" +
  "stand:stood;understand:understood;write:wrote,written;speak:spoke,spoken;eat:ate,eaten;drink:drank,drunk;" +
  "drive:drove,driven;fly:flew,flown;swim:swam,swum;begin:began,begun;break:broke,broken;choose:chose,chosen;" +
  "forget:forgot,forgotten;grow:grew,grown;hide:hid,hidden;ride:rode,ridden;rise:rose,risen;sing:sang,sung;" +
  "sleep:slept;spend:spent;send:sent;build:built;lose:lost;meet:met;pay:paid;teach:taught;catch:caught;" +
  "fall:fell,fallen;win:won;wear:wore,worn;sell:sold;hold:held;lend:lent;lay:laid;lead:led;mean:meant;" +
  "bite:bit,bitten;blow:blew,blown;draw:drew,drawn;feed:fed;fight:fought;hang:hung;hear:heard;shoot:shot;" +
  "shine:shone;steal:stole,stolen;sweep:swept;throw:threw,thrown;wake:woke,woken;shake:shook,shaken;" +
  "forgive:forgave,forgiven;overcome:overcame;undergo:underwent,undergone;withdraw:withdrew,withdrawn;" +
  "child:children;man:men;woman:women;person:people;foot:feet;tooth:teeth;mouse:mice;goose:geese;" +
  "life:lives;wife:wives;knife:knives;leaf:leaves;half:halves;wolf:wolves;shelf:shelves;thief:thieves;" +
  "good:better,best;bad:worse,worst;much:more,most;many:more,most;little:less,least;far:farther,further,farthest,furthest;" +
  "i:me,my,mine,myself;he:him,his;she:her,hers;we:us,our,ours;they:them,their,theirs;" +
  "analysis:analyses;crisis:crises;criterion:criteria;phenomenon:phenomena;datum:data;"
)
  .split(";")
  .filter(Boolean)
  .forEach((group) => {
    const [base, forms] = group.split(":");
    for (const form of forms.split(",")) IRREGULAR.set(form, [...(IRREGULAR.get(form) ?? []), base]);
  });

const VOWELS = /[aeiou]/;

/**
 * Base forms a word may come from, most likely first: "went" → go, "studies" →
 * study, "stopped" → stop, "bigger" → big. Candidates only; the book decides
 * which of them is a word.
 */
export function baseForms(word: string): string[] {
  const w = word.toLowerCase();
  const out: string[] = [...(IRREGULAR.get(w) ?? [])];
  const add = (base: string) => {
    if (base.length >= 2 && base !== w && !out.includes(base)) out.push(base);
  };
  const undouble = (stemmed: string) => (stemmed.length > 2 && stemmed.at(-1) === stemmed.at(-2) && !VOWELS.test(stemmed.at(-1)!) ? stemmed.slice(0, -1) : null);

  if (w.length < 3) return out;
  // plurals and the third person
  if (w.endsWith("ies")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ves")) {
    add(`${w.slice(0, -3)}f`);
    add(`${w.slice(0, -3)}fe`);
  }
  if (/(s|x|z|ch|sh|o)es$/.test(w)) add(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) add(w.slice(0, -1));
  // past and participle
  if (w.endsWith("ied")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ed")) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
    const u = undouble(w.slice(0, -2));
    if (u) add(u);
  }
  // -ing
  if (w.endsWith("ying") && w.length > 5) add(`${w.slice(0, -4)}ie`);
  if (w.endsWith("ing") && w.length > 4) {
    const stem = w.slice(0, -3);
    add(stem);
    add(`${stem}e`);
    const u = undouble(stem);
    if (u) add(u);
  }
  // comparatives and superlatives
  for (const suffix of ["est", "er"]) {
    if (!w.endsWith(suffix) || w.length <= suffix.length + 2) continue;
    const stem = w.slice(0, -suffix.length);
    add(stem);
    add(`${stem}e`);
    if (stem.endsWith("i")) add(`${stem.slice(0, -1)}y`);
    const u = undouble(stem);
    if (u) add(u);
  }
  // adverbs
  if (w.endsWith("ily")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ally")) add(w.slice(0, -2));
  if (w.endsWith("ly") && w.length > 4) {
    add(w.slice(0, -2));
    if (w.endsWith("bly") || w.endsWith("ply")) add(`${w.slice(0, -1)}e`);
  }
  return out;
}

/* ---------------------------- spelling guesses ----------------------------- */

/** Edits needed to turn one word into the other, a swap of neighbours counting as one; stops above `cap`. */
export function typoDistance(a: string, b: string, cap: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        rows[i][j] = j;
        continue;
      }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1);
      rows[i][j] = v;
    }
  }
  return rows[a.length][b.length];
}

/** How many edits a spelling guess may be away: none for tiny words (too many neighbours), more for long ones. */
export function editBudget(length: number): number {
  return length < 4 ? 0 : length < 8 ? 1 : 2;
}

/* --------------------------------- index ---------------------------------- */

export type MatchKind =
  /** The headword itself. */
  | "headword"
  /** An inflected form of the headword: went → go. */
  | "form"
  /** A phrase listed under the headword: "good afternoon". */
  | "phrase"
  /** The Spanish translation of the headword. */
  | "translation"
  /** Part of a longer Spanish translation. */
  | "contains"
  /** Used in the entry's example or meaning, but not an entry of its own. */
  | "mention";

export interface WordMatch {
  entry: DictEntry;
  how: MatchKind;
  /** What led here: the form that was typed ("went"), the Spanish translation that matched, or the phrase. */
  via: string | null;
}

export interface Lookup {
  matches: WordMatch[];
  /** Close spellings, when nothing matched exactly. */
  suggestions: DictEntry[];
}

export interface Suggestion {
  /** What the person typed towards: the English headword, or a Spanish translation. */
  text: string;
  language: "en" | "es";
  entry: DictEntry;
}

/** The "/a" the book prints after a Spanish word that has a feminine form: "malo/a". */
const GENDER_MARK = /\/\p{L}{1,2}(?![\p{L}/])/gu;

const SPANISH_STOP = new Set(["de", "la", "el", "los", "las", "un", "una", "a", "en", "se", "que", "y", "o", "con", "por", "para", "lo", "al", "del", "su"]);
const ENGLISH_STOP = new Set(["the", "a", "an", "and", "of", "to", "in", "is", "it", "that", "this", "for", "on", "with", "as", "at", "by", "or", "be", "are", "was", "we", "you", "i", "my", "he", "she", "they", "his", "her", "our", "your"]);

const byLevel = (a: DictEntry, b: DictEntry) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.word.localeCompare(b.word);

/** The two forms Spanish gives a word by gender in print: "correcto/a" → correcto, correcta. */
function slashForms(word: string): string[] {
  const m = /^(\p{L}+)\/(\p{L}+)$/u.exec(word);
  if (!m) return [word];
  const [, first, second] = m;
  if (second.length <= 2) return [first, first.endsWith("o") && second === "a" ? `${first.slice(0, -1)}a` : `${first}${second}`];
  return [first, second];
}

export class DictionaryIndex {
  readonly entries: DictEntry[];
  private readonly byWord = new Map<string, DictEntry>();
  private readonly byFolded = new Map<string, DictEntry>();
  private readonly sorted: string[];
  private readonly spanish = new Map<string, { entry: DictEntry; rank: number }[]>();
  private readonly spanishParts = new Map<string, { entry: DictEntry; rank: number }[]>();
  private readonly phrases = new Map<string, DictEntry[]>();
  private readonly mentions = new Map<string, DictEntry[]>();

  constructor(entries: DictEntry[]) {
    this.entries = entries;
    for (const entry of entries) {
      if (!this.byWord.has(entry.word)) this.byWord.set(entry.word, entry);
      const folded = fold(entry.word).replace(/-/g, " ");
      if (!this.byFolded.has(folded)) this.byFolded.set(folded, entry);
      entry.translations.forEach((t, rank) => {
        // "seguro/a de sí mismo/a" is also looked up as "seguro de sí mismo".
        const withoutGender = t.plain.replace(GENDER_MARK, "");
        for (const form of new Set([...slashForms(t.plain), withoutGender])) {
          for (const key of new Set([lower(form), fold(form)])) this.push(this.spanish, key, entry, rank);
        }
        const tokens = fold(t.plain).split(" ").filter((x) => x.length > 2 && !SPANISH_STOP.has(x));
        if (tokens.length > 1) for (const token of new Set(tokens)) this.push(this.spanishParts, token, entry, rank);
      });
      for (const phrase of entry.common) this.pushList(this.phrases, fold(phrase), entry);
      const seen = new Set<string>();
      for (const token of fold(`${entry.example} ${entry.meaning}`).split(" ")) {
        if (token.length < 3 || ENGLISH_STOP.has(token) || seen.has(token)) continue;
        seen.add(token);
        this.pushList(this.mentions, token, entry);
      }
    }
    this.sorted = [...this.byFolded.keys()].sort();
  }

  private push(map: Map<string, { entry: DictEntry; rank: number }[]>, key: string, entry: DictEntry, rank: number) {
    const list = map.get(key) ?? [];
    if (!list.some((x) => x.entry === entry)) list.push({ entry, rank });
    map.set(key, list);
  }

  private pushList(map: Map<string, DictEntry[]>, key: string, entry: DictEntry) {
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.includes(entry)) list.push(entry);
    map.set(key, list);
  }

  get size(): number {
    return this.entries.length;
  }

  /** The entry for exactly this headword (any case, accents and hyphen-or-space ignored). */
  get(word: string): DictEntry | undefined {
    const key = fold(word).replace(/-/g, " ");
    return this.byWord.get(word.toLowerCase().trim()) ?? this.byFolded.get(key);
  }

  /** English → Spanish: what the book has for what was typed. */
  lookupEnglish(raw: string): Lookup {
    let q = fold(raw);
    const tokens = q.split(" ").filter(Boolean);
    // "to go", "a dog", "the afternoon": the headword is what follows.
    if (tokens.length > 1 && ["to", "a", "an", "the"].includes(tokens[0])) q = tokens.slice(1).join(" ");
    q = q.replace(/'s$/, "");
    const matches: WordMatch[] = [];
    const seen = new Set<DictEntry>();
    const add = (entry: DictEntry | undefined, how: MatchKind, via: string | null) => {
      if (!entry || seen.has(entry)) return;
      seen.add(entry);
      matches.push({ entry, how, via });
    };
    if (!q) return { matches, suggestions: [] };

    add(this.get(q), "headword", null);
    const single = !q.includes(" ");
    if (single) for (const base of baseForms(q)) add(this.get(base), "form", q);
    else {
      // "good afternoon" is not an entry but is listed under AFTERNOON; "had breakfast", "went home": a form of the first word.
      for (const entry of this.phrases.get(q) ?? []) add(entry, "phrase", q);
      const [first, ...rest] = q.split(" ");
      if (!matches.length && rest.length <= 2) {
        for (const base of baseForms(first)) {
          const entry = this.get(base);
          if (entry && entry.common.some((c) => fold(c) === `${base} ${rest.join(" ")}`)) add(entry, "phrase", q);
        }
      }
    }
    const found = matches.length > 0;

    // Close spellings, only when nothing matched: a guess must not stand beside a real entry.
    let suggestions: DictEntry[] = [];
    if (!found && single && q.length >= 4) suggestions = this.similar(q, 5);

    // A word the book uses without defining it.
    if (!found && single && q.length >= 3) {
      for (const entry of [...(this.mentions.get(q) ?? [])].sort(byLevel).slice(0, 4)) add(entry, "mention", q);
    }
    return { matches, suggestions };
  }

  /** Spanish → English: the headwords whose Spanish translation is what was typed. */
  lookupSpanish(raw: string): Lookup {
    // The book prints genders as "malo/a"; what is looked up is the first form.
    const written = raw.replace(GENDER_MARK, "");
    const typed = lower(written);
    const accentless = fold(written);
    const stripped = (text: string) => text.replace(ARTICLE, "").trim();
    // The typed form, then without the article, then plural → singular, then the other gender.
    const keys: string[] = [];
    const push = (key: string) => {
      if (key && !keys.includes(key)) keys.push(key);
    };
    for (const base of [typed, accentless]) {
      push(base);
      push(stripped(base));
      const bare = stripped(base);
      if (bare.length > 3 && bare.endsWith("es")) push(bare.slice(0, -2));
      if (bare.length > 3 && bare.endsWith("s")) push(bare.slice(0, -1));
      if (bare.length > 3 && bare.endsWith("a")) push(`${bare.slice(0, -1)}o`);
    }
    const matches: WordMatch[] = [];
    const seen = new Set<DictEntry>();
    const add = (list: { entry: DictEntry; rank: number }[] | undefined, how: MatchKind) => {
      for (const { entry, rank } of [...(list ?? [])].sort((a, b) => a.rank - b.rank || byLevel(a.entry, b.entry))) {
        if (seen.has(entry)) continue;
        seen.add(entry);
        matches.push({ entry, how, via: entry.translations[rank]?.text ?? null });
      }
    };
    for (const key of keys) add(this.spanish.get(key), "translation");
    if (!matches.length && accentless.length > 2) add(this.spanishParts.get(stripped(accentless)), "contains");
    return { matches, suggestions: [] };
  }

  /** Headwords a typo away from the word, nearest first. */
  similar(word: string, limit = 5): DictEntry[] {
    const q = fold(word);
    const budget = editBudget(q.length);
    if (budget === 0) return [];
    const out: { entry: DictEntry; distance: number; sameStart: boolean }[] = [];
    for (const [key, entry] of this.byFolded) {
      if (Math.abs(key.length - q.length) > budget || key.includes(" ")) continue;
      const distance = typoDistance(q, key, budget);
      if (distance > budget) continue;
      const sameStart = key[0] === q[0];
      // Typing the first letter wrong is rare; with one edit, allow it only for a swap of the first two.
      if (!sameStart && typoDistance(q, key, 1) !== 1) continue;
      out.push({ entry, distance, sameStart });
    }
    return out
      .sort((a, b) => a.distance - b.distance || Number(b.sameStart) - Number(a.sameStart) || byLevel(a.entry, b.entry))
      .slice(0, limit)
      .map((x) => x.entry);
  }

  /** Words and Spanish translations that start with what has been typed so far. */
  suggest(raw: string, limit = 8): Suggestion[] {
    const q = fold(raw);
    if (q.length < 1) return [];
    const out: Suggestion[] = [];
    const seen = new Set<DictEntry>();
    // Binary search for the first word >= q, then walk while the prefix holds.
    let lo = 0;
    let hi = this.sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sorted[mid] < q) lo = mid + 1;
      else hi = mid;
    }
    const english: Suggestion[] = [];
    for (let i = lo; i < this.sorted.length && this.sorted[i].startsWith(q); i++) {
      const entry = this.byFolded.get(this.sorted[i])!;
      english.push({ text: entry.word, language: "en", entry });
    }
    english.sort((a, b) => Number(b.text === q) - Number(a.text === q) || byLevel(a.entry, b.entry));
    for (const s of english.slice(0, limit)) {
      out.push(s);
      seen.add(s.entry);
    }
    if (out.length < limit && q.length >= 2) {
      const spanish: Suggestion[] = [];
      for (const [key, list] of this.spanish) {
        if (!key.startsWith(q) || key !== fold(key)) continue;
        for (const { entry, rank } of list) if (!seen.has(entry)) spanish.push({ text: entry.translations[rank]?.plain ?? key, language: "es", entry });
      }
      spanish.sort((a, b) => a.text.length - b.text.length || byLevel(a.entry, b.entry));
      for (const s of spanish) {
        if (out.length >= limit) break;
        if (seen.has(s.entry)) continue;
        seen.add(s.entry);
        out.push(s);
      }
    }
    return out;
  }
}

/* ---------------------------- which way to look ---------------------------- */

/** Letters and words that say a text is Spanish rather than English. */
export function looksSpanish(text: string): boolean {
  if (/[ñáéíóúü¿¡]/i.test(text)) return true;
  return /^(el|la|los|las|un|una|unos|unas)\s+\p{L}/iu.test(text.trim());
}
