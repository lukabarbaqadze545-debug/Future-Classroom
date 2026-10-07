"use client";

import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { BADGES } from "@/lib/engagement/model";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { BADGE_ICONS } from "./badge-icons";
import { useEngagement } from "./engagement-provider";

/** Everything there is to earn: what has been earned, and how far along the rest is. */
export function BadgesCard() {
  const { dict } = useI18n();
  const t = dict.today.badges;
  const { ready, state } = useEngagement();
  const earned = state?.badges ?? {};
  const count = BADGES.filter((b) => earned[b.id]).length;
  return (
    <Card data-testid="badges" className="fc-reveal">
      <CardHeader title={t.title} action={<span className="text-sm font-medium text-ink-muted tabular-nums">{ready ? fmt(t.count, { n: count, total: BADGES.length }) : ""}</span>} />
      <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((badge) => {
          const info = (t.list as Record<string, { name: string; text: string }>)[badge.id];
          const Icon = BADGE_ICONS[badge.id];
          const has = Boolean(earned[badge.id]);
          const progress = state ? badge.progress(state) : { value: 0, target: 1 };
          return (
            <li
              key={badge.id}
              data-testid={`badge-${badge.id}`}
              data-earned={has}
              className={cn("fc-spotlight fc-lift flex items-start gap-3.5 rounded-2xl border p-3.5", has ? "border-brand/25 bg-brand-soft/40" : "border-line bg-surface")}
            >
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors", has ? "bg-linear-to-br from-brand to-aurora-violet text-white shadow-sm" : "bg-muted text-ink-subtle")}>
                <Icon aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", !has && "text-ink-muted")}>{info.name}</span>
                <span className="block text-xs text-ink-muted">{info.text}</span>
                {!has && progress.value > 0 ? (
                  <span className="mt-2 flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="fc-grow block h-full rounded-full bg-brand/70" style={{ width: `${(progress.value / progress.target) * 100}%` }} />
                    </span>
                    <span className="text-[11px] text-ink-muted tabular-nums">
                      {progress.value}/{progress.target}
                    </span>
                  </span>
                ) : null}
                <span className="sr-only">{has ? t.earned : t.locked}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
