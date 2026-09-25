"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { clientId } from "@/lib/client/ids";
import { GRADES, QUIZ_QUESTION_TYPES, SUBJECTS } from "@/lib/domain/catalog";
import type { QuizDraft, QuizQuestion } from "@/lib/domain/schemas";
import type { QuizRecord } from "@/lib/services/quizzes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Dialog } from "@/components/ui/dialog";
import { ItemToolbar } from "@/components/lesson/item-toolbar";

const LETTERS = "abcdefgh";

function draftOf(quiz: QuizRecord): QuizDraft {
  return { title: quiz.title, subject: quiz.subject, grade: quiz.grade, topic: quiz.topic, feedbackMode: quiz.feedbackMode, questions: quiz.questions };
}

function QuestionEditor({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
  const { dict } = useI18n();
  const q = dict.teacher.quizzes;
  const e = dict.teacher.editor;
  const set = <K extends keyof QuizQuestion>(key: K, value: QuizQuestion[K]) => onChange({ ...question, [key]: value });

  const changeType = (type: QuizQuestion["type"]) => {
    const next: QuizQuestion = { ...question, type, correctOptionIds: [], acceptedAnswers: [], numericAnswer: null };
    if (type === "true_false") next.options = [{ id: "true", text: dict.student.quiz.true }, { id: "false", text: dict.student.quiz.false }];
    else if (type === "multiple_choice") next.options = question.type === "multiple_choice" ? question.options : [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }];
    else next.options = [];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr_100px]">
        <Field label={q.questionType}>
          {(ids) => (
            <Select {...ids} value={question.type} onChange={(ev) => changeType(ev.target.value as QuizQuestion["type"])}>
              {QUIZ_QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dict.quizTypes[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={e.prompt}>{(ids) => <Textarea {...ids} rows={2} value={question.prompt} onChange={(ev) => set("prompt", ev.target.value)} />}</Field>
        <Field label={q.points}>{(ids) => <Input {...ids} type="number" min={1} max={10} value={question.points} onChange={(ev) => set("points", Math.max(1, Math.min(10, Number(ev.target.value) || 1)))} />}</Field>
      </div>
      {question.type === "multiple_choice" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{e.options}</legend>
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-sm font-semibold text-ink-subtle uppercase">{option.id}</span>
              <Input aria-label={`${e.options} ${option.id}`} value={option.text} onChange={(ev) => set("options", question.options.map((o, i) => (i === index ? { ...o, text: ev.target.value } : o)))} className="flex-1" />
              <label className="inline-flex items-center gap-1.5 text-sm">
                <input type="radio" name={`correct-${question.id}`} checked={question.correctOptionIds.includes(option.id)} onChange={() => set("correctOptionIds", [option.id])} className="size-4 accent-success" />
                {e.correctOption}
              </label>
              <button
                type="button"
                className="rounded-md p-2 text-ink-subtle hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                disabled={question.options.length <= 2}
                onClick={() => onChange({ ...question, options: question.options.filter((_, i) => i !== index), correctOptionIds: question.correctOptionIds.filter((id) => id !== option.id) })}
                aria-label={dict.common.remove}
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </div>
          ))}
          {question.options.length < 8 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const used = new Set(question.options.map((o) => o.id));
                set("options", [...question.options, { id: [...LETTERS].find((l) => !used.has(l)) ?? clientId(), text: "" }]);
              }}
            >
              <Plus aria-hidden className="size-4" />
              {e.addOption}
            </Button>
          ) : null}
        </fieldset>
      ) : null}
      {question.type === "true_false" ? (
        <div className="flex gap-4">
          {question.options.map((option) => (
            <label key={option.id} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5">
              <input type="radio" name={`tf-${question.id}`} checked={question.correctOptionIds.includes(option.id)} onChange={() => set("correctOptionIds", [option.id])} className="size-4 accent-success" />
              {option.text}
            </label>
          ))}
        </div>
      ) : null}
      {question.type === "numerical" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={q.numericAnswer}>{(ids) => <Input {...ids} type="number" step="any" value={question.numericAnswer ?? ""} onChange={(ev) => set("numericAnswer", ev.target.value === "" ? null : Number(ev.target.value))} />}</Field>
          <Field label={q.tolerance}>{(ids) => <Input {...ids} type="number" step="any" min={0} value={question.tolerance} onChange={(ev) => set("tolerance", Math.max(0, Number(ev.target.value) || 0))} />}</Field>
        </div>
      ) : null}
      {question.type === "short_answer" ? (
        <Field label={e.acceptedAnswers} hint={e.acceptedAnswersHelp}>
          {(ids) => <Textarea {...ids} rows={2} value={question.acceptedAnswers.join("\n")} onChange={(ev) => set("acceptedAnswers", ev.target.value.split("\n").slice(0, 10))} className="font-mono text-sm" />}
        </Field>
      ) : null}
      <Field label={e.explanation} optionalLabel={dict.common.optional}>
        {(ids) => <Textarea {...ids} rows={2} value={question.explanation} onChange={(ev) => set("explanation", ev.target.value)} className="text-sm" />}
      </Field>
    </div>
  );
}

