/**
 * The "Today" game around learning: a daily streak, experience points, levels,
 * badges and three small daily quests. Everything here is pure (no browser, no
 * server): the state lives in the visitor's own browser, so it works for
 * everyone who opens the site, with or without an account, and on a host that
 * keeps no data between visits.
 *
 * This is encouragement, not assessment: nothing here is a grade, and the
 * teacher never sees it.
 */

export const STATE_VERSION = 1;
const MAX_DAYS = 400;

export type ChallengeStatus = "open" | "solved" | "missed";

export interface EngagementState {
  v: typeof STATE_VERSION;
  /** What to call the visitor ("" until they say). */
  name: string;
  xp: number;
  /** School days (YYYY-MM-DD, oldest first) on which the visitor learned something. */
  days: string[];
  /** Days on which the daily challenge was solved. */
  solved: string[];
  /** Experience earned per school day (the most recent days), for the activity map. */
  xpByDay: Record<string, number>;
  best: number;
  /** Badge id → the day it was earned. */
  badges: Record<string, string>;
  totals: { challenges: number; firstTry: number; practice: number; quizzes: number; perfectQuizzes: number; live: number; joined: number; night: number; early: number; words: number; code: number; lessons: number };
  /** The laboratories the visitor has worked in (ever). */
  labs: string[];
  /** Counters of the current school day; reset when the day changes. */
  today: {
    day: string;
    challenge: ChallengeStatus;
    attempts: number;
    practice: number;
    practiceXp: number;
    /** Experience from solved programming tasks today (capped). */
    codeXp: number;
    /** Words known in the vocabulary practice, and the experience they gave (capped). */
    words: number;
    wordsXp: number;
    live: number;
    joined: boolean;
    labs: string[];
    chest: boolean;
  };
}

export type EngagementEvent =
  /** The daily challenge was answered wrongly (the tries so far). */
  | { kind: "attempt"; attempts: number }
  | { kind: "challenge"; outcome: "solved" | "missed"; attempts: number }
  /** A correct answer while practising a lesson. */
  | { kind: "practice" }
  /** A word the visitor knew while practising their words. */
  | { kind: "word" }
  /** A programming task of a course was solved for the first time (1 easy … 3 hard). */
  | { kind: "code"; weight: 1 | 2 | 3 }
  /** A course lesson was finished (all its tasks solved). */
  | { kind: "lesson" }
  | { kind: "quiz"; score: number; max: number }
  /** An answer in a live class. */
  | { kind: "live" }
  | { kind: "join" }
  | { kind: "lab"; lab: string };

export interface EventContext {
  /** The school day now (YYYY-MM-DD). */
  today: string;
  /** The hour of the day on the visitor's clock, 0–23. */
  hour: number;
}

export interface Delta {
  xp: number;
  levelUp: number | null;
  newBadges: string[];
  streak: number;
  /** Today was the first learning event of the day and it extended the streak. */
  streakGrew: boolean;
  chest: boolean;
}

export const XP = {
  challengeSolved: 20,
  firstTryBonus: 10,
  streakBonusPerDay: 2,
  streakBonusDays: 7,
  challengeMissed: 5,
  practice: 5,
  practiceDailyCap: 40,
  word: 2,
  wordDailyCap: 30,
  codePerWeight: 12,
  codeDailyCap: 180,
  lesson: 20,
  quizBase: 10,
  quizScore: 10,
  live: 3,
  liveDailyCap: 30,
  join: 10,
  lab: 8,
  chest: 25,
} as const;

/** The most tries a daily challenge allows. */
export const CHALLENGE_TRIES = 3;

export function emptyState(today: string): EngagementState {
  return {
    v: STATE_VERSION,
    name: "",
    xp: 0,
    days: [],
    solved: [],
    xpByDay: {},
    best: 0,
    badges: {},
    totals: { challenges: 0, firstTry: 0, practice: 0, quizzes: 0, perfectQuizzes: 0, live: 0, joined: 0, night: 0, early: 0, words: 0, code: 0, lessons: 0 },
    labs: [],
    today: freshToday(today),
  };
}

