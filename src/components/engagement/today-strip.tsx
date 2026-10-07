"use client";

import Link from "next/link";
import { Activity, ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { levelOf } from "@/lib/engagement/model";
import { Aurora } from "@/components/motion/aurora";
import { useEngagement } from "./engagement-provider";

/** A slim reminder of today's challenge, for the top of a student's home page. */
export function TodayStrip({ challengeNumber }: { challengeNumber: number }) {
  const { dict } = useI18n();
  const t = dict.today;
  const { ready, state, today, streak } = useEngagement();
  if (!ready || !state) return <div aria-hidden className="mb-6 h-[4.75rem] rounded-2xl bg-night/90" />;
  const solved = state.today.day === today && state.today.challenge !== "open";
  return (
    <Link
      href="/today"
      data-testid="today-strip"
      data-done={solved}
      className="fc-spotlight fc-spotlight-dark group fc-rise relative isolate mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden rounded-2xl bg-night p-4 pr-4 text-white shadow-[var(--shadow-card)] ring-1 ring-white/10 transition-shadow hover:shadow-[var(--shadow-raised)]"
    >
      <Aurora />
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-glow-c">
        <Activity aria-hidden className="size-5" strokeWidth={2} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-semibold">{solved ? t.challenge.ctaDone : t.challenge.cta}</span>
        <span className="block text-sm text-white/70">
          {fmt(t.challenge.title, { n: challengeNumber })} · {fmtCount(t.streak, streak)} · {fmt(t.levelShort, { n: levelOf(state.xp) })}
        </span>
      </span>
      <span className="relative inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-night transition-transform group-hover:translate-x-0.5">
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
      <p className="flex items-center justify-center gap-1.5 text-2xl font-semibold tabular-nums" data-testid="device-streak">
        <Activity aria-hidden className="size-5 text-brand" />
        {ready ? streak : 0}
      </p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
