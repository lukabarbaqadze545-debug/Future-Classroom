"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { CheckCircle2, Coffee, Hourglass, Lock, PartyPopper, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, ClientApiError, errorMessage } from "@/lib/client/api";
import type { StudentSessionView } from "@/lib/services/sessions";
import type { HintResult } from "@/lib/ai/hint-service";
import type { Answer } from "@/lib/domain/schemas";
import { isAnswerEmpty } from "@/lib/domain/grading";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Stat } from "@/components/ui/misc";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useLiveState } from "./use-live-state";
import { ConnectionBadge } from "./connection-badge";
import { Countdown } from "./countdown";
import { AnswerInput } from "./answer-input";
import { HintPanel } from "./hint-panel";
import { ResultBars } from "./result-bars";

type View = StudentSessionView & { unlockedHints: HintResult[] };
const EMPTY: Answer = { optionIds: [], text: "" };

function draftKey(sessionId: string, activityId: string) {
  return `fc:draft:${sessionId}:${activityId}`;
}

function loadDraft(sessionId: string, activityId: string): Answer | null {
  try {
    const raw = window.localStorage.getItem(draftKey(sessionId, activityId));
    return raw ? (JSON.parse(raw) as Answer) : null;
  } catch {
    return null;
  }
}

function saveDraft(sessionId: string, activityId: string, answer: Answer) {
  try {
    window.localStorage.setItem(draftKey(sessionId, activityId), JSON.stringify(answer));
  } catch {
    // Storage may be unavailable (private mode); drafts are a convenience only.
  }
}

/** An answer that could not be sent yet (no connection). Kept across reloads. */
interface QueuedAnswer {
  activityId: string;
  answer: Answer;
  submissionId: string;
}

function queueKey(sessionId: string) {
  return `fc:queued:${sessionId}`;
}

function loadQueued(sessionId: string): QueuedAnswer | null {
  try {
    const raw = window.localStorage.getItem(queueKey(sessionId));
    return raw ? (JSON.parse(raw) as QueuedAnswer) : null;
  } catch {
    return null;
  }
}

function storeQueued(sessionId: string, queued: QueuedAnswer | null) {
  try {
    if (queued) window.localStorage.setItem(queueKey(sessionId), JSON.stringify(queued));
    else window.localStorage.removeItem(queueKey(sessionId));
  } catch {
    // Without storage the queue still lives in memory until the page closes.
  }
}

/** Failures worth retrying: the request never reached the server or the server is restarting. */
function isTransient(error: unknown): boolean {
  return error instanceof ClientApiError && (error.code === "network" || error.status === 502 || error.status === 503 || error.status === 504);
}

function newSubmissionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** A student's screen during a live classroom session. */
export function StudentSession({ initial, signedIn }: { initial: View; signedIn: boolean }) {
  const { dict } = useI18n();
  const s = dict.session;
  const sessionId = initial.session.id;
  const { data, refetch, connection, clockOffset } = useLiveState<View>({
    stateUrl: `/api/sessions/${sessionId}/me`,
    eventsUrl: `/api/sessions/${sessionId}/events`,
    initial,
    versionOf: (v) => v.session.version,
  });
  const view = data ?? initial;
  const current = view.current;
  const promptId = useId();

  const [answer, setAnswer] = useState<Answer>(EMPTY);
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<HintResult[]>(initial.unlockedHints);
  const [queued, setQueued] = useState<QueuedAnswer | null>(null);
  const [sentLate, setSentLate] = useState(false);

  // When a new activity arrives: restore the local draft or the submitted answer.
  const currentId = current?.id ?? null;
  if (currentId !== answerFor) {
    setAnswerFor(currentId);
    setEditing(false);
    setError(null);
    setAnswer(current?.myResponse?.answer ?? EMPTY);
  }
  useEffect(() => {
    if (!currentId || current?.myResponse) return;
    const draft = loadDraft(sessionId, currentId);
    // Restoring an unsent draft from localStorage (an external store) after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setAnswer(draft);
    // Only when the activity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, sessionId]);

  // Keep unlocked hints in sync with the server (e.g. after a reload).
  const serverHints = view.unlockedHints;
  const [hintsFor, setHintsFor] = useState<string | null>(currentId);
  if (hintsFor !== currentId || serverHints.length > hints.length) {
    setHintsFor(currentId);
    setHints(serverHints);
  }

  const updateAnswer = (next: Answer) => {
    setAnswer(next);
    if (currentId) saveDraft(sessionId, currentId, next);
  };

  const send = useCallback(
    (item: QueuedAnswer) => api(`/api/sessions/${sessionId}/respond`, { body: { activityId: item.activityId, answer: item.answer, submissionId: item.submissionId } }),
    [sessionId],
  );

  const submit = async () => {
    if (!current || isAnswerEmpty(answer)) return;
    const item: QueuedAnswer = { activityId: current.id, answer, submissionId: newSubmissionId() };
    setSubmitting(true);
    setError(null);
    setSentLate(false);
    try {
      await send(item);
      setQueued(null);
      storeQueued(sessionId, null);
      setEditing(false);
      await refetch();
    } catch (e) {
      if (isTransient(e)) {
        // Keep the answer and send it as soon as the server can be reached.
        setQueued(item);
        storeQueued(sessionId, item);
      } else {
        setError(errorMessage(dict, e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // An answer queued before a reload is picked up again.
  useEffect(() => {
    const saved = loadQueued(sessionId);
    // Restoring a queued answer from localStorage (an external store) after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setQueued(saved);
  }, [sessionId]);

  // Retry a queued answer every few seconds and as soon as the browser is back online.
  useEffect(() => {
    if (!queued) return;
    let stopped = false;
    const attempt = async () => {
      try {
        await send(queued);
        if (stopped) return;
        setQueued(null);
        storeQueued(sessionId, null);
        setSentLate(true);
        setEditing(false);
        await refetch();
      } catch (e) {
        if (stopped || isTransient(e)) return;
        // The activity closed meanwhile (or the answer was refused): stop retrying and say why.
        setQueued(null);
        storeQueued(sessionId, null);
        setError(errorMessage(dict, e));
      }
    };
    const timer = setInterval(() => void attempt(), 4000);
    window.addEventListener("online", attempt);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("online", attempt);
    };
  }, [queued, send, sessionId, refetch, dict]);

  const requestHint = async () => {
    if (!current) return;
    setError(null);
    try {
      const { hint } = await api<{ hint: HintResult }>(`/api/sessions/${sessionId}/hint`, { body: { activityId: current.id } });
      setHints((prev) => [...prev.filter((h) => h.level !== hint.level), hint].sort((a, b) => a.level - b.level));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  const response = current?.myResponse ?? null;
  const locked = !current || current.state !== "open" || view.session.paused;
  const showForm = current && (!response || editing || response.isCorrect === false);
  const resultTone = response?.isCorrect === true ? "success" : response?.isCorrect === false ? "warn" : "info";

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo label={dict.common.appName} compact href={signedIn ? "/student" : "/"} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{view.session.title}</p>
            <p className="text-xs text-ink-muted">{fmt(s.joinedAs, { name: view.participant.name })}</p>
          </div>
          <ConnectionBadge state={connection} />
          <LanguageSwitcher />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        {error ? <Notice tone="danger" className="mb-4">{error}</Notice> : null}
        {queued ? (
          <div className="mb-4" data-testid="answer-queued">
            <Notice tone="warn">{s.queued}</Notice>
          </div>
        ) : sentLate ? (
          <div className="mb-4" data-testid="answer-sent-late">
            <Notice tone="success">{s.sentAfterReconnect}</Notice>
          </div>
        ) : null}

        {view.session.status === "ended" && view.summary ? (
          <div className="fc-fade-in rounded-3xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)] sm:p-10" data-testid="session-ended">
            <PartyPopper aria-hidden className="mx-auto size-10 text-brand" />
            <h1 className="mt-4 text-2xl font-semibold">{s.endedTitle}</h1>
            <p className="mt-1 text-ink-muted">{s.endedText}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label={s.endedAnswered} value={view.summary.answered} />
              <Stat label={s.endedCorrect} value={view.summary.graded ? `${view.summary.correct}/${view.summary.graded}` : "—"} />
              <Stat label={s.endedHints} value={view.summary.hintsUsed} />
            </div>
            <ButtonLink href={signedIn ? "/student" : "/"} size="lg" className="mt-8">
              {s.endedCta}
            </ButtonLink>
          </div>
        ) : !current ? (
          <div className="fc-fade-in flex flex-col items-center rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-[var(--shadow-card)]" data-testid="waiting-screen">
            <Hourglass aria-hidden className="fc-pulse size-10 text-brand" />
            <h1 className="mt-4 text-2xl font-semibold">{s.waitingTitle}</h1>
            <p className="mt-1 text-ink-muted">{s.waitingText}</p>
          </div>
        ) : (
          <div className="space-y-5" key={current.id}>
            <section className="fc-fade-in rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8" data-testid="student-activity">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{dict.activityTypes[current.type]}</Badge>
                  {current.title ? <span className="text-sm font-medium text-ink-muted">{current.title}</span> : null}
                </div>
                {current.timerEndsAt && current.state === "open" ? <Countdown endsAt={current.timerEndsAt} clockOffset={clockOffset} label={s.timeLeft} /> : null}
              </div>
              <h1 id={promptId} className="fc-prose mt-4 text-2xl leading-snug font-semibold sm:text-[28px]">
                {current.prompt}
              </h1>

              <div className="mt-6">
                <AnswerInput
                  type={current.type}
                  options={current.options}
                  value={answer}
                  onChange={updateAnswer}
                  disabled={locked || Boolean(response && !editing && response.isCorrect !== false)}
                  correctOptionIds={current.results?.correctOptionIds ?? []}
                  labelId={promptId}
                  onSubmit={submit}
                />
              </div>

              {response && !editing ? (
                <Notice tone={resultTone} className="mt-5" title={response.isCorrect === true ? s.correct : response.isCorrect === false ? s.incorrect : s.received}>
                  {response.attempts > 1 ? fmt(s.attempts, { n: response.attempts }) : null}
                </Notice>
              ) : null}

              {current.explanation ? (
                <div className="mt-4 rounded-xl bg-success-soft/60 p-4">
                  <p className="text-sm font-semibold text-success">{s.explanation}</p>
                  <p className="fc-prose mt-1">{current.explanation}</p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {current.state !== "open" ? (
                  <p className="flex items-center gap-2 text-ink-muted">
                    <Lock aria-hidden className="size-4" />
                    {s.closed}
                  </p>
                ) : showForm ? (
                  <Button size="lg" onClick={submit} disabled={submitting || locked || isAnswerEmpty(answer)} data-testid="submit-answer">
                    {submitting ? s.submitting : response ? s.resubmit : s.submit}
                  </Button>
                ) : response && response.isCorrect === null ? (
                  <Button size="lg" variant="secondary" onClick={() => setEditing(true)}>
                    {s.resubmit}
                  </Button>
                ) : null}
                {response && !editing ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                    {response.isCorrect === false ? <XCircle aria-hidden className="size-4 text-warn" /> : <CheckCircle2 aria-hidden className="size-4 text-success" />}
                    {s.submitted}
                  </span>
                ) : null}
              </div>
            </section>

            {current.type !== "poll" && response?.isCorrect !== true ? (
              <HintPanel hints={hints} maxLevel={current.hints.maxLevel} onRequest={requestHint} disabled={current.state !== "open"} />
            ) : null}

            {current.revealed && current.results ? (
              <section className="fc-fade-in rounded-3xl border border-line bg-surface p-5 sm:p-8" data-testid="class-results">
                <h2 className="text-lg font-semibold">{s.classResults}</h2>
                {current.results.distribution.length ? (
                  <div className="mt-4">
                    <ResultBars distribution={current.results.distribution} showCorrect={current.type === "multiple_choice"} correctLabel={s.correctAnswer} />
                  </div>
                ) : null}
                {current.results.correctAnswer ? (
                  <p className="mt-4">
                    <span className="font-semibold">{s.correctAnswer}: </span>
                    <span className="font-mono">{current.results.correctAnswer}</span>
                  </p>
                ) : null}
                {current.results.correctPercent !== null ? (
                  <p className="mt-2 text-sm text-ink-muted">{fmt(dict.teacher.console.correctRate, { n: current.results.correctPercent })}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        )}

        {view.session.paused && view.session.status !== "ended" ? (
          <div role="alertdialog" aria-modal="true" aria-labelledby="paused-title" className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
            <div className="max-w-md rounded-3xl bg-surface p-8 text-center shadow-[var(--shadow-raised)]">
              <Coffee aria-hidden className="mx-auto size-10 text-brand" />
              <h2 id="paused-title" className="mt-4 text-2xl font-semibold">
                {s.pausedTitle}
              </h2>
              <p className="mt-1 text-ink-muted">{s.pausedText}</p>
            </div>
          </div>
        ) : null}

        <p className="mt-10 text-center text-sm text-ink-subtle">
          <Link href="/privacy" className="hover:underline">
            {dict.nav.privacy}
          </Link>
        </p>
      </main>
    </div>
  );
}
