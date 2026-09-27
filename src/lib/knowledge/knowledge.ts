import { contentTerms, splitSentences } from "./language";
import { pagesForSentence, type Confidence, type IngestedChunk } from "./ingest";

/**
 * Structured knowledge inside a text: which sentences define something, give
 * a formula or an example, make a claim, argue, object or reply.
 *
 * Extraction is marker-driven and conservative. Every item's content is a
 * sentence of the material itself, with the pages that sentence is on;
 * nothing is paraphrased or invented here. Where the marker is explicit the
 * item is high confidence; weaker readings are marked lower, and a sentence
 * from a badly extracted page is never more than "low".
 */

export const KNOWLEDGE_TYPES = [
  "definition",
  "formula",
  "example",
  "claim",
  "argument",
  "objection",
  "reply",
  "counterargument",
  "distinction",
  "thought_experiment",
] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

export type RelationKind = "challenges" | "responds_to" | "contradicts" | "example_of" | "supports";

export interface KnowledgeItem {
  type: KnowledgeType;
  /** The term being defined, when the sentence names it. */
  term: string | null;
  content: string;
  confidence: Confidence;
  chunkPosition: number;
  section: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  terms: string[];
  /** Index (in the returned list) of the item this one relates to. */
  relatesTo: number | null;
  relation: RelationKind | null;
}

interface Marker {
  type: KnowledgeType;
  confidence: Confidence;
  patterns: RegExp[];
}

const WORD = "[\\p{L}][\\p{L}'’-]*";
const TERM_EN = `((?:${WORD}\\s+){0,3}${WORD})`;

/** Definitions whose defined term can be read off the sentence. */
const DEFINITION_TERM: RegExp[] = [
  new RegExp(`\\b(?:is|are)\\s+called\\s+(?:an?\\s+|the\\s+)?${TERM_EN}(?=\\s*[.,;:(]|$)`, "iu"),
  new RegExp(`\\b(?:is|are)\\s+known\\s+as\\s+(?:an?\\s+|the\\s+)?${TERM_EN}(?=\\s*[.,;:(]|$)`, "iu"),
  new RegExp(`\\bwe\\s+call\\s+(?:this|it|that|them)\\s+(?:an?\\s+|the\\s+)?${TERM_EN}(?=\\s*[.,;:(]|$)`, "iu"),
  new RegExp(`\\bthe\\s+term\\s+["“']?${TERM_EN}["”']?\\s+(?:refers\\s+to|denotes|means)\\b`, "iu"),
  new RegExp(`\\bby\\s+["“']?${TERM_EN}["”']?\\s*,?\\s*(?:i|we)\\s+mean\\b`, "iu"),
  new RegExp(`^(?:an?\\s+|the\\s+)?${TERM_EN}\\s+(?:is|are)\\s+(?:defined|understood)\\s+as\\b`, "iu"),
  new RegExp(`^(?:an?\\s+|the\\s+)?${TERM_EN}\\s+(?:means|refers\\s+to)\\b`, "iu"),
];

