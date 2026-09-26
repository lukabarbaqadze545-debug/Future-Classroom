"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { nextReviewStatus, reviewSteps, type ReviewEntry, type ReviewStatus } from "@/lib/domain/review";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

/** The review steps of one lesson, the next action and the history. Staff only. */
export function ReviewPanel({ lessonId, language, status: initialStatus, history: initialHistory }: { lessonId: string; language: string; status: ReviewStatus; history: ReviewEntry[] }) {
  const { dict, locale } = useI18n();
  const r = dict.review;
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [history, setHistory] = useState(initialHistory);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = reviewSteps(language);
  const reached = steps.indexOf(status);
  const next = nextReviewStatus(status, language);

  const save = async (target: ReviewStatus) => {
    if (target === "draft" && !note.trim()) {
      setError(r.noteRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ reviewStatus: ReviewStatus; history: ReviewEntry[] }>(`/api/lessons/${lessonId}/review`, { body: { status: target, note } });
      setStatus(res.reviewStatus);
      setHistory(res.history);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card data-testid="review-panel">
      <CardHeader title={r.title} />
      <div className="space-y-4 px-5 pb-5">
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3" data-testid="review-step" data-state={i <= reached ? "done" : "todo"}>
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  i < reached || (i === reached && step !== "draft") ? "border-success bg-success text-white" : i === reached ? "border-brand text-brand" : "border-line-strong text-ink-subtle",
                )}
                aria-hidden
              >
                {i < reached || (i === reached && step !== "draft") ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm", i === reached ? "font-semibold" : "text-ink-muted")}>{r.status[step]}</span>
                {i === reached + 1 ? <span className="block text-xs text-ink-muted">{r.stepHelp[step]}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        {language !== "ka" ? <p className="text-xs text-ink-subtle">{r.languageOnlyKa}</p> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field label={r.note}>{(ids) => <Textarea {...ids} rows={2} value={note} maxLength={1000} placeholder={r.notePlaceholder} onChange={(e) => setNote(e.target.value)} data-testid="review-note" />}</Field>
        <div className="flex flex-wrap gap-2">
          {next ? (
            <Button onClick={() => save(next)} disabled={busy} data-testid="review-next">
              <Check aria-hidden className="size-4" />
              {fmt(r.markAs, { status: r.status[next] })}
            </Button>
          ) : null}
          {status !== "draft" ? (
            <Button variant="ghost" onClick={() => save("draft")} disabled={busy} data-testid="review-send-back">
              <Undo2 aria-hidden className="size-4" />
              {r.sendBack}
            </Button>
          ) : null}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{r.history}</h3>
          {history.length ? (
            <ul className="space-y-2 text-sm" data-testid="review-history">
              {history.map((h) => (
                <li key={h.id} className="rounded-lg bg-muted/50 px-3 py-2">
                  <span className="font-medium">{h.kind === "edited" ? r.edited : r.status[h.status]}</span>
                  <span className="block text-xs text-ink-muted">
                    {[h.userName, formatDateTime(locale, h.createdAt)].filter(Boolean).join(" · ")}
                  </span>
                  {h.note ? <span className="mt-1 block whitespace-pre-line">{h.note}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">{r.noHistory}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
