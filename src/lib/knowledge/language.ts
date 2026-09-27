/**
 * Word matching for Georgian and English school texts.
 *
 * Georgian is agglutinative: one noun appears as ძალა, ძალის, ძალას, ძალები,
 * ძალებში… Matching surface forms fails constantly, and trimming a fixed
 * number of letters joins some forms while splitting others. Known suffixes
 * are therefore stripped longest-first, twice (Georgian stacks them), never
 * below a three-letter stem. Ablaut (თავისუფალი / თავისუფლება) is lexical and
 * belongs in the synonym table, not here.
 *
 * English gets a deliberately light stemmer (plurals and possessives): school
 * questions rarely need more, and aggressive stemming merges unrelated words.
 *
 * Everything here is pure, so search, knowledge extraction and claim checking
 * all use exactly the same notion of "the same word".
 */

/** Case endings, plural markers and postpositions (sorted longest-first below). */
const KA_SUFFIXES = [
  "ებისთვის", "ებისათვის", "ებისგან", "ებისკენ", "ებამდე", "ებიდან", "ებთან",
  "ებშიც", "ებზეც", "ებში", "ებზე", "ებით", "ებად", "ებმა", "ების", "ებს", "ები", "ებ",
  "ისთვის", "ისათვის", "ისგან", "ისკენ", "იდან", "ამდე", "თანაც", "შიც", "ზეც",
  "თვის", "გან", "კენ", "მდე", "თან", "ვით", "ურთ",
  "ში", "ზე", "ით", "ად", "ის", "მა",
  "ს", "ი", "ა", "ე", "ო", "ც",
];
const SUFFIXES = [...new Set(KA_SUFFIXES)].sort((a, b) => b.length - a.length);
const MIN_STEM = 3;

const GEORGIAN = /[Ⴀ-ჿᲐ-Ჿ]/;

export function isGeorgian(text: string): boolean {
  return GEORGIAN.test(text);
}

const VOWEL = /[აეიოუ]$/;

function kaStemOnce(word: string): string {
  if (word.length <= MIN_STEM) return word;
  for (const suffix of SUFFIXES) {
    if (word.length - suffix.length < MIN_STEM || !word.endsWith(suffix)) continue;
    const rest = word.slice(0, word.length - suffix.length);
    // The ergative „-მა" follows a consonant (ნიუტონმა); after a vowel it is
    // part of the word (თემა, სისტემა).
    if (suffix === "მა" && VOWEL.test(rest)) continue;
    return rest;
  }
  return word;
}

/** Georgian stem: two passes, because „ვექტორებშიც" needs both. */
export function kaStem(word: string): string {
  const once = kaStemOnce(word);
  const twice = kaStemOnce(once);
  return twice.length >= MIN_STEM ? twice : once;
}

/** Light English stem: plurals and possessives only. */
export function enStem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("sses")) return w.slice(0, -2);
  if (/(ch|sh|x|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !/(ss|us|is|ys)$/.test(w)) w = w.slice(0, -1);
  return w;
}

/** The stem of one lower-case word, in either language. */
export function stem(word: string): string {
  return isGeorgian(word) ? kaStem(word) : enStem(word);
}

/** Words that never identify what a sentence is about. */
const STOP = new Set(
  (
    // English
    "a an and are as at be been being but by can could did do does for from had has have he her his how i if in into is it its " +
    "may me might more most my no nor not of on or our she should so than that the their them then there these they this " +
    "those to too us was we were what when where which while who whom why will with would you your about also very just " +
    "only some such each any all other one two tell explain say says said please material materials text according " +
    // Georgian: particles, pronouns, question words, auxiliaries
    "და ან თუ რომ როგორც ის ეს ეგ იმ ამ მაგ არის არაა არა არც იყო იქნება იქნებოდა მაგრამ თუმცა ამიტომ რადგან იმიტომ " +
    "ასევე უფრო ძალიან მხოლოდ კიდევ ისევ უკვე ჯერ სწორედ ანუ მაინც ალბათ რა რას რის რისი რაა ვინ ვის სად როდის რატომ როგორ " +
    "რომელი რომელიც ვინც რამდენი მე შენ ჩვენ თქვენ მან მათ მას მისი მათი ჩემი შენი ჩვენი თქვენი თავად თვითონ მასში მასზე " +
    "მასთან მისთვის ამის იმის ამას იმას ამით იმით ამაში იმაში ყველა ყოველი ზოგი სხვა ერთი ორი " +
    "მინდა მაინტერესებს მითხარი მიამბე ამიხსენი ახსენი გამაგებინე გავიგო ვიცოდე ვისწავლო გთხოვ " +
    "შესახებ ამბობს წერია წერს მასალა მასალის მასალაში მასალაზე ტექსტი ტექსტში " +
    "ხომ კი ხო აბა ცოტა როცა როდესაც აქ იქ ახლა მერე შემდეგ ისე ასე აი " +
    "ხდება გვაქვს მაქვს გაქვს აქვს ვარ ხარ არიან ვართ ხართ"
  ).split(/\s+/),
);

