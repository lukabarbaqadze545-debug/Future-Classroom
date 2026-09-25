import Link from "next/link";
import type { ReactNode } from "react";
import type { StemMode } from "@/lib/labs/stem/types";
import type { Dictionary } from "@/lib/i18n/en";
import { ModeBadge, Stars } from "../lab-shell";

/** Card used across the STEM hub: mode is always visible so activities are never confused. */
export function StemCard({
  href,
  mode,
  title,
  text,
  meta,
  difficulty,
  status,
  dict,
}: {
  href: string;
  mode: StemMode;
  title: string;
  text: string;
  meta: ReactNode;
  difficulty: number;
  status?: ReactNode;
  dict: Dictionary;
}) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-stem/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ModeBadge mode={mode} label={dict.labs.stem.modes[mode]} />
        {status}
      </div>
      <h3 className="mt-2.5 font-semibold group-hover:text-lab-stem">{title}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{text}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-ink-muted">
        <span>{meta}</span>
        <Stars value={difficulty} label={`${dict.labs.common.difficulty}: ${difficulty}/3`} />
      </div>
    </Link>
  );
}

export function ModeLegend({ dict }: { dict: Dictionary }) {
  const s = dict.labs.stem;
  return (
    <dl className="mb-6 grid gap-3 md:grid-cols-3">
      {(["simulation", "experiment", "physical"] as const).map((mode) => (
        <div key={mode} className="rounded-2xl border border-line bg-surface px-4 py-3">
          <dt>
            <ModeBadge mode={mode} label={s.modes[mode]} />
          </dt>
          <dd className="mt-1.5 text-sm text-ink-muted">{s.modeHelp[mode]}</dd>
        </div>
      ))}
    </dl>
  );
}
