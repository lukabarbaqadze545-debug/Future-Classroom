"use client";

import { Activity, CheckCheck, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { BADGE_ICONS } from "./badge-icons";

export interface Toast {
  id: number;
  kind: "xp" | "streak" | "badge" | "badges" | "level" | "chest";
  xp?: number;
  streak?: number;
  badge?: string;
  /** Several achievements at once: their names. */
  names?: string[];
  level?: number;
}

/** A thin light that crosses the top of the window: the quiet way to say that something was earned. */
export function Sheen() {
  return <div aria-hidden className="fc-sheen" />;
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { dict } = useI18n();
  const t = dict.today;
  let icon = <Zap aria-hidden className="size-[18px]" />;
  let title = "";
  let text = "";
  switch (toast.kind) {
    case "xp":
      title = fmt(t.xp, { n: `+${toast.xp}` });
      break;
    case "streak":
      icon = <Activity aria-hidden className="size-[18px]" />;
      title = fmt(t.toast.streakUp, { n: toast.streak ?? 0 });
      break;
    case "badge": {
      const Icon = BADGE_ICONS[toast.badge ?? ""] ?? Sparkles;
      icon = <Icon aria-hidden className="size-[18px]" />;
      const info = (t.badges.list as Record<string, { name: string; text: string }>)[toast.badge ?? ""];
      title = fmt(t.toast.badge, { name: info?.name ?? "" });
      text = info?.text ?? "";
      break;
    }
    case "badges":
      icon = <Sparkles aria-hidden className="size-[18px]" />;
      title = fmt(t.toast.badges, { n: toast.names?.length ?? 0 });
      text = (toast.names ?? []).join(" · ");
      break;
    case "level":
      icon = <TrendingUp aria-hidden className="size-[18px]" />;
      title = fmt(t.toast.levelUp, { n: toast.level ?? 1 });
      text = fmt(t.toast.levelUpText, { title: t.levels[Math.min(toast.level ?? 1, t.levels.length) - 1] });
      break;
    case "chest":
      icon = <CheckCheck aria-hidden className="size-[18px]" />;
      title = fmt(t.quests.chestOpened, { n: toast.xp ?? 0 });
      break;
  }
  return (
    <div className="fc-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-night/95 p-3 pr-2 text-white shadow-[0_18px_50px_-12px_rgb(0_0_0/0.55)] backdrop-blur-md">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-glow-c">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        {text ? <span className="block text-sm text-white/70">{text}</span> : null}
      </span>
      <button type="button" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white" aria-label={t.toast.close}>
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
