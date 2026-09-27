/**
 * What kind of statement is this, and what does it quietly assume?
 *
 * A statement's form carries premises whatever its subject: a universal
 * claim assumes there are no exceptions, a causal claim that the link is not
 * mere coincidence, a value judgement that there is a shared standard. Naming
 * these gives a student something to check — it is not a verdict. Detection
 * is cue-based and conservative; when unsure the statement is "factual".
 */

export const STATEMENT_TYPES = ["conditional", "normative", "causal", "universal", "comparative", "definition", "existential", "factual"] as const;
export type StatementType = (typeof STATEMENT_TYPES)[number];

export const ASSUMPTIONS = ["no_exception", "cause_not_coincidence", "shared_standard", "condition_holds", "same_scale", "searched_everywhere", "terms_agreed"] as const;
export type AssumptionId = (typeof ASSUMPTIONS)[number];

const CUES: Record<Exclude<StatementType, "factual">, RegExp[]> = {
  conditional: [/\bif\b[^.]*\bthen\b/i, /\b(?:provided\s+that|as\s+long\s+as|unless)\b/i, /(?<![\p{L}])(?:თუ\s[^.]*(?:მაშინ|მაშ)|იმ\s+შემთხვევაში|დავუშვათ)(?![\p{L}])/u],
  normative: [
    /\b(?:should|ought|must\s+not|must|good|bad|right|wrong|fair|unfair|better\s+to|worse)\b/i,
    /(?<![\p{L}])(?:უნდა|არ\s+უნდა|ცუდი|კარგი|სწორი|არასწორი|სამართლიან\p{L}*|უსამართლო|მორალურ\p{L}*|ვალდებულ\p{L}*|დასაშვებ\p{L}*|დაუშვებ\p{L}*)(?![\p{L}])/u,
  ],
  causal: [
    /\b(?:because|causes?|caused|leads?\s+to|results?\s+in|due\s+to|makes?\b[^.]{0,20}\b(?:happen|grow|rise|fall))\b/i,
    /(?<![\p{L}])(?:იწვევს|გამოიწვია|გამო|იმიტომ\s+რომ|შედეგად|განაპირობებს|დამოკიდებულია|მიზეზი)(?![\p{L}])/u,
  ],
  universal: [/\b(?:all|every|always|never|nobody|no\s+one|nothing|everyone|any)\b/i, /(?<![\p{L}])(?:ყველა|ყოველი|ყოველთვის|არასდროს|არასოდეს|არავინ|არაფერი|ნებისმიერ\p{L}*|მუდამ)(?![\p{L}])/u],
  comparative: [/\b(?:more|less|fewer|better|worse|than|most|least)\b/i, /(?<![\p{L}])(?:უფრო|ვიდრე|ნაკლებ\p{L}*|ყველაზე|მეტად)(?![\p{L}])/u],
  definition: [/\b(?:means|is\s+called|is\s+defined\s+as|refers\s+to)\b/i, /(?<![\p{L}])(?:ნიშნავს|ეწოდება|განიმარტება|გულისხმობს)(?![\p{L}])/u],
  existential: [/\bthere\s+(?:is|are)\s+(?:no|not)\b/i, /\b(?:exists?|does\s+not\s+exist)\b/i, /(?<![\p{L}])(?:არსებობს|არ\s+არსებობს)(?![\p{L}])/u],
};

const ORDER: Exclude<StatementType, "factual">[] = ["conditional", "normative", "causal", "universal", "definition", "existential", "comparative"];

/** Every type whose cue appears, strongest reading first (at least "factual"). */
export function statementTypes(sentence: string): StatementType[] {
  const found = ORDER.filter((type) => CUES[type].some((re) => re.test(sentence)));
  return found.length ? found : ["factual"];
}

const ASSUMPTION_FOR: Partial<Record<StatementType, AssumptionId>> = {
  universal: "no_exception",
  causal: "cause_not_coincidence",
  normative: "shared_standard",
  conditional: "condition_holds",
  comparative: "same_scale",
  existential: "searched_everywhere",
  definition: "terms_agreed",
};

/** Assumptions worth checking for a statement, most important first (at most three). */
export function assumptionsFor(sentence: string): AssumptionId[] {
  const out: AssumptionId[] = [];
  for (const type of statementTypes(sentence)) {
    const id = ASSUMPTION_FOR[type];
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 3);
}

/** Opinion markers: the speaker presents a view, not a checkable fact. */
export function soundsLikeOpinion(sentence: string): boolean {
  return (
    /\b(?:i\s+think|i\s+believe|in\s+my\s+opinion|i\s+feel|probably|maybe|perhaps)\b/i.test(sentence) ||
    /(?<![\p{L}])(?:ვფიქრობ|მგონია|მგონი|ჩემი\s+აზრით|ვთვლი|მჯერა|ალბათ|შეიძლება)(?![\p{L}])/u.test(sentence) ||
    statementTypes(sentence).includes("normative")
  );
}
