import { describe, expect, it } from "vitest";
import { contentTerms, editDistance, figuresFoundIn, isTypoOf, kaStem, enStem, splitSentences, textLanguage } from "@/lib/knowledge/language";
import { expandTerms } from "@/lib/knowledge/synonyms";
import { ingestDocument, pageQuality, type SourcePage } from "@/lib/knowledge/ingest";
import { extractKnowledge } from "@/lib/knowledge/knowledge";
import { checkUnderstanding, validateClaims } from "@/lib/knowledge/grounding";
import { assumptionsFor, statementTypes } from "@/lib/knowledge/reasoning";
import { formulaIn, suggestQuestions } from "@/lib/knowledge/questions";
import { SEED_MATERIALS } from "@/lib/db/seed-materials";

/*
 * A synthetic textbook with what real PDFs contain and naive pipelines get
 * wrong: a running head on every page, printed page numbers, a word split
 * across a line break, a letter-spaced page and a blank page.
 */
const HEAD = "PHYSICS FOR GRADE 9";
const page = (n: number, lines: string[]): SourcePage => ({ page: n, text: [HEAD, ...lines, String(n)].join("\n") });
const TEXTBOOK: SourcePage[] = [
  page(1, [
    "Chapter 1",
    "Forces and Motion",
    "The tendency of an object to keep its state of motion is called inertia.",
    "Scientists agree that inertia depends only on the mass of the object.",
  ]),
  page(2, [
    "The acceleration of a body is directly proportional to the net force and inversely proportional to its mass: F = m · a. The unit of force is the new-",
    "ton, and one newton gives a mass of 1 kg an acceleration of 1 m/s².",
    "For example, a net force of 20 N acting on a 4 kg trolley gives an acceleration of 5 m/s².",
  ]),
  page(3, [
    "One might object that heavy objects fall faster than light ones in everyday life.",
    "In reply, air resistance, not mass, explains the difference we observe.",
  ]),
  page(4, ["Chapter 2", "Energy", "Kinetic energy is defined as the energy an object has because it moves.", "Therefore a faster trolley carries more energy than a slower one of the same mass."]),
  { page: 5, text: [HEAD, "T h e   t e x t   c o n t i n u e s   h e r e", "5"].join("\n") },
  { page: 6, text: "" },
];

describe("Georgian and English word matching", () => {
  it("brings inflected Georgian forms to one stem", () => {
    for (const [a, b] of [
      ["ნიუტონის", "ნიუტონი"],
      ["კანონი", "კანონის"],
      ["ინერცია", "ინერციის"],
      ["განტოლება", "განტოლებები"],
      ["ეკოსისტემა", "ეკოსისტემებში"],
      ["ძალა", "ძალის"],
    ]) {
      expect(kaStem(a), `${a} / ${b}`).toBe(kaStem(b));
    }
    // Never shorter than three letters: over-stripping destroys words.
    expect(kaStem("ძალა").length).toBeGreaterThanOrEqual(3);
  });

  it("stems English plurals and possessives lightly", () => {
    expect(enStem("laws")).toBe("law");
    expect(enStem("forces")).toBe("force");
    expect(enStem("species")).toBe(enStem("species"));
    expect(enStem("analysis")).toBe("analysis");
    expect(enStem("mass")).toBe("mass");
    expect(contentTerms("What does Newton's second law say?")).toEqual(["newton", "second", "law"]);
  });

  it("drops filler and keeps content words in both languages", () => {
    expect(contentTerms("რას ამბობს მასალა ნიუტონის მეორე კანონის შესახებ?")).toEqual([kaStem("ნიუტონის"), kaStem("მეორე"), kaStem("კანონის")]);
  });

  it("tolerates typos in long words only", () => {
    expect(isTypoOf("photosynthesis", "photosintesis")).toBe(true);
    expect(isTypoOf("mass", "mast")).toBe(false);
    expect(editDistance("ინერცია", "ინერცია")).toBe(0);
  });

  it("detects the language of a text", () => {
    expect(textLanguage("ნიუტონის კანონები და ძალა")).toBe("ka");
    expect(textLanguage("Newton's laws of motion and force")).toBe("en");
  });

  it("expands a question with its equivalents in the other language", () => {
    const terms = expandTerms(contentTerms("კვადრატული განტოლება")).map((t) => t.term);
    expect(terms).toEqual(expect.arrayContaining(["quadratic", "equation"]));
    const english = expandTerms(contentTerms("Newton's law of inertia"));
    expect(english.find((t) => t.term === kaStem("ინერცია"))?.weight).toBeLessThan(1);
    expect(english.find((t) => t.term === "inertia")?.weight).toBe(1);
  });

  it("checks figures with decimal comma or point", () => {
    expect(figuresFoundIn("a = 5 m/s²", "the acceleration is 5 m/s²")).toBe(true);
    expect(figuresFoundIn("a = 0,5", "a = 0.5")).toBe(true);
    expect(figuresFoundIn("it is 12 N", "it is 20 N")).toBe(false);
  });

  it("splits sentences without breaking abbreviations or crossing paragraphs", () => {
    expect(splitSentences("See p. 4 for details on forces. The next part is about energy.\n\nA new paragraph starts here.")).toEqual([
      "See p. 4 for details on forces.",
      "The next part is about energy.",
      "A new paragraph starts here.",
    ]);
  });
});

