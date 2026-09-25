import Link from "next/link";
import type { ReactNode } from "react";
import { BookMarked, Brain, ChevronRight, Code2, FlaskConical, GraduationCap, SearchCheck, type LucideIcon } from "lucide-react";
import type { LabId } from "@/lib/labs/registry";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/components/ui/cn";

export const LAB_ICONS: Record<LabId, LucideIcon> = {
  programming: Code2,
  stem: FlaskConical,
  research: SearchCheck,
  critical: Brain,
  library: BookMarked,
  career: GraduationCap,
};

/** Accent colour per laboratory — subtle, but each room is recognisable. */
export const LAB_ACCENT: Record<LabId, { text: string; bg: string; soft: string; border: string }> = {
  programming: { text: "text-lab-programming", bg: "bg-lab-programming", soft: "bg-lab-programming/10", border: "border-lab-programming/30" },
  stem: { text: "text-lab-stem", bg: "bg-lab-stem", soft: "bg-lab-stem/10", border: "border-lab-stem/30" },
  research: { text: "text-lab-research", bg: "bg-lab-research", soft: "bg-lab-research/10", border: "border-lab-research/30" },
  critical: { text: "text-lab-critical", bg: "bg-lab-critical", soft: "bg-lab-critical/10", border: "border-lab-critical/30" },
  library: { text: "text-lab-library", bg: "bg-lab-library", soft: "bg-lab-library/10", border: "border-lab-library/30" },
  career: { text: "text-lab-career", bg: "bg-lab-career", soft: "bg-lab-career/10", border: "border-lab-career/30" },
};

export function LabIcon({ lab, size = "md" }: { lab: LabId; size?: "sm" | "md" | "lg" }) {
  const Icon = LAB_ICONS[lab];
  const accent = LAB_ACCENT[lab];
  const box = size === "lg" ? "size-14 rounded-2xl" : size === "sm" ? "size-8 rounded-lg" : "size-11 rounded-xl";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5.5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center text-white", box, accent.bg)} aria-hidden>
      <Icon className={icon} />
    </span>
  );
}

/** Page header shared by all laboratories: breadcrumb, accent icon, title, actions. */
export async function LabHeader({
  lab,
  hubLabel,
  labName,
  title,
  lead,
  actions,
  crumbs = [],
}: {
  lab: LabId;
  hubLabel: string;
  labName: string;
  title?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  crumbs?: { href: string; label: string }[];
}) {
  const [accent, { dict }] = [LAB_ACCENT[lab], await getDictionary()];
  const trail = [{ href: "/labs", label: hubLabel }, ...(title ? [{ href: lab === "library" ? "/library" : lab === "career" ? "/career" : `/labs/${lab === "critical" ? "critical-thinking" : lab}`, label: labName }] : []), ...crumbs];
  return (
    <div className={cn("mb-6 border-b pb-5", accent.border)}>
      <nav aria-label={dict.common.breadcrumb} className="mb-3 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        {trail.map((c, i) => (
          <span key={c.href + i} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight aria-hidden className="size-3.5" /> : null}
            <Link href={c.href} className="hover:text-ink hover:underline">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <LabIcon lab={lab} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title ?? labName}</h1>
            {lead ? <div className="mt-1.5 max-w-3xl text-[15px] text-ink-muted">{lead}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

/** "Simulation / Classroom experiment / Physical project" — never blurred together. */
export function ModeBadge({ mode, label }: { mode: "simulation" | "experiment" | "physical"; label: string }) {
  const styles = {
    simulation: "bg-brand-soft text-brand-ink border-brand/20",
    experiment: "bg-warn-soft text-warn border-warn/25",
    physical: "bg-muted text-ink border-line-strong",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[mode])}>{label}</span>;
}

export function Stars({ value, max = 3, label }: { value: number; max?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-warn" aria-label={label} title={label}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden className={i < value ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}
