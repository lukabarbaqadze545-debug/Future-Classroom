"use client";

import { useState } from "react";
import { ChevronRight, Eye, EyeOff, LogOut, Pause, Play, Power, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { ControlAction, TeacherSessionView } from "@/lib/services/sessions";
import { cn } from "@/components/ui/cn";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLiveState } from "@/components/session/use-live-state";
import { Countdown } from "@/components/session/countdown";
import { ResultBars } from "@/components/session/result-bars";
import { ConnectionBadge } from "@/components/session/connection-badge";
import { PresentButton, PresentShell } from "./present-shell";

export function PresentSession({ initial, joinUrl }: { initial: TeacherSessionView; joinUrl: string }) {
  const { dict } = useI18n();
  const p = dict.present;
  const sessionId = initial.session.id;
  const { data, replace, clockOffset, connection } = useLiveState<TeacherSessionView>({
    stateUrl: `/api/sessions/${sessionId}`,
    eventsUrl: `/api/sessions/${sessionId}/events`,
    initial,
    versionOf: (v) => v.session.version,
  });
  const view = data ?? initial;
  const { session, current, participants } = view;
  const [busy, setBusy] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = view.activities.some((a) => a.state === "pending");

  const control = async (action: ControlAction) => {
    setBusy(true);
    setError(null);
    try {
      replace(await api<TeacherSessionView>(`/api/sessions/${sessionId}/control`, { body: action }));
    } catch (e) {
      // Shown on the screen: a tap that did nothing must not look like it worked.
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  const results = current?.results;
  const revealed = current?.revealed ?? false;

  return (
    <PresentShell
      top={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-xl font-semibold opacity-80">{session.title}</p>
          {session.status !== "ended" ? (
            <p className="rounded-xl bg-brand px-4 py-1.5 font-mono text-2xl font-bold tracking-widest text-white">{session.joinCode}</p>
          ) : null}
          {current && results ? <p className="text-xl tabular-nums opacity-80">{fmt(p.responses, { a: results.responseCount, b: results.participantCount })}</p> : null}
          {session.paused ? <p className="rounded-full bg-amber-500/20 px-4 py-1 text-lg font-semibold text-amber-600">{p.paused}</p> : null}
          {connection !== "live" ? <ConnectionBadge state={connection} className="text-base" /> : null}
          {error ? (
            <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-1.5 text-lg font-semibold text-red-600" data-testid="present-error">
              {error}
            </p>
          ) : null}
        </div>
      }
      controls={(theme) =>
        session.status === "ended" ? (
          <PresentButton theme={theme} href={`/teacher/sessions/${sessionId}`}>
            {dict.teacher.console.viewSummary}
          </PresentButton>
        ) : (
          <>
            {current ? (
              <PresentButton theme={theme} onClick={() => control({ type: "reveal", revealed: !revealed })} disabled={busy}>
                {revealed ? <EyeOff aria-hidden className="size-6" /> : <Eye aria-hidden className="size-6" />}
                {revealed ? p.hideResults : p.showResults}
              </PresentButton>
            ) : null}
            {current ? (
              <PresentButton theme={theme} onClick={() => setTimerOpen(true)} disabled={busy}>
                <Timer aria-hidden className="size-6" />
                {p.timer}
              </PresentButton>
            ) : null}
            <PresentButton theme={theme} variant="primary" onClick={() => control({ type: "next" })} disabled={busy || !pending} data-testid="present-next">
              {p.next}
              <ChevronRight aria-hidden className="size-6" />
            </PresentButton>
            <PresentButton theme={theme} onClick={() => control({ type: session.paused ? "resume" : "pause" })} disabled={busy}>
              {session.paused ? <Play aria-hidden className="size-6" /> : <Pause aria-hidden className="size-6" />}
              <span className="sr-only xl:not-sr-only">{session.paused ? dict.teacher.console.resume : dict.teacher.console.pause}</span>
            </PresentButton>
            <PresentButton theme={theme} variant="danger" onClick={() => setEndOpen(true)} disabled={busy}>
              <Power aria-hidden className="size-6" />
              <span className="sr-only xl:not-sr-only">{p.endSession}</span>
            </PresentButton>
            <PresentButton theme={theme} href={`/teacher/sessions/${sessionId}`}>
              <LogOut aria-hidden className="size-6" />
              <span className="sr-only">{p.exit}</span>
            </PresentButton>
          </>
        )
      }
      overlay={
        <>
          <Dialog
            open={timerOpen}
            onClose={() => setTimerOpen(false)}
            title={p.timer}
            closeLabel={dict.common.close}
            footer={
              <Button variant="ghost" size="lg" onClick={() => void control({ type: "timer", seconds: null }).then(() => setTimerOpen(false))}>
                {dict.teacher.console.timerOff}
              </Button>
            }
          >
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 120, 180, 300, 600].map((s) => (
                <Button
                  key={s}
                  size="xl"
                  variant="secondary"
                  onClick={async () => {
                    await control({ type: "timer", seconds: s });
                    setTimerOpen(false);
                  }}
                >
                  {s < 60 ? `${s}s` : `${s / 60} min`}
                </Button>
              ))}
            </div>
          </Dialog>
          <Dialog
            open={endOpen}
            onClose={() => setEndOpen(false)}
            title={dict.teacher.console.end}
            description={dict.teacher.console.endConfirm}
            closeLabel={dict.common.close}
            footer={
              <>
                <Button variant="ghost" size="lg" onClick={() => setEndOpen(false)}>
                  {dict.common.cancel}
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={async () => {
                    setEndOpen(false);
                    await control({ type: "end" });
                  }}
                >
                  {dict.teacher.console.end}
                </Button>
              </>
            }
          />
        </>
      }
    >
      {(theme) => {
        const dark = theme === "dark";
        if (session.status === "ended") {
          return <div className="flex flex-1 items-center justify-center text-center text-5xl font-semibold">{p.ended}</div>;
        }
        if (!current) {
          return (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-3xl font-semibold opacity-80">{p.joinTitle}</p>
              <p className="mt-4 text-2xl opacity-70">{fmt(p.joinStep, { url: joinUrl })}</p>
              <p className="mt-6 font-mono text-[clamp(64px,14vw,180px)] leading-none font-bold tracking-[0.12em]" data-testid="present-code">
                {session.joinCode}
              </p>
              <p className="mt-8 text-2xl font-medium">{fmt(p.joined, { n: participants.length })}</p>
              <ul className="mt-5 flex max-w-5xl flex-wrap justify-center gap-3">
                {participants.map((pt) => (
                  <li key={pt.id} className={cn("fc-fade-in rounded-full px-5 py-2 text-xl", dark ? "bg-white/10" : "bg-brand-soft text-brand-ink")}>
                    {pt.name}
                  </li>
                ))}
              </ul>
              {session.status === "live" ? <p className="mt-10 text-2xl opacity-60">{p.waiting}</p> : null}
            </div>
          );
        }
        const activity = current.activity;
        const isOptions = activity.type === "multiple_choice" || activity.type === "poll";
        const position = view.activities.findIndex((a) => a.id === current.id);
        const answered = results && results.participantCount ? Math.round((results.responseCount / results.participantCount) * 100) : 0;
        return (
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="flex flex-wrap items-center gap-3">
                <span className={cn("rounded-full px-4 py-1.5 text-lg font-semibold", dark ? "bg-white/10" : "bg-brand-soft text-brand-ink")}>{dict.activityTypes[activity.type]}</span>
                <span className="text-lg font-semibold tabular-nums opacity-70" data-testid="present-position">{fmt(p.slide, { n: position + 1, m: view.activities.length })}</span>
              </span>
              {current.timerEndsAt ? <Countdown endsAt={current.timerEndsAt} clockOffset={clockOffset} label={dict.session.timeLeft} large /> : null}
            </div>
            <h1 className="fc-prose mt-8 text-[clamp(26px,4.2vw,60px)] leading-tight font-semibold">{activity.prompt}</h1>
            {results && current.state === "open" && !revealed ? (
              <div className="mt-6" aria-hidden>
                <div className={cn("h-3 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-muted")}>
                  <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${answered}%` }} />
                </div>
              </div>
            ) : null}
            <div className="mt-10">
              {isOptions && revealed && results ? (
                <ResultBars distribution={results.distribution} showCorrect={activity.type === "multiple_choice"} large correctLabel={p.correct} />
              ) : isOptions ? (
                <ul className="grid gap-4 md:grid-cols-2">
                  {activity.options.map((o) => (
                    <li key={o.id} className={cn("flex items-center gap-5 rounded-3xl border-2 px-6 py-5 text-[clamp(20px,2.2vw,34px)] font-medium wrap-break-word", dark ? "border-white/15" : "border-line")}>
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white uppercase">{o.id}</span>
                      {o.text}
                    </li>
                  ))}
                </ul>
              ) : revealed && results ? (
                <div>
                  {activity.acceptedAnswers[0] && current.gradable ? (
                    <p className="mb-6 text-3xl">
                      <span className="font-semibold">{p.correct}: </span>
                      <span className="font-mono">{activity.acceptedAnswers[0]}</span>
                    </p>
                  ) : null}
                  {/* Answers are shown without names on the shared screen. */}
                  <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {results.answers.map((a) => (
                      <li key={a.participantId} className={cn("rounded-2xl px-5 py-4 text-xl", dark ? "bg-white/10" : "bg-muted", a.isCorrect === true && "ring-2 ring-emerald-500")}>
                        {a.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-3xl opacity-70">{fmtCount(p.answersCount, results?.responseCount ?? 0)}</p>
              )}
            </div>
          </div>
        );
      }}
    </PresentShell>
  );
}
