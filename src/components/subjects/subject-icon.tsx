import { Atom, BookOpenText, Brain, Calculator, Code2, Coins, Dna, Earth, FlaskConical, GraduationCap, HeartPulse, Landmark, Languages, Palette, Rocket, Scale, Search, Wrench, type LucideIcon } from "lucide-react";
import type { SubjectCategory, SubjectIcon as IconName } from "@/lib/content/subjects";
import { LAB_ACCENT } from "@/components/labs/lab-shell";
import type { LabId } from "@/lib/labs/registry";
import { cn } from "@/components/ui/cn";

const ICONS: Record<IconName, LucideIcon> = {
  calculator: Calculator,
  atom: Atom,
  flask: FlaskConical,
  dna: Dna,
  code: Code2,
  book: BookOpenText,
  languages: Languages,
  landmark: Landmark,
  globe: Earth,
  scale: Scale,
  coins: Coins,
  palette: Palette,
  wrench: Wrench,
  heart: HeartPulse,
  graduation: GraduationCap,
  search: Search,
  brain: Brain,
  rocket: Rocket,
};

/** Subject groups borrow the laboratory accents, so related areas share a colour. */
export const CATEGORY_ACCENT: Record<SubjectCategory, LabId> = {
  mathematics_computing: "programming",
  sciences: "stem",
  languages: "library",
  society: "research",
  technology_creativity: "career",
  skills: "critical",
};

export function SubjectIcon({ icon, category, size = "md" }: { icon: IconName; category: SubjectCategory; size?: "md" | "lg" }) {
  const Icon = ICONS[icon];
  const accent = LAB_ACCENT[CATEGORY_ACCENT[category]];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center text-white", size === "lg" ? "size-14 rounded-2xl" : "size-11 rounded-xl", accent.bg)} aria-hidden>
      <Icon className={size === "lg" ? "size-7" : "size-5.5"} />
    </span>
  );
}
