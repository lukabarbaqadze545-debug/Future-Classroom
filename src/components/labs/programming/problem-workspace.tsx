"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, Lightbulb, Play, RotateCcw, Send, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr, type L } from "@/lib/labs/localized";
import type { ProgLanguage } from "@/lib/labs/programming/types";
import type { StudentProblem, SubmissionResult, SubmissionSummary, TestReport, Verdict } from "@/lib/labs/programming/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/form";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";
import { CodeBlock, CodeEditor } from "../code-editor";
import { useLocalDraft } from "../use-local-draft";
import { usePythonRunner, type BrowserRunResult } from "./use-python-runner";
import { useProgLanguage, writeProgLanguage } from "./problem-browser";

const SOLVED: Verdict[] = ["accepted", "correct"];

export function ProblemWorkspace({
  problem,
  history: initialHistory,
  judge,
  initiallySolved,
  explanation: initialExplanation,
  isStudent,
  inPortfolio: initiallyInPortfolio,
}: {
  problem: StudentProblem;
  history: SubmissionSummary[];
  judge: { cpp: boolean };
  initiallySolved: boolean;
  explanation: L | null;
  isStudent: boolean;
  inPortfolio: boolean;
}) {
  const { dict, locale } = useI18n();
  const p = dict.labs.programming;
  const language = useProgLanguage();
  const runner = usePythonRunner();
  const starter = problem.starter?.[language] ?? "";
  const [code, setCode, resetCode] = useLocalDraft(`prog:${problem.id}:${language}`, starter);
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [busy, setBusy] = useState<null | "samples" | "custom" | "submit">(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [sampleRuns, setSampleRuns] = useState<BrowserRunResult[] | null>(null);
  const [customInput, setCustomInput] = useState(problem.tests.find((t) => t.sample)?.input ?? "");
  const [customRun, setCustomRun] = useState<BrowserRunResult | null>(null);
  const [selfOutputs, setSelfOutputs] = useState<string[]>(() => problem.tests.map(() => ""));
  const [hints, setHints] = useState<L[]>([]);
  const [hintBusy, setHintBusy] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const [solved, setSolved] = useState(initiallySolved);
  const [explanation, setExplanation] = useState<L | null>(initialExplanation);
  const [inPortfolio, setInPortfolio] = useState(initiallyInPortfolio);
  const [portfolioBusy, setPortfolioBusy] = useState(false);

  const samples = problem.tests.filter((t) => t.sample);
  const isCode = problem.kind === "code";
  const cppManual = isCode && language === "cpp" && !judge.cpp;
  // WebAssembly Python is slower than native Python; give it a fair margin.
  const browserLimit = Math.max(problem.timeLimitMs * 3, 4000);

  const onProgress = (total: number) => (i: number) => setProgress(fmt(p.running, { n: i + 1, m: total }));

  async function runPython(inputs: string[]) {
    setError("");
    setProgress(runner.status === "ready" ? "" : p.preparingPython);
    try {
      return await runner.run(code, inputs, browserLimit, onProgress(inputs.length));
    } catch {
      setError(p.pythonError);
      return null;
    } finally {
      setProgress("");
    }
  }

  async function runSamples() {
    setBusy("samples");
    const runs = await runPython(samples.map((t) => t.input));
    if (runs) setSampleRuns(runs);
    setBusy(null);
  }

  async function runCustom() {
    setBusy("custom");
    const runs = await runPython([customInput]);
    if (runs) setCustomRun(runs[0]);
    setBusy(null);
  }

  async function send(body: Record<string, unknown>) {
    const res = await api<SubmissionResult>("/api/labs/programming/submit", { body: { problemId: problem.id, language, ...body } });
    setResult(res);
    setHistory((h) =>
      [{ id: res.id, problemId: problem.id, language, verdict: res.verdict, checker: res.checker, passed: res.passed, total: res.total, code: String(body.code ?? ""), answer: String(body.answer ?? ""), createdAt: res.createdAt }, ...h].slice(0, 10),
    );
    if (SOLVED.includes(res.verdict)) {
      setSolved(true);
      if (res.explanation) setExplanation(res.explanation);
    }
  }

  async function submit() {
    setBusy("submit");
    setError("");
    try {
      if (problem.kind === "predict") await send({ mode: "answer", answer });
      else if (problem.kind === "choice") await send({ mode: "answer", answer: choice ?? "" });
      else if (language === "python") {
        const runs = await runPython(problem.tests.map((t) => t.input));
        if (runs) {
          setProgress(p.submitting);
          await send({ mode: "browser", code, results: runs.map((r) => ({ output: r.output.slice(0, 200000), error: r.error?.slice(-4000), timedOut: r.timedOut, skipped: r.skipped })) });
        }
      } else if (judge.cpp) {
        setProgress(p.submitting);
        await send({ mode: "judge", code });
      } else {
        await send({ mode: "self", code, results: selfOutputs.map((output) => ({ output })) });
      }
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setProgress("");
      setBusy(null);
    }
  }

  async function nextHint() {
    setHintBusy(true);
    try {
      const res = await api<{ hint: L }>("/api/labs/programming/hint", { body: { problemId: problem.id, index: hints.length } });
      setHints((h) => [...h, res.hint]);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setHintBusy(false);
    }
  }

  async function addToPortfolio() {
    setPortfolioBusy(true);
    try {
      await api("/api/portfolio/from-source", { body: { kind: "programming", id: problem.id } });
      setInPortfolio(true);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setPortfolioBusy(false);
    }
  }

  const displayCode = problem.code ? (problem.code[language] ?? problem.code.python ?? problem.code.cpp ?? "") : "";
  const canSubmit =
    busy === null &&
    (problem.kind === "predict" ? answer.trim().length > 0 : problem.kind === "choice" ? choice !== null : cppManual ? selfOutputs.some((o) => o.trim()) && code.trim().length > 0 : code.trim().length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Left: the problem */}
      <div className="min-w-0 space-y-5">
        <Card>
          <div className="space-y-5 px-5 py-5">
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{p.statement}</h2>
              <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line">{tr(problem.statement, locale)}</p>
            </section>
            {isCode ? (
              <>
                <FormatSection title={p.input} text={tr(problem.inputFormat!, locale)} />
                <FormatSection title={p.output} text={tr(problem.outputFormat!, locale)} />
                <FormatSection title={p.constraints} text={tr(problem.constraints!, locale)} />
                <section>
                  <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{p.examples}</h2>
                  <div className="mt-2 space-y-3">
                    {samples.map((t, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-ink-muted">
                            {fmt(p.example, { n: i + 1 })} · {p.exampleInput}
                          </p>
                          <CodeBlock code={t.input || " "} />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-ink-muted">{p.exampleOutput}</p>
                          <CodeBlock code={t.output ?? ""} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink-subtle">{fmt(p.timeLimit, { n: problem.timeLimitMs / 1000 })}</p>
                </section>
              </>
            ) : displayCode ? (
              <CodeBlock code={displayCode} label={p.languages[language]} />
            ) : null}
          </div>
        </Card>

        {problem.hintCount > 0 ? (
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><Lightbulb aria-hidden className="size-4.5 text-warn" />{p.hints}</span>} description={p.hintsLead} />
            <div className="space-y-2 px-5 py-4">
              {hints.map((h, i) => (
                <p key={i} className="rounded-xl border border-warn/25 bg-warn-soft/60 px-3.5 py-2.5 text-[15px]">
                  <span className="mr-2 font-semibold text-warn">{i + 1}.</span>
                  {tr(h, locale)}
                </p>
              ))}
              {hints.length < problem.hintCount ? (
                <Button variant="secondary" size="sm" onClick={nextHint} disabled={hintBusy}>
                  {fmt(p.showHint, { n: hints.length + 1 })}
                </Button>
              ) : (
                <p className="text-sm text-ink-muted">{p.noMoreHints}</p>
              )}
            </div>
          </Card>
        ) : null}

        {solved && explanation && tr(explanation, locale) ? (
          <Card className="border-success/30">
            <CardHeader title={p.explanation} />
            <p className="px-5 py-4 text-[15px] leading-relaxed whitespace-pre-line">{tr(explanation, locale)}</p>
          </Card>
        ) : null}
      </div>

      {/* Right: the answer */}
      <div className="min-w-0 space-y-5">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <div role="group" aria-label={p.language} className="inline-flex rounded-xl border border-line-strong p-1">
              {(["python", "cpp"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={language === lang}
                  onClick={() => {
                    writeProgLanguage(lang);
                    setSampleRuns(null);
                    setCustomRun(null);
                    setResult(null);
                  }}
                  className={cn("h-9 rounded-lg px-4 text-sm font-semibold", language === lang ? "bg-lab-programming text-white" : "text-ink-muted hover:bg-muted")}
                >
                  {p.languages[lang]}
                </button>
              ))}
            </div>
            {solved ? (
              <Badge tone="success">
                <CheckCircle2 aria-hidden className="size-3.5" />
                {p.solved}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-4 px-5 py-4">
            {isCode ? (
              <>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium" htmlFor={`editor-${problem.id}`}>
                      {p.editor}
                    </label>
                    <Button variant="ghost" size="sm" onClick={resetCode} disabled={code === starter}>
                      <RotateCcw aria-hidden className="size-4" />
                      {p.resetCode}
                    </Button>
                  </div>
                  <CodeEditor id={`editor-${problem.id}`} value={code} onChange={setCode} label={p.editorLabel} minRows={12} />
                  <p className="mt-1.5 text-xs text-ink-subtle">
                    {p.editorHelp} {p.draftKept}
                  </p>
                </div>

                {cppManual ? (
                  <SelfCheck tests={problem.tests} outputs={selfOutputs} setOutputs={setSelfOutputs} />
                ) : language === "cpp" ? (
                  <Notice tone="info">{p.cppJudgeText}</Notice>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={runSamples} disabled={busy !== null || !code.trim()}>
                      <Play aria-hidden className="size-4" />
                      {p.runSamples}
                    </Button>
                  </div>
                )}
              </>
            ) : problem.kind === "predict" ? (
              <div>
                <label htmlFor={`answer-${problem.id}`} className="text-sm font-medium">
                  {p.predictPrompt}
                </label>
                <textarea
                  id={`answer-${problem.id}`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  placeholder={p.predictPlaceholder}
                  spellCheck={false}
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 font-mono text-[15px] focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none"
                />
              </div>
            ) : (
              <fieldset>
                <legend className="sr-only">{p.kinds.choice}</legend>
                <div className="space-y-2">
                  {problem.options.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors",
                        choice === o.id ? "border-lab-programming bg-lab-programming/5" : "border-line-strong hover:bg-muted/60",
                      )}
                    >
                      <input type="radio" name={`choice-${problem.id}`} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} className="mt-1 size-4 accent-[var(--color-lab-programming)]" />
                      <span>{tr(o.text, locale)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button onClick={submit} disabled={!canSubmit} size="lg" data-testid="submit-code">
                <Send aria-hidden className="size-4" />
                {busy === "submit" ? p.submitting : isCode ? (cppManual ? p.submitOutputs : p.submit) : p.check}
              </Button>
              {progress ? <Spinner label={progress} className="text-lab-programming" /> : null}
            </div>
            {error ? <Notice tone="danger">{error}</Notice> : null}
          </div>
        </Card>

        {result ? (
          <ResultPanel result={result} canAddToPortfolio={isStudent && !inPortfolio} portfolioBusy={portfolioBusy} onAddToPortfolio={addToPortfolio} />
        ) : null}
        {!result && solved && isStudent ? (
          inPortfolio ? (
            <Notice tone="success" action={<Link href="/career/portfolio" className="text-sm font-medium text-brand hover:underline">{p.viewPortfolio}</Link>}>
              {dict.labs.common.addedToPortfolio}
            </Notice>
          ) : (
            <Button variant="secondary" onClick={addToPortfolio} disabled={portfolioBusy}>
              {dict.labs.common.addToPortfolio}
            </Button>
          )
        ) : null}
        {result && inPortfolio && SOLVED.includes(result.verdict) && isStudent ? (
          <Notice tone="success" action={<Link href="/career/portfolio" className="text-sm font-medium text-brand hover:underline">{p.viewPortfolio}</Link>}>
            {dict.labs.common.addedToPortfolio}
          </Notice>
        ) : null}

        {sampleRuns && isCode ? (
          <Card>
            <CardHeader title={p.runSamples} />
            <ul className="divide-y divide-line">
              {samples.map((t, i) => {
                const run = sampleRuns[i];
                const ok = run && !run.error && !run.timedOut && normalize(run.output) === normalize(t.output ?? "");
                return (
                  <li key={i} className="space-y-2 px-5 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {ok ? <CheckCircle2 aria-hidden className="size-4 text-success" /> : <XCircle aria-hidden className="size-4 text-danger" />}
                      {fmt(p.example, { n: i + 1 })} · {ok ? p.sampleOk : run?.timedOut ? p.testStatus.time_limit : run?.error ? p.testStatus.runtime_error : p.sampleDiff}
                    </p>
                    {!ok && run ? <OutputCompare expected={t.output ?? ""} actual={run.output} error={run.error} /> : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {isCode && language === "python" ? (
          <Card>
            <CardHeader title={p.runCustom} as="h3" />
            <div className="space-y-3 px-5 py-4">
              <div>
                <label htmlFor={`custom-${problem.id}`} className="text-sm font-medium">
                  {p.customInput}
                </label>
                <Textarea id={`custom-${problem.id}`} value={customInput} onChange={(e) => setCustomInput(e.target.value)} rows={3} className="mt-1.5 font-mono" spellCheck={false} />
              </div>
              <Button variant="secondary" size="sm" onClick={runCustom} disabled={busy !== null || !code.trim()}>
                <Play aria-hidden className="size-4" />
                {p.runCustom}
              </Button>
              {customRun ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-ink-muted">{p.customOutput}</p>
                  <CodeBlock code={customRun.timedOut ? p.testStatus.time_limit : customRun.output || p.noOutput} />
                  {customRun.error ? <pre className="mt-2 overflow-x-auto rounded-xl bg-danger-soft p-3 text-sm whitespace-pre-wrap text-danger">{customRun.error}</pre> : null}
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        <Card>
          <CardHeader title={p.history} as="h3" />
          {history.length ? (
            <ul className="divide-y divide-line">
              {history.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge tone={SOLVED.includes(s.verdict) ? "success" : "danger"}>{p.verdicts[s.verdict]}</Badge>
                    <span className="text-ink-muted">
                      {p.languages[s.language]} · {s.total > 1 ? `${s.passed}/${s.total} · ` : ""}
                      {relativeTime(dict, s.createdAt)}
                    </span>
                  </span>
                  {s.code && isCode ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        writeProgLanguage(s.language as ProgLanguage);
                        setCode(s.code);
                      }}
                    >
                      {p.loadCode}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.noHistory}</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function normalize(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}

function FormatSection({ title, text }: { title: string; text: string }) {
  if (!text || text === "—") return null;
  return (
    <section>
      <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{title}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line">{text}</p>
    </section>
  );
}

function OutputCompare({ expected, actual, error }: { expected: string | null; actual: string | null; error?: string | null }) {
  const { dict } = useI18n();
  const p = dict.labs.programming;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {expected !== null ? (
          <div>
            <p className="mb-1 text-xs font-medium text-ink-muted">{p.expected}</p>
            <CodeBlock code={expected || p.noOutput} />
          </div>
        ) : null}
        {actual !== null ? (
          <div>
            <p className="mb-1 text-xs font-medium text-ink-muted">{p.got}</p>
            <CodeBlock code={actual || p.noOutput} />
          </div>
        ) : null}
      </div>
      {error ? <pre className="max-h-48 overflow-auto rounded-xl bg-danger-soft p-3 text-sm whitespace-pre-wrap text-danger">{error}</pre> : null}
    </div>
  );
}

function ResultPanel({
  result,
  canAddToPortfolio,
  portfolioBusy,
  onAddToPortfolio,
}: {
  result: SubmissionResult;
  canAddToPortfolio: boolean;
  portfolioBusy: boolean;
  onAddToPortfolio: () => void;
}) {
  const { dict } = useI18n();
  const p = dict.labs.programming;
  const ok = SOLVED.includes(result.verdict);
  return (
    <Card className={ok ? "border-success/40" : "border-danger/30"} data-testid="submission-result">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-t-[var(--radius-card)] px-5 py-4", ok ? "bg-success-soft" : "bg-danger-soft/70")}>
        <div className="flex items-center gap-3">
          {ok ? <CheckCircle2 aria-hidden className="size-6 text-success" /> : <XCircle aria-hidden className="size-6 text-danger" />}
          <div>
            <p className={cn("text-lg font-semibold", ok ? "text-success" : "text-danger")} role="status">
              {p.verdicts[result.verdict]}
            </p>
            <p className="text-sm text-ink-muted">
              {result.total > 1 || result.tests.length ? `${fmt(p.passedCount, { passed: result.passed, total: result.total })} · ` : ""}
              {p.checkers[result.checker]}
            </p>
          </div>
        </div>
        {ok && canAddToPortfolio ? (
          <Button variant="secondary" size="sm" onClick={onAddToPortfolio} disabled={portfolioBusy}>
            {dict.labs.common.addToPortfolio}
          </Button>
        ) : null}
      </div>
      {result.tests.length ? (
        <ul className="divide-y divide-line">
          {result.tests.map((t) => (
            <TestRow key={t.index} test={t} />
          ))}
        </ul>
      ) : null}
      {!ok ? <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">{p.unsolvedHelp}</p> : null}
    </Card>
  );
}

function TestRow({ test }: { test: TestReport }) {
  const { dict } = useI18n();
  const p = dict.labs.programming;
  const [open, setOpen] = useState(!test.passed && test.sample);
  const label = test.sample ? fmt(p.test, { n: test.index + 1 }) : fmt(p.hiddenTest, { n: test.index + 1 });
  const hasDetail = !test.passed && (test.sample || test.error);
  return (
    <li className="px-5 py-2.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          {test.passed ? <CheckCircle2 aria-hidden className="size-4 text-success" /> : <XCircle aria-hidden className="size-4 text-danger" />}
          {label}
        </span>
        <span className="flex items-center gap-2">
          <Badge tone={test.passed ? "success" : test.status === "not_run" ? "neutral" : "danger"}>{p.testStatus[test.status]}</Badge>
          {hasDetail ? (
            <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? dict.common.close : dict.common.open}
            </Button>
          ) : null}
        </span>
      </div>
      {open && hasDetail ? (
        <div className="mt-2">
          <OutputCompare expected={test.expected} actual={test.actual} error={test.error} />
        </div>
      ) : null}
    </li>
  );
}

/** C++ without a code judge: the student runs the program locally and pastes each output. */
function SelfCheck({ tests, outputs, setOutputs }: { tests: StudentProblem["tests"]; outputs: string[]; setOutputs: (o: string[]) => void }) {
  const { dict } = useI18n();
  const p = dict.labs.programming;
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <Notice tone="info" title={p.cppManualTitle}>
        {p.cppManualText}
      </Notice>
      <ol className="space-y-3">
        {tests.map((t, i) => (
          <li key={i} className="rounded-xl border border-line p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{t.sample ? fmt(p.test, { n: i + 1 }) : fmt(p.hiddenTest, { n: i + 1 })}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(t.input);
                    setCopied(i);
                  } catch {
                    setCopied(null);
                  }
                }}
              >
                <Copy aria-hidden className="size-4" />
                {copied === i ? p.copied : p.copyInput}
              </Button>
            </div>
            <CodeBlock code={t.input || " "} />
            <label htmlFor={`self-${i}`} className="mt-2 block text-xs font-medium text-ink-muted">
              {fmt(p.outputFor, { n: i + 1 })}
            </label>
            <textarea
              id={`self-${i}`}
              value={outputs[i]}
              onChange={(e) => setOutputs(outputs.map((o, j) => (j === i ? e.target.value : o)))}
              rows={2}
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 font-mono text-sm focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
