"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronRight, CircleDot, Eye, EyeOff, Lightbulb, Lock, MonitorPlay, Pause, Play, Power, RotateCcw, Timer, Users, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { TeacherSessionView } from "@/lib/services/sessions";
import type { ControlAction } from "@/lib/services/sessions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { Meter } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";
import { useLiveState } from "./use-live-state";
import { ConnectionBadge } from "./connection-badge";
import { Countdown } from "./countdown";
import { ResultBars } from "./result-bars";


/** Live control panel for a classroom session (desktop and touchscreen). */
/** `joinUrl`: the address students type, e.g. "192.168.1.10:3000/join" (see `joinAddress`). */
export function TeacherConsole({ initial, joinUrl }: { initial: TeacherSessionView; joinUrl: string }) {
  const { dict } = useI18n();
  const c = dict.teacher.console;
  const router = useRouter();
  const sessionId = initial.session.id;
  const { data, replace, connection, clockOffset } = useLiveState<TeacherSessionView>({
    stateUrl: `/api/sessions/${sessionId}`,
    eventsUrl: `/api/sessions/${sessionId}/events`,
    initial,
    versionOf: (v) => v.session.version,
  });
  const view = data ?? initial;
  const { session, current, activities, participants } = view;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  const control = async (action: ControlAction) => {
    setBusy(true);
    setError(null);
    try {
      const next = await api<TeacherSessionView>(`/api/sessions/${sessionId}/control`, { body: action });
      replace(next);
      if (action.type === "end") router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  const pending = activities.filter((a) => a.state === "pending");
  const online = participants.filter((p) => p.online).length;
  const results = current?.results;
  const answeredPercent = results && results.participantCount ? (results.responseCount / results.participantCount) * 100 : 0;
  const correctPercent = results && results.gradedCount ? Math.round((results.correctCount / results.gradedCount) * 100) : null;

  return (
    <div className="space-y-5">
      {/* Session bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{session.title}</h1>
            {session.classLabel ? <Badge>{session.classLabel}</Badge> : null}
            <Badge tone={session.paused ? "warn" : session.status === "live" ? "success" : "neutral"} dot>
              {session.paused ? dict.status.paused : dict.status[session.status]}
            </Badge>
            <ConnectionBadge state={connection} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">{fmt(c.joinAt, { url: joinUrl })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-ink px-4 py-2 text-center text-white">
            <div className="text-[11px] tracking-wider text-white/70 uppercase">{c.code}</div>
            <div className="font-mono text-2xl font-bold tracking-widest" data-testid="join-code-display">
              {session.joinCode}
            </div>
          </div>
          <ButtonLink href={`/present/session/${sessionId}`} target="_blank" variant="secondary" size="lg">
            <MonitorPlay aria-hidden className="size-5" />
            {c.present}
          </ButtonLink>
          {session.paused ? (
            <Button variant="secondary" size="lg" onClick={() => control({ type: "resume" })} disabled={busy}>
              <Play aria-hidden className="size-5" />
              {c.resume}
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => control({ type: "pause" })} disabled={busy}>
              <Pause aria-hidden className="size-5" />
              {c.pause}
            </Button>
          )}
          <Button variant="danger" size="lg" onClick={() => setEndOpen(true)} disabled={busy} data-testid="end-session">
            <Power aria-hidden className="size-5" />
            {c.end}
          </Button>
        </div>
      </div>

      {error ? <Notice tone="danger">{error}</Notice> : null}
      {session.paused ? <Notice tone="warn">{c.paused}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[300px_1fr_260px]">
        {/* Activities */}
        <Card className="h-fit">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-semibold">{c.activities}</h2>
          </div>
          <ol className="divide-y divide-line">
            {activities.map((a, index) => {
              const isCurrent = a.id === session.currentActivityId;
              return (
                <li key={a.id} className={cn("px-4 py-3", isCurrent && "bg-brand-soft/60")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold", isCurrent ? "bg-brand text-white" : a.state === "pending" ? "bg-muted text-ink-muted" : "bg-success-soft text-success")}>
                      {a.state === "closed" && !isCurrent ? <Check aria-hidden className="size-4" /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{a.activity.title || a.activity.prompt}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {dict.activityTypes[a.activity.type]}
                        {a.state !== "pending" ? ` · ${fmtCount(c.responses, a.responseCount)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    {isCurrent ? (
                      <Badge tone="brand">{c.current}</Badge>
                    ) : a.state === "pending" ? (
                      <Button size="sm" variant="subtle" onClick={() => control({ type: "launch", activityId: a.id })} disabled={busy} data-testid="launch-activity">
                        <Play aria-hidden className="size-3.5" />
                        {c.launch}
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => control({ type: "reopen", activityId: a.id })} disabled={busy}>
                        <RotateCcw aria-hidden className="size-3.5" />
                        {c.relaunch}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Current activity */}
        <div className="min-w-0 space-y-5">
          {current ? (
            <Card className="p-5 sm:p-6" data-testid="current-activity">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{dict.activityTypes[current.activity.type]}</Badge>
                  {current.state === "closed" ? (
                    <Badge tone="neutral">
                      <Lock aria-hidden className="size-3" />
                      {dict.session.closed}
                    </Badge>
                  ) : (
                    <Badge tone="success" dot>
                      {dict.status.live}
                    </Badge>
                  )}
                  {current.revealed ? <Badge tone="ai">{c.reveal}</Badge> : null}
                </div>
                {current.timerEndsAt ? <Countdown endsAt={current.timerEndsAt} clockOffset={clockOffset} label={dict.session.timeLeft} /> : null}
              </div>
              <p className="fc-prose mt-4 text-xl leading-snug font-medium sm:text-2xl">{current.activity.prompt}</p>

              {/* Controls */}
              <div className="mt-5 flex flex-wrap gap-2">
                {pending.length ? (
                  <Button size="lg" onClick={() => control({ type: "next" })} disabled={busy} data-testid="next-activity">
                    {c.next}
                    <ChevronRight aria-hidden className="size-5" />
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" disabled>
                    {c.noNext}
                  </Button>
                )}
                {current.state === "open" ? (
                  <Button size="lg" variant="secondary" onClick={() => control({ type: "close" })} disabled={busy}>
                    <Lock aria-hidden className="size-4" />
                    {c.close}
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" onClick={() => control({ type: "reopen", activityId: current.id })} disabled={busy}>
                    <RotateCcw aria-hidden className="size-4" />
                    {c.relaunch}
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={() => control({ type: "reveal", revealed: !current.revealed })} disabled={busy} data-testid="reveal-results">
                  {current.revealed ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                  {current.revealed ? c.hideResults : c.reveal}
                </Button>
                <div className="flex items-center gap-1 rounded-xl border border-line-strong px-1">
                  <Timer aria-hidden className="ml-2 size-4 text-ink-subtle" />
                  <span className="sr-only">{c.timer}</span>
                  {[60, 120, 300].map((s) => (
                    <button key={s} type="button" className="h-10 rounded-lg px-2.5 text-sm font-medium hover:bg-muted" onClick={() => control({ type: "timer", seconds: s })} disabled={busy}>
                      {s / 60}′
                    </button>
                  ))}
                  {current.timerEndsAt ? (
                    <button type="button" className="h-10 rounded-lg px-2.5 text-sm text-ink-muted hover:bg-muted" onClick={() => control({ type: "timer", seconds: null })} aria-label={c.timerOff}>
                      <X aria-hidden className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center p-8 text-center sm:p-12">
              <Users aria-hidden className="size-10 text-brand" />
              <h2 className="mt-4 text-2xl font-semibold">{session.status === "lobby" ? c.lobbyTitle : c.noCurrent}</h2>
              {session.status === "lobby" ? <p className="mt-1 text-ink-muted">{c.lobbyText}</p> : null}
              <div className="mt-6 rounded-2xl bg-ink px-8 py-4 text-white">
                <div className="text-sm text-white/70">{fmt(c.joinAt, { url: joinUrl })}</div>
                <div className="font-mono text-5xl font-bold tracking-widest">{session.joinCode}</div>
              </div>
              {pending.length ? (
                <Button size="xl" className="mt-6" onClick={() => control({ type: "next" })} disabled={busy} data-testid="launch-first">
                  <Play aria-hidden className="size-6" />
                  {session.status === "lobby" ? c.startFirst : c.next}
                </Button>
              ) : null}
            </Card>
          )}

          {current && results ? (
            <Card className="p-5 sm:p-6" data-testid="live-results">
              <h2 className="text-lg font-semibold">{c.liveResults}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-ink-muted" data-testid="answered-count">{fmt(c.answered, { a: results.responseCount, b: results.participantCount })}</p>
                  <Meter value={answeredPercent} className="mt-2" label={fmt(c.answered, { a: results.responseCount, b: results.participantCount })} />
                </div>
                {current.gradable ? (
                  <div>
                    <p className="text-sm text-ink-muted">{correctPercent === null ? "—" : fmt(c.correctRate, { n: correctPercent })}</p>
                    <Meter value={correctPercent ?? 0} tone="success" className="mt-2" />
                  </div>
                ) : (
                  <div />
                )}
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Lightbulb aria-hidden className="size-4 text-warn" />
                  {fmtCount(c.hintsRequested, results.hintsRequested)}
                </p>
              </div>

              {results.distribution.length ? (
                <div className="mt-6">
                  <ResultBars distribution={results.distribution} showCorrect={current.activity.type === "multiple_choice"} correctLabel={c.correctMark} />
                </div>
              ) : null}

              {results.commonWrongAnswers.length ? (
                <div className="mt-6 rounded-xl border border-warn/25 bg-warn-soft/50 p-4">
                  <h3 className="text-sm font-semibold">{c.commonWrong}</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {results.commonWrongAnswers.map((w) => (
                      <li key={w.answer} className="rounded-lg bg-surface px-3 py-1.5 text-sm">
                        <span className="font-medium">{w.answer}</span> <span className="text-ink-subtle">×{w.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {current.activity.type !== "multiple_choice" && current.activity.type !== "poll" ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold">{c.answers}</h3>
                  {results.answers.length ? (
                    <ul className="mt-2 divide-y divide-line rounded-xl border border-line" data-testid="answers-list">
                      {results.answers.map((a) => (
                        <li key={a.participantId} className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5">
                          <div className="min-w-0">
                            <span className="text-sm font-medium">{a.name}</span>
                            <p className="fc-prose text-[15px]">{a.text}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs">
                            {a.isCorrect === true ? <Badge tone="success">{c.correctMark}</Badge> : a.isCorrect === false ? <Badge tone="danger">{c.incorrectMark}</Badge> : <Badge>{c.openMark}</Badge>}
                            {a.attempts > 1 ? <Badge>{fmtCount(c.attempts, a.attempts)}</Badge> : null}
                            {a.hintsUsed > 0 ? <Badge tone="warn">{fmtCount(c.hintsUsed, a.hintsUsed)}</Badge> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-muted">{c.noAnswers}</p>
                  )}
                </div>
              ) : null}

              {results.waiting.length && current.state === "open" ? (
                <p className="mt-5 text-sm text-ink-muted">
                  <span className="font-medium text-ink">{c.waitingFor}:</span> {results.waiting.join(", ")}
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>

        {/* Students */}
        <Card className="h-fit">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-semibold">{c.students}</h2>
            <span className="text-sm text-ink-muted tabular-nums" data-testid="participant-count">
              {online}/{participants.length}
            </span>
          </div>
          {participants.length ? (
            <ul className="max-h-[520px] divide-y divide-line overflow-y-auto" data-testid="console-students">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2" data-status={p.current ?? "none"}>
                  <span className="flex min-w-0 items-center gap-2">
                    <CircleDot aria-label={p.online ? c.online : c.offline} className={cn("size-3 shrink-0", p.online ? "text-success" : "text-ink-subtle")} />
                    <span className="truncate text-sm">{p.name}</span>
                  </span>
                  {p.current === "correct" ? (
                    <Badge tone="success">{c.correctMark}</Badge>
                  ) : p.current === "incorrect" ? (
                    <Badge tone="warn">{c.incorrectMark}</Badge>
                  ) : p.current === "answered" ? (
                    <Badge tone="brand">{c.statusAnswered}</Badge>
                  ) : p.current === "waiting" ? (
                    <span className="text-xs text-ink-subtle">{c.statusWaiting}</span>
                  ) : (
                    <span className={cn("text-xs", p.online ? "text-success" : "text-ink-subtle")}>{p.online ? c.online : c.offline}</span>
                  )}
                  {session.status !== "ended" ? (
                    <button
                      type="button"
                      onClick={() => setRemoving({ id: p.id, name: p.name })}
                      aria-label={`${c.remove}: ${p.name}`}
                      title={c.removeTitle}
                      className="-mr-2 rounded-md p-1.5 text-ink-subtle hover:bg-danger-soft hover:text-danger"
                      data-testid="remove-participant"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-ink-muted">{c.noStudents}</p>
          )}
          {view.absent.length ? (
            <div className="border-t border-line px-4 py-3" data-testid="console-absent">
              <p className="text-xs font-semibold text-ink-muted">
                {c.notJoined} ({view.absent.length})
              </p>
              <p className="mt-1 text-sm text-ink-muted">{view.absent.map((a) => a.name).join(", ")}</p>
            </div>
          ) : null}
        </Card>
      </div>

      <Dialog
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title={c.end}
        description={c.endConfirm}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEndOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setEndOpen(false);
                await control({ type: "end" });
              }}
              data-testid="confirm-end-session"
            >
              {c.end}
            </Button>
          </>
        }
      />
      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={c.removeTitle}
        description={removing ? fmt(c.removeConfirm, { name: removing.name }) : ""}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              {dict.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                const target = removing;
                setRemoving(null);
                if (target) await control({ type: "remove", participantId: target.id });
              }}
              data-testid="confirm-remove-participant"
            >
              {c.remove}
            </Button>
          </>
        }
      />
      <p className="text-center text-sm text-ink-subtle">
        <Link href="/teacher/sessions" className="hover:underline">
          {dict.nav.sessions}
        </Link>
      </p>
    </div>
  );
}