function freshToday(day: string): EngagementState["today"] {
  return { day, challenge: "open", attempts: 0, practice: 0, practiceXp: 0, codeXp: 0, words: 0, wordsXp: 0, live: 0, joined: false, labs: [], chest: false };
}

// --- Days ------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The school day of a moment in a time zone, as YYYY-MM-DD. */
export function dayKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** The hour (0–23) of a moment in a time zone. */
export function hourIn(date: Date, timeZone: string): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date);
    return Number(hour) % 24;
  } catch {
    return date.getUTCHours();
  }
}

const toUtc = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(day: string, n: number): string {
  return new Date(toUtc(day) + n * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** 1 = Monday … 7 = Sunday. */
export function weekdayOf(day: string): number {
  return ((new Date(toUtc(day)).getUTCDay() + 6) % 7) + 1;
}

/** Seconds from `now` to the start of the next school day in the time zone. */
export function secondsToNextDay(now: Date, timeZone: string): number {
  const today = dayKey(now, timeZone);
  // The day changes within 25 hours (daylight saving included) and never changes back: search for the first second of the next one.
  let low = 0;
  let high = 26 * 3600;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (dayKey(new Date(now.getTime() + middle * 1000), timeZone) === today) low = middle;
    else high = middle;
  }
  return high;
}

// --- Streak ----------------------------------------------------------------------

/** The streak as it stands on `today`: it stays alive through the day after the last active one. */
export function streakOf(days: string[], today: string): { streak: number; doneToday: boolean } {
  const set = new Set(days);
  const doneToday = set.has(today);
  let cursor = doneToday ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return { streak, doneToday };
}

export interface WeekDay {
  day: string;
  done: boolean;
  isToday: boolean;
  future: boolean;
}

/** Monday to Sunday of the week `today` is in. */
export function weekView(days: string[], today: string): WeekDay[] {
  const set = new Set(days);
  const monday = addDays(today, -(weekdayOf(today) - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return { day, done: set.has(day), isToday: day === today, future: day > today };
  });
}

/** How strongly a day shows on the activity map: 0 (nothing) to 4. */
export function intensityOf(xp: number, active: boolean): 0 | 1 | 2 | 3 | 4 {
  if (!active && xp <= 0) return 0;
  if (xp < 25) return 1;
  if (xp < 60) return 2;
  if (xp < 120) return 3;
  return 4;
}

export interface HeatCell {
  day: string;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
  isToday: boolean;
}

/** The last `weeks` weeks as columns of seven days (Monday first), the newest week last. */
export function activityMap(state: Pick<EngagementState, "days" | "xpByDay">, today: string, weeks: number): HeatCell[][] {
  const active = new Set(state.days);
  const monday = addDays(today, -(weekdayOf(today) - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(monday, (w - (weeks - 1)) * 7 + d);
      const future = day > today;
      return { day, level: future ? 0 : intensityOf(state.xpByDay[day] ?? 0, active.has(day)), future, isToday: day === today };
    }),
  );
}

// --- Levels ----------------------------------------------------------------------

/** XP needed to reach a level: 0, 100, 300, 600, 1000, … */
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export function levelOf(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number): { level: number; into: number; needed: number; fraction: number } {
  const level = levelOf(xp);
  const from = xpForLevel(level);
  const needed = xpForLevel(level + 1) - from;
  const into = xp - from;
  return { level, into, needed, fraction: needed > 0 ? into / needed : 0 };
}

// --- Quests ----------------------------------------------------------------------

export const QUESTS = ["challenge", "answers", "lab"] as const;
export type QuestId = (typeof QUESTS)[number];
export const ANSWERS_QUEST_TARGET = 3;

