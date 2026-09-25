import { Check } from "lucide-react";
import { cn } from "@/components/ui/cn";

/** Answer distribution for multiple-choice questions and polls. */
export function ResultBars({
  distribution,
  showCorrect,
  large = false,
  correctLabel,
}: {
  distribution: { optionId: string; text: string; count: number; correct: boolean }[];
  showCorrect: boolean;
  large?: boolean;
  correctLabel: string;
}) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <ul className={cn("space-y-3", large && "space-y-4")}>
      {distribution.map((d) => {
        const highlight = showCorrect && d.correct;
        const percent = total ? Math.round((d.count / total) * 100) : 0;
        return (
          <li key={d.optionId}>
            <div className={cn("mb-1 flex items-baseline justify-between gap-3", large ? "text-2xl" : "text-sm")}>
              <span className={cn("flex items-center gap-2 font-medium", highlight && "text-success")}>
                <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md font-semibold uppercase", large ? "size-10 text-xl" : "size-6 text-xs", highlight ? "bg-success text-white" : "bg-muted text-ink-muted")}>
                  {d.optionId}
                </span>
                {d.text}
                {highlight ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Check aria-hidden className={large ? "size-6" : "size-4"} />
                    <span className="sr-only">{correctLabel}</span>
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-ink-muted">
                {d.count} <span className="text-ink-subtle">({percent}%)</span>
              </span>
            </div>
            <div className={cn("overflow-hidden rounded-full bg-muted", large ? "h-5" : "h-2.5")}>
              <div className={cn("h-full rounded-full transition-[width] duration-500", highlight ? "bg-success" : "bg-brand/70")} style={{ width: `${(d.count / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
