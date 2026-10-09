import { Award, BadgeCheck, BookA, CalendarCheck, CalendarDays, CalendarRange, Crosshair, Flag, FlaskConical, Languages, Layers, ListChecks, Moon, Radio, Repeat, Sunrise, Target, type LucideIcon } from "lucide-react";

/** One line drawing for every achievement. */
export const BADGE_ICONS: Record<string, LucideIcon> = {
  firstStep: Flag,
  challenge1: Target,
  firstTry: Crosshair,
  streak3: CalendarCheck,
  streak7: CalendarDays,
  streak30: CalendarRange,
  challenges10: ListChecks,
  challenges30: Layers,
  practice25: Repeat,
  words25: Languages,
  words100: BookA,
  quizAce: BadgeCheck,
  explorer: FlaskConical,
  liveClass: Radio,
  nightOwl: Moon,
  earlyBird: Sunrise,
  level5: Award,
};
