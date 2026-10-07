"use client";

import { Flame as FlameIcon, Gift, Sparkles, X, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/components/ui/cn";
import { BADGE_ICONS } from "./badge-icons";

export interface Toast {
  id: number;
  kind: "xp" | "streak" | "badge" | "level" | "chest";
  xp?: number;
  streak?: number;
  badge?: string;
  level?: number;
}

const COLORS = ["#f97316", "#fbbf24", "#1d4ed8", "#7c3aed", "#10b981", "#ec4899"];

/** A burst of paper from the middle of the screen. Pieces are laid out by a fixed formula: no randomness, so it renders the same everywhere. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 44 }, (_, i) => {
        const angle = (i * 137.5 * Math.PI) / 180;
        const distance = 140 + ((i * 53) % 260);
        return (
          <span
            key={i}
            className="fc-confetti"
            style={
              {
                background: COLORS[i % COLORS.length],
                "--fc-dx": `${Math.cos(angle) * distance}px`,
                "--fc-dy": `${Math.sin(angle) * distance * 0.8 + 90}px`,
                "--fc-spin": `${(i % 2 ? 1 : -1) * (240 + ((i * 29) % 400))}deg`,
                animationDelay: `${(i % 6) * 25}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { dict } = useI18n();
  const t = dict.today;
  let icon = <Zap aria-hidden className="size-5" />;
  let tone = "bg-gold-soft text-gold";
  let title = "";
  let text = "";
  switch (toast.kind) {
    case "xp":
      title = fmt(t.xp, { n: `+${toast.xp}` });
      break;
    case "streak":
      icon = <FlameIcon aria-hidden className="size-5" />;
      tone = "bg-spark-soft text-spark";
      title = fmt(t.toast.streakUp, { n: toast.streak ?? 0 });
      break;
    case "badge": {
      const Icon = BADGE_ICONS[toast.badge ?? ""] ?? Sparkles;
      icon = <Icon aria-hidden className="size-5" />;
      tone = "bg-brand-soft text-brand-ink";
      const info = (t.badges.list as Record<string, { name: string; text: string }>)[toast.badge ?? ""];
      title = fmt(t.toast.badge, { name: info?.name ?? "" });
      text = info?.text ?? "";
      break;
    }
    case "level": {
      icon = <Sparkles aria-hidden className="size-5" />;
      tone = "bg-ai-soft text-ai";
      title = fmt(t.toast.levelUp, { n: toast.level ?? 1 });
      text = fmt(t.toast.levelUpText, { title: t.levels[Math.min(toast.level ?? 1, t.levels.length) - 1] });
      break;
    }
    case "chest":
      icon = <Gift aria-hidden className="size-5" />;
      tone = "bg-gold-soft text-gold";
      title = fmt(t.quests.chestOpened, { n: toast.xp ?? 0 });
      break;
  }
  return (
    <div className="fc-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-2 shadow-[var(--shadow-raised)]">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        {text ? <span className="block text-sm text-ink-muted">{text}</span> : null}
      </span>
      <button type="button" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-subtle hover:bg-muted hover:text-ink" aria-label={t.toast.close}>
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** What was just earned, at the bottom of the screen; announced politely to screen readers. */
export function Toasts({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" data-testid="toasts">
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
}
