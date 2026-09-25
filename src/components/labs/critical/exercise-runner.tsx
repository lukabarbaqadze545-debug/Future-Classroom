"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, CircleAlert, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr, type L } from "@/lib/labs/localized";
import type { StudentExercise, AttemptRecord } from "@/lib/labs/critical/service";
import type { BuilderAnswers, CtResult, DebateAnswers, DecisionAnswers, EvidenceType, HumilityAnswers, ItemAnswers } from "@/lib/labs/critical/grade";
import { TAG_ROLES, type TagRole } from "@/lib/labs/critical/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";
import { useLocalJsonDraft } from "../use-local-draft";
import { DebateTimer } from "./debate-timer";

const EVIDENCE_TYPES: EvidenceType[] = ["statistic", "study", "expert", "document", "example", "personal"];

type Answers = ItemAnswers | BuilderAnswers | DebateAnswers | HumilityAnswers | DecisionAnswers;

function emptyAnswers(exercise: StudentExercise, locale: "en" | "ka"): Answers {
  switch (exercise.kind) {
    case "builder":
      return {
        questionId: exercise.questions[0]?.id ?? "",
        claim: "",
        reasons: [
          { text: "", evidence: "", evidenceType: "example" },
          { text: "", evidence: "", evidenceType: "example" },
        ],
        counter: "",
        rebuttal: "",
        conclusion: "",
      };
    case "debate":
      return { side: "for", arguments: [0, 1, 2].map(() => ({ point: "", support: "" })), steelman: "", rebuttal: "", switched: "" };
    case "humility":
      return { ratings: {}, belief: "", changeMind: "", opposing: "" };
    case "decision":
      return {
        options: exercise.options.map((o) => tr(o, locale)),
        criteria: exercise.criteria.map((c) => ({ name: tr(c, locale), weight: 3 })),
        scores: exercise.options.map(() => exercise.criteria.map(() => 0)),
        reflection: "",
      };
    default:
      return { items: {} };
  }
}

