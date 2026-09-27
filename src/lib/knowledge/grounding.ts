import { figuresFoundIn, hasNegation, splitSentences, uniqueTerms } from "./language";

/**
 * Checking statements against the passages they are supposed to come from.
 *
 * The same stemmer the search uses decides whether two texts share their
 * content words, so a paraphrase counts as support and a fluent invention
 * does not. Two users:
 *
 *  - AI explanations: each sentence the model writes is checked against the
 *    evidence it was given, whatever the model claims about it;
 *  - "check my understanding": each sentence a student writes is compared
 *    with the material.
 *
 * Nothing is silently dropped: a sentence that the material does not carry
 * is shown as such.
 */

export interface Evidence {
  id: string;
  text: string;
}

export type ClaimStatus = "grounded" | "inferred" | "uncertain" | "unsupported";

export interface ModelClaim {
  text: string;
  status: Exclude<ClaimStatus, "unsupported">;
  evidence: string[];
}

export interface CheckedClaim {
  text: string;
  status: ClaimStatus;
  evidence: string[];
  /** Share of the claim's content words found in its evidence (0..1). */
  support: number;
}

/** Share of a stated fact's content words that must appear in its evidence. */
const GROUNDED_THRESHOLD = 0.4;
/** Below this many shared words a ratio is noise, not evidence. */
const MIN_MATCHES = 2;

function overlap(claimTerms: readonly string[], evidenceTerms: ReadonlySet<string>): { ratio: number; matches: number } {
  if (claimTerms.length === 0) return { ratio: 0, matches: 0 };
  const matches = claimTerms.filter((t) => evidenceTerms.has(t)).length;
  return { ratio: matches / claimTerms.length, matches };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Validate an AI explanation sentence by sentence.
 *
 *  grounded    stated as coming from the material: its words must be there
 *              (the cited passage, or — citation repair — another one given);
 *  inferred    a conclusion drawn from the material: it must be anchored to
 *              evidence, but new wording is the point;
 *  uncertain   hedged by the model; asserts nothing to verify;
 *  unsupported none of the above.
 *
 * Every figure must appear somewhere in the evidence, whatever the status: a
 * wrong number is the most damaging error and the least visible to word overlap.
 */
export function validateClaims(claims: readonly ModelClaim[], evidence: readonly Evidence[]): CheckedClaim[] {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const termsById = new Map(evidence.map((e) => [e.id, new Set(uniqueTerms(e.text))]));
  const allTerms = new Set([...termsById.values()].flatMap((s) => [...s]));
  const allText = evidence.map((e) => e.text).join(" ");

  return claims.map((claim) => {
    const claimTerms = uniqueTerms(claim.text);
    const cited = claim.evidence.filter((id) => byId.has(id));
    const citedTerms = new Set(cited.flatMap((id) => [...termsById.get(id)!]));
    const direct = overlap(claimTerms, citedTerms);
    const anywhere = overlap(claimTerms, allTerms);
    const figuresOk = figuresFoundIn(claim.text, allText);
    const reject = (): CheckedClaim => ({ text: claim.text, status: "unsupported", evidence: cited, support: round(Math.max(direct.ratio, anywhere.ratio)) });

    if (!figuresOk) return reject();
    if (claim.status === "uncertain") return { text: claim.text, status: "uncertain", evidence: cited, support: round(anywhere.ratio) };
    if (claim.status === "inferred") {
      if (cited.length === 0 && anywhere.matches === 0) return reject();
      return { text: claim.text, status: "inferred", evidence: cited, support: round(cited.length ? direct.ratio : anywhere.ratio) };
    }
    if (cited.length > 0 && direct.ratio >= GROUNDED_THRESHOLD && direct.matches >= MIN_MATCHES) {
      return { text: claim.text, status: "grounded", evidence: cited, support: round(direct.ratio) };
    }
    // Citation repair: a correct sentence with the wrong (or no) passage number.
    if (anywhere.ratio >= GROUNDED_THRESHOLD && anywhere.matches >= MIN_MATCHES) {
      const repaired = evidence.filter((e) => overlap(claimTerms, termsById.get(e.id)!).ratio >= GROUNDED_THRESHOLD).map((e) => e.id);
      return { text: claim.text, status: "grounded", evidence: repaired.length ? repaired : cited, support: round(anywhere.ratio) };
    }
    return reject();
  });
}

/* ------------------------- checking a student's text ------------------------- */

export type UnderstandingStatus = "found" | "partly" | "numbers_differ" | "may_contradict" | "not_found";

export interface SourceSentence {
  /** Which passage (index into the list given) the sentence is from. */
  passage: number;
  text: string;
}

export interface UnderstandingCheck {
  sentence: string;
  status: UnderstandingStatus;
  /** The closest sentence of the material, when there is one. */
  match: SourceSentence | null;
  support: number;
}

/**
 * Compare each sentence a student wrote with the sentences of the retrieved
 * passages. The result never says "wrong": "not found" means the material
 * does not say it, and "may contradict" only asks for a careful comparison.
 */
export function checkUnderstanding(studentText: string, passages: readonly string[]): UnderstandingCheck[] {
  const sources: (SourceSentence & { terms: Set<string> })[] = passages.flatMap((text, passage) =>
    splitSentences(text, { min: 8 }).map((sentence) => ({ passage, text: sentence, terms: new Set(uniqueTerms(sentence)) })),
  );
  const sentences = splitSentences(studentText, { min: 4, max: 800 });
  const list = sentences.length ? sentences : studentText.trim() ? [studentText.trim()] : [];

  return list.slice(0, 12).map((sentence) => {
    const terms = uniqueTerms(sentence);
    let best: { source: (typeof sources)[number]; ratio: number; matches: number } | null = null;
    for (const source of sources) {
      const { ratio, matches } = overlap(terms, source.terms);
      if (!best || ratio > best.ratio || (ratio === best.ratio && matches > best.matches)) best = { source, ratio, matches };
    }
    // Words spread over several sentences of one passage still count, at a discount.
    const passageTerms = best ? new Set(sources.filter((s) => s.passage === best!.source.passage).flatMap((s) => [...s.terms])) : new Set<string>();
    const wider = overlap(terms, passageTerms);
    const match = best ? { passage: best.source.passage, text: best.source.text } : null;
    const ratio = best ? Math.max(best.ratio, wider.ratio * 0.8) : 0;
    const matches = best ? Math.max(best.matches, wider.matches) : 0;

    if (!best || terms.length === 0 || matches === 0 || ratio < 0.25) return { sentence, status: "not_found", match: null, support: round(ratio) };
    const strong = ratio >= 0.5 && matches >= Math.min(2, terms.length);
    if (strong && !figuresFoundIn(sentence, passages[best.source.passage] ?? "")) return { sentence, status: "numbers_differ", match, support: round(ratio) };
    if (strong && best.ratio >= 0.5 && hasNegation(sentence) !== hasNegation(best.source.text)) return { sentence, status: "may_contradict", match, support: round(ratio) };
    return { sentence, status: strong ? "found" : "partly", match, support: round(ratio) };
  });
}
