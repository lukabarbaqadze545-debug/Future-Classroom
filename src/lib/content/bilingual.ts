import type { Activity, LessonContent, QuizQuestion } from "@/lib/domain/schemas";
import type { ContentLanguage, Difficulty, SectionKind, Subject } from "@/lib/domain/catalog";
import { discussion, exercise, exitTicket, multipleChoice, plot, poll, quiz, section, shortAnswer } from "@/lib/ai/templates/builders";
import type { CuratedLesson } from "@/lib/ai/templates/types";

/**
 * Built-in lessons are written once with both languages side by side and
 * turned into one ordinary lesson record per language. Structure (activities,
 * correct answers, quiz keys) is shared, so the versions cannot drift apart.
 *
 * A plain string is used as-is in every language (formulas, code, names) or
 * for lessons that exist in only one language (see `only`).
 */
export type Txt = { en: string; ka: string } | string;
type Answers = string[] | { en: string[]; ka: string[] };

interface ActivityCommon {
  title?: Txt;
  hints?: Txt[];
  solution?: Txt;
  explanation?: Txt;
  allowSolution?: boolean;
}

export type BiActivity =
  | (ActivityCommon & { type: "mc"; prompt: Txt; options: Txt[]; correct: number | number[] })
  | (ActivityCommon & { type: "exercise" | "short"; prompt: Txt; accepted: Answers })
  | (ActivityCommon & { type: "discussion" | "exit"; prompt: Txt })
  | (ActivityCommon & { type: "poll"; prompt: Txt; options: Txt[] });

export type BiQuestion =
  | { type: "mc"; prompt: Txt; options: Txt[]; correct: number; explanation?: Txt }
  | { type: "tf"; prompt: Txt; answer: boolean; explanation?: Txt }
  | { type: "num"; prompt: Txt; answer: number; tolerance?: number; explanation?: Txt }
  | { type: "short"; prompt: Txt; accepted: Answers; explanation?: Txt };

export interface BiSection {
  kind: SectionKind;
  title: Txt;
  minutes: number;
  body: Txt;
  plot?: { expression: string; xMin: number; xMax: number; caption: Txt };
}

export interface BiLesson {
  /** Shared by all language versions; each version's key is `${group}-${language}`. */
  group: string;
  subject: Subject;
  grade: number;
  durationMin: number;
  difficulty: Difficulty;
  /** Matches topics typed by teachers (in either language) when AI is off. */
  match: RegExp;
  /** Lessons that make sense in one language only (e.g. Georgian grammar). */
  only?: ContentLanguage;
  title: Txt;
  topic: Txt;
  objective: Txt;
  objectives: Txt[];
  sections: BiSection[];
  activities: BiActivity[];
  discussion: Txt[];
  assessment: Txt[];
  homework: Txt[];
  teacherNotes: Txt;
  /** Real, checkable references only. */
  sources?: string[];
  quiz: { title: Txt; questions: BiQuestion[] };
}

export function t(value: Txt, lang: ContentLanguage): string {
  return typeof value === "string" ? value : value[lang];
}

function answers(value: Answers, lang: ContentLanguage): string[] {
  return Array.isArray(value) ? value : value[lang];
}

const TRUE_FALSE: Record<ContentLanguage, [string, string]> = { en: ["True", "False"], ka: ["მართალია", "მცდარია"] };

function activity(a: BiActivity, id: string, lang: ContentLanguage): Activity {
  const fields = {
    title: a.title ? t(a.title, lang) : undefined,
    hints: a.hints?.map((h) => t(h, lang)),
    solution: a.solution ? t(a.solution, lang) : undefined,
    explanation: a.explanation ? t(a.explanation, lang) : undefined,
    allowSolution: a.allowSolution,
  };
  switch (a.type) {
    case "mc":
      return multipleChoice(id, t(a.prompt, lang), a.options.map((o) => t(o, lang)), a.correct, fields);
    case "exercise":
      return exercise(id, t(a.prompt, lang), answers(a.accepted, lang), fields);
    case "short":
      return shortAnswer(id, t(a.prompt, lang), answers(a.accepted, lang), fields);
    case "poll":
      return poll(id, t(a.prompt, lang), a.options.map((o) => t(o, lang)), fields);
    case "discussion":
      return discussion(id, t(a.prompt, lang), fields);
    case "exit":
      return exitTicket(id, t(a.prompt, lang), fields);
  }
}

function question(q: BiQuestion, id: string, lang: ContentLanguage): QuizQuestion {
  const explanation = q.explanation ? t(q.explanation, lang) : "";
  switch (q.type) {
    case "mc":
      return quiz.mc(id, t(q.prompt, lang), q.options.map((o) => t(o, lang)), q.correct, explanation);
    case "tf":
      return quiz.trueFalse(id, t(q.prompt, lang), q.answer, explanation, TRUE_FALSE[lang]);
    case "num":
      return quiz.numerical(id, t(q.prompt, lang), q.answer, q.tolerance ?? 0, explanation);
    case "short":
      return quiz.short(id, t(q.prompt, lang), answers(q.accepted, lang), explanation);
  }
}

/** One ordinary curated lesson per language. */
export function lessonVersions(def: BiLesson): CuratedLesson[] {
  const languages: ContentLanguage[] = def.only ? [def.only] : ["en", "ka"];
  return languages.map((lang) => {
    const content: LessonContent = {
      objectives: def.objectives.map((o) => t(o, lang)),
      sections: def.sections.map((s, i) =>
        section(`s${i + 1}`, s.kind, t(s.title, lang), s.minutes, t(s.body, lang), s.plot ? plot(s.plot.expression, s.plot.xMin, s.plot.xMax, t(s.plot.caption, lang)) : null),
      ),
      activities: def.activities.map((a, i) => activity(a, `a${i + 1}`, lang)),
      discussionQuestions: def.discussion.map((d) => t(d, lang)),
      assessment: def.assessment.map((d) => t(d, lang)),
      homework: def.homework.map((d) => t(d, lang)),
      teacherNotes: t(def.teacherNotes, lang),
      sources: def.sources ?? [],
    };
    return {
      key: `${def.group}-${lang}`,
      group: def.group,
      match: def.match,
      subject: def.subject,
      language: lang,
      title: t(def.title, lang),
      topic: t(def.topic, lang),
      grade: def.grade,
      durationMin: def.durationMin,
      difficulty: def.difficulty,
      objective: t(def.objective, lang),
      content,
      quiz: { title: t(def.quiz.title, lang), questions: def.quiz.questions.map((q, i) => question(q, `q${i + 1}`, lang)) },
    };
  });
}
