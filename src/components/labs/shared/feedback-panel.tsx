"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export interface FeedbackView {
  id: string;
  authorName: string;
  body: string;
  createdAt: number;
}

/** Teacher comments on a piece of work. Students read; staff can add. */
export function FeedbackPanel({
  targetKind,
  targetId,
  initial,
  canWrite,
}: {
  targetKind: "research" | "stem_project" | "stem_record" | "portfolio" | "ct_attempt" | "university";
  targetId: string;
  initial: FeedbackView[];
  canWrite: boolean;
}) {
  const { dict } = useI18n();
  const c = dict.labs.common;
  const [items, setItems] = useState(initial);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ feedback: FeedbackView }>("/api/feedback", { body: { targetKind, targetId, body } });
      setItems((list) => [...list, res.feedback]);
      setBody("");
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3" aria-label={c.teacherFeedback}>
      <h3 className="flex items-center gap-2 font-semibold">
        <MessageSquareText aria-hidden className="size-4.5 text-brand" />
        {c.teacherFeedback}
      </h3>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((f) => (
            <li key={f.id} className="rounded-xl border border-brand/20 bg-brand-soft/40 px-4 py-3">
              <p className="text-[15px] whitespace-pre-line">{f.body}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                {f.authorName} · {relativeTime(dict, f.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{c.noFeedback}</p>
      )}
      {canWrite ? (
        <div className="space-y-2">
          <Textarea aria-label={c.leaveFeedback} placeholder={dict.labs.assignments.feedbackPlaceholder} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <Button size="sm" onClick={send} disabled={busy || !body.trim()}>
            {c.sendFeedback}
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </section>
  );
}
