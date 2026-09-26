import { describe, expect, it } from "vitest";
import { ka } from "@/lib/i18n/ka";
import { en } from "@/lib/i18n/en";
import { AVOIDED } from "@/lib/i18n/terminology";
import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import { SUBJECT_CATALOG } from "@/lib/content/subjects";
import { BUILT_IN_PROBLEMS } from "@/lib/labs/programming/catalog";
import { CT_EXERCISES } from "@/lib/labs/critical/catalog";
import { BIAS_CARDS, CONCEPTS, FALLACY_CARDS } from "@/lib/labs/critical/concepts";
import { COMPONENTS, ELECTRONICS_CHALLENGES, ELECTRONICS_TOPICS } from "@/lib/labs/stem/electronics";
import { EXPERIMENTS } from "@/lib/labs/stem/experiments";
import { PROJECT_TEMPLATES } from "@/lib/labs/stem/projects";
import { ROBOTICS_CHALLENGES, ROBOTICS_CONCEPTS, ROBOTICS_PROJECTS } from "@/lib/labs/stem/robotics";
import { SIMULATIONS } from "@/lib/labs/stem/simulations";
import { SEED_LIBRARY } from "@/lib/labs/library/catalog-seed";
import { CAREERS, FIELDS } from "@/lib/labs/career/careers";
import { SKILLS } from "@/lib/labs/career/skills";

type Text = { where: string; text: string };

/** Every string in a tree. */
function strings(tree: unknown, where: string): Text[] {
  if (typeof tree === "string") return [{ where, text: tree }];
  if (Array.isArray(tree)) return tree.flatMap((v, i) => strings(v, `${where}[${i}]`));
  if (tree && typeof tree === "object") return Object.entries(tree).flatMap(([k, v]) => strings(v, `${where}.${k}`));
  return [];
}

/** The Georgian side of every bilingual {en, ka} pair in a tree. */
function georgianSides(tree: unknown, where: string): Text[] {
  if (Array.isArray(tree)) return tree.flatMap((v, i) => georgianSides(v, `${where}[${i}]`));
  if (tree && typeof tree === "object") {
    const record = tree as Record<string, unknown>;
    if (typeof record.en === "string" && typeof record.ka === "string" && Object.keys(record).length === 2) return [{ where, text: record.ka }];
    return Object.entries(record).flatMap(([k, v]) => georgianSides(v, `${where}.${k}`));
  }
  return [];
}

const CATALOGS: Record<string, unknown> = {
  subjects: SUBJECT_CATALOG,
  problems: BUILT_IN_PROBLEMS,
  critical: CT_EXERCISES,
  concepts: [CONCEPTS, FALLACY_CARDS, BIAS_CARDS],
  electronics: [ELECTRONICS_TOPICS, COMPONENTS, ELECTRONICS_CHALLENGES],
  experiments: EXPERIMENTS,
  projects: PROJECT_TEMPLATES,
  robotics: [ROBOTICS_CONCEPTS, ROBOTICS_PROJECTS, ROBOTICS_CHALLENGES],
  simulations: SIMULATIONS,
  library: SEED_LIBRARY,
  careers: [CAREERS, FIELDS, SKILLS],
};

const georgianUi = strings(ka, "ka");
// English lessons keep their English examples in the Georgian version on purpose.
const georgianLessons = BUILT_IN_LESSONS.filter((l) => l.language === "ka" && l.subject !== "english").flatMap((l) => strings({ title: l.title, topic: l.topic, objective: l.objective, content: l.content, quiz: l.quiz }, l.key));
const georgianCatalogs = Object.entries(CATALOGS).flatMap(([name, tree]) => georgianSides(tree, name));
const ALL = [...georgianUi, ...georgianLessons, ...georgianCatalogs];

const GEORGIAN = /[ა-ჿ]/;
/** Latin words outside {placeholders}. */
const latinWords = (s: string) => s.replace(/\{\w+\}/g, "").match(/\b[A-Za-z]{3,}\b/g) ?? [];

describe("Georgian terminology", () => {
  it("never uses wordings the terminology file rules out", () => {
    const found = ALL.flatMap(({ where, text }) =>
      AVOIDED.filter(({ wording }) => text.toLowerCase().includes(wording.toLowerCase())).map(({ wording, use }) => `${where}: “${wording}” → use “${use}”`),
    );
    expect(found).toEqual([]);
  });

  it("has Georgian built-in content wherever there is prose", () => {
    // Formulas, code, names, units and sample passwords may be Latin; sentences (which have spaces) may not.
    const untranslated = [...georgianLessons, ...georgianCatalogs].filter(({ text }) => !GEORGIAN.test(text) && /\s/.test(text.trim()) && latinWords(text).length >= 4 && !/[=(){};<>]|print|cout|def /.test(text));
    expect(untranslated.map((t) => `${t.where}: ${t.text.slice(0, 80)}`)).toEqual([]);
  });

  it("translates the interface: no Georgian UI string is the English one", () => {
    const english = new Map(strings(en, "ka").map((t) => [t.where, t.text]));
    const same = georgianUi.filter(({ where, text }) => english.get(where) === text && latinWords(text).length >= 2 && GEORGIAN.test(text) === false);
    // Brand and product names are the only allowed exceptions.
    expect(same.map((t) => `${t.where}: ${t.text}`).filter((s) => !/STEM|Python|C\+\+|Judge0|Pyodide|Arduino/.test(s))).toEqual([]);
  });
});