export function QuizEditor({ quiz, generated }: { quiz: QuizRecord; generated: boolean }) {
  const { dict } = useI18n();
  const q = dict.teacher.quizzes;
  const router = useRouter();
  const [draft, setDraft] = useState<QuizDraft>(() => draftOf(quiz));
  const [status, setStatus] = useState(quiz.status);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = (patch: Partial<QuizDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const cleaned = { ...draft, questions: draft.questions.filter((x) => x.prompt.trim()).map((x) => ({ ...x, acceptedAnswers: x.acceptedAnswers.map((a) => a.trim()).filter(Boolean) })) };
      const { quiz: saved } = await api<{ quiz: QuizRecord }>(`/api/quizzes/${quiz.id}`, { method: "PUT", body: cleaned });
      setDraft(draftOf(saved));
      setDirty(false);
      return true;
    } catch (e) {
      setError(errorMessage(dict, e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setQuizStatus = async (next: "draft" | "published") => {
    if (dirty && !(await save())) return;
    try {
      await api(`/api/quizzes/${quiz.id}/status`, { body: { status: next } });
      setStatus(next);
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  const move = (index: number, delta: number) => {
    const next = [...draft.questions];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    update({ questions: next });
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <Link href="/teacher/quizzes" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          {q.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{draft.title}</h1>
          <Badge tone={status === "published" ? "success" : "neutral"} dot>
            {dict.status[status]}
          </Badge>
          <Badge tone={quiz.origin === "ai" ? "ai" : quiz.origin === "template" ? "brand" : "neutral"}>{dict.origin[quiz.origin]}</Badge>
        </div>
      </div>
      {generated && quiz.origin === "ai" ? <Notice tone="ai">{dict.ai.reviewNotice}</Notice> : null}
      {generated && quiz.origin === "template" ? <Notice tone="info">{dict.ai.templateCuratedNotice}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={dict.teacher.editor.titleLabel} className="sm:col-span-2">
          {(ids) => <Input {...ids} value={draft.title} onChange={(ev) => update({ title: ev.target.value })} maxLength={160} />}
        </Field>
        <Field label={dict.teacher.create.subject}>
          {(ids) => (
            <Select {...ids} value={draft.subject} onChange={(ev) => update({ subject: ev.target.value as QuizDraft["subject"] })}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {dict.subjects[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={dict.teacher.create.grade}>
          {(ids) => (
            <Select {...ids} value={draft.grade} onChange={(ev) => update({ grade: Number(ev.target.value) })}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {fmt(dict.common.grade, { n: g })}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <fieldset className="sm:col-span-2 lg:col-span-4">
          <legend className="mb-2 text-sm font-medium">{q.feedbackMode}</legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            {(["full", "score_only"] as const).map((mode) => (
              <label key={mode} className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="feedback-mode" checked={draft.feedbackMode === mode} onChange={() => update({ feedbackMode: mode })} className="size-4 accent-brand" />
                {mode === "full" ? q.feedbackFull : q.feedbackScoreOnly}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className="space-y-3">
        {draft.questions.map((question, index) => {
          const open = expanded === question.id;
          return (
            <Card key={question.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded(open ? null : question.id)} aria-expanded={open}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{question.prompt || "—"}</span>
                    <span className="text-sm text-ink-muted">
                      {dict.quizTypes[question.type]} · {fmt(dict.student.quiz.points, { n: question.points })}
                    </span>
                  </span>
                </button>
                <ItemToolbar index={index} count={draft.questions.length} aiAvailable={false} onMove={(d) => move(index, d)} onDelete={() => update({ questions: draft.questions.filter((x) => x.id !== question.id) })} />
              </div>
              {open ? (
                <div className="border-t border-line px-4 py-4 sm:px-5">
                  <QuestionEditor question={question} onChange={(next) => update({ questions: draft.questions.map((x) => (x.id === question.id ? next : x)) })} />
                </div>
              ) : null}
            </Card>
          );
        })}
        <Button
          variant="secondary"
          onClick={() => {
            const id = clientId("q");
            update({
              questions: [
                ...draft.questions,
                { id, type: "multiple_choice", prompt: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }], correctOptionIds: [], acceptedAnswers: [], numericAnswer: null, tolerance: 0, explanation: "", points: 1 },
              ],
            });
            setExpanded(id);
          }}
        >
          <Plus aria-hidden className="size-4" />
          {q.addQuestion}
        </Button>
      </div>

      <div className="flex gap-2 border-t border-line pt-5">
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden className="size-4" />
          {dict.common.delete}
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {dirty ? <span className="font-medium text-warn">{dict.common.unsaved}</span> : fmtCount(q.questions, draft.questions.length)}
          </p>
          <div className="flex gap-2">
            {status === "published" ? (
              <Button variant="ghost" onClick={() => setQuizStatus("draft")}>
                {q.unpublish}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setQuizStatus("published")} disabled={draft.questions.length === 0} data-testid="publish-quiz">
                {q.publish}
              </Button>
            )}
            <Button onClick={save} disabled={saving || !dirty}>
              <Save aria-hidden className="size-4" />
              {saving ? dict.common.saving : dirty ? dict.common.save : dict.common.saved}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={dict.common.delete}
        description={q.deleteConfirm}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await api(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
                setDirty(false);
                router.push("/teacher/quizzes");
                router.refresh();
              }}
            >
              {dict.common.delete}
            </Button>
          </>
        }
      />
    </div>
  );
}
