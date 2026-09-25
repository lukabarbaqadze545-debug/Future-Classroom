"use client";

import { useState } from "react";
import { Plus, Minus, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { relativeTime, fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr, type L } from "@/lib/labs/localized";
import type { ExperimentRecordData } from "@/lib/labs/stem/service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { useLocalJsonDraft } from "../use-local-draft";

/** A student's experiment record: prediction, data table, observations, conclusion and reflection. */
export function ExperimentRecord({
  experimentId,
  columns,
  rows,
  predictionPrompt,
  observationsPrompt,
  reflection,
  initial,
  initialStatus,
  initialUpdatedAt,
  onSaved,
  readOnly,
}: {
  experimentId: string;
  columns: L[];
  rows: number;
  predictionPrompt: L;
  observationsPrompt: L;
  reflection: L[];
  initial: ExperimentRecordData | null;
  initialStatus: "draft" | "submitted" | null;
  initialUpdatedAt: number | null;
  onSaved?: (record: { id: string; status: "draft" | "submitted" }, expected: L | null) => void;
  readOnly?: boolean;
}) {
  const { dict, locale } = useI18n();
  const s = dict.labs.stem;
  const empty: ExperimentRecordData = {
    prediction: "",
    table: Array.from({ length: rows }, () => columns.map(() => "")),
    observations: "",
    conclusion: "",
    reflection: reflection.map(() => ""),
  };
  const [serverData, setServerData] = useState<ExperimentRecordData>(initial ?? empty);
  const [draft, setDraft, clearDraft, unsaved] = useLocalJsonDraft<ExperimentRecordData>(`stem:exp:${experimentId}`, serverData);
  const data = readOnly ? serverData : draft;
  const [status, setStatus] = useState(initialStatus);
  const [savedAt, setSavedAt] = useState(initialUpdatedAt);
  const [busy, setBusy] = useState<null | "save" | "submit">(null);
  const [error, setError] = useState("");
  const set = (patch: Partial<ExperimentRecordData>) => setDraft({ ...data, ...patch });

  async function save(submit: boolean) {
    setBusy(submit ? "submit" : "save");
    setError("");
    try {
      const res = await api<{ record: { id: string; status: "draft" | "submitted"; updatedAt: number }; expected: L | null }>(`/api/labs/stem/experiments/${experimentId}`, {
        body: { data, submit },
      });
      setStatus(res.record.status);
      setSavedAt(res.record.updatedAt);
      setServerData(data);
      clearDraft();
      onSaved?.(res.record, res.expected);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <fieldset disabled={readOnly} className="space-y-5" data-testid="experiment-record">
      <Card className="p-5">
        <Field label={`${s.prediction}: ${tr(predictionPrompt, locale)}`}>{(ids) => <Textarea {...ids} rows={3} value={data.prediction} onChange={(e) => set({ prediction: e.target.value })} />}</Field>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h3 className="font-semibold">{s.dataTable}</h3>
          {!readOnly ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => set({ table: [...data.table, columns.map(() => "")] })} disabled={data.table.length >= 30}>
                <Plus aria-hidden className="size-4" />
                {s.addRow}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => set({ table: data.table.slice(0, -1) })} disabled={data.table.length <= 1}>
                <Minus aria-hidden className="size-4" />
                {s.removeRow}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                {columns.map((c, j) => (
                  <th key={j} scope="col" className="px-3 py-2 font-medium">
                    {tr(c, locale)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.table.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {columns.map((c, j) => (
                    <td key={j} className="px-2 py-1.5">
                      <input
                        aria-label={`${tr(c, locale)} ${i + 1}`}
                        value={row[j] ?? ""}
                        maxLength={200}
                        onChange={(e) => set({ table: data.table.map((r, ri) => (ri === i ? columns.map((_, cj) => (cj === j ? e.target.value : (r[cj] ?? ""))) : r)) })}
                        className="h-10 w-full rounded-lg border border-line bg-surface px-2.5 tabular-nums focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="space-y-4 p-5">
        <Field label={`${s.observations}: ${tr(observationsPrompt, locale)}`}>{(ids) => <Textarea {...ids} rows={4} value={data.observations} onChange={(e) => set({ observations: e.target.value })} />}</Field>
        <Field label={s.conclusion} hint={s.conclusionHelp}>
          {(ids) => <Textarea {...ids} rows={4} value={data.conclusion} onChange={(e) => set({ conclusion: e.target.value })} data-testid="experiment-conclusion" />}
        </Field>
      </Card>
      <Card className="space-y-4 p-5">
        <h3 className="font-semibold">{s.reflection}</h3>
        {reflection.map((q, i) => (
          <Field key={i} label={tr(q, locale)}>
            {(ids) => <Textarea {...ids} rows={2} value={data.reflection[i] ?? ""} onChange={(e) => set({ reflection: reflection.map((_, k) => (k === i ? e.target.value : (data.reflection[k] ?? ""))) })} />}
          </Field>
        ))}
      </Card>
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg" onClick={() => save(false)} disabled={busy !== null}>
            {busy === "save" ? dict.common.saving : s.saveDraft}
          </Button>
          <Button size="lg" onClick={() => save(true)} disabled={busy !== null} data-testid="submit-experiment">
            <Send aria-hidden className="size-4" />
            {status === "submitted" ? dict.labs.common.resubmit : s.submitRecord}
          </Button>
          <span className="text-sm text-ink-muted">
            {unsaved ? s.unsaved : status ? `${s.recordStatus[status]}${savedAt ? ` · ${fmt(s.lastSaved, { when: relativeTime(dict, savedAt) })}` : ""}` : null}
          </span>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </fieldset>
  );
}
