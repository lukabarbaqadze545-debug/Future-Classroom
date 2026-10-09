"use client";

import { useState } from "react";
import { CheckCircle2, Eye, Lightbulb, Play, RotateCcw, XCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/client/api";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { CheckResult, StudentExercise, TestOutcome, Text } from "@/lib/courses/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";
import { CodeBlock, CodeEditor } from "@/components/labs/code-editor";
import { useLocalDraft } from "@/components/labs/use-local-draft";
import { useEngagement } from "@/components/engagement/engagement-provider";
import { cn } from "@/components/ui/cn";
import { DiagnosticView } from "./diagnostic-view";
import { recordCheck, useCourseProgress } from "./progress";
import { RichText, pick } from "./text";

const SHOWN = (s: string | undefined, empty: string) => (s === undefined || s === "" ? empty : s);

/** One programming task: statement, examples, an editor, a server check, hints and (after solving) the solution. */
export function ExercisePanel({ exercise, index }: { exercise: StudentExercise; index: number }) {
  const { dict, locale } = useI18n();
  const t = dict.courses.exercise;
  const { award } = useEngagement();
  const progress = useCourseProgress();
  const mine = progress.exercises[exercise.id];
  const solved = mine?.done === true;
  const [code, setCode, resetCode, hasDraft] = useLocalDraft(`course:${exercise.id}`, exercise.starter);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkedCode, setCheckedCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hints, setHints] = useState<Text[]>([]);
  const [hintBusy, setHintBusy] = useState(false);
  const [solution, setSolution] = useState<{ solution: string; explanation?: Text } | null>(null);
  const [solutionBusy, setSolutionBusy] = useState(false);
  const attempts = mine?.attempts ?? 0;

  async function check() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await api<CheckResult>("/api/courses/check", { body: { exerciseId: exercise.id, code } });
      setResult(r);
      setCheckedCode(code);
      const first = recordCheck(exercise.id, r.verdict === "accepted");
      if (first) award({ kind: "code", weight: exercise.weight });
    } catch (e) {
      setError(errorMessage(dict, e) || t.checkFailed);
    } finally {
      setBusy(false);
    }
  }

  async function nextHint() {
    const n = hints.length + 1;
    if (n > exercise.hintCount) return;
    setHintBusy(true);
    setError("");
    try {
      const r = await api<{ hint: Text }>("/api/courses/hint", { body: { exerciseId: exercise.id, n } });
      setHints((list) => [...list, r.hint]);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setHintBusy(false);
    }
  }

  async function showSolution() {
    setSolutionBusy(true);
    setError("");
    try {
      setSolution(await api<{ solution: string; explanation?: Text }>("/api/courses/solution", { body: { exerciseId: exercise.id, code } }));
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setSolutionBusy(false);
    }
  }

  const canHint = attempts > 0 && hints.length < exercise.hintCount;
  return (
    <Card className="overflow-hidden" data-testid="exercise" data-exercise={exercise.id} data-solved={solved ? "true" : "false"}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-muted/40 px-5 py-3">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-ink">{index + 1}</span>
        <h3 className="min-w-0 flex-1 text-base font-semibold text-ink">{pick(exercise.title, locale)}</h3>
        <Badge tone="neutral">{t.kind[exercise.kind]}</Badge>
        <Badge tone={exercise.weight === 1 ? "success" : exercise.weight === 2 ? "warn" : "danger"}>{t.weight[exercise.weight]}</Badge>
        {solved ? (
          <Badge tone="success" dot>
            {t.solved}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="space-y-2 text-[15px] leading-relaxed text-ink">
          <RichText text={exercise.statement} locale={locale} />
        </div>
        {exercise.inputFormat || exercise.outputFormat ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {exercise.inputFormat ? (
              <div>
                <dt className="font-semibold text-ink-muted">{t.input}</dt>
                <dd className="mt-0.5 text-ink">
                  <RichText text={exercise.inputFormat} locale={locale} />
                </dd>
              </div>
            ) : null}
            {exercise.outputFormat ? (
              <div>
                <dt className="font-semibold text-ink-muted">{t.output}</dt>
                <dd className="mt-0.5 text-ink">
                  <RichText text={exercise.outputFormat} locale={locale} />
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {exercise.samples.length ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink-muted">{t.examples}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {exercise.samples.map((s, i) => (
                <div key={i} className="space-y-1 rounded-xl border border-line p-3" data-testid="sample">
                  <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{fmt(t.example, { n: i + 1 })}</p>
                  {s.input.trim() ? (
                    <>
                      <p className="text-xs text-ink-subtle">{t.exampleInput}</p>
                      <CodeBlock code={s.input} />
                    </>
                  ) : null}
                  <p className="text-xs text-ink-subtle">{t.exampleOutput}</p>
                  <CodeBlock code={s.output} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <CodeEditor value={code} onChange={setCode} label={t.yourCode} minRows={exercise.kind === "write" ? 10 : 12} id={`code-${exercise.id}`} />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={check} disabled={busy} data-testid="check-button">
            {busy ? <Spinner className="size-4" /> : <Play aria-hidden className="size-4" />}
            {busy ? t.checking : t.check}
          </Button>
          <Button variant="secondary" onClick={nextHint} disabled={!canHint || hintBusy} data-testid="hint-button" title={attempts === 0 ? t.hintLater : undefined}>
            <Lightbulb aria-hidden className="size-4" />
            {hints.length >= exercise.hintCount ? t.noMoreHints : hints.length ? fmt(t.hintN, { n: hints.length + 1 }) : t.showHint}
          </Button>
          <Button variant="secondary" onClick={showSolution} disabled={!solved || solutionBusy || solution !== null} title={solved ? undefined : t.solutionLocked} data-testid="solution-button">
            <Eye aria-hidden className="size-4" />
            {t.showSolution}
          </Button>
          {hasDraft && code !== exercise.starter ? (
            <Button variant="ghost" onClick={() => (resetCode(), setResult(null))}>
              <RotateCcw aria-hidden className="size-4" />
              {dict.courses.editor.reset}
            </Button>
          ) : null}
          {attempts > 0 ? <span className="text-xs text-ink-subtle">{fmt(t.attempts, { n: attempts })}</span> : null}
        </div>

        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

        {hints.length ? (
          <ol className="space-y-2" data-testid="hints">
            {hints.map((h, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-warn/25 bg-warn-soft px-4 py-2.5 text-sm">
                <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
                <div>
                  <p className="font-semibold">{fmt(t.hintN, { n: i + 1 })}</p>
                  <RichText text={h} locale={locale} />
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {result ? <ResultView result={result} source={checkedCode} /> : null}

        {solution ? (
          <div className="space-y-2" data-testid="solution">
            <p className="text-sm font-semibold text-ink-muted">{t.solution}</p>
            <CodeBlock code={solution.solution} label={t.solution} />
            {solution.explanation ? (
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-ink">
                <p className="font-semibold">{t.explanation}</p>
                <RichText text={solution.explanation} locale={locale} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function StatusDot({ status }: { status: TestOutcome["status"] }) {
  const color = status === "ok" ? "bg-success" : status === "skipped" ? "bg-line-strong" : "bg-danger";
  return <span aria-hidden className={cn("size-2.5 rounded-full", color)} />;
}

function ResultView({ result, source }: { result: CheckResult; source: string }) {
  const { dict } = useI18n();
  const t = dict.courses.exercise;
  const accepted = result.verdict === "accepted";
  const failed = result.tests.find((x) => x.status !== "ok" && x.status !== "skipped" && (x.input !== undefined || x.diagnostic));
  const help = (t.verdictHelp as Record<string, string>)[result.verdict];
  return (
    <div className="space-y-3" role="status" data-testid="check-result" data-verdict={result.verdict}>
      <Notice tone={accepted ? "success" : "danger"} title={accepted ? t.allPassed : t.verdict[result.verdict]}>
        {result.tests.length || result.total ? <span>{fmt(t.passed, { passed: result.passed, total: result.total })}</span> : null}
        {!accepted && help ? <p className="mt-1">{help}</p> : null}
      </Notice>
      {result.diagnostic ? <DiagnosticView diagnostic={{ ...result.diagnostic, kind: result.verdict === "unsupported" ? "unsupported" : "semantic" }} source={source} /> : null}
      {result.tests.length ? (
        <div className="flex flex-wrap gap-1.5" aria-label={t.tests}>
          {result.tests.map((x, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted" title={t.status[x.status]} data-status={x.status}>
              <StatusDot status={x.status} />
              {x.sample ? fmt(t.testN, { n: i + 1 }) : fmt(t.hiddenTest, { n: i + 1 })}
            </span>
          ))}
        </div>
      ) : null}
      {failed ? <FailureView test={failed} source={source} /> : null}
      {result.note === "stderr" ? <p className="text-xs text-ink-subtle">{t.stderrNote}</p> : null}
    </div>
  );
}

function FailureView({ test, source }: { test: TestOutcome; source: string }) {
  const { dict } = useI18n();
  const t = dict.courses.exercise;
  return (
    <div className="space-y-2 rounded-xl border border-line p-3 text-sm" data-testid="failure">
      <p className="flex items-center gap-2 font-semibold text-ink">
        {test.status === "ok" ? <CheckCircle2 aria-hidden className="size-4 text-success" /> : <XCircle aria-hidden className="size-4 text-danger" />}
        {t.status[test.status]}
      </p>
      {test.input !== undefined && test.input.trim() ? (
        <div>
          <p className="text-xs font-semibold text-ink-subtle">{t.failedInput}</p>
          <CodeBlock code={test.input} />
        </div>
      ) : null}
      {test.expected !== undefined ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-ink-subtle">{t.expectedOutput}</p>
            <CodeBlock code={SHOWN(test.expected, t.emptyOutput)} />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-subtle">{t.yourOutput}</p>
            <CodeBlock code={SHOWN(test.got, t.emptyOutput)} />
          </div>
        </div>
      ) : null}
      {test.diagnostic ? <DiagnosticView diagnostic={{ ...test.diagnostic, kind: test.status === "timeout" ? "limit" : "runtime" }} source={source} /> : null}
    </div>
  );
}
