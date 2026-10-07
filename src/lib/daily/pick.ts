import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import type { CuratedLesson } from "@/lib/ai/templates/types";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";
import type { Activity, Answer, QuizQuestion } from "@/lib/domain/schemas";
import { gradeActivity, gradeQuizQuestion } from "@/lib/domain/grading";
import { CHALLENGE_TRIES, daysBetween, weekdayOf } from "@/lib/engagement/model";

/**
 * The daily challenge: one question a day, the same for everybody, taken from
 * the lessons that ship with the platform (so it needs no database and works
 * on any host). Each weekday has its own kind of question, so a week is a small
 * course. Which question comes on which day is fixed: it cycles through every
 * suitable question of that kind before one repeats.
 *
 * No answer data leaves this module in `publicChallenge`; checking happens
 * on the server (`checkChallenge`).
 */

/** Day number 1 of the challenge; also the start of the cycle. */
export const LAUNCH_DAY = "2026-10-01";
/** A Monday: the weeks of the cycle count from here. */
const CYCLE_START = "2026-09-28";

export const THEMES = ["numbers", "science", "code", "mind", "wildcard", "world", "life"] as const;
export type ThemeId = (typeof THEMES)[number];

/** Monday → Sunday. */
const THEME_BY_WEEKDAY: ThemeId[] = ["numbers", "science", "code", "mind", "wildcard", "world", "life"];

const THEME_SUBJECTS: Record<ThemeId, Subject[] | null> = {
  numbers: ["mathematics"],
  science: ["physics", "chemistry", "biology"],
  code: ["computer_science", "engineering"],
  mind: ["critical_thinking", "research"],
  wildcard: null,
  world: ["geography", "history", "civics", "economics", "georgian"],
  life: ["english", "health", "arts", "career", "entrepreneurship"],
};

export function themeOf(day: string): ThemeId {
  return THEME_BY_WEEKDAY[weekdayOf(day) - 1];
}

/** One question, from a lesson's activities or its quiz, in the one shape the challenge needs. */
export interface DailyQuestion {
  id: string;
  lesson: CuratedLesson;
  title: string;
  prompt: string;
  type: "choice" | "text";
  options: { id: string; text: string }[];
  hints: string[];
  explanation: string;
  solution: string;
  /** The right answer, in words. */
  answer: string;
  grade: (answer: Answer) => boolean;
}

/** Questions that make sense on their own, with one clear answer. */
const NEEDS_CONTEXT = /\b(above|below|figure|diagram|the text|the passage|the table|the graph|lesson|in class)\b|ზემოთ|ქვემოთ|ნახაზ|ტექსტში|ტექსტის|ცხრილ|გრაფიკ|გაკვეთილ/i;

const decimal = (value: number, language: ContentLanguage) => (language === "ka" ? String(value).replace(".", ",") : String(value));

function fromActivity(lesson: CuratedLesson, activity: Activity): DailyQuestion | null {
  if (activity.prompt.length > 360 || NEEDS_CONTEXT.test(activity.prompt)) return null;
  const base = {
    id: `${lesson.group}:a:${activity.id}`,
    lesson,
    title: activity.title,
    prompt: activity.prompt,
    hints: activity.hints,
    explanation: activity.explanation,
    solution: activity.solution,
    grade: (answer: Answer) => gradeActivity(activity, answer) === true,
  };
  if (activity.type === "multiple_choice") {
    if (activity.options.length < 2 || activity.options.length > 5 || activity.correctOptionIds.length !== 1 || activity.options.some((o) => o.text.length > 120)) return null;
    return { ...base, type: "choice", options: activity.options.map((o) => ({ id: o.id, text: o.text })), answer: activity.options.find((o) => o.id === activity.correctOptionIds[0])?.text ?? "" };
  }
  if (activity.type === "short_answer" || activity.type === "exercise") {
    if (activity.acceptedAnswers.length === 0 || activity.acceptedAnswers.some((a) => a.length > 30)) return null;
    return { ...base, type: "text", options: [], answer: activity.acceptedAnswers[0] };
  }
  return null;
}

/** Quiz questions with a real choice or a number or word to find (true/false is a coin toss with three tries). */
function fromQuiz(lesson: CuratedLesson, question: QuizQuestion, language: ContentLanguage): DailyQuestion | null {
  if (question.prompt.length > 360 || NEEDS_CONTEXT.test(question.prompt)) return null;
  const base = {
    id: `${lesson.group}:q:${question.id}`,
    lesson,
    title: "",
    prompt: question.prompt,
    hints: [] as string[],
    explanation: question.explanation,
    solution: question.explanation,
    grade: (answer: Answer) => gradeQuizQuestion(question, answer),
  };
  if (question.type === "multiple_choice") {
    if (question.options.length < 2 || question.options.length > 5 || question.correctOptionIds.length !== 1 || question.options.some((o) => o.text.length > 120)) return null;
    return { ...base, type: "choice", options: question.options.map((o) => ({ id: o.id, text: o.text })), answer: question.options.find((o) => o.id === question.correctOptionIds[0])?.text ?? "" };
  }
  if (question.type === "numerical") {
    if (question.numericAnswer === null) return null;
    return { ...base, type: "text", options: [], answer: decimal(question.numericAnswer, language) };
  }
  if (question.type === "short_answer") {
    if (question.acceptedAnswers.length === 0 || question.acceptedAnswers.some((a) => a.length > 30)) return null;
    return { ...base, type: "text", options: [], answer: question.acceptedAnswers[0] };
  }
  return null;
}