export function isStopWord(token: string): boolean {
  return STOP.has(token);
}

/** Lower-case word tokens, letters and digits only (so no search syntax survives). */
export function tokens(text: string): string[] {
  return text.normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function isContentToken(token: string): boolean {
  if (token.length < 2 || STOP.has(token)) return false;
  // Lone letters and single digits carry no meaning on their own.
  return !/^\p{N}$/u.test(token);
}

/** Stemmed content words, in order and with repeats (for term frequency). */
export function contentTerms(text: string): string[] {
  const out: string[] = [];
  for (const token of tokens(text)) if (isContentToken(token)) out.push(stem(token));
  return out;
}

/** Stemmed content words, each once. */
export function uniqueTerms(text: string): string[] {
  return [...new Set(contentTerms(text))];
}

/** First surface form of each stem in a text — for showing words back to people. */
export function surfaceForms(text: string): Map<string, string> {
  const map = new Map<string, string>();
  // Keep the writer's capitalisation ("Iceland"), match on the lower-case form.
  for (const original of text.normalize("NFC").match(/[\p{L}\p{N}]+/gu) ?? []) {
    const token = original.toLowerCase();
    if (!isContentToken(token)) continue;
    const s = stem(token);
    if (!map.has(s)) map.set(s, original);
  }
  return map;
}

/** Levenshtein distance with an early exit above `cap`. */
export function editDistance(a: string, b: string, cap = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr[j] = v;
      if (v < best) best = v;
    }
    if (best > cap) return cap + 1;
    prev = curr;
  }
  return prev[b.length];
}

/** A likely typo: one edit for short words, two for long ones. */
export function isTypoOf(a: string, b: string): boolean {
  const min = Math.min(a.length, b.length);
  if (min < 5 || /\p{N}/u.test(a) || /\p{N}/u.test(b)) return false;
  const budget = min <= 6 ? 1 : 2;
  return editDistance(a, b, budget) <= budget;
}

export type TextLanguage = "ka" | "en" | "mixed" | "unknown";

/** Which script dominates a text. */
export function textLanguage(text: string): TextLanguage {
  const sample = text.slice(0, 20_000);
  const ka = (sample.match(/[ა-ჿ]/g) ?? []).length;
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length;
  if (ka + latin < 20) return ka > latin ? "ka" : latin > 0 ? "en" : "unknown";
  if (ka >= latin * 4) return "ka";
  if (latin >= ka * 4) return "en";
  return "mixed";
}

const NEGATION_EN = /\b(not|no|never|cannot|can't|isn't|aren't|doesn't|don't|didn't|won't|wasn't|weren't|without|neither|nor|none)\b/i;
const NEGATION_KA = /(^|[^\p{L}])(არ|ვერ|არა|აღარ|ვეღარ|ნუ|არასდროს|არასოდეს|არავინ|არაფერი|არაფერს|არსად|ვერასდროს)(?=[^\p{L}]|$)/u;

/** Does the sentence deny something? Used only to suggest a careful comparison. */
export function hasNegation(sentence: string): boolean {
  return NEGATION_EN.test(sentence) || NEGATION_KA.test(sentence.toLowerCase());
}

/** Figures in a text, for checking that a number really comes from the source. */
export function figures(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)?/g) ?? [];
}

/** Every figure in `claim` appears in `source` (decimal comma and point are the same). */
export function figuresFoundIn(claim: string, source: string): boolean {
  const normal = (s: string) => s.replace(",", ".");
  const available = new Set(figures(source).map(normal));
  for (const figure of figures(source)) for (const part of figure.split(/[.,]/)) available.add(part);
  return figures(claim).every((f) => available.has(normal(f)));
}

/** Split into sentences without breaking on abbreviations or across paragraphs. */
export function splitSentences(text: string, options: { min?: number; max?: number } = {}): string[] {
  const min = options.min ?? 12;
  const max = options.max ?? 600;
  return text
    .split(/\n{2,}|\n(?=\s*[•\-*]\s)/)
    .flatMap((paragraph) => {
      const guarded = paragraph.replace(/\b(e\.g|i\.e|cf|etc|vs|Dr|Mr|Mrs|Prof|St|ch|p|pp|vol|fig|No)\./gi, "$1\u0001");
      return guarded.split(/(?<=[.!?])\s+(?=[\p{L}\p{N}„"'(«])/u);
    })
    .map((s) => s.split("\u0001").join(".").replace(/^[•\-*]\s*/, "").replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= min && s.length <= max);
}

/** Shorten text at a word boundary. */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`;
}

/**
 * An FTS5 query matching any of the given stems. Stems are letters and
 * digits only, so no search syntax from the user can reach the query.
 */
export function ftsQuery(terms: readonly string[]): string | null {
  const safe = [...new Set(terms.filter((t) => /^[\p{L}\p{N}]+$/u.test(t)))].slice(0, 40);
  return safe.length ? safe.map((t) => `"${t}"`).join(" OR ") : null;
}
