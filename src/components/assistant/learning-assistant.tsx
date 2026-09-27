"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Bookmark, BookmarkCheck, CircleHelp, ClipboardList, FileSearch, FlaskConical, GraduationCap, Lightbulb, ListChecks, Scale, Search, Sparkles, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { SUBJECTS, type Subject } from "@/lib/domain/catalog";
import type { AssistantMode, AssistantResult, NumberedPassage, ResearchQuestionKind, SavedQuestion } from "@/lib/services/learning-assistant";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

const MODES: AssistantMode[] = ["explain", "locate", "evidence", "check", "questions", "research"];
const MODE_ICONS: Record<AssistantMode, typeof Search> = { explain: Lightbulb, locate: FileSearch, evidence: Scale, check: ListChecks, questions: CircleHelp, research: FlaskConical };
/** The next steps offered after each task: understand → check → question → research. */
const NEXT: Record<AssistantMode, AssistantMode[]> = {
  explain: ["check", "questions", "evidence", "research"],
  locate: ["explain", "check", "questions"],
  evidence: ["locate", "questions", "research"],
  check: ["explain", "questions", "research"],
  questions: ["explain", "research"],
  research: ["explain", "evidence"],
};
const RESEARCH_TYPE: Record<ResearchQuestionKind, "descriptive" | "comparative" | "causal" | "evaluative"> = {
  what_known: "descriptive",
  how_works: "causal",
  why_matters: "evaluative",
  compare_views: "comparative",
  evidence_strength: "evaluative",
};

