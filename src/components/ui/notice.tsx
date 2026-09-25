import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { cn } from "./cn";

type NoticeTone = "info" | "success" | "warn" | "danger" | "ai";

const styles: Record<NoticeTone, { box: string; icon: typeof Info }> = {
  info: { box: "bg-brand-soft/60 border-brand/15 text-brand-ink", icon: Info },
  success: { box: "bg-success-soft border-success/20 text-success", icon: CheckCircle2 },
  warn: { box: "bg-warn-soft border-warn/25 text-warn", icon: AlertTriangle },
  danger: { box: "bg-danger-soft border-danger/20 text-danger", icon: XCircle },
  ai: { box: "bg-ai-soft border-ai/20 text-ai", icon: Sparkles },
};

export function Notice({ tone = "info", title, children, className, action }: { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  const { box, icon: Icon } = styles[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", box, className)}>
      <Icon aria-hidden className="mt-0.5 size-4.5 shrink-0" />
      <div className="min-w-0 flex-1 text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-0.5" : null, "text-ink-muted")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
