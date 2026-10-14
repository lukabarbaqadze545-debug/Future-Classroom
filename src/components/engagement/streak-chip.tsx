"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { levelOf } from "@/lib/engagement/model";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";

/** The study streak and level in the header of every page; a quiet pulse shows when today's learning is still to do. */
export function StreakChip() {
  const { dict } = useI18n();
  const { ready, state, streak, doneToday } = useEngagement();
  if (!ready || !state) return <span aria-hidden className="inline-block h-9 w-[4.5rem]" />;
  const level = levelOf(state.xp);
  const waiting = streak > 0 && !doneToday;
  return (
    <Link
      href="/today"
      data-testid="streak-chip"
      aria-label={fmt(dict.today.chip, { streak, level })}
      title={fmt(dict.today.chip, { streak, level })}
      className={cn(
        "fc-rise inline-flex h-9 items-center gap-2 rounded-full border bg-surface px-3 text-sm font-semibold tabular-nums transition-[border-color,box-shadow] duration-200 hover:border-brand/40 hover:shadow-sm",
        streak > 0 ? "border-line text-ink" : "border-line text-ink-subtle",
      )}
    >
      <span className="relative flex size-4 items-center justify-center">
        {waiting ? <span aria-hidden className="fc-ping absolute inline-flex size-full rounded-full bg-brand/40" /> : null}
        <Activity aria-hidden className={cn("relative size-4", streak > 0 ? "text-brand" : "text-ink-subtle")} strokeWidth={2.25} />
      </span>
      <span>{streak}</span>
      <span className="hidden border-l border-line pl-2 text-xs font-medium text-ink-muted sm:inline">{fmt(dict.today.levelShort, { n: level })}</span>
    </Link>
  );
}
