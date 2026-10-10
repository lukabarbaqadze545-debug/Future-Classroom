"use client";

import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Spinner } from "@/components/ui/misc";
import { CodeEditor } from "@/components/labs/code-editor";
import { useLocalDraft } from "@/components/labs/use-local-draft";
import type { RunResult } from "@/lib/cpp";
import { DiagnosticView } from "./diagnostic-view";
import { useCppRunner, type CppRun } from "./use-cpp-runner";

/** Shows what a run produced: the output, or what went wrong. */
export function RunOutput({ run, source }: { run: CppRun; source: string }) {
  const { dict } = useI18n();
  const t = dict.courses.editor;
  if (run.kind === "failed") return <p role="alert" className="text-sm text-danger">{t.workerFailed}</p>;
  if (run.kind === "timeout") return <p role="alert" className="text-sm text-danger">{t.timeout}</p>;
  const r: RunResult = run.result;
  return (
    <div className="space-y-2" data-testid="run-output">
      {r.stdout ? (
        <pre aria-label={t.stdout} className="max-h-72 overflow-auto rounded-xl border border-line bg-[#0a0a0d] p-3 font-mono text-[13.5px] leading-6 whitespace-pre-wrap text-slate-100" data-testid="run-stdout">
          {r.stdout}
        </pre>
      ) : r.status === "ok" ? (
        <p className="text-sm text-ink-subtle">{t.noOutput}</p>
      ) : null}
      {r.stderr ? (
        <pre aria-label={t.stderr} className="max-h-40 overflow-auto rounded-xl border border-warn/30 bg-warn-soft p-3 font-mono text-[13px] whitespace-pre-wrap text-ink">
          {r.stderr}
        </pre>
      ) : null}
      {r.status !== "ok" && r.diagnostic ? <DiagnosticView diagnostic={r.diagnostic} source={source} /> : null}
      {r.status === "ok" && r.exitCode !== 0 ? <p className="text-sm text-ink-muted">{fmt(t.exitCode, { code: r.exitCode })}</p> : null}
    </div>
  );
}

/**
 * A C++ program the visitor can read, change and run. The code is kept on this computer while they
 * work (a draft per `draftKey`), so a closed tab does not lose it.
 */
export function ProgramRunner({
  draftKey,
  initial,
  stdin: initialStdin,
  expected,
  readOnly,
  minRows = 4,
  showInput,
  caption,
  testId,
}: {
  draftKey: string;
  initial: string;
  stdin?: string;
  /** What the program prints (shown under "Prints" so the reader can compare). */
  expected?: string;
  readOnly?: boolean;
  minRows?: number;
  showInput?: boolean;
  caption?: string;
  testId?: string;
}) {
  const { dict } = useI18n();
  const t = dict.courses.editor;
  const [code, setCode, resetCode] = useLocalDraft(draftKey, initial);
  const [stdin, setStdin] = useState(initialStdin ?? "");
  const [run, setRun] = useState<CppRun | null>(null);
  const [busy, setBusy] = useState(false);
  const runner = useCppRunner();
  const wantsInput = showInput ?? (initialStdin !== undefined || /\bcin\b|getline|scanf/.test(code));

  async function execute() {
    setBusy(true);
    setRun(null);
    setRun(await runner.run(code, stdin));
    setBusy(false);
  }

  const changed = code !== initial;
  return (
    <div className="space-y-2" data-testid={testId ?? "program-runner"}>
      {caption ? <p className="text-sm font-medium text-ink-muted">{caption}</p> : null}
      <CodeEditor value={code} onChange={readOnly ? undefined : setCode} readOnly={readOnly} label={t.codeLabel} minRows={minRows} />
      {wantsInput ? (
        <label className="block space-y-1">
          <span className="text-sm font-medium text-ink-muted">{t.stdin}</span>
          <Textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2} className="font-mono text-sm" placeholder={t.stdinHint} data-testid="run-stdin" />
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={execute} disabled={busy} data-testid="run-button">
          {busy ? <Spinner className="size-4" /> : <Play aria-hidden className="size-4" />}
          {busy ? t.running : t.run}
        </Button>
        {changed ? (
          <Button size="sm" variant="ghost" onClick={resetCode}>
            <RotateCcw aria-hidden className="size-4" />
            {t.reset}
          </Button>
        ) : null}
        {expected !== undefined && !run ? <span className="text-xs text-ink-subtle">{t.expected}: <code className="rounded bg-muted px-1.5 py-0.5 font-mono whitespace-pre-wrap">{expected.replace(/\n$/, "").split("\n").slice(0, 3).join(" ⏎ ")}{expected.split("\n").length > 4 ? " …" : ""}</code></span> : null}
      </div>
      {run ? <RunOutput run={run} source={code} /> : null}
    </div>
  );
}
