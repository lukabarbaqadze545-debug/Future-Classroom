import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { ApiError } from "@/lib/http/errors";
import { getAssignmentForStudent, markStarted } from "@/lib/services/assignments";
import { assignedItem, ownWorks, workHref } from "@/lib/labs/assignment-items";
import { AUTO_CHECKED_KINDS, OPEN_WORK_KINDS } from "@/lib/labs/registry";
import { listAttachments } from "@/lib/services/attachments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/misc";
import { HandIn } from "@/components/assignments/hand-in";
import { STATUS_TONE } from "@/components/assignments/review-board";
import { AttachmentPanel } from "@/components/labs/shared/attachment-panel";

export async function generateMetadata() {
  return pageTitle((p) => p.assignment);
}

/** Kinds completed by doing the activity in its lab (the lab updates the status). */
const LAB_DRIVEN = ["experiment", "library"];

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let data;
  try {
    markStarted(id, user.id);
    data = getAssignmentForStudent(id, user.id);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { dict, locale } = await getDictionary();
  const a = dict.labs.assignments;
  const { assignment, recipient, overdue } = data;
  const item = assignedItem(assignment.kind, assignment.refId, locale);
  const auto = AUTO_CHECKED_KINDS.includes(assignment.kind);
  const openWork = OPEN_WORK_KINDS.includes(assignment.kind) && assignment.kind !== "custom";
  const labDriven = LAB_DRIVEN.includes(assignment.kind);
  const work = workHref(assignment.kind, assignment.refId, recipient.workRef, user.id);
  const reviewed = recipient.status === "reviewed";
  const handedIn = ["submitted", "completed", "reviewed"].includes(recipient.status);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link href="/student/assignments" className="hover:underline">
            {a.title}
          </Link>
        }
        title={assignment.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{a.kinds[assignment.kind]}</Badge>
            <span>{fmt(dict.labs.common.assignedBy, { name: assignment.teacherName })}</span>
            {assignment.dueAt ? <span className={overdue ? "font-semibold text-danger" : undefined}>· {fmt(dict.labs.common.due, { date: formatDateTime(locale, assignment.dueAt) })}</span> : null}
          </span>
        }
        actions={<Badge tone={overdue ? "danger" : STATUS_TONE[recipient.status]}>{overdue ? dict.labs.common.overdue : a.status[recipient.status]}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="space-y-3 p-5">
            {assignment.instructions ? <p className="text-[15px] leading-relaxed whitespace-pre-line">{assignment.instructions}</p> : null}
            {item ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-muted/40 px-4 py-3">
                {item.title ? <p className="min-w-0 font-medium">{item.title}</p> : null}
                <ButtonLink href={item.href} data-testid="open-activity" className="shrink-0">
                  {item.title ? a.openActivity : a.createInLab}
                  <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
              </div>
            ) : null}
            {auto ? <p className="text-sm text-ink-muted">{a.autoChecked}</p> : null}
          </Card>
          {recipient.feedback ? (
            <Card className="border-brand/25 p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquareText aria-hidden className="size-4.5 text-brand" />
                {fmt(a.feedbackFrom, { name: assignment.teacherName })}
              </h2>
              <p className="mt-2 text-[15px] whitespace-pre-line">{recipient.feedback}</p>
              {recipient.status === "revision" ? <Notice tone="warn" className="mt-3">{a.status.revision}</Notice> : null}
            </Card>
          ) : null}
          {!auto && !labDriven && !reviewed ? (
            <Card className="p-5">
              <HandIn
                assignmentId={id}
                works={openWork ? ownWorks(assignment.kind, user.id, assignment.refId) : null}
                needsWork={openWork}
                initial={{ text: recipient.response.text, link: recipient.response.link, workRef: recipient.workRef }}
                resubmit={handedIn}
              />
            </Card>
          ) : null}
          {assignment.kind === "custom" ? (
            <Card className="p-5">
              <AttachmentPanel targetKind="assignment" targetId={`${id}:${user.id}`} initial={listAttachments("assignment", `${id}:${user.id}`)} canEdit={!reviewed} />
            </Card>
          ) : null}
        </div>
        <Card className="h-fit space-y-2 p-5 text-sm">
          <p>
            <span className="text-ink-muted">{a.status[recipient.status]}</span>
            {recipient.submittedAt ? <span className="text-ink-muted"> · {fmt(a.handedInAt, { when: formatDateTime(locale, recipient.submittedAt) })}</span> : null}
          </p>
          {recipient.score !== null && recipient.maxScore ? (
            <p className="text-2xl font-semibold tabular-nums">
              {recipient.score}/{recipient.maxScore}
            </p>
          ) : null}
          {recipient.response.workTitle ? <p className="font-medium">{recipient.response.workTitle}</p> : null}
          {work ? (
            <Link href={work} className="inline-block font-medium text-brand hover:underline">
              {a.viewWork}
            </Link>
          ) : null}
        </Card>
      </div>
    </PageContainer>
  );
}
