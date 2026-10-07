"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight, CalendarDays, Check, Lightbulb, Share2, Target, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ClientApiError, api, errorMessage } from "@/lib/client/api";
import { secondsToNextDay } from "@/lib/engagement/model";
import type { ChallengeResult, PublicChallenge } from "@/lib/daily/pick";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { useEngagement } from "./engagement-provider";

// One tick a second for the countdown; the server renders no time at all.
const subscribeSecond = (notify: () => void) => {
  const timer = setInterval(notify, 1000);
  return () => clearInterval(timer);
};
const currentSecond = () => Math.floor(Date.now() / 1000);
const noSecond = () => 0;

function Countdown({ timeZone }: { timeZone: string }) {
  const { dict } = useI18n();
  const second = useSyncExternalStore(subscribeSecond, currentSecond, noSecond);
  const left = second === 0 ? null : secondsToNextDay(new Date(second * 1000), timeZone);
  const clock =
    left === null
      ? "--:--:--"
      : [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, "0")).join(":");
  return (
    <p className="text-sm text-ink-muted" data-testid="next-challenge">
      {dict.today.challenge.nextIn} <span className="font-mono font-semibold text-ink tabular-nums">{clock}</span>
    </p>
  );
}

interface Feedback {
  kind: "wrong" | "solved" | "missed";
  hint: string | null;
  explanation: string;
  solution: string | null;
}

