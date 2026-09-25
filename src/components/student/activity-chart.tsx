import { cn } from "@/components/ui/cn";

/** 14-day activity bars. Purely visual; the numbers are also in the label. */
export function ActivityChart({ days, label, locale }: { days: { date: string; count: number }[]; label: string; locale: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const weekday = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-GB", { weekday: "narrow" });
  return (
    <figure>
      <div className="flex h-28 items-end gap-1.5" role="img" aria-label={`${label}: ${days.map((d) => d.count).join(", ")}`}>
        {days.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className={cn("w-full rounded-t-md", d.count ? "bg-brand" : "bg-muted")} style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }} title={`${d.date}: ${d.count}`} />
            <span className="text-[10px] text-ink-subtle">{weekday.format(new Date(`${d.date}T12:00:00`))}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
