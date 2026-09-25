import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/en";
import { fmt, formatDate, type Locale } from "@/lib/i18n/config";
import { cn } from "@/components/ui/cn";

/** Shown on a lab item when the student has an assignment for it. */
export function AssignmentBanner({
  assignments,
  dict,
  locale,
}: {
  assignments: { id: string; title: string; teacherName: string; dueAt: number | null; overdue: boolean; instructions: string; recipient: { status: string; feedback: string } }[];
  dict: Dictionary;
  locale: Locale;
}) {
  if (!assignments.length) return null;
  return (
    <div className="mb-5 space-y-2">
      {assignments.map((a) => (
        <Link
          key={a.id}
          href={`/student/assignments/${a.id}`}
          className={cn("flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3 transition-colors hover:bg-surface", a.overdue ? "border-danger/30 bg-danger-soft/50" : "border-brand/25 bg-brand-soft/50")}
        >
          <ClipboardCheck aria-hidden className={cn("mt-0.5 size-5 shrink-0", a.overdue ? "text-danger" : "text-brand")} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{a.title}</p>
            <p className="text-sm text-ink-muted">
              {fmt(dict.labs.common.assignedBy, { name: a.teacherName })}
              {a.dueAt ? ` · ${fmt(dict.labs.common.due, { date: formatDate(locale, a.dueAt) })}` : ""}
              {a.overdue ? ` · ${dict.labs.common.overdue}` : ""}
            </p>
            {a.instructions ? <p className="mt-1 line-clamp-2 text-sm">{a.instructions}</p> : null}
          </div>
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium">{dict.labs.assignments.status[a.recipient.status as keyof typeof dict.labs.assignments.status]}</span>
        </Link>
      ))}
    </div>
  );
}