/** „X ეწოდება" / „ამას ეწოდება X" / „X ნიშნავს" / „X ეს არის". */
function georgianDefinitionTerm(sentence: string): string | null {
  const words = sentence.replace(/[.,;:!?„“"()«»—–]/g, " ").split(/\s+/).filter(Boolean);
  const naming = words.findIndex((w) => /^(ეწოდება|ეწოდებათ|უწოდებენ|ეძახიან)$/u.test(w));
  if (naming >= 0) {
    const before = words[naming - 1];
    const after = words[naming + 1];
    // „ამ თვისებას ინერცია ეწოდება": the nominative right before is the term;
    // „ამ თვისებას ეწოდება ინერცია": after it, when the word before is dative (-ს).
    if (before && !/ს$/u.test(before) && before.length >= 3) return before;
    if (after && after.length >= 3) return after;
    return null;
  }
  const means = words.findIndex((w) => /^(ნიშნავს|განისაზღვრება|გულისხმობს)$/u.test(w));
  if (means > 0 && means <= 3) return words.slice(0, means).join(" ");
  const isThis = /^([\p{L}-]{3,30}(?:\s+[\p{L}-]{3,30})?)\s*(?:—|-)\s*ეს\s+(?:არის|არს)\b/u.exec(sentence);
  if (isThis) return isThis[1];
  return null;
}

const MARKERS: Marker[] = [
  {
    type: "objection",
    confidence: "high",
    patterns: [
      /\b(?:one\s+might\s+object|it\s+may\s+be\s+objected|critics?\s+(?:argue|claim|object|say)|an?\s+obvious\s+objection|against\s+this(?:\s+view)?)\b/i,
      /\b(?:the\s+)?(?:standard|common|main)\s+objection\b/i,
      /(?<![\p{L}])(?:შესაგებელი|კრიტიკოსები\s+ამბობენ|კრიტიკოსები\s+ფიქრობენ|ამის\s+წინააღმდეგ)(?![\p{L}])/u,
    ],
  },
  {
    type: "reply",
    confidence: "high",
    patterns: [
      /\b(?:in\s+reply|the\s+reply\s+is|in\s+response|this\s+objection\s+fails|but\s+this\s+(?:objection\s+)?(?:misses|ignores|overlooks))\b/i,
      /(?<![\p{L}])(?:პასუხად|საპასუხოდ|ეს\s+შესაგებელი\s+ვერ)(?![\p{L}])/u,
    ],
  },
  {
    type: "counterargument",
    confidence: "medium",
    patterns: [/\b(?:on\s+the\s+other\s+hand|by\s+contrast|conversely)\b/i, /(?<![\p{L}])(?:მეორე\s+მხრივ|საპირისპიროდ)(?![\p{L}])/u],
  },
  {
    type: "argument",
    confidence: "high",
    patterns: [
      /\b(?:therefore|thus|hence|consequently|it\s+follows\s+that|we\s+may\s+conclude|this\s+is\s+why|that\s+is\s+why|which\s+is\s+why)\b/i,
      /(?<![\p{L}])(?:მაშასადამე|შესაბამისად|აქედან\s+გამომდინარე|ამრიგად|ამიტომაა|ამიტომ\s+არის)(?![\p{L}])/u,
    ],
  },
  {
    type: "example",
    confidence: "medium",
    patterns: [
      /\b(?:for\s+example|for\s+instance|to\s+take\s+an?\s+example|as\s+an\s+illustration|e\.g\.|worked\s+example|example\s*(?:from\s+class)?\s*:)/i,
      /(?<![\p{L}])(?:მაგალითად|მაგალითისთვის|მაგალითი\s*:|მაგალითი\s+კლასიდან)/u,
    ],
  },
  {
    type: "distinction",
    confidence: "high",
    patterns: [
      /\bdistinction\s+between\b/i,
      /\bmust\s+be\s+distinguished\s+from\b/i,
      /\bdiffers?\s+from\b[^.]{0,60}\bin\s+that\b/i,
      /(?<![\p{L}])(?:განსხვავება\s+[\p{L}\s]{3,60}\s+შორის|უნდა\s+გავმიჯნოთ|განსხვავდება)(?![\p{L}])/u,
    ],
  },
  {
    type: "thought_experiment",
    confidence: "high",
    patterns: [/\b(?:thought\s+experiment|imagine\s+that|suppose\s+that|consider\s+a\s+case)\b/i, /(?<![\p{L}])(?:წარმოიდგინე|დავუშვათ|წარმოვიდგინოთ|სააზროვნო\s+ექსპერიმენტი)(?![\p{L}])/u],
  },
  {
    type: "claim",
    confidence: "medium",
    patterns: [
      /\b(?:i\s+(?:shall\s+)?argue\s+that|my\s+claim\s+is|the\s+central\s+claim|i\s+maintain\s+that|the\s+thesis\s+(?:is|of)|scientists\s+(?:think|believe|agree|argue)|research\s+(?:shows|suggests)|evidence\s+(?:shows|suggests))\b/i,
      /(?<![\p{L}])(?:ვამტკიცებ|ჩემი\s+თეზისი|მთავარი\s+მტკიცება|მეცნიერები\s+(?:თვლიან|ფიქრობენ|ვარაუდობენ|ამტკიცებენ)|კვლევები\s+(?:აჩვენებს|ადასტურებს))(?![\p{L}])/u,
    ],
  },
];

/** A formula: a letter variable equal to an expression in letters (F = m · a, D = b² − 4ac). */
const FORMULA = /(?:^|[\s(:])[A-Za-zΔΣπλ][A-Za-z₀-₉²³]*\s*=\s*[(−\-√]*\s*[A-Za-zΔπλ√]/u;
/** An equation in standard form: ax² + bx + c = 0. */
const EQUATION = /[A-Za-z][²³]?\s*[+−-]\s*[\dA-Za-z][^=]{0,40}=\s*0(?![\d,.])/u;

function downgrade(confidence: Confidence, quality: Confidence): Confidence {
  if (quality === "low") return "low";
  if (quality === "medium" && confidence === "high") return "medium";
  return confidence;
}

function classify(sentence: string): { type: KnowledgeType; confidence: Confidence; term: string | null } | null {
  for (const pattern of DEFINITION_TERM) {
    const match = pattern.exec(sentence);
    if (match) return { type: "definition", confidence: "high", term: match[1].trim() };
  }
  const kaTerm = georgianDefinitionTerm(sentence);
  if (kaTerm) return { type: "definition", confidence: "high", term: kaTerm };
  for (const marker of MARKERS) {
    if (marker.type === "example" && marker.patterns.some((p) => p.test(sentence))) return { type: "example", confidence: marker.confidence, term: null };
    if (marker.patterns.some((p) => p.test(sentence))) return { type: marker.type, confidence: marker.confidence, term: null };
  }
  if (FORMULA.test(sentence) || EQUATION.test(sentence)) return { type: "formula", confidence: "high", term: null };
  return null;
}

/**
 * Extract knowledge items from a document's chunks. Relations (an objection
 * challenging a claim, a reply answering an objection, an example of a
 * claim) are carried across chunks within one section, where real prose
 * places them.
 */
export function extractKnowledge(chunks: readonly IngestedChunk[]): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const seen = new Set<string>();
  let lastClaim: number | null = null;
  let lastObjection: number | null = null;
  let lastSection: string | null | undefined;

  for (const chunk of chunks) {
    if (chunk.section !== lastSection) {
      lastClaim = null;
      lastObjection = null;
      lastSection = chunk.section;
    }
    const sectionTerms = contentTerms(`${chunk.section ?? ""} ${chunk.chapter ?? ""}`);
    const sentences = splitSentences(chunk.text, { min: 15 });
    for (const sentence of sentences) {
      const found = classify(sentence);
      if (!found) continue;
      const key = `${found.type}:${sentence.slice(0, 80)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const pages = pagesForSentence(chunk, sentence);
      const index = items.length;
      const item: KnowledgeItem = {
        type: found.type,
        term: found.term ? found.term.slice(0, 80) : null,
        content: sentence,
        confidence: downgrade(found.confidence, chunk.quality),
        chunkPosition: chunk.position,
        section: chunk.section,
        pageStart: pages.pageStart,
        pageEnd: pages.pageEnd,
        terms: [...new Set([...contentTerms(sentence), ...sectionTerms])],
        relatesTo: null,
        relation: null,
      };
      const relate = (target: number | null, relation: RelationKind) => {
        if (target === null) return;
        item.relatesTo = target;
        item.relation = relation;
      };
      if (found.type === "objection") relate(lastClaim, "challenges");
      else if (found.type === "reply") relate(lastObjection, "responds_to");
      else if (found.type === "counterargument") relate(lastClaim, "contradicts");
      else if (found.type === "example" || found.type === "thought_experiment") relate(lastClaim, "example_of");
      else if (found.type === "argument") relate(lastClaim, "supports");
      items.push(item);
      if (found.type === "claim" || found.type === "definition") lastClaim = index;
      if (found.type === "objection") lastObjection = index;
    }
  }
  return items;
}
