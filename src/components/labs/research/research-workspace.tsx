"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CheckCircle2, Circle, CircleAlert, Plus, Presentation, Send, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { QUESTION_TYPES, RESEARCH_STEPS, type ResearchProjectData, type ResearchStep } from "@/lib/labs/research/model";
import type { ResearchDataset, ResearchNote, ResearchSource } from "@/lib/labs/research/service";
import { countValues, describe, toNumbers } from "@/lib/labs/research/stats";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";
import { useLocalJsonDraft } from "../use-local-draft";
import { DataPanel } from "./data-panel";
import { NotesPanel } from "./notes-panel";
import { SourcesPanel, type LibraryOption } from "./sources-panel";

const YES_NO_EN = /^(is|are|do|does|did|can|could|will|would|should|has|have|was|were)\b/i;

/** Deterministic checks for a research question (no AI). */
export function questionChecks(data: Pick<ResearchProjectData, "question" | "scope" | "why">) {
  const q = data.question.trim();
  const words = q ? q.split(/\s+/u).length : 0;
  const yesNo = YES_NO_EN.test(q) || /თუ არა/u.test(q) || /^არის\s/u.test(q);
  return {
    open: q.length > 0 && !yesNo,
    specific: words >= 8,
    scope: data.scope.trim().split(/\s+/u).filter(Boolean).length >= 3,
    researchable: data.why.trim().split(/\s+/u).filter(Boolean).length >= 8,
  };
}

function stepDone(step: ResearchStep, data: ResearchProjectData, sources: ResearchSource[], notes: ResearchNote[], datasets: ResearchDataset[]) {
  switch (step) {
    case "question":
      return data.question.trim().length > 10;
    case "hypothesis":
      return data.hypothesis.trim().length > 10;
    case "sources":
      return sources.length >= 2;
    case "notes":
      return notes.some((n) => n.kind !== "evidence");
    case "evidence":
      return notes.some((n) => n.kind === "evidence");
    case "data":
      return datasets.some((d) => d.rows.some((r) => r.some((c) => c.trim())));
    case "analysis":
      return data.analysis.trim().length > 20;
    case "findings":
      return data.findings.some((f) => f.trim());
    case "conclusion":
      return data.conclusion.trim().length > 20;
    case "presentation":
      return data.keyMessage.trim().length > 5;
  }
}