export interface LearningAssistantProps {
  initialMode?: AssistantMode;
  initialText?: string;
  material: { id: string; title: string } | null;
  initialSubject?: Subject | "";
  aiAvailable: boolean;
  initialSaved?: SavedQuestion[];
  /** Embedded in another page (the library): no saved list, no address-bar updates. */
  embedded?: boolean;
  /** Teachers can hand a question or a research start to students as an assignment. */
  staff?: boolean;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The excerpt with the question's words marked. */
function Highlighted({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.map(escapeRegex).join("|")})`, "giu");
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-brand-soft px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function LearningAssistant({ initialMode = "explain", initialText = "", material: initialMaterial, initialSubject = "", aiAvailable, initialSaved = [], embedded = false, staff = false }: LearningAssistantProps) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const router = useRouter();
  const [mode, setMode] = useState<AssistantMode>(initialMode);
  // A saved or shared "check" link fills in the topic and waits for the student's own words.
  const [text, setText] = useState(initialMode === "check" ? "" : initialText);
  const [topic, setTopic] = useState(initialMode === "check" ? initialText : "");
  const [material, setMaterial] = useState(initialMaterial);
  const [subject, setSubject] = useState<Subject | "">(initialSubject);
  const [useAI, setUseAI] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [saved, setSaved] = useState<SavedQuestion[]>(initialSaved);
  const [savedThis, setSavedThis] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState("");
  const [researchKind, setResearchKind] = useState<ResearchQuestionKind>("what_known");
  const [starting, setStarting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const ranInitial = useRef(false);

  const pageLabel = (start: number | null, end: number | null) =>
    start === null ? null : end !== null && end !== start ? fmt(a.pages, { from: start, to: end }) : fmt(a.page, { n: start });

  const run = async (next: { mode: AssistantMode; text: string; topic?: string; material?: { id: string; title: string } | null }) => {
    const value = next.text.trim();
    if (value.length < 2) return;
    const scopeMaterial = next.material === undefined ? material : next.material;
    setMode(next.mode);
    setText(next.text);
    if (next.topic !== undefined) setTopic(next.topic);
    setBusy(true);
    setError(null);
    setSavedThis(false);
    try {
      const response = await api<AssistantResult>("/api/learning-assistant", {
        body: {
          mode: next.mode,
          text: value,
          topic: next.mode === "check" ? (next.topic ?? topic).trim() : "",
          materialId: scopeMaterial?.id,
          subject: scopeMaterial ? undefined : subject || undefined,
          useAI,
        },
      });
      setResult(response);
      if (response.research) {
        setResearchKind(response.research.questions[0]?.kind ?? "what_known");
        const first = response.research.questions[0];
        setResearchQuestion(first ? fmt(a.researchKinds[first.kind], { subject: first.subject }) : "");
      }
      if (!embedded) {
        const params = new URLSearchParams({ mode: next.mode, q: next.mode === "check" ? (next.topic ?? topic) || value : value });
        if (scopeMaterial) params.set("material", scopeMaterial.id);
        else if (subject) params.set("subject", subject);
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
      requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }));
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // A shared or saved link opens with its result.
    if (ranInitial.current || !initialText.trim() || initialMode === "check") return;
    ranInitial.current = true;
    void run({ mode: initialMode, text: initialText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run({ mode, text, topic });
  };

  const switchMode = (next: AssistantMode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    if (next === "check") {
      setTopic(result?.query ?? text);
      setText("");
    } else if (mode === "check") {
      setText(topic || text);
    }
  };

  const nextStep = (next: AssistantMode) => {
    const subjectText = result?.query ?? text;
    if (next === "check") {
      setMode("check");
      setTopic(subjectText);
      setText("");
      setResult(null);
      return;
    }
    void run({ mode: next, text: subjectText });
  };

  const saveCurrent = async () => {
    if (!result) return;
    try {
      const response = await api<{ saved: SavedQuestion }>("/api/learning-assistant/saved", {
        body: { mode: result.mode, question: result.query, materialId: result.scope.materialId, subject: result.scope.subject },
      });
      setSaved((list) => [response.saved, ...list]);
      setSavedThis(true);
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  const startProject = async () => {
    if (!result) return;
    setStarting(true);
    setError(null);
    try {
      const response = await api<{ projectId: string }>("/api/learning-assistant/research", {
        body: {
          topic: result.query,
          question: researchQuestion.trim() || result.query,
          questionType: RESEARCH_TYPE[researchKind],
          materialId: result.scope.materialId ?? undefined,
          subject: result.scope.subject ?? undefined,
        },
      });
      router.push(`/labs/research/${response.projectId}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setStarting(false);
    }
  };

  const assignHref = (kind: "research" | "custom", title: string, instructions: string) =>
    `/teacher/assignments/new?${new URLSearchParams({ kind, title: title.slice(0, 150), instructions: instructions.slice(0, 3000) }).toString()}`;

  const cite = (n: number) => (
    <a key={n} href={`#passage-${n}`} className="mx-0.5 inline-flex min-w-6 items-center justify-center rounded-md bg-brand-soft px-1.5 py-0.5 align-middle text-xs font-semibold text-brand-ink no-underline hover:bg-brand hover:text-white" aria-label={fmt(a.cite, { n })}>
      {n}
    </a>
  );

  const modeCopy = a.modes[mode];
  const textIsLong = mode === "evidence" || mode === "check";

  return (
    <div className="space-y-6">
      {/* ---- task picker ---- */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-muted">{a.modeLabel}</legend>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3" data-testid="assistant-modes">
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={active}
                data-testid={`assistant-mode-${m}`}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-2.5 text-left text-[15px] font-medium transition-colors sm:min-h-14 sm:py-3",
                  active ? "border-brand bg-brand-soft/60 text-brand-ink" : "border-line bg-surface hover:border-brand/40 hover:bg-brand-soft/30",
                )}
              >
                <Icon aria-hidden className={cn("size-5 shrink-0", active ? "text-brand" : "text-ink-subtle")} />
                <span className="min-w-0">{a.modes[m].label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- the question ---- */}
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]" data-testid="assistant-form">
        {mode === "check" ? (
          <div>
            <label htmlFor="assistant-topic" className="mb-1.5 block text-sm font-medium">
              {a.modes.check.topic}
            </label>
            <Input id="assistant-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={a.modes.check.topicPlaceholder} maxLength={300} className="h-12 text-base" data-testid="assistant-topic" />
          </div>
        ) : null}
        <div>
          <label htmlFor="assistant-text" className={cn(mode === "check" ? "mb-1.5 block text-sm font-medium" : "sr-only")}>
            {mode === "check" ? modeCopy.label : a.textLabel}
          </label>
          <Textarea
            id="assistant-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !textIsLong) {
                e.preventDefault();
                void run({ mode, text, topic });
              }
            }}
            placeholder={modeCopy.placeholder}
            rows={textIsLong ? 4 : 2}
            maxLength={2000}
            className="text-base"
            data-testid="assistant-text"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {material ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span data-testid="assistant-scope" className="min-w-0">
                <Badge tone="brand" className="max-w-full whitespace-normal">
                  <BookMarked aria-hidden className="size-3.5 shrink-0" />
                  {fmt(a.scope.onlyMaterial, { title: material.title })}
                </Badge>
              </span>
              <button type="button" className="font-medium text-brand hover:underline" onClick={() => setMaterial(null)}>
                {a.scope.searchEverything}
              </button>
            </div>
          ) : (
            <Select aria-label={a.scope.label} value={subject} onChange={(e) => setSubject(e.target.value as Subject | "")} className="h-12 sm:w-auto sm:min-w-64" data-testid="assistant-subject">
              <option value="">{a.scope.everything}</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {dict.subjects[s]}
                </option>
              ))}
            </Select>
          )}
          {mode === "explain" && aiAvailable ? <Checkbox label={a.useAI} checked={useAI} onChange={(e) => setUseAI(e.target.checked)} /> : null}
          <Button type="submit" size="lg" disabled={busy || text.trim().length < 2} className="h-12 sm:ml-auto" data-testid="assistant-submit">
            {modeCopy.action}
          </Button>
        </div>
        {mode === "explain" && !aiAvailable ? <p className="text-xs text-ink-subtle">{a.aiUnavailable}</p> : null}
      </form>

      {!result && !busy && mode === "explain" ? (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">{a.examples}</p>
          <div className="flex flex-wrap gap-2">
            {a.exampleQuestions.map((q) => (
              <button key={q} type="button" onClick={() => void run({ mode: "explain", text: q })} className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-sm hover:border-brand/40 hover:bg-brand-soft/40">
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {busy ? <Spinner label={a.working} /> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {/* ---- the result ---- */}
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {result && !busy ? (
          <div className="space-y-5" data-testid="assistant-result" data-found={result.match === "full" ? "yes" : result.match === "partial" ? "partial" : "no"}>
            <ResultLead result={result} />

            {result.mode === "explain" ? <ExplainBlock result={result} cite={cite} /> : null}
            {result.mode === "evidence" && result.statement ? <EvidenceBlock result={result} cite={cite} /> : null}
            {result.mode === "check" && result.checks ? <CheckBlock result={result} cite={cite} /> : null}
            {result.mode === "questions" && result.questions ? (
              <section className="rounded-2xl border border-line bg-surface p-5" data-testid="assistant-questions">
                <h2 className="flex items-center gap-2 font-semibold">
                  <CircleHelp aria-hidden className="size-4 text-brand" />
                  {a.questionsTitle}
                </h2>
                <ol className="mt-3 space-y-2">
                  {result.questions.map((q, i) => (
                    <li key={`${q.kind}-${i}`} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="min-w-0 text-[15px]">
                        {fmt(a.questionKinds[q.kind], { subject: q.subject })}
                        {q.n ? <span className="ml-1">{cite(q.n)}</span> : null}
                      </span>
                      {q.kind !== "not_covered" ? (
                        <Button variant="ghost" size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => void run({ mode: "explain", text: q.subject })}>
                          {a.explainThis}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ol>
                {staff ? (
                  <ButtonLink
                    href={assignHref(
                      "custom",
                      result.query,
                      fmt(a.assignQuestionsText, {
                        questions: result.questions
                          .map((q, i) => `${i + 1}. ${fmt(a.questionKinds[q.kind], { subject: q.subject })}`)
                          .join("\n"),
                      }),
                    )}
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    data-testid="assign-questions"
                  >
                    <ClipboardList aria-hidden className="size-4" />
                    {a.assignQuestions}
                  </ButtonLink>
                ) : null}
              </section>
            ) : null}
            {result.mode === "research" && result.research ? (
              <section className="space-y-4 rounded-2xl border border-lab-research/30 bg-lab-research/5 p-5" data-testid="assistant-research">
                <h2 className="flex items-center gap-2 font-semibold">
                  <FlaskConical aria-hidden className="size-4 text-lab-research" />
                  {a.researchTitle}
                </h2>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-ink-muted">{a.researchQuestionsTitle}</legend>
                  <div className="space-y-2">
                    {result.research.questions.map((q) => {
                      const label = fmt(a.researchKinds[q.kind], { subject: q.subject });
                      return (
                        <label key={q.kind} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3 text-[15px] has-[:checked]:border-brand">
                          <input
                            type="radio"
                            name="research-question"
                            className="mt-1 size-4 shrink-0 accent-[var(--color-brand)]"
                            checked={researchKind === q.kind}
                            onChange={() => {
                              setResearchKind(q.kind);
                              setResearchQuestion(label);
                            }}
                          />
                          <span className="min-w-0">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="research-question" className="mb-1.5 block text-sm font-medium">
                    {a.yourQuestion}
                  </label>
                  <Textarea id="research-question" value={researchQuestion} onChange={(e) => setResearchQuestion(e.target.value)} rows={2} maxLength={600} data-testid="research-question" />
                </div>
                {result.research.sources.length ? (
                  <div>
                    <h3 className="text-sm font-semibold">{a.sourcesTitle}</h3>
                    <ul className="mt-1.5 space-y-1 text-[15px]">
                      {result.research.sources.map((s) => (
                        <li key={s.sourceId} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Badge>{a.sourceKinds[s.kind]}</Badge>
                          <span className="min-w-0 break-words">{s.sourceTitle}</span>
                          <span>{s.passages.map((n) => cite(n))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {result.research.gaps.length && result.found ? (
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">{a.gapsTitle}:</span> {result.research.gaps.join(", ")}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button onClick={() => void startProject()} disabled={starting || researchQuestion.trim().length < 2} data-testid="start-research">
                    <FlaskConical aria-hidden className="size-4" />
                    {starting ? a.starting : a.startProject}
                  </Button>
                  {staff ? (
                    <ButtonLink href={assignHref("research", researchQuestion.trim() || result.query, fmt(a.assignResearchText, { question: researchQuestion.trim() || result.query }))} variant="secondary" data-testid="assign-research">
                      <ClipboardList aria-hidden className="size-4" />
                      {a.assignResearch}
                    </ButtonLink>
                  ) : null}
                  <p className="text-xs text-ink-subtle">{a.projectNote}</p>
                </div>
              </section>
            ) : null}

            {result.passages.length ? (
              <section>
                <h2 className="mb-2 font-semibold">{a.passagesTitle}</h2>
                <ol className="space-y-3" data-testid="assistant-passages">
                  {result.passages.map((p) => (
                    <PassageCard key={p.n} passage={p} pageLabel={pageLabel(p.pageStart, p.pageEnd)} />
                  ))}
                </ol>
              </section>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              {result.found ? (
                <>
                  <span className="text-sm font-medium text-ink-muted">{a.nextTitle}:</span>
                  <div className="flex flex-wrap gap-2" data-testid="assistant-next">
                    {NEXT[result.mode].map((m) => (
                      <Button key={m} variant="secondary" size="sm" onClick={() => nextStep(m)}>
                        {a.next[m]}
                      </Button>
                    ))}
                  </div>
                </>
              ) : null}
              {!embedded ? (
                <Button variant="ghost" size="sm" className="sm:ml-auto" onClick={() => void saveCurrent()} disabled={savedThis} data-testid="assistant-save">
                  {savedThis ? <BookmarkCheck aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
                  {savedThis ? a.saved : a.save}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {!embedded ? (
        <SavedList
          saved={saved}
          onOpen={(s) => {
            const scope = s.materialId && s.materialTitle ? { id: s.materialId, title: s.materialTitle } : null;
            setMaterial(scope);
            if (s.subject && !scope) setSubject(s.subject);
            if (s.mode === "check") {
              setMode("check");
              setTopic(s.question);
              setText("");
              setResult(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
            void run({ mode: s.mode, text: s.question, material: scope });
          }}
          onChange={setSaved}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ result blocks ------------------------------ */

function ResultLead({ result }: { result: AssistantResult }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const total = result.searched.materials + result.searched.lessons;
  if (total === 0) return <Notice tone="info">{a.nothingToSearch}</Notice>;
  if (!result.found) {
    return (
      <Notice tone="warn" title={a.notFoundTitle}>
        {a.notFoundText}
      </Notice>
    );
  }
  const missing = result.terms.filter((t) => !t.found).map((t) => t.surface);
  const partial = result.match === "partial";
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-[15px]", partial ? "border-warn/30 bg-warn-soft/40" : "border-success/30 bg-success-soft/30")} data-testid="assistant-lead">
      <p className="font-medium">{partial ? a.partialTitle : result.scope.materialId ? a.foundLeadMaterial : a.foundLead}</p>
      {partial ? <p className="mt-0.5 text-sm">{a.partialText}</p> : null}
      <p className="mt-0.5 text-sm text-ink-muted">
        {fmtCount(a.searched, total)}
        {missing.length ? ` ${fmt(a.notInMaterial, { words: missing.join(", ") })}` : ""}
      </p>
    </div>
  );
}

function ExplainBlock({ result, cite }: { result: AssistantResult; cite: (n: number) => ReactNode }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const ai = result.ai;
  return (
    <>
      {result.key.length ? (
        <section className="rounded-2xl border border-line bg-surface p-5" data-testid="assistant-key">
          <h2 className="flex items-center gap-2 font-semibold">
            <GraduationCap aria-hidden className="size-4 text-brand" />
            {a.fromMaterial}
          </h2>
          <ul className="mt-3 space-y-3">
            {result.key.map((k, i) => (
              <li key={i} className="border-l-4 border-brand/30 pl-3">
                <Badge tone="brand">{a.keyTypes[k.type]}</Badge>
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  „{k.content}“ {cite(k.n)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {ai?.status === "used" && ai.claims.length ? (
        <section className="rounded-2xl border border-ai/25 bg-ai-soft/40 p-5" data-testid="assistant-ai">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles aria-hidden className="size-4 text-ai" />
            {a.aiTitle}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {ai.claims.map((c, i) => {
              const tone: Tone = c.status === "grounded" ? "success" : c.status === "inferred" ? "brand" : c.status === "uncertain" ? "neutral" : "danger";
              return (
                <li key={i} className={cn("rounded-xl bg-surface/70 p-3", c.status === "unsupported" && "border border-danger/30")} data-status={c.status}>
                  <p className={cn("text-[15px] leading-relaxed", c.status === "unsupported" && "text-ink-muted")}>
                    {c.text} {c.sources.map((n) => cite(n))}
                  </p>
                  <Badge tone={tone} className="mt-1.5 whitespace-normal">
                    {a.claimStatus[c.status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
          {!ai.covered ? <p className="mt-3 text-sm text-warn">{a.aiNotCovered}</p> : null}
          {ai.checkQuestion ? (
            <p className="mt-3 rounded-xl border border-line bg-surface p-3 text-[15px]">
              <span className="font-semibold">{a.testYourself}:</span> {ai.checkQuestion}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-ink-muted">{a.aiNote}</p>
        </section>
      ) : null}
      {result.match === "full" && (ai?.status === "off" || ai?.status === "failed") ? (
        <p className="text-sm text-ink-muted" data-testid="assistant-ai-note">
          {ai.status === "failed" ? a.aiFailedNote : a.aiOffNote}
        </p>
      ) : null}
    </>
  );
}

function EvidenceBlock({ result, cite }: { result: AssistantResult; cite: (n: number) => ReactNode }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const s = result.statement!;
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5" data-testid="assistant-evidence">
      <div>
        <h2 className="font-semibold">{a.statementTitle}</h2>
        <p className="mt-1 text-[15px]">„{result.query}“</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.types.map((t) => (
            <Badge key={t} className="whitespace-normal">
              {a.statementTypes[t]}
            </Badge>
          ))}
        </div>
        {s.opinion ? <p className="mt-2 text-sm text-ink-muted">{a.opinionNote}</p> : null}
      </div>
      {s.assumptions.length ? (
        <div>
          <h3 className="text-sm font-semibold">{a.assumptionsTitle}</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[15px]">
            {s.assumptions.map((id) => (
              <li key={id}>{a.assumptions[id]}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold">{a.supportingTitle}</h3>
        {s.supporting.length ? (
          <ul className="mt-1.5 space-y-2">
            {s.supporting.map((x, i) => (
              <li key={i} className="rounded-xl border border-line p-3 text-[15px]">
                „{x.sentence}“ {cite(x.n)}
                {x.mayContradict ? <p className="mt-1 text-sm text-warn">{a.mayContradict}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm text-ink-muted">{a.noSupport}</p>
        )}
      </div>
      {s.otherViews.length ? (
        <div>
          <h3 className="text-sm font-semibold">{a.otherViewsTitle}</h3>
          <ul className="mt-1.5 space-y-2">
            {s.otherViews.map((k, i) => (
              <li key={i} className="rounded-xl border border-line p-3 text-[15px]">
                <Badge>{a.keyTypes[k.type]}</Badge> „{k.content}“ {cite(k.n)}
                {k.relatedTo ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    {a.relatesTo} „{k.relatedTo.content}“
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CheckBlock({ result, cite }: { result: AssistantResult; cite: (n: number) => ReactNode }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const checks = result.checks!;
  const tones: Record<string, Tone> = { found: "success", partly: "brand", numbers_differ: "warn", may_contradict: "warn", not_found: "neutral" };
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" data-testid="assistant-checks">
      <h2 className="font-semibold">{a.checkTitle}</h2>
      <ol className="mt-3 space-y-2.5">
        {checks.map((c, i) => (
          <li key={i} className="rounded-xl border border-line p-3" data-status={c.status}>
            <p className="text-[15px]">{c.sentence}</p>
            <Badge tone={tones[c.status]} className="mt-1.5 whitespace-normal">
              {a.checkStatus[c.status]}
            </Badge>
            {c.match && c.status !== "found" ? (
              <p className="mt-1.5 text-sm text-ink-muted">
                {fmt(a.compareWith, { n: c.match.n })} „{c.match.text}“ {cite(c.match.n)}
              </p>
            ) : c.match ? (
              <span className="ml-1">{cite(c.match.n)}</span>
            ) : null}
          </li>
        ))}
      </ol>
      {checks.some((c) => c.status === "not_found") ? <p className="mt-3 text-sm text-ink-muted">{a.notFoundIsNotWrong}</p> : null}
    </section>
  );
}

function PassageCard({ passage: p, pageLabel }: { passage: NumberedPassage; pageLabel: string | null }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const [open, setOpen] = useState(false);
  return (
    <li id={`passage-${p.n}`} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-4" data-testid="assistant-passage">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand-ink">{p.n}</span>
        <Badge>{a.sourceKinds[p.kind]}</Badge>
        <a href={p.href} className="min-w-0 font-medium break-words text-brand hover:underline" {...(p.kind === "material" ? { target: "_blank", rel: "noopener" } : {})}>
          {p.sourceTitle}
        </a>
        {p.section ? <span className="min-w-0 break-words text-ink-muted">· {p.section}</span> : null}
        {pageLabel ? <span className="text-ink-subtle">· {pageLabel}</span> : null}
        <span className="text-ink-subtle">· {dict.subjects[p.subject]}</span>
      </div>
      <p className="fc-prose mt-2 text-[15px] leading-relaxed">
        {open ? <span className="whitespace-pre-line">{p.text}</span> : <Highlighted text={p.excerpt} words={p.highlights} />}
      </p>
      {p.text.length > p.excerpt.length + 5 ? (
        <button type="button" className="mt-1.5 text-sm font-medium text-brand hover:underline" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? a.showLess : a.showWhole}
        </button>
      ) : null}
    </li>
  );
}


function SavedList({ saved, onOpen, onChange }: { saved: SavedQuestion[]; onOpen: (s: SavedQuestion) => void; onChange: (next: SavedQuestion[]) => void }) {
  const { dict } = useI18n();
  const a = dict.assistant;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const saveNote = async (s: SavedQuestion) => {
    const note = notes[s.id] ?? s.note;
    try {
      await api(`/api/learning-assistant/saved/${s.id}`, { method: "PATCH", body: { note } });
      onChange(saved.map((x) => (x.id === s.id ? { ...x, note } : x)));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };
  const remove = async (s: SavedQuestion) => {
    try {
      await api(`/api/learning-assistant/saved/${s.id}`, { method: "DELETE" });
      onChange(saved.filter((x) => x.id !== s.id));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" data-testid="assistant-saved">
      <h2 className="flex items-center gap-2 font-semibold">
        <Bookmark aria-hidden className="size-4 text-brand" />
        {a.savedTitle}
      </h2>
      {error ? <Notice tone="danger" className="mt-3">{error}</Notice> : null}
      {saved.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">{a.savedEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {saved.map((s) => {
            const note = notes[s.id] ?? s.note;
            return (
              <li key={s.id} className="rounded-xl border border-line p-3" data-testid="saved-question">
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <Badge tone="brand" className="whitespace-normal">
                    {a.modes[s.mode].label}
                  </Badge>
                  {s.materialTitle ? <span className="min-w-0 break-words">· {s.materialTitle}</span> : null}
                </div>
                <p className="mt-1.5 font-medium break-words">{s.question}</p>
                <label className="mt-2 block text-sm font-medium" htmlFor={`note-${s.id}`}>
                  {a.note}
                </label>
                <Textarea id={`note-${s.id}`} rows={2} value={note} placeholder={a.notePlaceholder} maxLength={2000} onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))} className="mt-1" />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onOpen(s)}>
                    {a.openAgain}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={note === s.note} onClick={() => void saveNote(s)}>
                    {a.saveNote}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(s)} aria-label={`${a.remove}: ${s.question}`}>
                    <Trash2 aria-hidden className="size-4" />
                    {a.remove}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
