"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { HintResult } from "@/lib/ai/hint-service";
import type { Answer } from "@/lib/domain/schemas";
import type { ActivityType } from "@/lib/domain/catalog";
import { isAnswerEmpty } from "@/lib/domain/grading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { AnswerInput } from "@/components/session/answer-input";
import { HintPanel } from "@/components/session/hint-panel";

export interface PracticeItem {
  id: string;
  type: ActivityType;
  title: string;
  prompt: string;
  options: { id: string; text: string }[];
  maxLevel: number;
}

interface ItemState {
  answer: Answer;
  result: { isCorrect: boolean | null; explanation: string } | null;
  hints: HintResult[];
}

/** Self-paced practice with server-side checking and the hint ladder. */
export function Practice({ lessonId, items }: { lessonId: string; items: PracticeItem[] }) {
  const { dict } = useI18n();
  const p = dict.student.lesson;
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return <Notice tone="info">{p.noPractice}</Notice>;
  const item = items[index];
  const state: ItemState = states[item.id] ?? { answer: { optionIds: [], text: "" }, result: null, hints: [] };
  const setState = (patch: Partial<ItemState>) => setStates((prev) => ({ ...prev, [item.id]: { ...state, ...patch } }));
  const done = items.every((i) => states[i.id]?.result?.isCorrect === true);

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await api<{ isCorrect: boolean | null; explanation: string }>("/api/practice/check", { body: { lessonId, activityId: item.id, answer: state.answer } });
      setState({ result });
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setChecking(false);
    }
  };

  const hint = async () => {
    const { hint: next } = await api<{ hint: HintResult }>("/api/practice/hint", { body: { lessonId, activityId: item.id, level: state.hints.length + 1 } });
    setState({ hints: [...state.hints, next] });
  };

  return (
    <div className="space-y-5">
      <p className="text-ink-muted">{p.practiceLead}</p>
      {done ? <Notice tone="success">{p.practiceDone}</Notice> : null}
      <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7" aria-labelledby="practice-prompt">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink-muted">{fmt(p.question, { n: index + 1, m: items.length })}</span>
          <Badge tone="brand">{dict.activityTypes[item.type]}</Badge>
        </div>
        <h2 id="practice-prompt" className="fc-prose mt-3 text-xl leading-snug font-semibold sm:text-2xl">
          {item.prompt}
        </h2>
        <div className="mt-5">
          <AnswerInput
            type={item.type}
            options={item.options}
            value={state.answer}
            onChange={(answer) => setState({ answer, result: state.result?.isCorrect === true ? state.result : null })}
            disabled={state.result?.isCorrect === true}
            labelId="practice-prompt"
            onSubmit={check}
          />
        </div>
        {error ? <Notice tone="danger" className="mt-4">{error}</Notice> : null}
        {state.result ? (
          <Notice className="mt-4" tone={state.result.isCorrect === true ? "success" : state.result.isCorrect === false ? "warn" : "info"} title={state.result.isCorrect === true ? dict.session.correct : state.result.isCorrect === false ? dict.session.incorrect : dict.session.received}>
            {state.result.explanation || null}
          </Notice>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button size="lg" onClick={check} disabled={checking || isAnswerEmpty(state.answer) || state.result?.isCorrect === true} data-testid="practice-check">
            {checking ? p.checking : p.check}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>
              <ChevronLeft aria-hidden className="size-4" />
              {p.previousQuestion}
            </Button>
            <Button variant="secondary" onClick={() => setIndex(index + 1)} disabled={index === items.length - 1}>
              {p.nextQuestion}
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      </section>
      {state.result?.isCorrect !== true ? <HintPanel key={item.id} hints={state.hints} maxLevel={item.maxLevel} onRequest={hint} /> : null}
    </div>
  );
}
