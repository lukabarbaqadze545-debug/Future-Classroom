/**
 * Turns a free-text question into a safe SQLite FTS5 query. User input is
 * reduced to word tokens (so FTS operators cannot be injected), stop words
 * are dropped, and longer words are matched by prefix — a light form of
 * stemming that helps with English plurals and Georgian case endings
 * (e.g. "ნიუტონის" → "ნიუტონ*").
 */
const STOP_WORDS = new Set([
  // English
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "how", "in", "is", "it", "of", "on", "or",
  "our", "say", "says", "that", "the", "this", "to", "what", "when", "where", "which", "who", "why", "with", "about", "material",
  "materials", "tell", "me", "explain", "we", "you", "i",
  // Georgian
  "და", "რა", "რას", "როგორ", "რატომ", "სად", "როდის", "არის", "ეს", "ის", "ამ", "იმ", "რომ", "თუ", "ან", "მაგრამ", "ჩვენი",
  "ჩვენ", "შესახებ", "ამბობს", "მასალა", "მასალის", "მასალაში",
]);

export function tokenizeQuery(query: string): string[] {
  const words = query
    .normalize("NFKC")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
  const unique: string[] = [];
  for (const word of words) {
    if (word.length < 2 || STOP_WORDS.has(word)) continue;
    if (!unique.includes(word)) unique.push(word);
  }
  return unique.slice(0, 12);
}

/** Word stem used for prefix matching (long words only). */
export function stemOf(token: string): { stem: string; prefix: boolean } {
  if (token.length <= 5) return { stem: token, prefix: false };
  const isGeorgian = /[Ⴀ-ჿ]/.test(token);
  const stemLength = isGeorgian ? Math.max(4, token.length - 3) : Math.max(4, token.length - 2);
  return { stem: token.slice(0, stemLength), prefix: true };
}

export function buildFtsQuery(query: string): string | null {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return null;
  return tokens
    .map((token) => {
      const { stem, prefix } = stemOf(token);
      return prefix ? `"${stem}"*` : `"${token}"`;
    })
    .join(" OR ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Re-ranking signal on top of BM25: how many different query words a passage
 * contains, plus a bonus for query words that appear next to each other
 * ("second law"). BM25 alone favours passages that repeat a single word.
 */
export function relevanceBoost(query: string, content: string): number {
  const text = content.normalize("NFKC").toLowerCase();
  const patterns = tokenizeQuery(query).map((token) => {
    const { stem, prefix } = stemOf(token);
    return `${escapeRegex(stem)}${prefix ? "[\\p{L}\\p{N}]*" : ""}`;
  });
  let coverage = 0;
  for (const pattern of patterns) {
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}`, "u").test(text)) coverage += 1;
  }
  let phrases = 0;
  for (let i = 0; i + 1 < patterns.length; i++) {
    if (new RegExp(`${patterns[i]}(['’]\\p{L}*)?\\s+${patterns[i + 1]}`, "u").test(text)) phrases += 1;
  }
  return coverage * 2 + phrases * 1.5;
}