/** A small, fast, seedable generator, so the order is the same on every machine. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pools = new Map<string, DailyQuestion[]>();

/** All suitable questions of a kind in a language, in the fixed order the cycle follows. */
export function poolFor(theme: ThemeId, language: ContentLanguage): DailyQuestion[] {
  const cacheKey = `${language}/${theme}`;
  const cached = pools.get(cacheKey);
  if (cached) return cached;
  const subjects = THEME_SUBJECTS[theme];
  const items: DailyQuestion[] = [];
  for (const lesson of BUILT_IN_LESSONS) {
    if (lesson.language !== language) continue;
    if (subjects && !subjects.includes(lesson.subject)) continue;
    for (const activity of lesson.content.activities) {
      const question = fromActivity(lesson, activity);
      if (question) items.push(question);
    }
    for (const quizQuestion of lesson.quiz.questions) {
      const question = fromQuiz(lesson, quizQuestion, language);
      if (question) items.push(question);
    }
  }
  items.sort((a, b) => (a.id < b.id ? -1 : 1));
  // Fisher–Yates with a fixed seed.
  const random = mulberry32(hash(cacheKey));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  pools.set(cacheKey, items);
  return items;
}

/** The question of a day. Falls back to any kind when a language has none of the day's kind. */
export function challengeFor(day: string, language: ContentLanguage): DailyQuestion {
  const week = Math.floor(daysBetween(CYCLE_START, day) / 7);
  let pool = poolFor(themeOf(day), language);
  if (pool.length === 0) pool = poolFor("wildcard", language);
  return pool[((week % pool.length) + pool.length) % pool.length];
}

export const challengeNumber = (day: string) => daysBetween(LAUNCH_DAY, day) + 1;

// --- What the browser gets -------------------------------------------------------

export interface PublicChallenge {
  day: string;
  number: number;
  weekday: number;
  theme: ThemeId;
  subject: Subject;
  topic: string;
  lessonTitle: string;
  type: "choice" | "text";
  title: string;
  prompt: string;
  options: { id: string; text: string }[];
  tries: number;
}

/** The question without anything that gives the answer away. */
export function publicChallenge(day: string, language: ContentLanguage): PublicChallenge {
  const question = challengeFor(day, language);
  return {
    day,
    number: challengeNumber(day),
    weekday: weekdayOf(day),
    theme: themeOf(day),
    subject: question.lesson.subject,
    topic: question.lesson.topic,
    lessonTitle: question.lesson.title,
    type: question.type,
    title: question.title,
    prompt: question.prompt,
    options: question.options,
    tries: CHALLENGE_TRIES,
  };
}

// --- Checking --------------------------------------------------------------------

export interface ChallengeResult {
  isCorrect: boolean;
  /** Why the answer is right (after a correct answer, or when the tries are used up). */
  explanation: string;
  /** A nudge after a wrong answer that leaves tries. */
  hint: string | null;
  /** The answer, once the tries are used up. */
  solution: string | null;
  /** The lesson that teaches it. */
  lessonKey: string;
}

/**
 * Grades an answer to a day's question. `attempt` is the number of the try
 * (1…tries): hints come after the first wrong tries, the solution after the
 * last. The number comes from the browser, which is fine for a game: it only
 * decides when help appears, never a grade.
 */
export function checkChallenge(day: string, language: ContentLanguage, answer: Answer, attempt: number): ChallengeResult {
  const question = challengeFor(day, language);
  const lessonKey = question.lesson.key;
  if (question.grade(answer)) return { isCorrect: true, explanation: question.explanation || question.solution, hint: null, solution: null, lessonKey };
  if (attempt >= CHALLENGE_TRIES) {
    return { isCorrect: false, explanation: question.solution || question.explanation, hint: null, solution: question.answer, lessonKey };
  }
  // Never the last hint: it is the explanation.
  const usable = question.hints.length > 1 ? question.hints.slice(0, -1) : question.hints;
  return { isCorrect: false, explanation: "", hint: usable[Math.min(attempt - 1, usable.length - 1)] ?? null, solution: null, lessonKey };
}