describe("document ingestion", () => {
  const result = ingestDocument(TEXTBOOK, "pdf");

  it("removes running heads and page numbers, and repairs hyphenation", () => {
    const all = result.chunks.map((c) => c.text).join("\n");
    expect(all).not.toContain(HEAD);
    expect(all).not.toMatch(/^\d+$/m);
    expect(all).toContain("newton, and one newton");
    expect(result.report.dehyphenated).toBe(1);
    expect(result.report.warnings.map((w) => w.code)).toContain("running_text_removed");
  });

  it("reports empty and letter-spaced pages instead of indexing them as knowledge", () => {
    expect(pageQuality("T h e   t e x t   c o n t i n u e s   h e r e")).toBeLessThan(0.5);
    expect(result.report.emptyPages).toContain(6);
    expect(result.report.lowQualityPages).toContain(5);
    expect(result.report.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(["empty_pages", "low_quality_pages"]));
  });

  it("recovers chapters and keeps each passage inside one section with its real pages", () => {
    const energy = result.chunks.find((c) => c.text.includes("Kinetic energy"))!;
    expect(energy.chapter ?? energy.section).toMatch(/Chapter 2/);
    expect(energy.pageStart).toBe(4);
    expect(energy.pageEnd).toBe(4);
    const forces = result.chunks.filter((c) => (c.chapter ?? c.section ?? "").includes("Chapter 1"));
    expect(forces.length).toBeGreaterThan(0);
    for (const chunk of result.chunks) {
      expect(chunk.pageStart).not.toBeNull();
      expect(chunk.pageStart!).toBeGreaterThanOrEqual(1);
      expect(chunk.pageEnd!).toBeLessThanOrEqual(6);
    }
  });

  it("keeps Markdown headings as sections and never invents page numbers", () => {
    const ka = SEED_MATERIALS.find((m) => m.key === "newton-notes-ka")!;
    const md = ingestDocument([{ page: null, text: ka.text }], "markdown");
    expect(md.language).toBe("ka");
    expect(md.chunks.map((c) => c.section)).toEqual(expect.arrayContaining(["ნიუტონის მეორე კანონი", "ნიუტონის მესამე კანონი"]));
    expect(md.chunks.every((c) => c.pageStart === null && c.pageEnd === null)).toBe(true);
    expect(md.chunks.map((c) => c.text).join(" ")).not.toContain("##");
    // Every passage is findable by its section's name.
    const second = md.chunks.find((c) => c.section === "ნიუტონის მეორე კანონი")!;
    expect(second.terms).toContain(kaStem("მეორე"));
  });

  it("does not drop short sections", () => {
    const md = ingestDocument([{ page: null, text: "# Notes\n\n## Tiny\nA short line about magnets.\n\n## Other\nSomething else entirely here." }], "markdown");
    expect(md.chunks.map((c) => c.text).join(" ")).toContain("A short line about magnets.");
  });
});

describe("knowledge extraction", () => {
  const { chunks } = ingestDocument(TEXTBOOK, "pdf");
  const items = extractKnowledge(chunks);
  const byType = (type: string) => items.filter((i) => i.type === type);

  it("finds definitions with the defined term, formulas, examples, claims, objections and replies", () => {
    expect(byType("definition").map((i) => i.term)).toEqual(expect.arrayContaining(["inertia", "Kinetic energy"]));
    expect(byType("formula")[0].content).toContain("F = m · a");
    expect(byType("example")[0].content).toContain("20 N");
    expect(byType("claim")[0].content).toContain("Scientists agree");
    expect(byType("objection")[0].content).toContain("One might object");
    expect(byType("reply")[0].content).toContain("In reply");
    expect(byType("argument")[0].content).toContain("Therefore");
  });

  it("quotes only the material and attributes each item to the page its sentence is on", () => {
    const text = chunks.map((c) => c.text).join("\n\n");
    for (const item of items) expect(text).toContain(item.content);
    expect(byType("objection")[0].pageStart).toBe(3);
    expect(byType("formula")[0].pageStart).toBe(2);
  });

  it("links replies to objections and objections to the claim before them", () => {
    const objection = items.indexOf(byType("objection")[0]);
    const reply = byType("reply")[0];
    expect(reply.relation).toBe("responds_to");
    expect(reply.relatesTo).toBe(objection);
    expect(byType("objection")[0].relation).toBe("challenges");
  });

  it("reads Georgian definitions and formulas", () => {
    const ka = SEED_MATERIALS.find((m) => m.key === "newton-notes-ka")!;
    const kaItems = extractKnowledge(ingestDocument([{ page: null, text: ka.text }], "markdown").chunks);
    expect(kaItems.find((i) => i.type === "definition")?.term).toBe("ინერცია");
    expect(kaItems.some((i) => i.type === "formula" && i.content.includes("F = m · a"))).toBe(true);
    expect(kaItems.some((i) => i.type === "example" && i.content.startsWith("მაგალითი"))).toBe(true);
    expect(kaItems.every((i) => i.pageStart === null)).toBe(true);
  });
});

