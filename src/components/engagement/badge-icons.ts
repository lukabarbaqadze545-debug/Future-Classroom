import { Compass, Crosshair, Crown, Dumbbell, Flame, Footprints, Medal, Moon, Radio, Star, Sunrise, Swords, Trophy, Zap, type LucideIcon } from "lucide-react";

/** One picture for every badge. */
export const BADGE_ICONS: Record<string, LucideIcon> = {
  firstStep: Footprints,
  challenge1: Swords,
  firstTry: Crosshair,
  streak3: Flame,
  streak7: Zap,
  streak30: Flame,
  challenges10: Medal,
  challenges30: Trophy,
  practice25: Dumbbell,
  quizAce: Star,
  explorer: Compass,
  liveClass: Radio,
  nightOwl: Moon,
  earlyBird: Sunrise,
  level5: Crown,
};