export function questProgress(state: EngagementState): Record<QuestId, { done: number; target: number }> {
  const t = state.today;
  return {
    challenge: { done: t.challenge === "open" ? 0 : 1, target: 1 },
    answers: { done: Math.min(ANSWERS_QUEST_TARGET, t.practice + t.live), target: ANSWERS_QUEST_TARGET },
    lab: { done: Math.min(1, t.labs.length), target: 1 },
  };
}

const allQuestsDone = (state: EngagementState) => QUESTS.every((id) => {
  const p = questProgress(state)[id];
  return p.done >= p.target;
});

// --- Badges ----------------------------------------------------------------------

export interface BadgeRule {
  id: string;
  /** How far along the visitor is (value / target); the badge is earned when value reaches target. */
  progress: (state: EngagementState) => { value: number; target: number };
}

const toward = (value: (s: EngagementState) => number, target: number): BadgeRule["progress"] => (s) => ({ value: Math.min(value(s), target), target });

export const BADGES: BadgeRule[] = [
  { id: "firstStep", progress: toward((s) => s.days.length, 1) },
  { id: "challenge1", progress: toward((s) => s.totals.challenges, 1) },
  { id: "firstTry", progress: toward((s) => s.totals.firstTry, 1) },
  { id: "streak3", progress: toward((s) => s.best, 3) },
  { id: "streak7", progress: toward((s) => s.best, 7) },
  { id: "streak30", progress: toward((s) => s.best, 30) },
  { id: "challenges10", progress: toward((s) => s.totals.challenges, 10) },
  { id: "challenges30", progress: toward((s) => s.totals.challenges, 30) },
  { id: "practice25", progress: toward((s) => s.totals.practice, 25) },
  { id: "words25", progress: toward((s) => s.totals.words, 25) },
  { id: "words100", progress: toward((s) => s.totals.words, 100) },
  { id: "quizAce", progress: toward((s) => s.totals.perfectQuizzes, 1) },
  { id: "coder1", progress: toward((s) => s.totals.code, 1) },
  { id: "coder10", progress: toward((s) => s.totals.code, 10) },
  { id: "coder50", progress: toward((s) => s.totals.code, 50) },
  { id: "lessons5", progress: toward((s) => s.totals.lessons, 5) },
  { id: "explorer", progress: toward((s) => s.labs.length, 3) },
  { id: "liveClass", progress: toward((s) => s.totals.joined, 1) },
  { id: "nightOwl", progress: toward((s) => s.totals.night, 1) },
  { id: "earlyBird", progress: toward((s) => s.totals.early, 1) },
  { id: "level5", progress: toward((s) => levelOf(s.xp), 5) },
];

const isEarned = (rule: BadgeRule, state: EngagementState) => {
  const { value, target } = rule.progress(state);
  return value >= target;
};

// --- Events ----------------------------------------------------------------------

/** Brings the per-day counters up to date when a new school day has begun. */
export function rollover(state: EngagementState, today: string): EngagementState {
  return state.today.day === today ? state : { ...state, today: freshToday(today) };
}

const XP_DAYS = 140;

/** Adds to a day's experience and forgets the oldest days. */
function recordXp(byDay: Record<string, number>, day: string, xp: number): Record<string, number> {
  const next = { ...byDay, [day]: (byDay[day] ?? 0) + xp };
  const keys = Object.keys(next).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - XP_DAYS))) delete next[key];
  return next;
}

const cap = <T>(list: T[], max: number) => (list.length > max ? list.slice(list.length - max) : list);

/**
 * Applies one event. Returns the new state and what changed, for the
 * celebration (XP earned, a new level, new badges, the streak, the chest).
 */
