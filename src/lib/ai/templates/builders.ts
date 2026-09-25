import type { Activity, QuizQuestion, Section, Visual } from "@/lib/domain/schemas";
import type { SectionKind } from "@/lib/domain/catalog";

/** Compact builders for writing curated lesson content by hand. */

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function section(
  id: string,
  kind: SectionKind,
  title: string,
  minutes: number,
  body: string,
  visual: Visual | null = null,
): Section {
  return { id, kind, title, minutes, body: body.trim(), visual };
}

export function plot(expression: string, xMin: number, xMax: number, caption: string): Visual {
  return { type: "function_plot", expression, xMin, xMax, caption };
}

interface CommonActivityFields {
  title?: string;
  hints?: string[];
  solution?: string;
  explanation?: string;
  allowSolution?: boolean;
  timeLimitSec?: number | null;
}

function baseActivity(id: string, type: Activity["type"], prompt: string, fields: CommonActivityFields): Activity {
  return {
    id,
    type,
    title: fields.title ?? "",
    prompt: prompt.trim(),
    options: [],
    correctOptionIds: [],
    acceptedAnswers: [],
    hints: fields.hints ?? [],
    solution: fields.solution ?? "",
    allowSolution: fields.allowSolution ?? true,
    explanation: fields.explanation ?? "",
    timeLimitSec: fields.timeLimitSec ?? null,
  };
}

export function multipleChoice(
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number | number[],
  fields: CommonActivityFields = {},
): Activity {
  const correct = Array.isArray(correctIndex) ? correctIndex : [correctIndex];
  return {
    ...baseActivity(id, "multiple_choice", prompt, fields),
    options: options.map((text, i) => ({ id: LETTERS[i], text })),
    correctOptionIds: correct.map((i) => LETTERS[i]),
  };
}

export function poll(id: string, prompt: string, options: string[], fields: CommonActivityFields = {}): Activity {
  return { ...baseActivity(id, "poll", prompt, fields), options: options.map((text, i) => ({ id: LETTERS[i], text })) };
}

export function exercise(id: string, prompt: string, acceptedAnswers: string[], fields: CommonActivityFields = {}): Activity {
  return { ...baseActivity(id, "exercise", prompt, fields), acceptedAnswers };
}

export function shortAnswer(id: string, prompt: string, acceptedAnswers: string[], fields: CommonActivityFields = {}): Activity {
  return { ...baseActivity(id, "short_answer", prompt, fields), acceptedAnswers };
}

export function discussion(id: string, prompt: string, fields: CommonActivityFields = {}): Activity {
  return { ...baseActivity(id, "discussion", prompt, fields), allowSolution: false };
}

export function exitTicket(id: string, prompt: string, fields: CommonActivityFields = {}): Activity {
  return { ...baseActivity(id, "exit_ticket", prompt, fields), allowSolution: false };
}

export const quiz = {
  mc(id: string, prompt: string, options: string[], correctIndex: number, explanation = "", points = 1): QuizQuestion {
    return {
      id,
      type: "multiple_choice",
      prompt,
      options: options.map((text, i) => ({ id: LETTERS[i], text })),
      correctOptionIds: [LETTERS[correctIndex]],
      acceptedAnswers: [],
      numericAnswer: null,
      tolerance: 0,
      explanation,
      points,
    };
  },
  trueFalse(id: string, prompt: string, answer: boolean, explanation = "", labels: [string, string] = ["True", "False"]): QuizQuestion {
    return {
      id,
      type: "true_false",
      prompt,
      options: [
        { id: "true", text: labels[0] },
        { id: "false", text: labels[1] },
      ],
      correctOptionIds: [answer ? "true" : "false"],
      acceptedAnswers: [],
      numericAnswer: null,
      tolerance: 0,
      explanation,
      points: 1,
    };
  },
  numerical(id: string, prompt: string, answer: number, tolerance = 0, explanation = ""): QuizQuestion {
    return {
      id,
      type: "numerical",
      prompt,
      options: [],
      correctOptionIds: [],
      acceptedAnswers: [],
      numericAnswer: answer,
      tolerance,
      explanation,
      points: 1,
    };
  },
  short(id: string, prompt: string, accepted: string[], explanation = ""): QuizQuestion {
    return {
      id,
      type: "short_answer",
      prompt,
      options: [],
      correctOptionIds: [],
      acceptedAnswers: accepted,
      numericAnswer: null,
      tolerance: 0,
      explanation,
      points: 1,
    };
  },
};
