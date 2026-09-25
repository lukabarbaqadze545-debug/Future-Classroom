import { notFound } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { findExperiment } from "@/lib/labs/stem/experiments";
import { findSimulation } from "@/lib/labs/stem/simulations";
import { experimentRecordSchema, findChallengeSet, getRecordFor } from "@/lib/labs/stem/service";
import { ApiError } from "@/lib/http/errors";
import { listAttachments } from "@/lib/services/attachments";
import { listFeedback } from "@/lib/services/feedback";
import { PageContainer } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { AttachmentPanel } from "@/components/labs/shared/attachment-panel";
import { FeedbackPanel } from "@/components/labs/shared/feedback-panel";
import { ExperimentRecord } from "@/components/labs/stem/experiment-record";

export const metadata = { title: "STEM record" };

/** Read-only view of a student's STEM record, with teacher feedback. */
export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let record;
  try {
    record = getRecordFor(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const experiment = record.itemKind === "experiment" ? findExperiment(record.itemId) : null;
  const title = experiment?.title ?? (record.itemKind === "simulation" ? findSimulation(record.itemId)?.title : findChallengeSet(record.itemId)?.title);
  const parsed = experiment ? experimentRecordSchema.safeParse(record.data) : null;
  return (
    <PageContainer>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={title ? tr(title, locale) : record.itemId}
        lead={`${record.userName} · ${s.recordStatus[record.status]} · ${formatDateTime(locale, record.updatedAt)}${record.score !== null ? ` · ${fmt(s.bestScore, { score: record.score, max: record.maxScore ?? 0 })}` : ""}`}
      />
      {experiment && parsed?.success ? (
        <ExperimentRecord
          experimentId={experiment.id}
          columns={experiment.table.columns}
          rows={experiment.table.rows}
          predictionPrompt={experiment.prediction}
          observationsPrompt={experiment.observationsPrompt}
          reflection={experiment.reflection}
          initial={parsed.data}
          initialStatus={record.status}
          initialUpdatedAt={record.updatedAt}
          readOnly
        />
      ) : null}
      <Card className="mt-5 p-5">
        <AttachmentPanel targetKind="stem_record" targetId={id} initial={listAttachments("stem_record", id)} canEdit={false} title={s.photos} />
      </Card>
      <Card className="mt-5 p-5">
        <FeedbackPanel targetKind="stem_record" targetId={id} initial={listFeedback("stem_record", id)} canWrite={isStaff(user)} />
      </Card>
    </PageContainer>
  );
}
