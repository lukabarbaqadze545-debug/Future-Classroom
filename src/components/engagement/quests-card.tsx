"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ANSWERS_QUEST_TARGET, QUESTS, XP, questProgress } from "@/lib/engagement/model";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";

/** Three arcs, one for each goal; an arc lights when its goal is done, and the count sits in the middle. */
function Arcs({ done }: { done: boolean[] }) {
  return (
    <span className="relative flex size-11 items-center justify-center">
      <svg viewBox="0 0 44 44" aria-hidden className="absolute inset-0 size-11 -rotate-90">
        {done.map((isDone, i) => (
          <circle
            key={i}
            cx="22"
            cy="22"
            r="19"
            pathLength="100"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="27 73"
            strokeDashoffset={-i * 33.34}
            className={cn("transition-[stroke] duration-700", isDone ? "stroke-brand" : "stroke-line-strong/70")}
          />
        ))}
      </svg>
      <span className="text-xs font-semibold text-ink tabular-nums">{done.filter(Boolean).length}/{done.length}</span>
    </span>
  );
}

/** Three small goals for the day; finishing all three earns a bonus. */
export function QuestsCard() {
  const { dict } = useI18n();
  const t = dict.today.quests;
  const { ready, state, today } = useEngagement();
  const current = ready && state && state.today.day === today ? state : null;
  const progress = current ? questProgress(current) : null;
  const labels = { challenge: t.challenge, answers: fmt(t.answers, { n: ANSWERS_QUEST_TARGET }), lab: t.lab };
  const bonusEarned = current?.today.chest === true;
  const flags = QUESTS.map((id) => (progress ? progress[id].done >= progress[id].target : false));
  return (
    <Card data-testid="quests" className="fc-rise" style={{ "--i": 2 } as React.CSSProperties}>
      <CardHeader title={t.title} action={<Arcs done={flags} />} />
      <ul className="divide-y divide-line">
        {QUESTS.map((id, i) => {
          const p = progress?.[id] ?? { done: 0, target: id === "answers" ? ANSWERS_QUEST_TARGET : 1 };
          const done = p.done >= p.target;
          return (
            <li key={id} className="flex items-center gap-3.5 px-5 py-3.5" data-testid={`quest-${id}`} data-done={done}>
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500", done ? "border-brand bg-brand-solid text-white" : "border-line-strong text-transparent")}>
                <Check aria-hidden className="size-4" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-medium transition-colors", done && "text-ink-muted")}>{labels[id]}</span>
                {p.target > 1 ? (
                  <span className="mt-2 flex items-center gap-2.5">
                    <span className="h-1 w-28 overflow-hidden rounded-full bg-muted">
                      <span key={`${i}-${p.done}`} className="fc-grow block h-full rounded-full bg-brand-solid" style={{ width: `${(p.done / p.target) * 100}%` }} />
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      {p.done}/{p.target}
                    </span>
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <div className={cn("rounded-b-[var(--radius-card)] border-t border-line px-5 py-3.5 text-sm font-medium transition-colors duration-500", bonusEarned ? "bg-brand-soft text-brand-ink" : "bg-muted/60 text-ink-muted")} data-testid="chest" data-open={bonusEarned}>
        {bonusEarned ? fmt(t.chestOpened, { n: XP.chest }) : fmt(t.chest, { n: XP.chest })}
      </div>
    </Card>
  );
}
