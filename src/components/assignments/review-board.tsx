"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { RecipientRecord, RecipientStatus } from "@/lib/services/assignments";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export const STATUS_TONE: Record<RecipientStatus, Tone> = {
  assigned: "neutral",
  in_progress: "brand",
  submitted: "warn",
  completed: "success",
  reviewed: "success",
  revision: "danger",
};

/** The teacher's review table. Polls for new hand-ins so it stays current during a lesson. */
export function ReviewBoard({
  assignmentId,
  initial,
  workLinks,
  dueAt,
}: {
  assignmentId: string;
  initial: RecipientRecord[];
  workLinks: Record<string, string | null>;
  dueAt: number | null;
}) {
  const { dict } = useI18n();
  const a = dict.labs.assignments;
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [links, setLinks] = useState(workLinks);

  useEffect(() => {
    let stopped = false;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await api<{ recipients: RecipientRecord[]; links: Record<string, string | null> }>(`/api/assignments/${assignmentId}/recipients`);
        if (!stopped) {
          setRows(res.recipients);
          setLinks(res.links);
        }
      } catch {
        // Offline for a moment: keep showing the last known state.
      }
    }, 10000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [assignmentId]);

  async function review(studentId: string, status: "reviewed" | "revision") {
    setError("");
    try {
      const res = await api<{ recipient: RecipientRecord }>(`/api/assignments/${assignmentId}/review`, { body: { studentId, feedback, status } });
      setRows((list) => list.map((r) => (r.studentId === studentId ? res.recipient : r)));
      setOpen(null);
      setFeedback("");
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  return (
    <Card className="overflow-hidden" data-testid="review-board">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw aria-hidden className="size-3.5" />
          {a.liveRefresh}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => {
          const late = dueAt !== null && r.submittedAt !== null && r.submittedAt > dueAt;
          return (
            <li key={r.studentId} className="px-5 py-3" data-testid="recipient-row">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.studentName}</p>
                  <p className="text-sm text-ink-muted">
                    {r.submittedAt ? fmt(a.handedInAt, { when: relativeTime(dict, r.submittedAt) }) : fmt(a.lastUpdate, { when: relativeTime(dict, r.updatedAt) })}
                    {late ? ` · ${dict.labs.common.overdue}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.score !== null && r.maxScore ? <span className="text-sm font-semibold tabular-nums">{`${r.score}/${r.maxScore}`}</span> : null}
                  <Badge tone={STATUS_TONE[r.status]}>{a.status[r.status]}</Badge>
                  {links[r.studentId] ? (
                    <Link href={links[r.studentId]!} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
                      <ExternalLink aria-hidden className="size-4" />
                      {a.viewWork}
                    </Link>
                  ) : null}
                  {["submitted", "completed", "reviewed", "revision"].includes(r.status) ? (
                    <Button
                      size="sm"
                      variant={r.status === "submitted" ? "primary" : "ghost"}
                      onClick={() => {
                        setOpen(open === r.studentId ? null : r.studentId);
                        setFeedback(r.feedback);
                      }}
                      data-testid="review-button"
                    >
                      {a.review}
                    </Button>
                  ) : null}
                </div>
              </div>
              {r.response.text || r.response.link ? (
                <div className="mt-2 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
                  {r.response.text ? <p className="whitespace-pre-line">{r.response.text}</p> : null}
                  {r.response.link ? (
                    <a href={r.response.link} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block break-all text-brand hover:underline">
                      {r.response.link}
                    </a>
                  ) : null}
                </div>
              ) : null}
              {r.feedback && open !== r.studentId ? <p className="mt-2 text-sm text-ink-muted">“{r.feedback}”</p> : null}
              {open === r.studentId ? (
                <div className="mt-3 space-y-2">
                  <Textarea aria-label={fmt(a.reviewTitle, { name: r.studentName })} rows={3} placeholder={a.feedbackPlaceholder} value={feedback} onChange={(e) => setFeedback(e.target.value)} data-testid="review-feedback" />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => review(r.studentId, "reviewed")} data-testid="mark-reviewed">
                      {a.markReviewed}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => review(r.studentId, "revision")}>
                      {a.askRevision}
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? <Notice tone="danger" className="m-4">{error}</Notice> : null}
    </Card>
  );
}
