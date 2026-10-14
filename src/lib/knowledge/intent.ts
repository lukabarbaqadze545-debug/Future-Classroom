/**
 * What a question is really asking, in English and Georgian.
 *
 * "What does afternoon mean?" is about *afternoon*; "what does" and "mean" only
 * say that a definition is wanted. Searching with all of the words lets the
 * scaffolding drown the subject (every dictionary entry has a "Meaning:" line),
 * so the question is split into a kind (define, translate, compare…) and a
 * focus, and the focus is what gets searched. Pure and language-only: it never
 * looks at any material.
 */

export type IntentKind = "define" | "translate" | "example" | "compare" | "how" | "why" | "general";

export type TargetLanguage = "es" | "en" | "ka";

export interface QueryIntent {
  kind: IntentKind;
  /** What the question is about, without its scaffolding ("afternoon"). */
  focus: string;
  /** For a comparison, the two things compared. */
  sides: [string, string] | null;
  /** For a translation, the language asked for, when the question names one. */
  target: TargetLanguage | null;
  /** A word or short phrase on its own: most likely a look-up. */
  bare: boolean;
}

const LANGUAGE_NAMES: Record<string, TargetLanguage> = {
  spanish: "es",
  español: "es",
  espanol: "es",
  english: "en",
  georgian: "ka",
  ესპანურად: "es",
  ესპანური: "es",
  ინგლისურად: "en",
  ინგლისური: "en",
  ქართულად: "ka",
  ქართული: "ka",
};

const language = (name: string): TargetLanguage | null => LANGUAGE_NAMES[name.toLowerCase()] ?? null;

