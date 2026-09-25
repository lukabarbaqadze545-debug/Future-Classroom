import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { listAssignmentsForStudent } from "@/lib/services/assignments";
import { assignedItem } from "@/lib/labs/assignment-items";
import { ASSIGNMENT_LAB } from "@/lib/labs/registry";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LabIcon } from "@/components/labs/lab-shell";
import { STATUS_TONE } from "@/components/assignments/review-board";

export const metadata = { title: "My assignments" };

const DONE = ["submitted", "completed", "reviewed"];

export default async function StudentAssignmentsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const a = dict.labs.assignments;
  const filter = (await searchParams).filter ?? "todo";
  const all = listAssignmentsForStudent(user.id);
  const list = all.filter((x) => (filter === "done" ? DONE.includes(x.recipient.status) : filter === "overdue" ? x.overdue : filter === "all" ? true : !DONE.includes(x.recipient.status)));
  const tabs = [
    { id: "todo", n: all.filter((x) => !DONE.includes(x.recipient.status)).length },
    { id: "overdue", n: all.filter((x) => x.overdue).length },
    { id: "done", n: all.filter((x) => DONE.includes(x.recipient.status)).length },
    { id: "all", n: all.length },
  ] as const;
  return (
    <PageContainer>
      <PageHeader title={a.title} description={a.studentLead} />
      <nav aria-label={a.title} className="mb-5 flex flex-wrap gap-1 rounded-xl border border-line bg-muted/70 p-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/student/assignments?filter=${t.id}`}
            aria-current={filter === t.id ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-medium ${filter === t.id ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            {a.filter[t.id]}
            <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{t.n}</span>
          </Link>
        ))}
      </nav>
      {list.length ? (
        <ul className="space-y-3" data-testid="student-assignments">
          {list.map((x) => {
            const lab = ASSIGNMENT_LAB[x.kind];
            const item = assignedItem(x.kind, x.refId, locale);
            return (
              <li key={x.id}>
                <Link href={`/student/assignments/${x.id}`} className="block">
                  <Card className={`flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-brand/40 ${x.overdue ? "border-danger/30" : ""}`}>
                    {lab !== "lessons" && lab !== "custom" ? <LabIcon lab={lab} /> : <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-lg" aria-hidden>📝</span>}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{x.title}</p>
                      <p className="text-sm text-ink-muted">
                        {a.kinds[x.kind]}
                        {item?.title && item.title !== x.title ? ` · ${item.title}` : ""} · {fmt(dict.labs.common.assignedBy, { name: x.teacherName })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {x.dueAt ? <span className={`text-sm ${x.overdue ? "font-semibold text-danger" : "text-ink-muted"}`}>{fmt(dict.labs.common.due, { date: formatDateTime(locale, x.dueAt) })}</span> : null}
                      {x.recipient.score !== null && x.recipient.maxScore ? <span className="text-sm font-semibold tabular-nums">{`${x.recipient.score}/${x.recipient.maxScore}`}</span> : null}
                      <Badge tone={x.overdue ? "danger" : STATUS_TONE[x.recipient.status]}>{x.overdue ? dict.labs.common.overdue : a.status[x.recipient.status]}</Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={filter === "todo" ? a.studentEmpty : a.empty} />
      )}
    </PageContainer>
  );
}
