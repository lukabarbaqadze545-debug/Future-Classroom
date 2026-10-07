"use client";

import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { BADGES } from "@/lib/engagement/model";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { BADGE_ICONS } from "./badge-icons";
import { useEngagement } from "./engagement-provider";

/** Everything there is to earn, what has been earned, and how to get the rest. */
export function BadgesCard() {
  const { dict } = useI18n();
  const t = dict.today.badges;
  const { ready, state } = useEngagement();
  const earned = state?.badges ?? {};
  const count = BADGES.filter((b) => earned[b.id]).length;
  return (
    <Card data-testid="badges">
      <CardHeader title={t.title} action={<span className="text-sm font-medium text-ink-muted tabular-nums">{ready ? fmt(t.count, { n: count, total: BADGES.length }) : ""}</span>} />
      <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((badge) => {
          const info = (t.list as Record<string, { name: string; text: string }>)[badge.id];
          const Icon = BADGE_ICONS[badge.id];
          const has = Boolean(earned[badge.id]);
          return (
            <li key={badge.id} data-testid={`badge-${badge.id}`} data-earned={has} className={cn("flex items-start gap-3 rounded-2xl border p-3", has ? "border-gold/30 bg-gold-soft/60" : "border-line bg-muted/40")}>
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", has ? "fc-pop bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-sm" : "bg-surface text-ink-subtle")}>
                {has ? <Icon aria-hidden className="size-6" /> : <Lock aria-hidden className="size-5" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", !has && "text-ink-muted")}>{info.name}</span>
                <span className="block text-xs text-ink-muted">{info.text}</span>
                <span className="sr-only">{has ? t.earned : t.locked}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