export function applyEvent(before: EngagementState, event: EngagementEvent, context: EventContext): { state: EngagementState; delta: Delta } {
  const state = rollover(before, context.today);
  const levelBefore = levelOf(state.xp);
  const streakBefore = streakOf(state.days, context.today);
  let gained = 0;
  const totals = { ...state.totals };
  const today = { ...state.today, labs: [...state.today.labs] };
  let labs = state.labs;
  let solved = state.solved;
  let learned = true;

  switch (event.kind) {
    case "attempt":
      today.attempts = Math.max(today.attempts, Math.min(event.attempts, CHALLENGE_TRIES));
      learned = false;
      break;
    case "challenge": {
      if (today.challenge !== "open") {
        learned = false;
        break;
      }
      today.challenge = event.outcome;
      today.attempts = Math.max(today.attempts, event.attempts);
      if (event.outcome === "solved") {
        totals.challenges++;
        if (event.attempts <= 1) totals.firstTry++;
        if (context.hour >= 22 || context.hour < 4) totals.night++;
        if (context.hour >= 4 && context.hour < 7) totals.early++;
        solved = cap([...solved.filter((d) => d !== context.today), context.today], MAX_DAYS);
        const streakAfter = streakOf([...state.days, context.today], context.today).streak;
        gained += XP.challengeSolved + (event.attempts <= 1 ? XP.firstTryBonus : 0) + Math.min(streakAfter, XP.streakBonusDays) * XP.streakBonusPerDay;
      } else {
        gained += XP.challengeMissed;
      }
      break;
    }
    case "practice": {
      totals.practice++;
      today.practice++;
      const room = Math.max(0, XP.practiceDailyCap - today.practiceXp);
      const xp = Math.min(XP.practice, room);
      today.practiceXp += xp;
      gained += xp;
      break;
    }
    case "word": {
      totals.words++;
      today.words++;
      const room = Math.max(0, XP.wordDailyCap - today.wordsXp);
      const xp = Math.min(XP.word, room);
      today.wordsXp += xp;
      gained += xp;
      break;
    }
    case "code": {
      totals.code++;
      // A solved task counts as an answer for the daily goal, and earns more the harder it is (up to a daily cap).
      today.practice++;
      const room = Math.max(0, XP.codeDailyCap - today.codeXp);
      const xp = Math.min(XP.codePerWeight * event.weight, room);
      today.codeXp += xp;
      gained += xp;
      break;
    }
    case "lesson": {
      totals.lessons++;
      gained += XP.lesson;
      break;
    }
    case "quiz": {
      totals.quizzes++;
      const share = event.max > 0 ? Math.max(0, Math.min(1, event.score / event.max)) : 0;
      if (event.max > 0 && event.score >= event.max) totals.perfectQuizzes++;
      gained += XP.quizBase + Math.round(XP.quizScore * share);
      break;
    }
    case "live": {
      totals.live++;
      today.live++;
      gained += today.live * XP.live <= XP.liveDailyCap ? XP.live : 0;
      break;
    }
    case "join": {
      if (!today.joined) {
        today.joined = true;
        totals.joined++;
        gained += XP.join;
      }
      break;
    }
    case "lab": {
      const lab = event.lab.slice(0, 40);
      if (!today.labs.includes(lab)) {
        today.labs.push(lab);
        gained += XP.lab;
      }
      if (!labs.includes(lab)) labs = [...labs, lab];
      break;
    }
  }

  // The day counts for the streak as soon as the visitor has learned something.
  let days = state.days;
  if (learned && !days.includes(context.today)) days = cap([...days, context.today].sort(), MAX_DAYS);
  const streakAfter = streakOf(days, context.today);

  let next: EngagementState = { ...state, xp: state.xp + gained, days, solved, totals, labs, today, best: Math.max(state.best, streakAfter.streak) };

  // Three quests done → the chest, once a day.
  let chest = false;
  if (!next.today.chest && allQuestsDone(next)) {
    chest = true;
    next = { ...next, xp: next.xp + XP.chest, today: { ...next.today, chest: true } };
    gained += XP.chest;
  }

  if (gained > 0) next = { ...next, xpByDay: recordXp(next.xpByDay, context.today, gained) };

  const newBadges: string[] = [];
  const badges = { ...next.badges };
  for (const rule of BADGES) {
    if (!badges[rule.id] && isEarned(rule, next)) {
      badges[rule.id] = context.today;
      newBadges.push(rule.id);
    }
  }
  next = { ...next, badges };

  const levelAfter = levelOf(next.xp);
  return {
    state: next,
    delta: {
      xp: gained,
      levelUp: levelAfter > levelBefore ? levelAfter : null,
      newBadges,
      streak: streakAfter.streak,
      streakGrew: learned && !streakBefore.doneToday && streakAfter.doneToday,
      chest,
    },
  };
}