export function ExerciseRunner({ exercise, viewAttempt }: { exercise: StudentExercise; viewAttempt: AttemptRecord | null }) {
  const { dict, locale } = useI18n();
  const c = dict.labs.critical;
  const router = useRouter();
  const [draft, setDraft, clearDraft] = useLocalJsonDraft<Answers>(`ct:${exercise.id}`, emptyAnswers(exercise, locale));
  const [result, setResult] = useState<CtResult | null>(viewAttempt?.result ?? null);
  const [shownAnswers, setShownAnswers] = useState<Answers | null>((viewAttempt?.answers as Answers) ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answers = shownAnswers ?? draft;
  const locked = result !== null;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ attempt: AttemptRecord }>("/api/labs/critical/attempts", { body: { exerciseId: exercise.id, answers: draft } });
      setResult(res.attempt.result);
      setShownAnswers(draft);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    clearDraft();
    setResult(null);
    setShownAnswers(null);
    if (viewAttempt) router.replace(`/labs/critical-thinking/${exercise.id}`);
  }

  const itemsComplete =
    exercise.items.length > 0 &&
    exercise.items.every((item) => {
      const a = (answers as ItemAnswers).items?.[item.id];
      if (item.type === "choice") return typeof a === "string";
      if (item.type === "multi") return Array.isArray(a) && a.length > 0;
      return a && typeof a === "object" && item.segments.every((s) => (a as Record<string, string>)[s.id]);
    });

  return (
    <div className="space-y-5" data-testid="ct-runner">
      {result ? <ResultSummary result={result} onRestart={restart} /> : null}

      {exercise.passage ? (
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-muted/60 px-5 py-2 text-xs font-medium text-ink-muted">{tr(exercise.passage.label, locale)}</div>
          <article className="px-5 py-4">
            <h2 className="text-lg font-semibold">{tr(exercise.passage.title, locale)}</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{tr(exercise.passage.body, locale)}</p>
          </article>
        </Card>
      ) : null}

      {exercise.items.length ? (
        <ItemsForm exercise={exercise} answers={answers as ItemAnswers} setAnswers={(a) => setDraft(a)} result={result} locked={locked} />
      ) : exercise.kind === "builder" ? (
        <BuilderForm exercise={exercise} answers={answers as BuilderAnswers} setAnswers={setDraft} locked={locked} />
      ) : exercise.kind === "debate" ? (
        <DebateForm exercise={exercise} answers={answers as DebateAnswers} setAnswers={setDraft} locked={locked} />
      ) : exercise.kind === "humility" ? (
        <HumilityForm exercise={exercise} answers={answers as HumilityAnswers} setAnswers={setDraft} result={result} locked={locked} />
      ) : exercise.kind === "decision" ? (
        <DecisionForm exercise={exercise} answers={answers as DecisionAnswers} setAnswers={setDraft} result={result} locked={locked} />
      ) : null}

      {result && !exercise.items.length ? <Checklist result={result} /> : null}

      {!locked ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={submit} disabled={busy || (exercise.items.length > 0 && !itemsComplete)} data-testid="ct-submit">
            {busy ? c.checking : exercise.items.length ? c.checkAnswers : c.submit}
          </Button>
          {exercise.items.length > 0 && !itemsComplete ? <span className="text-sm text-ink-muted">{c.answerAll}</span> : null}
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}

function ResultSummary({ result, onRestart }: { result: CtResult; onRestart: () => void }) {
  const { dict } = useI18n();
  const c = dict.labs.critical;
  const ratio = result.max ? result.score / result.max : 0;
  return (
    <Card className={cn("flex flex-wrap items-center justify-between gap-4 px-5 py-4", ratio >= 0.8 ? "border-success/40 bg-success-soft/50" : ratio >= 0.5 ? "border-warn/30 bg-warn-soft/40" : "border-danger/25 bg-danger-soft/40")} data-testid="ct-result">
      <div>
        <p className="text-sm font-medium text-ink-muted">{c.resultTitle}</p>
        <p className="text-2xl font-semibold tabular-nums" role="status">
          {fmt(c.scored, { score: result.score, max: result.max })}
        </p>
      </div>
      <Button variant="secondary" onClick={onRestart}>
        <RotateCcw aria-hidden className="size-4" />
        {c.again}
      </Button>
    </Card>
  );
}

// ------------------------------------------------------------------ Items

function ItemsForm({ exercise, answers, setAnswers, result, locked }: { exercise: StudentExercise; answers: ItemAnswers; setAnswers: (a: ItemAnswers) => void; result: CtResult | null; locked: boolean }) {
  const { dict, locale } = useI18n();
  const c = dict.labs.critical;
  const set = (id: string, value: ItemAnswers["items"][string]) => setAnswers({ items: { ...(answers.items ?? {}), [id]: value } });
  return (
    <ol className="space-y-4">
      {exercise.items.map((item, index) => {
        const feedback = result?.items?.find((f) => f.id === item.id);
        const given = answers.items?.[item.id];
        return (
          <li key={item.id}>
            <Card className={cn(feedback ? (feedback.correct ? "border-success/40" : "border-danger/30") : null)} data-testid="ct-item">
              <div className="space-y-3 px-5 py-4">
                <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  {index + 1} / {exercise.items.length}
                </p>
                {item.context ? <blockquote className="rounded-xl border-l-4 border-lab-critical/50 bg-muted/60 px-4 py-3 text-[15px] leading-relaxed">{tr(item.context, locale)}</blockquote> : null}
                <p className="font-semibold">{tr(item.prompt, locale)}</p>
                {item.type === "multi" ? <p className="-mt-2 text-sm text-ink-muted">{c.selectAll}</p> : null}

                {item.type === "tag" ? (
                  <ul className="space-y-3">
                    {item.segments.map((seg) => {
                      const chosen = (given as Record<string, TagRole> | undefined)?.[seg.id];
                      const right = feedback ? (feedback.answer as Record<string, TagRole>)[seg.id] : null;
                      return (
                        <li key={seg.id} className="rounded-xl border border-line p-3">
                          <p className="text-[15px]">{tr(seg.text, locale)}</p>
                          <div role="radiogroup" aria-label={c.whatIsSentence} className="mt-2 flex flex-wrap gap-2">
                            {TAG_ROLES.map((role) => (
                              <button
                                key={role}
                                type="button"
                                role="radio"
                                aria-checked={chosen === role}
                                disabled={locked}
                                onClick={() => set(item.id, { ...((given as Record<string, TagRole>) ?? {}), [seg.id]: role })}
                                className={cn(
                                  "min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors",
                                  chosen === role ? "border-lab-critical bg-lab-critical text-white" : "border-line-strong hover:bg-muted",
                                  right && role === right && chosen !== role ? "border-success text-success" : null,
                                )}
                              >
                                {c.roles[role]}
                              </button>
                            ))}
                          </div>
                          {right && chosen !== right ? (
                            <p className="mt-2 text-sm text-danger">
                              {c.theAnswer}: {c.roles[right]}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="space-y-2" role={item.type === "choice" ? "radiogroup" : "group"} aria-label={tr(item.prompt, locale)}>
                    {item.options.map((o) => {
                      const selected = item.type === "choice" ? given === o.id : Array.isArray(given) && given.includes(o.id);
                      const isRight = feedback ? (Array.isArray(feedback.answer) ? feedback.answer.includes(o.id) : feedback.answer === o.id) : false;
                      return (
                        <label
                          key={o.id}
                          className={cn(
                            "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors",
                            selected ? "border-lab-critical bg-lab-critical/5" : "border-line-strong hover:bg-muted/60",
                            feedback && isRight ? "border-success bg-success-soft/50" : null,
                            feedback && selected && !isRight ? "border-danger bg-danger-soft/50" : null,
                            locked ? "cursor-default" : null,
                          )}
                          data-testid="ct-option"
                        >
                          <input
                            type={item.type === "choice" ? "radio" : "checkbox"}
                            name={`${exercise.id}-${item.id}`}
                            checked={selected}
                            disabled={locked}
                            onChange={() => {
                              if (item.type === "choice") set(item.id, o.id);
                              else {
                                const list = Array.isArray(given) ? given : [];
                                set(item.id, selected ? list.filter((x) => x !== o.id) : [...list, o.id]);
                              }
                            }}
                            className="mt-1 size-4 shrink-0 accent-[var(--color-lab-critical)]"
                          />
                          <span className="flex-1">{tr(o.text, locale)}</span>
                          {feedback && isRight ? <CheckCircle2 aria-label={c.correct} className="mt-0.5 size-5 shrink-0 text-success" /> : null}
                          {feedback && selected && !isRight ? <XCircle aria-label={c.notCorrect} className="mt-0.5 size-5 shrink-0 text-danger" /> : null}
                        </label>
                      );
                    })}
                  </div>
                )}

                {feedback ? (
                  <div className="space-y-2 rounded-xl bg-muted/60 px-4 py-3 text-[15px]">
                    <p className={cn("font-semibold", feedback.correct ? "text-success" : "text-danger")}>
                      {feedback.correct ? c.correct : feedback.max > 1 ? fmt(c.partly, { n: feedback.points, m: feedback.max }) : c.notCorrect}
                    </p>
                    <p>
                      <span className="font-medium">{c.why}: </span>
                      {tr(feedback.explanation, locale)}
                    </p>
                    {feedback.better ? (
                      <p>
                        <span className="font-medium">{c.betterWay}: </span>
                        {tr(feedback.better, locale)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

// ------------------------------------------------------------------ Checklist

function Checklist({ result }: { result: CtResult }) {
  const { dict } = useI18n();
  const c = dict.labs.critical;
  if (!result.checks?.length) return null;
  return (
    <Card>
      <CardHeader title={c.resultTitle} description={c.checklistLead} />
      <ul className="divide-y divide-line">
        {result.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-3 px-5 py-3 text-[15px]">
            {check.met ? <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-warn" />}
            <span>
              {check.met ? c.checks[check.id].met : c.checks[check.id].notMet}
              {check.found?.length ? <span className="block text-sm text-ink-muted">{fmt(c.found, { words: check.found.join(", ") })}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ------------------------------------------------------------------ Builder

function BuilderForm({ exercise, answers, setAnswers, locked }: { exercise: StudentExercise; answers: BuilderAnswers; setAnswers: (a: BuilderAnswers) => void; locked: boolean }) {
  const { dict, locale } = useI18n();
  const b = dict.labs.critical.builder;
  const set = <K extends keyof BuilderAnswers>(key: K, value: BuilderAnswers[K]) => setAnswers({ ...answers, [key]: value });
  const question = exercise.questions.find((q) => q.id === answers.questionId) ?? exercise.questions[0];
  return (
    <fieldset disabled={locked} className="space-y-5">
      <Card className="space-y-3 p-5">
        <p className="font-semibold">{b.chooseQuestion}</p>
        <div className="grid gap-2 md:grid-cols-2">
          {exercise.questions.map((q) => (
            <label key={q.id} className={cn("flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3", answers.questionId === q.id ? "border-lab-critical bg-lab-critical/5" : "border-line-strong hover:bg-muted/60")}>
              <input type="radio" name="question" checked={answers.questionId === q.id} onChange={() => set("questionId", q.id)} className="mt-1 accent-[var(--color-lab-critical)]" />
              <span className="text-[15px]">{tr(q.text, locale)}</span>
            </label>
          ))}
        </div>
        {question ? <p className="text-sm text-ink-muted">{tr(question.context, locale)}</p> : null}
      </Card>
      <Card className="space-y-4 p-5">
        <Field label={b.claim} hint={b.claimHelp}>
          {(ids) => <Textarea {...ids} rows={2} value={answers.claim} onChange={(e) => set("claim", e.target.value)} data-testid="ct-claim" />}
        </Field>
        {answers.reasons.map((r, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{fmt(b.reason, { n: i + 1 })}</p>
              {answers.reasons.length > 1 ? (
                <Button variant="ghost" size="sm" aria-label={dict.common.remove} onClick={() => set("reasons", answers.reasons.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              ) : null}
            </div>
            <Textarea aria-label={fmt(b.reason, { n: i + 1 })} rows={2} placeholder={b.reasonPlaceholder} value={r.text} onChange={(e) => set("reasons", answers.reasons.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Textarea aria-label={b.evidence} rows={2} placeholder={b.evidencePlaceholder} value={r.evidence} onChange={(e) => set("reasons", answers.reasons.map((x, j) => (j === i ? { ...x, evidence: e.target.value } : x)))} />
              <Select aria-label={b.evidenceType} value={r.evidenceType} onChange={(e) => set("reasons", answers.reasons.map((x, j) => (j === i ? { ...x, evidenceType: e.target.value as EvidenceType } : x)))}>
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {b.evidenceTypes[t]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
        {answers.reasons.length < 4 ? (
          <Button variant="secondary" size="sm" onClick={() => set("reasons", [...answers.reasons, { text: "", evidence: "", evidenceType: "example" }])}>
            <Plus aria-hidden className="size-4" />
            {b.addReason}
          </Button>
        ) : null}
      </Card>
      <Card className="space-y-4 p-5">
        <Field label={b.counter} hint={b.counterHelp}>
          {(ids) => <Textarea {...ids} rows={2} value={answers.counter} onChange={(e) => set("counter", e.target.value)} />}
        </Field>
        <Field label={b.rebuttal}>{(ids) => <Textarea {...ids} rows={2} value={answers.rebuttal} onChange={(e) => set("rebuttal", e.target.value)} />}</Field>
        <Field label={b.conclusion}>{(ids) => <Textarea {...ids} rows={2} value={answers.conclusion} onChange={(e) => set("conclusion", e.target.value)} />}</Field>
      </Card>
    </fieldset>
  );
}

// ------------------------------------------------------------------ Debate

function DebateForm({ exercise, answers, setAnswers, locked }: { exercise: StudentExercise; answers: DebateAnswers; setAnswers: (a: DebateAnswers) => void; locked: boolean }) {
  const { dict, locale } = useI18n();
  const d = dict.labs.critical.debate;
  const set = <K extends keyof DebateAnswers>(key: K, value: DebateAnswers[K]) => setAnswers({ ...answers, [key]: value });
  return (
    <div className="space-y-5">
      <Card className="border-lab-critical/30 p-5">
        <p className="text-xs font-semibold tracking-wide text-lab-critical uppercase">{d.motion}</p>
        <p className="mt-1 text-xl font-semibold">{exercise.motion ? tr(exercise.motion, locale) : null}</p>
        {exercise.context ? <p className="mt-2 text-[15px] text-ink-muted">{tr(exercise.context, locale)}</p> : null}
      </Card>
      <DebateTimer />
      <fieldset disabled={locked} className="space-y-5">
        <Card className="space-y-4 p-5">
          <div role="radiogroup" aria-label={d.side} className="flex flex-wrap gap-2">
            {(["for", "against"] as const).map((side) => (
              <button
                key={side}
                type="button"
                role="radio"
                aria-checked={answers.side === side}
                onClick={() => set("side", side)}
                className={cn("h-11 rounded-xl border px-4 font-semibold", answers.side === side ? "border-lab-critical bg-lab-critical text-white" : "border-line-strong hover:bg-muted")}
              >
                {d.sides[side]}
              </button>
            ))}
          </div>
          {answers.arguments.map((a, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line p-4 md:grid-cols-2">
              <Field label={fmt(d.argument, { n: i + 1 })}>
                {(ids) => <Textarea {...ids} rows={2} placeholder={d.point} value={a.point} onChange={(e) => set("arguments", answers.arguments.map((x, j) => (j === i ? { ...x, point: e.target.value } : x)))} />}
              </Field>
              <Field label={d.support}>
                {(ids) => <Textarea {...ids} rows={2} value={a.support} onChange={(e) => set("arguments", answers.arguments.map((x, j) => (j === i ? { ...x, support: e.target.value } : x)))} />}
              </Field>
            </div>
          ))}
        </Card>
        <Card className="space-y-4 p-5">
          <Field label={d.steelman} hint={d.steelmanHelp}>
            {(ids) => <Textarea {...ids} rows={2} value={answers.steelman} onChange={(e) => set("steelman", e.target.value)} />}
          </Field>
          <Field label={d.rebuttal}>{(ids) => <Textarea {...ids} rows={2} value={answers.rebuttal} onChange={(e) => set("rebuttal", e.target.value)} />}</Field>
          <Field label={d.switched} hint={d.switchedHelp}>
            {(ids) => <Textarea {...ids} rows={2} value={answers.switched} onChange={(e) => set("switched", e.target.value)} />}
          </Field>
        </Card>
      </fieldset>
    </div>
  );
}

// ------------------------------------------------------------------ Humility

function ConfidenceSlider({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const { dict } = useI18n();
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <input type="range" min={0} max={100} step={5} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="h-10 flex-1 accent-[var(--color-lab-critical)]" />
        <span className="w-36 text-right text-sm font-semibold tabular-nums">{fmt(dict.labs.critical.humility.confidence, { n: value })}</span>
      </div>
    </label>
  );
}

function HumilityForm({ exercise, answers, setAnswers, result, locked }: { exercise: StudentExercise; answers: HumilityAnswers; setAnswers: (a: HumilityAnswers) => void; result: CtResult | null; locked: boolean }) {
  const { dict, locale } = useI18n();
  const h = dict.labs.critical.humility;
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const rate = (id: string, patch: Partial<{ before: number; after: number }>) => {
    const current = answers.ratings[id] ?? { before: 50, after: 50 };
    const next = { ...current, ...patch };
    if (patch.before !== undefined && !revealed[id]) next.after = patch.before;
    setAnswers({ ...answers, ratings: { ...answers.ratings, [id]: next } });
  };
  return (
    <div className="space-y-4">
      {exercise.scenarios.map((s, i) => {
        const rating = answers.ratings[s.id];
        const show = locked || revealed[s.id];
        const feedback = result?.scenarios?.find((f) => f.id === s.id);
        return (
          <Card key={s.id} className={cn("space-y-4 p-5", feedback ? (feedback.ok ? "border-success/40" : "border-warn/40") : null)}>
            <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{fmt(h.step, { n: i + 1, m: exercise.scenarios.length })}</p>
            <p className="text-[15px]">{tr(s.situation, locale)}</p>
            <p className="rounded-xl bg-muted/60 px-4 py-3">
              <span className="font-medium">{h.claim}: </span>
              {tr(s.claim, locale)}
            </p>
            <ConfidenceSlider label={h.before} value={rating?.before ?? 50} disabled={locked || show} onChange={(v) => rate(s.id, { before: v })} />
            {!show ? (
              <Button
                variant="secondary"
                onClick={() => {
                  if (!rating) rate(s.id, { before: 50 });
                  setRevealed((r) => ({ ...r, [s.id]: true }));
                }}
              >
                {h.showEvidence}
              </Button>
            ) : (
              <>
                <div className="rounded-xl border border-lab-critical/30 bg-lab-critical/5 px-4 py-3">
                  <p className="text-xs font-semibold tracking-wide text-lab-critical uppercase">{h.newEvidence}</p>
                  <p className="mt-1 text-[15px]">{tr(s.newEvidence, locale)}</p>
                </div>
                <ConfidenceSlider label={h.after} value={rating?.after ?? rating?.before ?? 50} disabled={locked} onChange={(v) => rate(s.id, { after: v })} />
              </>
            )}
            {feedback ? (
              <div className="rounded-xl bg-muted/60 px-4 py-3 text-[15px]">
                <p className={cn("font-semibold", feedback.ok ? "text-success" : "text-warn")}>{feedback.ok ? h.reasonable : h.reconsider}</p>
                <p className="text-sm text-ink-muted">{fmt(h.moved, { before: feedback.before, after: feedback.after })}</p>
                <p className="mt-1">{h.directions[feedback.direction]}</p>
                <p className="mt-1">{tr(feedback.explanation, locale)}</p>
              </div>
            ) : null}
          </Card>
        );
      })}
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{h.reflectionTitle}</h2>
        <fieldset disabled={locked} className="space-y-4">
          <Field label={h.belief}>{(ids) => <Textarea {...ids} rows={2} value={answers.belief} onChange={(e) => setAnswers({ ...answers, belief: e.target.value })} />}</Field>
          <Field label={h.changeMind}>{(ids) => <Textarea {...ids} rows={2} value={answers.changeMind} onChange={(e) => setAnswers({ ...answers, changeMind: e.target.value })} />}</Field>
          <Field label={h.opposing}>{(ids) => <Textarea {...ids} rows={2} value={answers.opposing} onChange={(e) => setAnswers({ ...answers, opposing: e.target.value })} />}</Field>
        </fieldset>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ Decision

function DecisionForm({ exercise, answers, setAnswers, result, locked }: { exercise: StudentExercise; answers: DecisionAnswers; setAnswers: (a: DecisionAnswers) => void; result: CtResult | null; locked: boolean }) {
  const { dict, locale } = useI18n();
  const d = dict.labs.critical.decision;
  const set = (patch: Partial<DecisionAnswers>) => setAnswers({ ...answers, ...patch });
  const totals = answers.options.map((_, i) => answers.criteria.reduce((s, c, j) => s + c.weight * (answers.scores[i]?.[j] ?? 0), 0));
  const max = answers.criteria.reduce((s, c) => s + c.weight * 5, 0);
  const scoreAt = (i: number, j: number) => answers.scores[i]?.[j] ?? 0;
  const setScore = (i: number, j: number, v: number) =>
    set({ scores: answers.options.map((_, oi) => answers.criteria.map((__, cj) => (oi === i && cj === j ? v : scoreAt(oi, cj)))) });
  return (
    <fieldset disabled={locked} className="space-y-5">
      <Card className="p-5">
        <p className="text-xs font-semibold tracking-wide text-lab-critical uppercase">{d.scenario}</p>
        <p className="mt-1 text-lg font-semibold">{exercise.scenario ? tr(exercise.scenario as L, locale) : null}</p>
        <p className="mt-2 text-sm text-ink-muted">{d.note}</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">{d.options}</h2>
          {answers.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={fmt(d.option, { n: i + 1 })} value={o} maxLength={120} onChange={(e) => set({ options: answers.options.map((x, j) => (j === i ? e.target.value : x)) })} />
              {answers.options.length > 2 ? (
                <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set({ options: answers.options.filter((_, j) => j !== i), scores: answers.scores.filter((_, j) => j !== i) })}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {answers.options.length < 6 ? (
            <Button variant="secondary" size="sm" onClick={() => set({ options: [...answers.options, ""], scores: [...answers.scores, answers.criteria.map(() => 0)] })}>
              <Plus aria-hidden className="size-4" />
              {d.addOption}
            </Button>
          ) : null}
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">{d.criteria}</h2>
          <p className="text-xs text-ink-subtle">{d.weightHelp}</p>
          {answers.criteria.map((cr, j) => (
            <div key={j} className="flex gap-2">
              <Input aria-label={fmt(d.criterion, { n: j + 1 })} value={cr.name} maxLength={120} onChange={(e) => set({ criteria: answers.criteria.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)) })} />
              <Select aria-label={`${d.weight}: ${cr.name}`} value={cr.weight} className="w-20" onChange={(e) => set({ criteria: answers.criteria.map((x, k) => (k === j ? { ...x, weight: Number(e.target.value) } : x)) })}>
                {[1, 2, 3, 4, 5].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
              {answers.criteria.length > 2 ? (
                <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set({ criteria: answers.criteria.filter((_, k) => k !== j), scores: answers.scores.map((row) => row.filter((_, k) => k !== j)) })}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {answers.criteria.length < 8 ? (
            <Button variant="secondary" size="sm" onClick={() => set({ criteria: [...answers.criteria, { name: "", weight: 3 }], scores: answers.scores.map((row) => [...row, 0]) })}>
              <Plus aria-hidden className="size-4" />
              {d.addCriterion}
            </Button>
          ) : null}
        </Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader title={d.scores} description={d.scoreHelp} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium" scope="col">
                  {d.options}
                </th>
                {answers.criteria.map((cr, j) => (
                  <th key={j} className="px-3 py-2 font-medium" scope="col">
                    {cr.name || fmt(d.criterion, { n: j + 1 })} <span className="text-ink-subtle">×{cr.weight}</span>
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-medium" scope="col">
                  {d.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {answers.options.map((o, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    {o || fmt(d.option, { n: i + 1 })}
                  </th>
                  {answers.criteria.map((cr, j) => (
                    <td key={j} className="px-3 py-2">
                      <Select
                        aria-label={fmt(d.score, { option: o || String(i + 1), criterion: cr.name || String(j + 1) })}
                        value={scoreAt(i, j)}
                        className="h-10 w-20"
                        onChange={(e) => setScore(i, j, Number(e.target.value))}
                      >
                        <option value={0}>–</option>
                        {[1, 2, 3, 4, 5].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">
                    {totals[i]} / {max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {result?.decision?.winner ? (
        <Notice tone={result.decision.close ? "warn" : "success"} title={fmt(d.winner, { option: result.decision.winner })}>
          {result.decision.close ? d.close : null}
        </Notice>
      ) : null}
      <Card className="p-5">
        <Field label={d.reflection}>{(ids) => <Textarea {...ids} rows={3} value={answers.reflection} onChange={(e) => set({ reflection: e.target.value })} />}</Field>
      </Card>
    </fieldset>
  );
}
