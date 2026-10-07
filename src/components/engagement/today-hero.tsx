"use client";

import { useId, useState } from "react";
import { Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { activityMap, levelProgress } from "@/lib/engagement/model";
import { cn } from "@/components/ui/cn";
import { Aurora } from "@/components/motion/aurora";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { useEngagement } from "./engagement-provider";

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
      className="mt-3 flex max-w-md flex-wrap items-center gap-2"
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
        className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.07] px-3.5 text-white backdrop-blur placeholder:text-white/50 focus:border-aurora-cyan/60 focus:bg-white/10 focus:outline-none"
      />
      <button type="submit" className="h-11 rounded-xl bg-white px-5 font-semibold text-night transition-transform hover:bg-white/90 active:scale-[0.97]" data-testid="today-name-save">
        {dict.today.nameSave}
      </button>
      <p className="basis-full text-xs text-white/60">{dict.today.nameHint}</p>
    </form>
  );
}

/** The level as a ring that draws itself, with the title and what is left to the next one. */
function LevelRing({ xp }: { xp: number }) {
  const { dict } = useI18n();
  const t = dict.today;
  const gradient = useId();
  const { level, into, needed, fraction } = levelProgress(xp);
  const radius = 52;
  const length = 2 * Math.PI * radius;
  const target = length * (1 - Math.min(1, fraction));
  return (
    <div className="fc-rise flex items-center gap-5 lg:flex-col lg:gap-3 lg:text-center" style={{ "--i": 3 } as React.CSSProperties} data-testid="level-ring">
      <div className="relative size-32 shrink-0 sm:size-36">
        <svg viewBox="0 0 120 120" aria-hidden className="size-full -rotate-90">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#60a5fa" />
              <stop offset="0.55" stopColor="#8b7bff" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(#${gradient})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={target}
            className="fc-draw fc-ring-progress"
            style={{ "--len": length, filter: "drop-shadow(0 0 7px rgb(96 165 250 / 0.55))" } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">{t.levelLabel}</span>
          <AnimatedNumber value={level} className="text-5xl leading-none font-semibold" />
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold">{t.levels[Math.min(level, t.levels.length) - 1]}</p>
        <p className="mt-0.5 text-sm text-white/70">{fmt(t.toNextLevel, { n: needed - into, level: level + 1 })}</p>
      </div>
    </div>
  );
}

const WEEKS = 26;

/** The last half year, one square a day, brighter where more was done; it fills in as a wave. */
function ActivityMap({ state, today }: { state: { days: string[]; xpByDay: Record<string, number> }; today: string }) {
  const { dict } = useI18n();
  const t = dict.today;
  const weeks = activityMap(state, today, WEEKS);
  const levels = ["bg-white/[0.09] ring-1 ring-inset ring-white/[0.05]", "bg-aurora-blue/35", "bg-aurora-blue/65", "bg-aurora-blue", "bg-aurora-cyan shadow-[0_0_10px_rgb(34_211_238/0.55)]"];
  return (
    <div className="fc-rise mt-8" style={{ "--i": 5 } as React.CSSProperties} data-testid="activity-map">
      <div className="mb-3 flex max-w-[680px] items-center justify-between">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">{t.activityTitle}</h2>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50" aria-hidden>
          <span>{t.activityLess}</span>
          {levels.map((cls, i) => (
            <span key={i} className={cn("size-2.5 rounded-[3px]", cls)} />
          ))}
          <span>{t.activityMore}</span>
        </div>
      </div>
      {/* Seven rows; the number of weeks that fit depends on the width (older weeks are left out on narrow screens). */}
      <div
        role="img"
        aria-label={`${t.activityTitle}: ${state.days.length}`}
        className="grid max-w-[680px] gap-[5px] [--weeks:16] [grid-auto-flow:column] [grid-template-columns:auto_repeat(var(--weeks),minmax(0,1fr))] [grid-template-rows:repeat(7,auto)] md:[--weeks:22] lg:[--weeks:26]"
      >
        {t.weekdaysShort.map((name, i) => (
          <span key={name} aria-hidden className={cn("flex items-center pr-2.5 text-[10px] text-white/45", i % 2 === 1 && "invisible")}>
            {name}
          </span>
        ))}
        {weeks.map((week, w) =>
          week.map((cell, d) => (
            <span
              key={cell.day}
              title={cell.future ? undefined : fmt(t.activityDay, { day: cell.day, xp: state.xpByDay[cell.day] ?? 0 })}
              data-level={cell.future ? undefined : cell.level}
              className={cn(
                "fc-cell block aspect-square w-full rounded-[5px]",
                cell.future ? "bg-transparent ring-1 ring-white/[0.07] ring-inset" : levels[cell.level],
                cell.isToday && "outline-1 outline-offset-2 outline-white/80",
                w < 4 && "max-lg:hidden",
                w < 10 && "max-md:hidden",
              )}
              style={{ "--c": w * 3 + d } as React.CSSProperties}
            />
          )),
        )}
      </div>
    </div>
  );
}

/** The top of the Today page: who you are here, your streak, your level and your activity. */
export function TodayHero() {
  const { dict } = useI18n();
  const t = dict.today;
  const { ready, state, today, hour, streak, doneToday } = useEngagement();
  const [editing, setEditing] = useState(false);

  if (!ready || !state) {
    return (
      <section className="relative isolate h-[26rem] overflow-hidden rounded-[28px] bg-night md:h-[24rem]">
        <Aurora />
        <h1 className="sr-only">{t.title}</h1>
      </section>
    );
  }
  const named = state.name !== "";
  const status = streak > 0 ? (doneToday ? t.streakDone : t.streakKeep) : t.streakStart;
  const waiting = streak > 0 && !doneToday;
  const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

  return (
    <section data-testid="today-hero" className="relative isolate overflow-hidden rounded-[28px] bg-night p-6 text-white shadow-[var(--shadow-raised)] ring-1 ring-white/10 sm:p-9">
      <Aurora />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14">
        <div>
          <p className="fc-rise text-sm font-medium text-white/65" style={rise(0)}>
            {t.greetings[greetingKey(hour)]}
          </p>
          {named && !editing ? (
            <div className="fc-rise mt-1 flex flex-wrap items-center gap-2" style={rise(1)}>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-[42px] sm:leading-tight" data-testid="today-greeting">
                {fmt(t.hello, { name: state.name })}
              </h1>
              <button type="button" onClick={() => setEditing(true)} className="flex size-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label={t.nameChange} title={t.nameChange}>
                <Pencil aria-hidden className="size-4" />
              </button>
            </div>
          ) : (
            <div className="fc-rise mt-1" style={rise(1)}>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-[42px] sm:leading-tight">{named ? fmt(t.hello, { name: state.name }) : t.helloNew}</h1>
              <NameForm initial={state.name} onDone={() => setEditing(false)} />
            </div>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-14 gap-y-6" data-testid="streak-block">
            <div className="fc-rise" style={rise(2)}>
              <dt className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">{t.streakLabel}</dt>
              <dd className="mt-1.5 flex items-baseline gap-2">
                <span data-testid="streak-number" className="text-6xl leading-none font-semibold">
                  <AnimatedNumber value={streak} />
                </span>
                <span className="text-base text-white/70">{fmtCount(t.streakUnit, streak)}</span>
              </dd>
            </div>
            <div className="fc-rise" style={rise(3)}>
              <dt className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">{t.xpLabel}</dt>
              <dd className="mt-1.5 flex items-baseline gap-2">
                <span data-testid="xp-total" className="text-6xl leading-none font-semibold">
                  <AnimatedNumber value={state.xp} duration={1500} />
                </span>
                <span className="text-base text-white/70">XP</span>
              </dd>
            </div>
          </dl>
          <p className="fc-rise mt-5 flex max-w-md items-center gap-2.5 text-sm text-white/75" style={rise(4)}>
            {waiting ? (
              <span aria-hidden className="relative flex size-2.5 shrink-0">
                <span className="fc-ping absolute inline-flex size-full rounded-full bg-aurora-cyan/70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-aurora-cyan" />
              </span>
            ) : null}
            {status}
          </p>
        </div>
        <LevelRing xp={state.xp} />
      </div>
      <ActivityMap state={state} today={today} />
    </section>
  );
}