export function withName(state: EngagementState, name: string): EngagementState {
  return { ...state, name: name.replace(/[\p{C}<>]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24) };
}

// --- Storage format --------------------------------------------------------------

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const days = (value: unknown): string[] => (Array.isArray(value) ? value.filter((d): d is string => typeof d === "string" && DAY.test(d)).sort() : []);
const strings = (value: unknown, max: number): string[] => (Array.isArray(value) ? value.filter((d): d is string => typeof d === "string" && d.length <= 40).slice(0, max) : []);

/** Reads what was stored; anything unreadable or from an unknown version starts fresh. Never throws. */
export function parseState(raw: string | null, today: string): EngagementState {
  const fresh = emptyState(today);
  if (!raw) return fresh;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fresh;
  }
  if (!data || typeof data !== "object") return fresh;
  const o = data as Record<string, unknown>;
  if (o.v !== STATE_VERSION) return fresh;
  const count = (value: unknown) => (isNumber(value) && value >= 0 ? Math.floor(value) : 0);
  const t = (o.totals && typeof o.totals === "object" ? o.totals : {}) as Record<string, unknown>;
  const td = (o.today && typeof o.today === "object" ? o.today : {}) as Record<string, unknown>;
  const xpByDay: Record<string, number> = {};
  if (o.xpByDay && typeof o.xpByDay === "object") {
    const entries = Object.entries(o.xpByDay as Record<string, unknown>).filter(([day, xp]) => DAY.test(day) && isNumber(xp) && xp > 0);
    for (const [day, xp] of entries.sort(([a], [b]) => (a < b ? -1 : 1)).slice(-XP_DAYS)) xpByDay[day] = Math.floor(xp as number);
  }
  const badges: Record<string, string> = {};
  if (o.badges && typeof o.badges === "object") {
    for (const [id, day] of Object.entries(o.badges as Record<string, unknown>)) {
      if (BADGES.some((b) => b.id === id) && typeof day === "string" && DAY.test(day)) badges[id] = day;
    }
  }
  const status = td.challenge === "solved" || td.challenge === "missed" ? td.challenge : "open";
  const state: EngagementState = {
    v: STATE_VERSION,
    name: typeof o.name === "string" ? withName(fresh, o.name).name : "",
    xp: count(o.xp),
    days: days(o.days).slice(-MAX_DAYS),
    solved: days(o.solved).slice(-MAX_DAYS),
    xpByDay,
    best: count(o.best),
    badges,
    totals: {
      challenges: count(t.challenges),
      firstTry: count(t.firstTry),
      practice: count(t.practice),
      quizzes: count(t.quizzes),
      perfectQuizzes: count(t.perfectQuizzes),
      live: count(t.live),
      joined: count(t.joined),
      night: count(t.night),
      early: count(t.early),
      words: count(t.words),
      code: count(t.code),
      lessons: count(t.lessons),
    },
    labs: strings(o.labs, 40),
    today: {
      day: typeof td.day === "string" && DAY.test(td.day) ? td.day : today,
      challenge: status,
      attempts: Math.min(count(td.attempts), CHALLENGE_TRIES),
      practice: count(td.practice),
      practiceXp: count(td.practiceXp),
      codeXp: count(td.codeXp),
      words: count(td.words),
      wordsXp: count(td.wordsXp),
      live: count(td.live),
      joined: td.joined === true,
      labs: strings(td.labs, 10),
      chest: td.chest === true,
    },
  };
  return rollover(state, today);
}
