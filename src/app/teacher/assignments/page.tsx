import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { listAssignmentsForTeacher } from "@/lib/services/assignments";
import { assignedItem } from "@/lib/labs/assignment-items";
import { ASSIGNMENT_LAB } from "@/lib/labs/registry";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Meter, PageHeader } from "@/components/ui/misc";
import { LabIcon } from "@/components/labs/lab-shell";

export const metadata = { title: "Assignments" };

export default async function TeacherAssignmentsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const a = dict.labs.assignments;
  const showArchived = (await searchParams).archived === "1";
  const list = listAssignmentsForTeacher(user.id, showArchived).filter((x) => x.archived === showArchived);
  return (
    <PageContainer>
      <PageHeader
        title={a.title}
        description={a.teacherLead}
        actions={
          <>
            <ButtonLink href={showArchived ? "/teacher/assignments" : "/teacher/assignments?archived=1"} variant="ghost">
              {showArchived ? a.title : a.archived}
            </ButtonLink>
            <ButtonLink href="/teacher/assignments/new" data-testid="new-assignment">
              <Plus aria-hidden className="size-4" />
              {a.new}
            </ButtonLink>
          </>
        }
      />
      {list.length ? (
        <ul className="space-y-3" data-testid="assignment-list">
          {list.map((x) => {
            const lab = ASSIGNMENT_LAB[x.kind];
            const item = assignedItem(x.kind, x.refId, locale);
            return (
              <li key={x.id}>
                <Link href={`/teacher/assignments/${x.id}`} className="block">
                  <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-brand/40">
                    {lab !== "lessons" && lab !== "custom" ? <LabIcon lab={lab} size="md" /> : <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-lg" aria-hidden>📝</span>}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{x.title}</p>
                      <p className="text-sm text-ink-muted">
                        {a.kinds[x.kind]}
                        {item?.title && item.title !== x.title ? ` · ${item.title}` : ""}
                        {x.className ? ` · ${x.className}` : ""}
                        {x.dueAt ? ` · ${fmt(dict.labs.common.due, { date: formatDateTime(locale, x.dueAt) })}` : ""}
                      </p>
                    </div>
                    <div className="w-full sm:w-56">
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-muted">{fmt(a.progressCount, { done: x.done, total: x.total })}</span>
                        <span className="flex gap-1.5">
                          {x.toReview ? <Badge tone="warn">{fmt(a.toReview, { n: x.toReview })}</Badge> : null}
                          {x.overdue ? <Badge tone="danger">{fmt(a.overdueCount, { n: x.overdue })}</Badge> : null}
                        </span>
                      </div>
                      <Meter value={x.total ? (x.done / x.total) * 100 : 0} tone="success" className="mt-1.5" label={fmt(a.progressCount, { done: x.done, total: x.total })} />
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={a.empty} action={<ButtonLink href="/teacher/assignments/new">{a.new}</ButtonLink>} />
      )}
    </PageContainer>
  );
}
