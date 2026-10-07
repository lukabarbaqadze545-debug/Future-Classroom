"use client";

import { Check, Gift } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ANSWERS_QUEST_TARGET, QUESTS, XP, questProgress } from "@/lib/engagement/model";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";

/** Three small things to do today; all three open the chest. */
export function QuestsCard() {
  const { dict } = useI18n();
  const t = dict.today.quests;
  const { ready, state, today } = useEngagement();
  const current = ready && state && state.today.day === today ? state : null;
  const progress = current ? questProgress(current) : null;
  const labels = { challenge: t.challenge, answers: fmt(t.answers, { n: ANSWERS_QUEST_TARGET }), lab: t.lab };
  const chestOpen = current?.today.chest === true;
  return (
    <Card data-testid="quests">
      <CardHeader title={t.title} />
      <ul className="divide-y divide-line">
        {QUESTS.map((id) => {
          const p = progress?.[id] ?? { done: 0, target: id === "answers" ? ANSWERS_QUEST_TARGET : 1 };
          const done = p.done >= p.target;
          return (
            <li key={id} className="flex items-center gap-3 px-5 py-3.5" data-testid={`quest-${id}`} data-done={done}>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors", done ? "border-success bg-success text-white" : "border-line-strong text-transparent")}>
                <Check aria-hidden className="size-4" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-medium", done && "text-ink-muted line-through decoration-1")}>{labels[id]}</span>
                {p.target > 1 ? (
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${(p.done / p.target) * 100}%` }} />
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
      <div className={cn("flex items-center gap-3 rounded-b-[var(--radius-card)] border-t border-line px-5 py-3.5", chestOpen ? "bg-gold-soft" : "bg-muted/60")} data-testid="chest" data-open={chestOpen}>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", chestOpen ? "bg-gold text-white" : "bg-surface text-gold shadow-sm")}>
          <Gift aria-hidden className="size-5" />
        </span>
        <p className="text-sm font-medium">{chestOpen ? fmt(t.chestOpened, { n: XP.chest }) : fmt(t.chest, { n: XP.chest })}</p>
      </div>
    </Card>
  );
}