describe("checking sentences against the material", () => {
  const evidence = [
    { id: "E1", text: "The acceleration of a body is directly proportional to the net force and inversely proportional to its mass: F = m · a." },
    { id: "E2", text: "For example, a net force of 20 N acting on a 4 kg trolley gives an acceleration of 5 m/s²." },
  ];

  it("accepts a paraphrase, repairs a wrong citation and rejects an invention", () => {
    const [paraphrase, miscited, invented, figure, inference] = validateClaims(
      [
        { text: "Acceleration is proportional to the net force and inversely proportional to mass.", status: "grounded", evidence: ["E1"] },
        { text: "A 20 N force on a 4 kg trolley gives 5 m/s² of acceleration.", status: "grounded", evidence: ["E1"] },
        { text: "Newton discovered this law after watching an apple fall in 1666.", status: "grounded", evidence: ["E1"] },
        { text: "A net force of 20 N on a 4 kg trolley gives an acceleration of 8 m/s².", status: "grounded", evidence: ["E2"] },
        { text: "So doubling the force doubles the acceleration.", status: "inferred", evidence: ["E1"] },
      ],
      evidence,
    );
    expect(paraphrase.status).toBe("grounded");
    expect(miscited).toMatchObject({ status: "grounded", evidence: ["E2"] });
    expect(invented.status).toBe("unsupported");
    expect(figure.status).toBe("unsupported");
    expect(inference.status).toBe("inferred");
  });

  it("marks a hedged sentence uncertain, but never lets it carry an invented figure", () => {
    const [hedged, wrongFigure] = validateClaims(
      [
        { text: "This probably also applies to bicycles.", status: "uncertain", evidence: [] },
        { text: "Maybe the trolley weighed 9 kg.", status: "uncertain", evidence: [] },
      ],
      evidence,
    );
    expect(hedged.status).toBe("uncertain");
    expect(wrongFigure.status).toBe("unsupported");
  });

  it("compares a student's understanding sentence by sentence, never calling it wrong", () => {
    const passages = [
      "An object remains at rest, or continues to move in a straight line at a constant speed, unless a net external force acts on it. The more mass an object has, the greater its inertia.",
      "One newton is the force that gives a mass of 1 kg an acceleration of 1 m/s².",
    ];
    const checks = checkUnderstanding(
      "An object keeps moving at a constant speed unless a net force acts on it. One newton gives a mass of 1 kg an acceleration of 2 m/s². The more mass an object has, the smaller its inertia is not. Photosynthesis happens in leaves.",
      passages,
    );
    expect(checks.map((c) => c.status)).toEqual(["found", "numbers_differ", "may_contradict", "not_found"]);
    expect(checks[0].match?.passage).toBe(0);
    expect(checks[3].match).toBeNull();
  });
});

describe("reasoning cues and questions", () => {
  it("names the kind of statement and the assumptions to check", () => {
    expect(statementTypes("All metals conduct electricity.")).toContain("universal");
    expect(assumptionsFor("All metals conduct electricity.")).toContain("no_exception");
    expect(assumptionsFor("Smoking causes cancer.")).toContain("cause_not_coincidence");
    expect(assumptionsFor("სკოლებში ტელეფონი უნდა აიკრძალოს.")).toContain("shared_standard");
    expect(assumptionsFor("ყველა ლითონი ატარებს დენს.")).toContain("no_exception");
    expect(statementTypes("Water boils at 100 °C at sea level.")).toEqual(["factual"]);
  });

  it("builds questions from the material's own definitions, formulas and sections", () => {
    expect(formulaIn("We write this as F = m · a, where F is the force.")).toBe("F = m · a");
    const questions = suggestQuestions(
      [
        { type: "definition", term: "inertia", content: "The tendency to keep moving is called inertia.", section: "Forces", passage: 0 },
        { type: "formula", term: null, content: "We write this as F = m · a, where F is the force.", section: "Forces", passage: 1 },
      ],
      [{ title: "Newton's third law", passage: 2 }],
    );
    expect(questions.map((q) => q.kind)).toEqual(["meaning", "formula_parts", "own_example", "main_idea"]);
    expect(questions[1].subject).toBe("F = m · a");
  });
});
