"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/client/api";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { StudentBlock, Text } from "@/lib/courses/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { CodeBlock } from "@/components/labs/code-editor";
import { useEngagement } from "@/components/engagement/engagement-provider";
import { cn } from "@/components/ui/cn";
import { recordItem, useCourseProgress } from "./progress";
import { RichText, pick, inline } from "./text";

/** A multiple-choice question; the right answer is only revealed by the server after an answer. */
export function QuizBlock({ lessonId, block }: { lessonId: string; block: Extract<StudentBlock, { k: "quiz" }> }) {
  const { dict, locale } = useI18n();
  const t = dict.courses.quiz;
  const { award } = useEngagement();
  const progress = useCourseProgress();
  const key = `${lessonId}/${block.id}`;
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; answer: number; why: Text } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const answeredRight = progress.items[key] === true;

  async function answer(choice: number) {
    if (busy || (result && result.correct)) return;
    setChosen(choice);
    setBusy(true);
    setError("");
    try {
      const r = await api<{ correct: boolean; answer: number; why: Text }>("/api/courses/quiz", { body: { lessonId, blockId: block.id, choice } });
      setResult(r);
      if (r.correct && recordItem(key)) award({ kind: "practice" });
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 p-4" data-testid="quiz-block" data-quiz={block.id}>
      <p className="text-xs font-semibold tracking-wide text-brand-ink uppercase">{t.title}</p>
      <div className="font-medium text-ink">
        <RichText text={block.question} locale={locale} />
      </div>
      <div className="grid gap-2" role="group" aria-label={pick(block.question, locale)}>
        {block.options.map((option, i) => {
          const isRight = result && i === result.answer;
          const isWrongPick = result && !result.correct && i === chosen;
          return (
            <button
              key={i}
              type="button"
              disabled={busy || (result?.correct ?? false)}
              onClick={() => answer(i)}
              data-testid={`quiz-option-${i}`}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                isRight ? "border-success/40 bg-success-soft text-ink" : isWrongPick ? "border-danger/40 bg-danger-soft text-ink" : "border-line-strong bg-surface hover:bg-muted",
              )}
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-[11px] font-semibold text-ink-muted">{String.fromCharCode(65 + i)}</span>
              <span>{inline(pick(option, locale))}</span>
            </button>
          );
        })}
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      {result ? (
        <div className={cn("flex gap-2 rounded-xl px-4 py-3 text-sm", result.correct ? "bg-success-soft" : "bg-danger-soft")} role="status" data-testid="quiz-result">
          {result.correct ? <CheckCircle2 aria-hidden className="mt-0.5 size-4.5 shrink-0 text-success" /> : <XCircle aria-hidden className="mt-0.5 size-4.5 shrink-0 text-danger" />}
          <div className="space-y-1">
            <p className="font-semibold">{result.correct ? t.correct : t.wrong}</p>
            {!result.correct ? <p>{fmt(t.answerIs, { answer: String.fromCharCode(65 + result.answer) })}</p> : null}
            <RichText text={result.why} locale={locale} />
          </div>
        </div>
      ) : answeredRight ? (
        <p className="text-sm text-success">{t.correct}</p>
      ) : null}
    </Card>
  );
}

/** "What will this print?": the student types the output, the server runs the program and compares. */
export function PredictBlock({ lessonId, block }: { lessonId: string; block: Extract<StudentBlock, { k: "predict" }> }) {
  const { dict, locale } = useI18n();
  const t = dict.courses.predict;
  const { award } = useEngagement();
  const key = `${lessonId}/${block.id}`;
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ correct: boolean; output: string; why?: Text } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ correct: boolean; output: string; why?: Text }>("/api/courses/predict", { body: { lessonId, blockId: block.id, answer } });
      setResult(r);
      if (r.correct && recordItem(key)) award({ kind: "practice" });
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 p-4" data-testid="predict-block" data-predict={block.id}>
      <p className="text-xs font-semibold tracking-wide text-brand-ink uppercase">{t.title}</p>
      {block.ask ? (
        <div className="text-sm text-ink">
          <RichText text={block.ask} locale={locale} />
        </div>
      ) : null}
      <CodeBlock code={block.code} label={t.title} />
      {block.stdin ? (
        <p className="text-sm text-ink-muted">
          {dict.courses.editor.stdin}: <code className="rounded bg-muted px-1.5 py-0.5 font-mono whitespace-pre">{block.stdin.replace(/\n$/, "")}</code>
        </p>
      ) : null}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="font-mono text-sm" placeholder={t.placeholder} aria-label={t.answerLabel} data-testid="predict-answer" disabled={result?.correct} />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={check} disabled={busy || !answer.trim() || result?.correct} data-testid="predict-check">
          {t.check}
        </Button>
        {result && !result.correct ? (
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
            {t.tryAgain}
          </Button>
        ) : null}
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      {result ? (
        <div className={cn("space-y-2 rounded-xl px-4 py-3 text-sm", result.correct ? "bg-success-soft" : "bg-danger-soft")} role="status" data-testid="predict-result">
          <p className="flex items-center gap-2 font-semibold">
            {result.correct ? <CheckCircle2 aria-hidden className="size-4.5 text-success" /> : <XCircle aria-hidden className="size-4.5 text-danger" />}
            {result.correct ? t.correct : t.wrong}
          </p>
          {!result.correct ? <pre className="overflow-x-auto rounded-lg bg-[#0a0a0d] p-3 font-mono text-[13.5px] text-slate-100">{result.output || dict.courses.exercise.emptyOutput}</pre> : null}
          {result.why ? (
            <div>
              <p className="font-semibold">{t.explain}</p>
              <RichText text={result.why} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
