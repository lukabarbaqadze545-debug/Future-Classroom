"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { tr, type L } from "@/lib/labs/localized";
import type { ExperimentRecordData } from "@/lib/labs/stem/service";
import { Card } from "@/components/ui/card";
import { AttachmentPanel, type AttachmentView } from "../shared/attachment-panel";
import { FeedbackPanel, type FeedbackView } from "../shared/feedback-panel";
import { PortfolioButton } from "../shared/portfolio-button";
import { ExperimentRecord } from "./experiment-record";

export function ExperimentWork(props: {
  experimentId: string;
  columns: L[];
  rows: number;
  predictionPrompt: L;
  observationsPrompt: L;
  reflection: L[];
  record: { id: string; data: ExperimentRecordData; status: "draft" | "submitted"; updatedAt: number } | null;
  expected: L | null;
  attachments: AttachmentView[];
  feedback: FeedbackView[];
  inPortfolio: boolean;
}) {
  const { dict, locale } = useI18n();
  const s = dict.labs.stem;
  const [recordId, setRecordId] = useState(props.record?.id ?? null);
  const [status, setStatus] = useState(props.record?.status ?? null);
  const [expected, setExpected] = useState(props.expected);

  return (
    <div className="space-y-5">
      <ExperimentRecord
        experimentId={props.experimentId}
        columns={props.columns}
        rows={props.rows}
        predictionPrompt={props.predictionPrompt}
        observationsPrompt={props.observationsPrompt}
        reflection={props.reflection}
        initial={props.record?.data ?? null}
        initialStatus={props.record?.status ?? null}
        initialUpdatedAt={props.record?.updatedAt ?? null}
        onSaved={(record, exp) => {
          setRecordId(record.id);
          setStatus(record.status);
          if (exp) setExpected(exp);
        }}
      />
      {expected ? (
        <Card className="border-success/30 p-5" data-testid="expected-results">
          <h3 className="flex items-center gap-2 font-semibold">
            <Lightbulb aria-hidden className="size-4.5 text-warn" />
            {s.expected}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed">{tr(expected, locale)}</p>
        </Card>
      ) : (
        <p className="text-sm text-ink-muted">{s.expectedHidden}</p>
      )}
      <Card className="p-5">
        {recordId ? <AttachmentPanel targetKind="stem_record" targetId={recordId} initial={props.attachments} canEdit title={s.photos} /> : <p className="text-sm text-ink-muted">{s.photosAfterSave}</p>}
      </Card>
      {recordId ? (
        <Card className="space-y-4 p-5">
          <FeedbackPanel targetKind="stem_record" targetId={recordId} initial={props.feedback} canWrite={false} />
          {status === "submitted" ? <PortfolioButton kind="stem_record" id={recordId} initial={props.inPortfolio} /> : null}
        </Card>
      ) : null}
    </div>
  );
}
