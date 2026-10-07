"use client";

import { useState } from "react";
import { Check, Flame as FlameIcon, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { levelProgress, weekView } from "@/lib/engagement/model";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";
import { Flame } from "./flame";

function greetingKey(hour: number): "morning" | "day" | "evening" | "night" {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 18) return "day";
  return "evening";
}

function NameForm({ initial, onDone }: { initial: string; onDone: () => void }) {
  const { dict } = useI18n();
  const { rename } = useEngagement();
  const [value, setValue] = useState(initial);
  return (
    <form
      className="mt-2 flex max-w-sm flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) rename(value);
        onDone();
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={24}
        autoFocus={initial !== ""}
        placeholder={dict.today.namePlaceholder}
        aria-label={dict.today.namePlaceholder}
        data-testid="today-name-input"
        className="h-11 min-w-0 flex-1 rounded-xl border border-white/30 bg-white/15 px-3 text-white placeholder:text-white/70 focus:bg-white/25 focus:outline-none"
      />
      <button type="submit" className="h-11 rounded-xl bg-white px-4 font-semibold text-hero-from hover:bg-white/90" data-testid="today-name-save">
        {dict.today.nameSave}
      </button>
      <p className="basis-full text-xs text-white/80">{dict.today.nameHint}</p>
    </form>
  );
}

function LevelRing({ xp }: { xp: number }) {
  const { dict } = useI18n();
  const t = dict.today;
  const { level, into, needed, fraction } = levelProgress(xp);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-4 md:flex-col md:gap-2 md:text-center" data-testid="level-ring">
      <div className="relative size-28 shrink-0 sm:size-32">
        <svg viewBox="0 0 120 120" aria-hidden className="size-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(1, fraction))}
            className="fc-ring-progress"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium tracking-wide text-white/80 uppercase">{fmt(t.levelShort, { n: "" }).trim()}</span>
          <span className="text-4xl leading-none font-bold tabular-nums">{level}</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold">{t.levels[Math.min(level, t.levels.length) - 1]}</p>
        <p className="text-sm text-white/85" data-testid="xp-total">
          {fmt(t.xp, { n: xp })}
        </p>
        <p className="text-xs text-white/75">{fmt(t.toNextLevel, { n: needed - into, level: level + 1 })}</p>
      </div>
    </div>
  );
}

function WeekStrip({ days, today }: { days: string[]; today: string }) {
  const { dict } = useI18n();
  const t = dict.today;
  return (
    <div className="mt-6" data-testid="week-strip">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-white/80 uppercase">{t.weekTitle}</h2>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {weekView(days, today).map((day, i) => (
          <li key={day.day} className="flex flex-col items-center gap-1.5" aria-label={`${t.weekdays[i]}${day.done ? " ✓" : ""}`}>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-sm font-semibold sm:size-11",
                day.done ? "bg-spark text-white shadow-[0_2px_8px_rgb(234_88_12/0.5)]" : day.isToday ? "bg-white/15 ring-2 ring-white" : day.future ? "border border-dashed border-white/30" : "bg-white/10",
              )}
            >
              {day.done ? <Check aria-hidden className="size-5" strokeWidth={3} /> : day.isToday ? <FlameIcon aria-hidden className="size-4 text-white/90" /> : null}
            </span>
            <span className={cn("text-[11px] sm:text-xs", day.isToday ? "font-semibold text-white" : "text-white/75")}>{t.weekdaysShort[i]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The top of the Today page: who you are here, your streak, your level and your week. */
export function TodayHero() {
  const { dict } = useI18n();
  const t = dict.today;
  const { ready, state, today, hour, streak, doneToday } = useEngagement();
  const [editing, setEditing] = useState(false);

  if (!ready || !state) {
    return (
      <section className="h-[22rem] rounded-3xl bg-linear-to-br from-hero-from via-hero-via to-hero-to opacity-60 md:h-[19rem]">
        <h1 className="sr-only">{t.title}</h1>
      </section>
    );
  }
  const named = state.name !== "";
  const status = streak > 0 ? (doneToday ? t.streakDone : t.streakKeep) : t.streakStart;
  return (
    <section data-testid="today-hero" className="relative overflow-hidden rounded-3xl bg-linear-to-br from-hero-from via-hero-via to-hero-to p-5 text-white shadow-[var(--shadow-raised)] sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-spark/25 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        <div>
          <p className="text-sm font-medium text-white/85">{t.greetings[greetingKey(hour)]}</p>
          {named && !editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="today-greeting">
                {fmt(t.hello, { name: state.name })}
              </h1>
              <button type="button" onClick={() => setEditing(true)} className="flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white" aria-label={t.nameChange} title={t.nameChange}>
                <Pencil aria-hidden className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{named ? fmt(t.hello, { name: state.name }) : t.helloNew}</h1>
              <NameForm initial={state.name} onDone={() => setEditing(false)} />
            </>
          )}
          <div className="mt-5 flex items-center gap-4" data-testid="streak-block">
            <Flame lit={streak > 0} className="h-24 w-[4.8rem] drop-shadow-[0_6px_14px_rgb(234_88_12/0.45)]" />
            <div>
              <p className="flex items-baseline gap-2">
                <span className="text-6xl leading-none font-bold tabular-nums" data-testid="streak-number">
                  {streak}
                </span>
                <span className="text-lg font-semibold text-white/90">{fmtCount(t.streakUnit, streak)}</span>
              </p>
              <p className="mt-1 max-w-sm text-sm text-white/85">{status}</p>
            </div>
          </div>
        </div>
        <LevelRing xp={state.xp} />
      </div>
      <WeekStrip days={state.days} today={today} />
    </section>
  );
}
