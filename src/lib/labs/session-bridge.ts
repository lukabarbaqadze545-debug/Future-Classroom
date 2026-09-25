import "server-only";
import type { Activity } from "@/lib/domain/schemas";
import type { Subject } from "@/lib/domain/catalog";
import type { Locale } from "@/lib/i18n/config";
import { newId } from "@/lib/domain/ids";
import { tr, type L } from "./localized";
import { listProblems, getProblem } from "./programming/service";
import { CT_EXERCISES, findExercise } from "./critical/catalog";
import { EXPERIMENTS, findExperiment } from "./stem/experiments";
import { SIMULATIONS, findSimulation } from "./stem/simulations";
import { CHALLENGE_SETS, findChallengeSet } from "./stem/service";
import type { StemItem } from "./stem/types";

/*
 * "Use in a live session": converts lab items into classroom-session
 * activities, so a teacher can run a fallacy set, a predict-the-output
 * problem or an experiment discussion on the board with the whole class.
 * Only item types a session can show are converted; nothing is invented.
 */

export type BridgeLab = "programming" | "critical" | "experiment" | "simulation" | "challenge";

export interface BridgeItem {
  key: string;
  lab: BridgeLab;
  title: string;
  count: number;
}

const LETTERS = "abcdefgh";
const SESSION_READY_CT = new Set(["fallacy", "bias", "media", "sources", "claim"]);

function mc(title: string, prompt: string, options: { id: string; text: string }[], correct: string, explanation: string): Activity {
  const letters = new Map(options.map((o, i) => [o.id, LETTERS[i]]));
  return {
    id: newId(10),
    type: "multiple_choice",
    title: title.slice(0, 120),
    prompt: prompt.slice(0, 2000),
    options: options.map((o) => ({ id: letters.get(o.id)!, text: o.text.slice(0, 500) })),
    correctOptionIds: [letters.get(correct)!],
    acceptedAnswers: [],
    hints: [],
    solution: "",
    allowSolution: true,
    explanation: explanation.slice(0, 2000),
    timeLimitSec: null,
  };
}

function open(type: "short_answer" | "discussion" | "exit_ticket", title: string, prompt: string, accepted: string[] = [], explanation = ""): Activity {
  return {
    id: newId(10),
    type,
    title: title.slice(0, 120),
    prompt: prompt.slice(0, 2000),
    options: [],
    correctOptionIds: [],
    acceptedAnswers: accepted.map((a) => a.slice(0, 200)).slice(0, 10),
    hints: [],
    solution: "",
    allowSolution: true,
    explanation: explanation.slice(0, 2000),
    timeLimitSec: null,
  };
}

/** Accepted spellings of a numeric answer: exact, rounded, comma decimals. */
export function numericForms(value: number): string[] {
  const forms = new Set<string>();
  for (const digits of [0, 1, 2, 3]) {
    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (Math.abs(rounded - value) <= Math.max(Math.abs(value) * 0.01, 0.005)) {
      forms.add(String(rounded));
      forms.add(String(rounded).replace(".", ","));
    }
  }
  if (Math.abs(value * 6 - Math.round(value * 6)) < 1e-9 && !Number.isInteger(value)) forms.add(`${Math.round(value * 6)}/6`);
  if (Math.abs(value * 36 - Math.round(value * 36)) < 1e-9 && !Number.isInteger(value)) forms.add(`${Math.round(value * 36)}/36`);
  return [...forms];
}

function stemItems(items: StemItem[], title: string, locale: Locale): Activity[] {
  const out: Activity[] = [];
  for (const item of items) {
    if (item.type === "choice") out.push(mc(title, tr(item.prompt, locale), item.options.map((o) => ({ id: o.id, text: tr(o.text, locale) })), item.correct, tr(item.explanation, locale)));
    else if (item.type === "numeric") out.push(open("short_answer", title, `${tr(item.prompt, locale)}${item.unit ? ` (${item.unit})` : ""}`, numericForms(item.answer), tr(item.explanation, locale)));
  }
  return out;
}