/** Quotes and trailing punctuation around the thing asked about. */
function tidy(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[„“”"«»‹›`´]/g, "")
    .replace(/^['‘’]+|['‘’]+$/g, "")
    .replace(/^(?:the\s+)?(?:word|term|phrase|expression|სიტყვა|ტერმინი|გამოთქმა)\s+/i, "")
    .replace(/[?？!.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const LANG = "(spanish|english|georgian|ესპანურად|ინგლისურად|ქართულად)";
/** The Georgian adverb alone ("… ესპანურად") is enough to ask for a translation; the English name alone is not ("I like Spanish"). */
const LANG_KA = "(ესპანურად|ინგლისურად|ქართულად)";

type Rule = { kind: IntentKind; pattern: RegExp; focus: number; target?: number; sides?: [number, number] };

/** A focus that starts like a question is the whole question, not a topic ("what is the mean"). */
const QUESTION_START = /^(?:what|who|whom|whose|how|why|when|where|which|is|are|does|do|did|can|could|should|would|will)\b/i;

/** Tried in order; the first that matches decides. Comparisons come before definitions ("what is the difference…"). */
const RULES: Rule[] = [
  // --- comparing -------------------------------------------------------------
  { kind: "compare", pattern: /^(?:what(?:'s| is)\s+)?(?:the\s+)?(?:difference|differences|distinction)s?\s+between\s+(.+?)\s+(?:and|&|vs\.?|versus)\s+(.+)$/i, focus: 0, sides: [1, 2] },
  { kind: "compare", pattern: /^compare\s+(.+?)\s+(?:and|with|to|&)\s+(.+)$/i, focus: 0, sides: [1, 2] },
  { kind: "compare", pattern: /^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i, focus: 0, sides: [1, 2] },
  { kind: "compare", pattern: /^(?:რა\s+)?განსხვავებაა?\s+(.+?)\s+და\s+(.+?)(?:\s+შორის)?$/i, focus: 0, sides: [1, 2] },
  { kind: "compare", pattern: /^(.+?)\s+და\s+(.+?)\s+შორის\s+(?:განსხვავება|სხვაობა)$/i, focus: 0, sides: [1, 2] },
  { kind: "compare", pattern: /^შეადარე\s+(.+?)\s+და\s+(.+)$/i, focus: 0, sides: [1, 2] },

  // --- translating -----------------------------------------------------------
  { kind: "translate", pattern: new RegExp(`^(?:how\\s+(?:do\\s+(?:you|i)|can\\s+(?:you|i)|to)\\s+say|how\\s+to\\s+say)\\s+(.+?)\\s+in\\s+${LANG}$`, "i"), focus: 1, target: 2 },
  { kind: "translate", pattern: new RegExp(`^(?:what(?:'s| is)\\s+)?(?:the\\s+)?${LANG}\\s+(?:for|word\\s+for|translation\\s+of|equivalent\\s+of)\\s+(.+)$`, "i"), focus: 2, target: 1 },
  { kind: "translate", pattern: new RegExp(`^(?:what(?:'s| is)\\s+)?(.+?)\\s+in\\s+${LANG}$`, "i"), focus: 1, target: 2 },
  { kind: "translate", pattern: new RegExp(`^translate\\s+(.+?)\\s+(?:to|into|in)\\s+${LANG}$`, "i"), focus: 1, target: 2 },
  { kind: "translate", pattern: /^(?:translate|translation\s+of|translation\s+for)\s+(.+)$/i, focus: 1 },
  { kind: "translate", pattern: /^(.+?)\s+(?:translation|translated)$/i, focus: 1 },
  { kind: "translate", pattern: new RegExp(`^(?:როგორ\\s+(?:ითარგმნება|ვთქვა|იტყვი|ვთარგმნო))\\s+(.+?)\\s+${LANG}$`, "i"), focus: 1, target: 2 },
  { kind: "translate", pattern: new RegExp(`^(.+?)\\s+${LANG_KA}$`, "i"), focus: 1, target: 2 },
  { kind: "translate", pattern: new RegExp(`^${LANG_KA}\\s+(.+)$`, "i"), focus: 2, target: 1 },
  { kind: "translate", pattern: /^(?:თარგმნე|თარგმანი|თარგმნა)\s+(.+)$/i, focus: 1 },

  // --- examples --------------------------------------------------------------
  { kind: "example", pattern: /^(?:give\s+me\s+|show\s+me\s+)?(?:an?\s+|some\s+)?(?:examples?|sentences?)\s+(?:of|with|using|for)\s+(.+)$/i, focus: 1 },
  { kind: "example", pattern: /^(?:use|using)\s+(.+?)\s+in\s+(?:an?\s+)?(?:sentence|example)s?$/i, focus: 1 },
  { kind: "example", pattern: /^how\s+(?:do\s+i|to|can\s+i|do\s+you)\s+use\s+(.+)$/i, focus: 1 },
  { kind: "example", pattern: /^(?:მაგალითი|მაგალითები|წინადადება)\s+(.+)$/i, focus: 1 },

  // --- defining --------------------------------------------------------------
  { kind: "define", pattern: /^(?:what(?:'s| is| are)\s+)?(?:the\s+)?(?:meaning|meanings|definition|definitions)\s+of\s+(.+)$/i, focus: 1 },
  { kind: "define", pattern: /^what\s+(?:does|do|did)\s+(.+?)\s+mean(?:\s+in\s+(?:english|spanish|simple\s+words|plain\s+english))?$/i, focus: 1 },
  { kind: "define", pattern: /^(?:what\s+is\s+meant\s+by|what\s+do\s+you\s+mean\s+by)\s+(.+)$/i, focus: 1 },
  { kind: "define", pattern: /^(?:define|explain\s+the\s+(?:meaning|word|term)(?:\s+of)?|meaning\s+of|definition\s+of)\s+(.+)$/i, focus: 1 },
  { kind: "define", pattern: /^(.+?)\s+(?:meaning|definition|means|mean)$/i, focus: 1 },
  { kind: "define", pattern: /^(?:რას\s+(?:ნიშნავს|გულისხმობს)|რა\s+ნიშნავს)\s+(.+)$/i, focus: 1 },
  { kind: "define", pattern: /^(.+?)\s+(?:რას\s+ნიშნავს|რა\s+არის|რა\s+ნიშნავს)$/i, focus: 1 },
  { kind: "define", pattern: /^რა\s+არის\s+(.+?)(?:-ს\s+მნიშვნელობა|\s+მნიშვნელობა)?$/i, focus: 1 },
  { kind: "define", pattern: /^(?:განმარტე|განმარტება|განსაზღვრე|განსაზღვრება)\s+(.+)$/i, focus: 1 },
  { kind: "define", pattern: /^(?:what(?:'s| is| are)|whats)\s+(?:an?\s+|the\s+)?(.+)$/i, focus: 1 },

  // --- how and why -----------------------------------------------------------
  { kind: "why", pattern: /^why\s+(?:is|are|does|do|did|was|were|can|can't|cannot)\s+(.+)$/i, focus: 1 },
  { kind: "why", pattern: /^რატომ\s+(.+)$/i, focus: 1 },
  { kind: "how", pattern: /^how\s+(?:does|do|did|can|could|is|are)\s+(.+?)(?:\s+work)?$/i, focus: 1 },
  { kind: "how", pattern: /^როგორ\s+(?:მუშაობს|ხდება|მოქმედებს|მიმდინარეობს)\s+(.+)$/i, focus: 1 },
];

/** "Please explain…", "can you tell me about…": polite scaffolding in front of a plain topic. */
const LEAD_IN = /^(?:please\s+)?(?:(?:can|could|would)\s+you\s+(?:please\s+)?)?(?:tell\s+me\s+about|tell\s+me\s+what|explain(?:\s+to\s+me)?|describe|talk\s+about|help\s+me\s+understand|i\s+(?:want|need)\s+to\s+(?:know|learn|understand)(?:\s+about)?|i\s+would\s+like\s+to\s+(?:know|learn)\s+about|გთხოვ(?:თ)?|მითხარი|ამიხსენი|ახსენი|მიამბე|მინდა\s+(?:ვიცოდე|გავიგო|ვისწავლო))\s+(.+)$/i;

const WORDS = (text: string) => text.split(/\s+/).filter(Boolean);

/** Understand a question: its kind and what it is about. */
export function understandQuery(text: string): QueryIntent {
  const original = text.normalize("NFC").replace(/\s+/g, " ").trim();
  const cleaned = original.replace(/[?？!]+$/g, "").trim();

  for (const rule of RULES) {
    const m = rule.pattern.exec(cleaned);
    if (!m) continue;
    const focus = tidy(m[rule.focus] ?? m[1]);
    if (!focus) continue;
    const sides = rule.sides ? ([tidy(m[rule.sides[0]]), tidy(m[rule.sides[1]])] as [string, string]) : null;
    if (sides && (!sides[0] || !sides[1])) continue;
    const target = rule.target ? language(m[rule.target]) : null;
    // "x in spanish" with a long phrase before it is more likely a sentence than a look-up.
    if (rule.kind === "translate" && WORDS(focus).length > 8) continue;
    // "x means / x meaning" and "x translation" are look-ups only when x is a topic, not another question.
    if ((rule.pattern.source.includes("meaning|definition|means|mean") || rule.pattern.source.includes("translation|translated")) && QUESTION_START.test(focus)) continue;
    return { kind: rule.kind, focus: sides ? `${sides[0]} ${sides[1]}` : focus, sides, target, bare: false };
  }

  const lead = LEAD_IN.exec(cleaned);
  const focus = tidy(lead ? lead[1] : cleaned);
  return { kind: "general", focus: focus || tidy(cleaned), sides: null, target: null, bare: WORDS(focus).length <= 3 && !/[?？]/.test(original) };
}