export function ResearchWorkspace({
  id,
  initial,
  initialSources,
  initialNotes,
  initialDatasets,
  library,
  readOnly,
  footer,
}: {
  id: string;
  initial: { title: string; subject: string; data: ResearchProjectData; status: "draft" | "submitted"; updatedAt: number };
  initialSources: ResearchSource[];
  initialNotes: ResearchNote[];
  initialDatasets: ResearchDataset[];
  library: LibraryOption[];
  readOnly: boolean;
  footer?: ReactNode;
}) {
  const { dict } = useI18n();
  const r = dict.labs.research;
  const router = useRouter();
  const [server, setServer] = useState({ title: initial.title, subject: initial.subject, data: initial.data });
  const [draft, setDraft, clearDraft, unsaved] = useLocalJsonDraft(`research:${id}`, server);
  const value = readOnly ? server : draft;
  const data = value.data;
  const [sources, setSources] = useState(initialSources);
  const [notes, setNotes] = useState(initialNotes);
  const [datasets, setDatasets] = useState(initialDatasets);
  const [step, setStep] = useState<ResearchStep>("question");
  const [status, setStatus] = useState(initial.status);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [busy, setBusy] = useState<null | "save" | "submit" | "delete">(null);
  const [error, setError] = useState("");
  const set = (patch: Partial<ResearchProjectData>) => setDraft({ ...value, data: { ...data, ...patch } });

  async function save(submit: boolean) {
    setBusy(submit ? "submit" : "save");
    setError("");
    try {
      const res = await api<{ project: { status: "draft" | "submitted"; updatedAt: number } }>(`/api/labs/research/projects/${id}`, {
        method: "PUT",
        body: { title: value.title, subject: value.subject, data, submit },
      });
      setServer(value);
      clearDraft();
      setStatus(res.project.status);
      setSavedAt(res.project.updatedAt);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(dict.labs.common.deleteConfirm)) return;
    setBusy("delete");
    try {
      await api(`/api/labs/research/projects/${id}`, { method: "DELETE" });
      clearDraft();
      router.push("/labs/research");
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(null);
    }
  }

  const text = (key: keyof ResearchProjectData, label: string, rows = 3, placeholder?: string, testId?: string) => (
    <Field label={label}>
      {(ids) => <Textarea {...ids} rows={rows} placeholder={placeholder} value={data[key] as string} onChange={(e) => set({ [key]: e.target.value } as Partial<ResearchProjectData>)} data-testid={testId} />}
    </Field>
  );

  const checks = questionChecks(data);
  const helpers = datasets.flatMap((ds) =>
    ds.columns.flatMap((c, i) => {
      const values = ds.rows.map((row) => row[i] ?? "");
      if (c.type === "number") {
        const s = describe(toNumbers(values));
        return s ? [`${ds.name} — ${c.name}: ${r.data.mean} ${Math.round(s.mean * 100) / 100}, ${r.data.median} ${Math.round(s.median * 100) / 100}, ${r.data.min} ${s.min}, ${r.data.max} ${s.max} (n = ${s.n}).`] : [];
      }
      const counts = countValues(values);
      return counts.length ? [`${ds.name} — ${c.name}: ${counts.slice(0, 5).map((x) => `${x.value} ${x.count}`).join(", ")}.`] : [];
    }),
  );

  const panel: Record<ResearchStep, ReactNode> = {
    question: (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={r.question.topic}>{(ids) => <Input {...ids} value={data.topic} maxLength={300} onChange={(e) => set({ topic: e.target.value })} />}</Field>
          <Field label={r.question.type}>
            {(ids) => (
              <Select {...ids} value={data.questionType} onChange={(e) => set({ questionType: e.target.value as ResearchProjectData["questionType"] })}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {r.question.types[t]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {text("question", r.question.question, 2, r.question.questionPlaceholder, "research-question")}
        {text("why", r.question.why, 3)}
        {text("scope", r.question.scope, 2)}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{r.question.subQuestions}</legend>
          {data.subQuestions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`${r.question.subQuestions} ${i + 1}`} value={q} maxLength={400} onChange={(e) => set({ subQuestions: data.subQuestions.map((x, j) => (j === i ? e.target.value : x)) })} />
              <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set({ subQuestions: data.subQuestions.filter((_, j) => j !== i) })}>
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
          ))}
          {!readOnly && data.subQuestions.length < 6 ? (
            <Button variant="secondary" size="sm" onClick={() => set({ subQuestions: [...data.subQuestions, ""] })}>
              <Plus aria-hidden className="size-4" />
              {r.question.addSub}
            </Button>
          ) : null}
        </fieldset>
        <div className="rounded-xl border border-line bg-muted/40 p-4">
          <p className="font-semibold">{r.question.checksTitle}</p>
          <ul className="mt-2 space-y-1.5">
            {(Object.keys(checks) as (keyof typeof checks)[]).map((k) => (
              <li key={k} className="flex items-start gap-2 text-[15px]">
                {checks[k] ? <CheckCircle2 aria-hidden className="mt-0.5 size-4.5 shrink-0 text-success" /> : <CircleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0 text-warn" />}
                {checks[k] ? r.question.checks[k].ok : r.question.checks[k].no}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
    hypothesis: (
      <div className="space-y-4">
        <Notice tone="info">{r.hypothesis.note}</Notice>
        {text("hypothesis", r.hypothesis.statement, 3, r.hypothesis.statementPlaceholder, "research-hypothesis")}
        <div className="grid gap-4 md:grid-cols-3">
          {text("independent", r.hypothesis.independent, 2)}
          {text("dependent", r.hypothesis.dependent, 2)}
          {text("controlled", r.hypothesis.controlled, 2)}
        </div>
        {text("method", r.hypothesis.method, 4)}
      </div>
    ),
    sources: <SourcesPanel projectId={id} sources={sources} onChange={setSources} library={library} readOnly={readOnly} />,
    notes: <NotesPanel projectId={id} mode="notes" notes={notes} sources={sources} onChange={setNotes} readOnly={readOnly} />,
    evidence: <NotesPanel projectId={id} mode="evidence" notes={notes} sources={sources} onChange={setNotes} readOnly={readOnly} />,
    data: <DataPanel projectId={id} datasets={datasets} onChange={setDatasets} readOnly={readOnly} />,
    analysis: (
      <div className="space-y-4">
        {text("analysis", r.analysis.prompt, 8)}
        {helpers.length && !readOnly ? (
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-semibold">{r.analysis.helpers}</p>
            <ul className="mt-2 space-y-1.5">
              {helpers.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="tabular-nums">{h}</span>
                  <Button variant="ghost" size="sm" onClick={() => set({ analysis: `${data.analysis}${data.analysis && !data.analysis.endsWith("\n") ? "\n" : ""}${h}` })}>
                    {r.analysis.insert}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    ),
    findings: (
      <div className="space-y-3">
        <p className="text-[15px] text-ink-muted">{r.findings.prompt}</p>
        {data.findings.map((f, i) => (
          <div key={i} className="flex gap-2">
            <span className="mt-3 w-6 shrink-0 text-right font-semibold text-lab-research">{i + 1}.</span>
            <Textarea aria-label={`${r.steps.findings} ${i + 1}`} rows={2} placeholder={r.findings.placeholder} value={f} onChange={(e) => set({ findings: data.findings.map((x, j) => (j === i ? e.target.value : x)) })} data-testid="finding" />
            <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set({ findings: data.findings.filter((_, j) => j !== i) })}>
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>
        ))}
        {!readOnly && data.findings.length < 8 ? (
          <Button variant="secondary" size="sm" onClick={() => set({ findings: [...data.findings, ""] })} data-testid="add-finding">
            <Plus aria-hidden className="size-4" />
            {r.findings.add}
          </Button>
        ) : null}
      </div>
    ),
    conclusion: (
      <div className="space-y-4">
        {text("conclusion", r.conclusion.conclusion, 5, undefined, "research-conclusion")}
        {text("limitations", r.conclusion.limitations, 3)}
        {text("nextSteps", r.conclusion.nextSteps, 3)}
      </div>
    ),
    presentation: (
      <div className="space-y-4">
        <p className="text-[15px] text-ink-muted">{r.presentation.lead}</p>
        <Field label={r.presentation.audience}>{(ids) => <Input {...ids} value={data.audience} maxLength={300} onChange={(e) => set({ audience: e.target.value })} />}</Field>
        {text("keyMessage", r.presentation.keyMessage, 2)}
        <ButtonLink href={`/present/research/${id}`} variant="secondary" target="_blank">
          <Presentation aria-hidden className="size-4" />
          {r.presentation.open}
        </ButtonLink>
      </div>
    ),
  };

  const doneCount = RESEARCH_STEPS.filter((s) => stepDone(s, data, sources, notes, datasets)).length;

  return (
    <div className="space-y-5" data-testid="research-workspace">
      <Card className="grid gap-4 p-5 md:grid-cols-[2fr_1fr]">
        <fieldset disabled={readOnly} className="contents">
          <Field label={r.projectTitle}>{(ids) => <Input {...ids} value={value.title} maxLength={160} onChange={(e) => setDraft({ ...value, title: e.target.value })} />}</Field>
          <Field label={r.subject}>{(ids) => <Input {...ids} value={value.subject} maxLength={80} onChange={(e) => setDraft({ ...value, subject: e.target.value })} />}</Field>
        </fieldset>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={r.workflowTitle} className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-sm font-medium text-ink-muted">{fmt(r.stepsDone, { n: doneCount, m: RESEARCH_STEPS.length })}</p>
          <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {RESEARCH_STEPS.map((s, i) => {
              const done = stepDone(s, data, sources, notes, datasets);
              return (
                <li key={s} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(s)}
                    aria-current={step === s ? "step" : undefined}
                    className={cn(
                      "flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium transition-colors",
                      step === s ? "bg-lab-research text-white" : "hover:bg-muted",
                    )}
                    data-testid={`step-${s}`}
                  >
                    {done ? <CheckCircle2 aria-hidden className={cn("size-4.5 shrink-0", step === s ? "text-white" : "text-success")} /> : <Circle aria-hidden className="size-4.5 shrink-0 opacity-50" />}
                    <span className="whitespace-nowrap">
                      {i + 1}. {r.steps[s]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <Card className="min-w-0 p-5">
          <h2 className="text-xl font-semibold">{r.steps[step]}</h2>
          <p className="mt-0.5 mb-5 text-sm text-ink-muted">{r.stepHelp[step]}</p>
          <fieldset disabled={readOnly && !["sources", "notes", "evidence", "data"].includes(step)} className="min-w-0">
            {panel[step]}
          </fieldset>
        </Card>
      </div>

      {!readOnly ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-[var(--shadow-raised)] backdrop-blur">
          <Button variant="secondary" onClick={() => save(false)} disabled={busy !== null} data-testid="save-research">
            {busy === "save" ? dict.common.saving : r.save}
          </Button>
          <Button onClick={() => save(true)} disabled={busy !== null} data-testid="submit-research">
            <Send aria-hidden className="size-4" />
            {status === "submitted" ? r.resubmit : r.submit}
          </Button>
          <span className="text-sm text-ink-muted" role="status">
            {unsaved ? r.unsaved : `${dict.labs.stem.recordStatus[status]} · ${fmt(dict.labs.stem.lastSaved, { when: relativeTime(dict, savedAt) })}`}
          </span>
          <Button variant="ghost" className="ml-auto text-danger" onClick={remove} disabled={busy !== null}>
            <Trash2 aria-hidden className="size-4" />
            {r.deleteProject}
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {footer}
    </div>
  );
}
