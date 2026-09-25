import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Radio, ShieldAlert } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { findExperiment } from "@/lib/labs/stem/experiments";
import { experimentRecordSchema, getRecord, itemClassRecords } from "@/lib/labs/stem/service";
import { listAttachments } from "@/lib/services/attachments";
import { listFeedback } from "@/lib/services/feedback";
import { findPortfolioItemBySource } from "@/lib/services/portfolio";
import { isBookmarked } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";
import { ExperimentWork } from "@/components/labs/stem/experiment-work";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const e = findExperiment((await params).id);
  return { title: e ? e.title.en : "STEM Lab" };
}

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const experiment = findExperiment(id);
  if (!experiment) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const staff = isStaff(user);
  const record = staff ? null : getRecord(user.id, "experiment", id);
  const parsed = record ? experimentRecordSchema.safeParse(record.data) : null;
  const classRecords = staff ? itemClassRecords("experiment", id) : [];

  const list = (title: string, items: typeof experiment.objectives, ordered = false) => {
    const Tag = ordered ? "ol" : "ul";
    return (
      <section>
        <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{title}</h2>
        <Tag className={`mt-2 space-y-1.5 pl-5 text-[15px] ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((x, i) => (
            <li key={i}>{tr(x, locale)}</li>
          ))}
        </Tag>
      </section>
    );
  };

  return (
    <PageContainer wide>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={tr(experiment.title, locale)}
        lead={
          <span className="block space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <ModeBadge mode="experiment" label={s.modes.experiment} />
              <span>
                {s.subjects[experiment.subject]} · {fmt(s.grades, { from: experiment.grades[0], to: experiment.grades[1] })} · {fmt(s.minutes, { n: experiment.minutes })}
              </span>
            </span>
            <span className="block">{tr(experiment.summary, locale)}</span>
          </span>
        }
        actions={
          <>
            <BookmarkButton kind="experiment" refId={id} initial={isBookmarked(user.id, "experiment", id)} size="md" />
            {staff ? (
              <>
                <ButtonLink href={`/teacher/assignments/new?kind=experiment&ref=${id}`} variant="secondary">
                  <ClipboardList aria-hidden className="size-4" />
                  {dict.labs.common.assign}
                </ButtonLink>
                <ButtonLink href={`/teacher/sessions/labs?add=experiment:${id}`} variant="secondary">
                  <Radio aria-hidden className="size-4" />
                  {dict.labs.common.useInClass}
                </ButtonLink>
              </>
            ) : null}
          </>
        }
      />
      {staff ? null : <AssignmentBanner assignments={openAssignmentsFor(user.id, "experiment", id)} dict={dict} locale={locale} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="h-fit space-y-5 p-5 lg:sticky lg:top-20">
          {list(s.objectives, experiment.objectives)}
          {list(s.materials, experiment.materials)}
          <section className="rounded-xl border border-warn/30 bg-warn-soft/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-warn uppercase">
              <ShieldAlert aria-hidden className="size-4" />
              {s.safety}
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              {experiment.safety.map((x, i) => (
                <li key={i}>{tr(x, locale)}</li>
              ))}
            </ul>
          </section>
          {list(s.procedure, experiment.procedure, true)}
          {staff ? (
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{s.expected}</h2>
              <p className="mt-2 text-[15px]">{tr(experiment.expected, locale)}</p>
            </section>
          ) : null}
        </Card>
        <div className="min-w-0">
          {staff ? (
            <Card>
              <CardHeader title={s.studentsWorked} />
              {classRecords.length ? (
                <ul className="divide-y divide-line">
                  {classRecords.map((r) => (
                    <li key={r.id}>
                      <Link href={`/labs/stem/records/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                        <span>
                          <span className="font-medium">{r.userName}</span>
                          <span className="text-sm text-ink-muted"> · {relativeTime(dict, r.updatedAt)}</span>
                        </span>
                        <Badge tone={r.status === "submitted" ? "success" : "neutral"}>{s.recordStatus[r.status]}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-ink-muted">{s.noStudentWork}</p>
              )}
            </Card>
          ) : (
            <ExperimentWork
              experimentId={id}
              columns={experiment.table.columns}
              rows={experiment.table.rows}
              predictionPrompt={experiment.prediction}
              observationsPrompt={experiment.observationsPrompt}
              reflection={experiment.reflection}
              record={record && parsed?.success ? { id: record.id, data: parsed.data, status: record.status, updatedAt: record.updatedAt } : null}
              expected={record?.status === "submitted" ? experiment.expected : null}
              attachments={record ? listAttachments("stem_record", record.id) : []}
              feedback={record ? listFeedback("stem_record", record.id) : []}
              inPortfolio={record ? findPortfolioItemBySource(user.id, "stem_record", record.id) !== null : false}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
