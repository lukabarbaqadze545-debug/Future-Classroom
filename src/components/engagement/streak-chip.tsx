"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { levelOf } from "@/lib/engagement/model";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";
import { Flame } from "./flame";

/** The streak and level in the header of every page; it glows when today's learning is still to do. */
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
        "fc-pop inline-flex h-9 items-center gap-1.5 rounded-full border bg-surface px-2.5 text-sm font-semibold tabular-nums transition-colors hover:border-spark/50",
        waiting ? "fc-glow border-spark/50 text-spark" : streak > 0 ? "border-line text-ink" : "border-line text-ink-subtle",
      )}
    >
      <Flame lit={streak > 0} className="h-5 w-4" />
      <span>{streak}</span>
      <span className="hidden border-l border-line pl-1.5 text-xs font-medium text-ink-muted sm:inline">{fmt(dict.today.levelShort, { n: level })}</span>
    </Link>
  );
}