/** Items a teacher can bring into a session, grouped by lab. */
export function bridgeItems(locale: Locale): BridgeItem[] {
  const items: BridgeItem[] = [];
  for (const p of listProblems()) {
    const count = p.kind === "code" ? (p.tests.some((t) => t.sample) ? 1 : 0) : 1;
    if (count) items.push({ key: `programming:${p.id}`, lab: "programming", title: tr(p.title, locale), count });
  }
  for (const e of CT_EXERCISES) {
    if (!SESSION_READY_CT.has(e.kind) || !("items" in e)) continue;
    const count = e.items.filter((i) => i.type === "choice").length;
    if (count) items.push({ key: `critical:${e.id}`, lab: "critical", title: tr(e.title, locale), count });
  }
  for (const e of EXPERIMENTS) items.push({ key: `experiment:${e.id}`, lab: "experiment", title: tr(e.title, locale), count: 2 });
  for (const s of SIMULATIONS) {
    const count = s.items.filter((i) => i.type !== "task").length;
    if (count) items.push({ key: `simulation:${s.id}`, lab: "simulation", title: tr(s.title, locale), count });
  }
  for (const c of CHALLENGE_SETS) items.push({ key: `challenge:${c.id}`, lab: "challenge", title: tr(c.title, locale), count: c.items.filter((i) => i.type !== "task").length });
  return items;
}

export function subjectFor(key: string): Subject {
  const [lab, id] = key.split(":");
  if (lab === "programming") return "computer_science";
  if (lab === "critical") return "critical_thinking";
  if (lab === "experiment") {
    const e = findExperiment(id);
    return e?.subject === "chemistry" ? "chemistry" : e?.subject === "biology" ? "biology" : e?.subject === "mathematics" ? "mathematics" : "physics";
  }
  if (lab === "simulation") {
    const s = findSimulation(id);
    return s?.subject === "mathematics" ? "mathematics" : s?.subject === "computing" ? "computer_science" : "physics";
  }
  return "physics";
}

/** Converts one lab item into session activities (empty if it cannot be shown in a session). */
export function toSessionActivities(key: string, locale: Locale): Activity[] {
  const [lab, id] = key.split(":");
  const t = (v: L) => tr(v, locale);
  if (lab === "programming") {
    const p = getProblem(id);
    if (!p) return [];
    const title = t(p.title);
    if (p.kind === "choice") {
      const code = p.code ? (p.code.python ?? p.code.cpp ?? "") : "";
      return [mc(title, `${t(p.statement)}${code ? `\n\n${code}` : ""}`, p.options.map((o) => ({ id: o.id, text: t(o.text) })), p.correct, t(p.explanation))];
    }
    if (p.kind === "predict") return [open("short_answer", title, `${t(p.statement)}\n\n${p.code.python}`, [p.expected.python], t(p.explanation))];
    const sample = p.tests.find((x) => x.sample);
    if (!sample) return [];
    const prompt = locale === "ka" ? `${t(p.statement)}\n\nრას უნდა დაბეჭდოს პროგრამამ ამ შეტანისთვის?\n${sample.input}` : `${t(p.statement)}\n\nWhat should the program print for this input?\n${sample.input}`;
    return [open("short_answer", title, prompt, [sample.output])];
  }
  if (lab === "critical") {
    const e = findExercise(id);
    if (!e || !("items" in e)) return [];
    const title = t(e.title);
    const passage = e.passage ? `${t(e.passage.title)}\n${t(e.passage.body)}\n(${t(e.passage.label)})\n\n` : "";
    return e.items.flatMap((item) =>
      item.type === "choice"
        ? [mc(title, `${passage}${item.context ? `${t(item.context)}\n\n` : ""}${t(item.prompt)}`, item.options.map((o) => ({ id: o.id, text: t(o.text) })), item.correct, `${t(item.explanation)}${item.better ? `\n\n${t(item.better)}` : ""}`)]
        : [],
    );
  }
  if (lab === "experiment") {
    const e = findExperiment(id);
    if (!e) return [];
    const title = t(e.title);
    return [open("discussion", title, `${t(e.summary)}\n\n${t(e.prediction)}`), open("exit_ticket", title, t(e.reflection[0]))];
  }
  if (lab === "simulation") {
    const s = findSimulation(id);
    return s ? stemItems(s.items, t(s.title), locale) : [];
  }
  if (lab === "challenge") {
    const c = findChallengeSet(id);
    return c ? stemItems(c.items, t(c.title), locale) : [];
  }
  return [];
}
