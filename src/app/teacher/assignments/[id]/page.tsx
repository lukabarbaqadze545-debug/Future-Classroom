import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { ApiError } from "@/lib/http/errors";
import { getAssignmentForTeacher } from "@/lib/services/assignments";
import { assignedItem, workHref } from "@/lib/labs/assignment-items";
import { AUTO_CHECKED_KINDS } from "@/lib/labs/registry";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, Stat } from "@/components/ui/misc";
import { ReviewBoard } from "@/components/assignments/review-board";
import { AssignmentSettings } from "@/components/assignments/assignment-settings";

export async function generateMetadata() {
  return pageTitle((p) => p.assignment);
}

export default async function TeacherAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let data;
  try {
    data = getAssignmentForTeacher(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { dict, locale } = await getDictionary();
  const a = dict.labs.assignments;
  const { assignment, recipients } = data;
  const item = assignedItem(assignment.kind, assignment.refId, locale);
  const done = recipients.filter((r) => ["submitted", "completed", "reviewed"].includes(r.status)).length;
  const scored = recipients.filter((r) => r.score !== null && r.maxScore);
  const average = scored.length ? Math.round((scored.reduce((s, r) => s + r.score! / r.maxScore!, 0) / scored.length) * 100) : null;
  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link href="/teacher/assignments" className="hover:underline">
            {a.title}
          </Link>
        }
        title={assignment.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{a.kinds[assignment.kind]}</Badge>
            {assignment.className ? <span>{assignment.className}</span> : null}
            {assignment.dueAt ? <span>· {fmt(dict.labs.common.due, { date: formatDateTime(locale, assignment.dueAt) })}</span> : <span>· {a.noDue}</span>}
            {assignment.archived ? <Badge tone="neutral">{a.archived}</Badge> : null}
          </span>
        }
        actions={<AssignmentSettings id={id} archived={assignment.archived} />}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label={a.completion} value={`${done}/${recipients.length}`} />
        <Stat label={a.toReviewLabel} value={recipients.filter((r) => r.status === "submitted").length} />
        <Stat label={dict.labs.common.score} value={average !== null ? `${average}%` : "—"} />
      </div>
      {assignment.instructions || item ? (
        <Card className="mb-6 space-y-2 p-5">
          {assignment.instructions ? <p className="text-[15px] whitespace-pre-line">{assignment.instructions}</p> : null}
          {item ? (
            <Link href={item.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
              <ExternalLink aria-hidden className="size-4" />
              {item.title || a.openActivity}
            </Link>
          ) : null}
          {AUTO_CHECKED_KINDS.includes(assignment.kind) ? <p className="text-sm text-ink-muted">{a.autoChecked}</p> : null}
        </Card>
      ) : null}
      <ReviewBoard
        assignmentId={id}
        initial={recipients}
        workLinks={Object.fromEntries(recipients.map((r) => [r.studentId, workHref(assignment.kind, assignment.refId, r.workRef, r.studentId)]))}
        dueAt={assignment.dueAt}
      />
    </PageContainer>
  );
}
