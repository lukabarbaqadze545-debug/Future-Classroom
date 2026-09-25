"use client";

import { useState, type FormEvent } from "react";
import { BookMarked, Search, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { SUBJECTS, type Subject } from "@/lib/domain/catalog";
import type { LibraryAnswer } from "@/lib/ai/library-service";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

/** Renders "[1]" citation markers as small superscript links to the passages. */
function withCitations(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return <span key={i}>{part}</span>;
    return (
      <a key={i} href={`#passage-${match[1]}`} className="mx-0.5 rounded bg-brand-soft px-1 text-xs font-semibold text-brand-ink no-underline hover:bg-brand hover:text-white">
        {match[1]}
      </a>
    );
  });
}

export function LibraryAsk({ initialSubject }: { initialSubject: Subject | "" }) {
  const { dict } = useI18n();
  const l = dict.student.library;
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState<Subject | "">(initialSubject);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LibraryAnswer | null>(null);

  const ask = async (text: string) => {
    if (text.trim().length < 2) return;
    setQuestion(text);
    setBusy(true);
    setError(null);
    try {
      setResult(await api<LibraryAnswer>("/api/library/ask", { body: { question: text, subject: subject || undefined } }));
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 sm:flex-row">
        <label htmlFor="library-question" className="sr-only">
          {l.placeholder}
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
          <Input id="library-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={l.placeholder} className="h-12 pl-11 text-base" maxLength={500} data-testid="library-question" />
        </div>
        <Select aria-label={l.subject} value={subject} onChange={(e) => setSubject(e.target.value as Subject | "")} className="h-12 sm:w-52">
          <option value="">{dict.common.allSubjects}</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {dict.subjects[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" size="lg" disabled={busy || question.trim().length < 2} className="h-12" data-testid="library-ask">
          {l.ask}
        </Button>
      </form>

      {!result && !busy ? (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">{l.examples}</p>
          <div className="flex flex-wrap gap-2">
            {l.exampleQuestions.map((q) => (
              <button key={q} type="button" onClick={() => void ask(q)} className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-sm hover:border-brand/40 hover:bg-brand-soft/40">
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {busy ? <Spinner label={l.asking} /> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {result && !busy ? (
        <div className="space-y-4" data-testid="library-result">
          {result.mode === "ai" && result.answer ? (
            <section className="rounded-2xl border border-ai/20 bg-ai-soft/50 p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Sparkles aria-hidden className="size-4 text-ai" />
                {l.answer}
              </h2>
              <p className="fc-prose mt-2 text-[16px] leading-relaxed">{withCitations(result.answer)}</p>
              <p className="mt-3 text-xs text-ink-muted">{l.aiAnswerNote}</p>
            </section>
          ) : null}
          {result.passages.length === 0 ? <Notice tone="info">{l.noResults}</Notice> : null}
          {result.mode === "passages_only" && result.passages.length ? <Notice tone="info" title={l.passagesOnly}>{result.aiError ? l.aiErrorNote : l.passagesOnlyNote}</Notice> : null}
          {result.mode === "ai" && result.notCovered ? <Notice tone="warn">{l.notCovered}</Notice> : null}
          <ol className="space-y-3">
            {result.passages.map((p) => (
              <li key={p.index} id={`passage-${p.index}`} className={cn("scroll-mt-24 rounded-2xl border bg-surface p-4", result.citations.includes(p.index) ? "border-brand/40" : "border-line")}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand-ink">{p.index}</span>
                  <BookMarked aria-hidden className="size-4 text-ink-subtle" />
                  <a href={`/api/materials/${p.materialId}/file`} className="font-medium text-brand hover:underline">
                    {p.materialTitle}
                  </a>
                  {p.page ? <span className="text-ink-subtle">{fmt(l.page, { n: p.page })}</span> : null}
                  <span className="text-ink-subtle">· {dict.subjects[p.subject]}</span>
                </div>
                <p className="fc-prose mt-2 text-[15px] text-ink-muted">{p.content}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
