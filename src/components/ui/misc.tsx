import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

/** A spinner with a visible label; without one it is decorative and the caller announces the state. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  const icon = <Loader2 aria-hidden className={cn("size-4 animate-spin", className)} />;
  if (!label) return icon;
  return (
    <span role="status" className="inline-flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </span>
  );
}

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center", className)}>
      {icon ? <div className="mb-3 text-ink-subtle">{icon}</div> : null}
      <p className="font-medium text-ink">{title}</p>
      {children ? <div className="mt-1 max-w-md text-sm text-ink-muted">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1.5 text-sm font-medium text-ink-subtle">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-[15px] text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4 shadow-[var(--shadow-card)]", className)}>
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-ink-subtle">{hint}</div> : null}
    </div>
  );
}

/** Horizontal bar used for percentages and simple distributions. */
export function Meter({ value, tone = "brand", className, label }: { value: number; tone?: "brand" | "success" | "warn" | "danger" | "neutral"; className?: string; label?: string }) {
  const colors = { brand: "bg-brand", success: "bg-success", warn: "bg-warn", danger: "bg-danger", neutral: "bg-ink-subtle" };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)} aria-label={label} className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", colors[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
