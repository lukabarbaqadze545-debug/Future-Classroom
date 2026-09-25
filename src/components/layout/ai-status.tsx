import { fmt } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { AIStatus } from "@/lib/ai";
import { cn } from "@/components/ui/cn";

/** Always-visible indicator so teachers know whether AI is really in use. */
export function AIStatusBadge({ status, dict }: { status: AIStatus; dict: Dictionary }) {
  const label = status.mode === "online" ? dict.ai.online : status.mode === "degraded" ? dict.ai.degraded : dict.ai.offline;
  const help =
    status.mode === "online" ? fmt(dict.ai.onlineHelp, { model: status.model }) : status.mode === "degraded" ? dict.ai.degradedHelp : dict.ai.offlineHelp;
  const dot = status.mode === "online" ? "bg-success" : status.mode === "degraded" ? "bg-warn" : "bg-ink-subtle";
  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-muted hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span aria-hidden className={cn("size-2 rounded-full", dot)} />
        <span className="hidden sm:inline">{label}</span>
        <span className="sr-only sm:hidden">{label}</span>
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-line bg-surface p-4 text-sm shadow-[var(--shadow-raised)]">
        <p className="font-semibold text-ink">{dict.ai.statusTitle}: {label}</p>
        <p className="mt-1 text-ink-muted">{help}</p>
      </div>
    </details>
  );
}