/** Today's question: the same for everyone, checked on the server, three tries. */
export function DailyChallenge({ challenge }: { challenge: PublicChallenge }) {
  const { dict } = useI18n();
  const t = dict.today.challenge;
  const router = useRouter();
  const { ready, state, today, timeZone, streak, award, celebrate } = useEngagement();

  const [picked, setPicked] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [shakes, setShakes] = useState(0);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const sameDay = ready && state !== null && state.today.day === challenge.day;
  const status = sameDay ? state.today.challenge : "open";
  const attempts = sameDay ? state.today.attempts : 0;
  const stale = ready && today !== challenge.day;

  // The page was opened yesterday: fetch today's question.
  useEffect(() => {
    if (stale) router.refresh();
  }, [stale, router]);

  const answer = challenge.type === "choice" ? { optionIds: picked ? [picked] : [], text: "" } : { optionIds: [], text: text.trim() };
  const canCheck = ready && !busy && (challenge.type === "choice" ? picked !== null : text.trim().length > 0);

  const check = async () => {
    if (!canCheck) return;
    const attempt = attempts + 1;
    setBusy(true);
    setError(null);
    try {
      const result = await api<ChallengeResult>("/api/daily/check", { body: { day: challenge.day, answer, attempt } });
      if (result.isCorrect) {
        setFeedback({ kind: "solved", hint: null, explanation: result.explanation, solution: null });
        award({ kind: "challenge", outcome: "solved", attempts: attempt });
        celebrate();
      } else if (attempt >= challenge.tries) {
        setFeedback({ kind: "missed", hint: null, explanation: result.explanation, solution: result.solution });
        award({ kind: "challenge", outcome: "missed", attempts: attempt });
      } else {
        setFeedback({ kind: "wrong", hint: result.hint, explanation: "", solution: null });
        award({ kind: "attempt", attempts: attempt });
        if (picked) setWrongIds((ids) => [...ids, picked]);
        setPicked(null);
        setShakes((n) => n + 1);
      }
    } catch (e) {
      setError(e instanceof ClientApiError && e.code === "stale_day" ? t.stale : errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const squares = Array.from({ length: Math.max(1, attempts) }, (_, i) => (status === "solved" && i === attempts - 1 ? "🟩" : "🟥")).join("");
    const message = [fmt(t.shareLine, { app: dict.common.appName, n: challenge.number }), `${squares} · 🔥 ${streak}`, `${window.location.origin}/today`].join("\n");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      setShareNote(t.shared);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setShareNote(message);
    }
  };

  const subject = dict.subjects[challenge.subject];
  const done = status !== "open";
  // A question may carry a small program after a blank line: show it as code.
  const [question, ...codeLines] = challenge.prompt.split("\n\n");
  const code = codeLines.join("\n\n");

  return (
    <Card className="overflow-hidden" data-testid="daily-challenge" data-status={status}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-linear-to-r from-spark-soft to-surface px-5 py-3.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-spark text-white shadow-sm">
          <Target aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{fmt(t.title, { n: challenge.number })}</h2>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
            <CalendarDays aria-hidden className="size-3.5" />
            <span>{dict.today.weekdays[challenge.weekday - 1]}</span>
            <span aria-hidden>·</span>
            <span className="font-medium text-spark">{dict.today.themes[challenge.theme]}</span>
            <span aria-hidden>·</span>
            <span>{subject}</span>
          </p>
        </div>
        <ol className="ml-auto flex items-center gap-1.5" aria-label={fmt(t.tryOf, { n: Math.min(attempts + (done ? 0 : 1), challenge.tries), total: challenge.tries })}>
          {Array.from({ length: challenge.tries }, (_, i) => (
            <li key={i} className={cn("size-3 rounded-full border-2 transition-colors", i < attempts ? (done && status === "solved" && i === attempts - 1 ? "border-success bg-success" : "border-danger/70 bg-danger/70") : "border-line-strong")} />
          ))}
        </ol>
      </div>

      <div className="p-5 sm:p-6">
        <div id="daily-prompt" data-testid="challenge-prompt">
          <p className="text-xl leading-snug font-semibold whitespace-pre-line text-ink sm:text-2xl">{question}</p>
          {code ? (
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-ink px-4 py-3 font-mono text-sm leading-relaxed text-white sm:text-[15px]" data-testid="challenge-code">
              {code}
            </pre>
          ) : null}
        </div>

        {stale ? (
          <p role="alert" className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            {t.stale}
          </p>
        ) : null}

        {!done ? (
          <div key={shakes} className={cn(shakes > 0 && "fc-shake")}>
            {challenge.type === "choice" ? (
              <div role="radiogroup" aria-labelledby="daily-prompt" className="mt-5 grid gap-2.5">
                {challenge.options.map((option, i) => {
                  const wrong = wrongIds.includes(option.id);
                  const selected = picked === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={wrong || busy}
                      data-testid={`option-${option.id}`}
                      onClick={() => setPicked(option.id)}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] transition-all sm:text-base",
                        selected ? "border-brand bg-brand-soft shadow-sm" : "border-line bg-surface hover:border-brand/40 hover:bg-brand-soft/30",
                        wrong && "border-danger/30 bg-danger-soft/50 text-ink-subtle line-through",
                      )}
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", selected ? "bg-brand text-white" : "bg-muted text-ink-muted")}>{wrong ? <X aria-hidden className="size-4" /> : String.fromCharCode(65 + i)}</span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void check();
                }}
              >
                <label className="sr-only" htmlFor="daily-answer">
                  {t.yourAnswer}
                </label>
                <input
                  id="daily-answer"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t.typeHere}
                  maxLength={200}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-testid="challenge-input"
                  className="h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg focus:border-brand focus:outline-none"
                />
              </form>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => void check()} disabled={!canCheck} data-testid="challenge-check">
                {busy ? t.checking : t.check}
                {!busy ? <ArrowRight aria-hidden className="size-4" /> : null}
              </Button>
              <span className="text-sm text-ink-muted tabular-nums" data-testid="challenge-try">
                {fmt(t.tryOf, { n: Math.min(attempts + 1, challenge.tries), total: challenge.tries })}
              </span>
            </div>
          </div>
        ) : null}

        <div aria-live="polite" className="empty:hidden">
          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {!done && feedback?.kind === "wrong" ? (
            <div className="fc-fade-in mt-4 rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3" data-testid="challenge-wrong">
              <p className="font-semibold text-warn">{t.wrong}</p>
              <p className="mt-1 flex gap-2 text-sm text-ink">
                <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
                <span>
                  <span className="font-medium">{t.hint}:</span> {feedback.hint ?? t.noHint}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        {done ? (
          <div className="fc-fade-in mt-5 space-y-4" data-testid="challenge-result">
            <div className={cn("flex items-start gap-3 rounded-2xl p-4", status === "solved" ? "bg-success-soft" : "bg-muted")}>
              <span className={cn("fc-pop flex size-10 shrink-0 items-center justify-center rounded-full text-white", status === "solved" ? "bg-success" : "bg-ink-subtle")}>
                {status === "solved" ? <Check aria-hidden className="size-6" strokeWidth={3} /> : <Target aria-hidden className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold">{status === "solved" ? t.correct : feedback?.kind === "missed" ? t.missed : t.doneMissed}</p>
                <p className="text-sm text-ink-muted">{status === "solved" ? (attempts <= 1 ? t.firstTry : fmt(t.solvedOn, { n: attempts })) : feedback?.solution ? "" : t.doneTitle}</p>
                {feedback?.kind === "missed" && feedback.solution ? (
                  <p className="mt-1 font-semibold text-ink" data-testid="challenge-answer">
                    {fmt(t.answerIs, { answer: feedback.solution })}
                  </p>
                ) : null}
              </div>
            </div>
            {feedback?.explanation ? (
              <div className="rounded-2xl border border-line px-4 py-3">
                <p className="text-sm font-semibold">{t.whyTitle}</p>
                <p className="mt-1 text-[15px] whitespace-pre-line text-ink-muted">{feedback.explanation}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void share()} data-testid="challenge-share">
                <Share2 aria-hidden className="size-4" />
                {t.share}
              </Button>
              <Link href={`/subjects/${challenge.subject}`} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium text-brand hover:bg-brand-soft">
                {fmt(t.moreOn, { subject })}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            {shareNote ? (
              <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm whitespace-pre-line text-ink-muted" data-testid="share-note">
                {shareNote}
              </p>
            ) : null}
            <Countdown timeZone={timeZone} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
