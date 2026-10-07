"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame as FlameIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { levelOf } from "@/lib/engagement/model";
import { useEngagement } from "./engagement-provider";
import { Flame } from "./flame";

/** A slim reminder of today's challenge, for the top of a student's home page. */
export function TodayStrip({ challengeNumber }: { challengeNumber: number }) {
  const { dict } = useI18n();
  const t = dict.today;
  const { ready, state, today, streak } = useEngagement();
  if (!ready || !state) return <div aria-hidden className="mb-6 h-[4.5rem] rounded-2xl bg-muted/60" />;
  const solved = state.today.day === today && state.today.challenge !== "open";
  return (
    <Link
      href="/today"
      data-testid="today-strip"
      data-done={solved}
      className="group mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-linear-to-r from-hero-from via-hero-via to-hero-to p-3.5 pr-4 text-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
    >
      <Flame lit={streak > 0} className="h-11 w-9" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{solved ? t.challenge.ctaDone : t.challenge.cta}</span>
        <span className="block text-sm text-white/85">
          {fmt(t.challenge.title, { n: challengeNumber })} · {fmtCount(t.streak, streak)} · {fmt(t.levelShort, { n: levelOf(state.xp) })}
        </span>
      </span>
      <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-hero-from group-hover:bg-white/90">
        {solved ? <Check aria-hidden className="size-4" strokeWidth={3} /> : null}
        {solved ? t.title : t.challenge.start}
        <ArrowRight aria-hidden className="size-4" />
      </span>
    </Link>
  );
}

/** The streak number of this browser, in the place where the home page shows its statistics. */
export function DeviceStreakStat({ label }: { label: string }) {
  const { ready, streak } = useEngagement();
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums" data-testid="device-streak">
        <FlameIcon aria-hidden className="size-5 text-warn" />
        {ready ? streak : 0}
      </p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
