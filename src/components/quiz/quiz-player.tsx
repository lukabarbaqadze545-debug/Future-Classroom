"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { Answer } from "@/lib/domain/schemas";
import type { StudentQuizQuestion, studentAttemptView } from "@/lib/services/quizzes";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Dialog } from "@/components/ui/dialog";
import { AnswerInput } from "@/components/session/answer-input";
import { cn } from "@/components/ui/cn";

export type AttemptView = ReturnType<typeof studentAttemptView>;

export function QuizResultView({ result, quizId, lessonId }: { result: AttemptView; quizId: string; lessonId: string | null }) {
  const { dict } = useI18n();
  const q = dict.student.quiz;
  const percent = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
  return (
    <div className="space-y-5" data-testid="quiz-result">
      <Card className="p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-ink-muted">{q.resultTitle}</p>
        <p className="mt-2 text-5xl font-semibold tabular-nums">{fmt(q.score, { score: result.score, max: result.maxScore })}</p>
        <p className="mt-1 text-lg text-ink-muted">{percent}%</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href={`/student/quizzes/${quizId}`} variant="secondary">
            {q.retake}
          </ButtonLink>
          {lessonId ? <ButtonLink href={`/student/learn/${lessonId}`}>{q.backToTopic}</ButtonLink> : null}
        </div>
      </Card>
      {result.feedbackMode === "score_only" ? <Notice tone="info">{q.scoreOnly}</Notice> : null}
      <h2 className="text-lg font-semibold">{q.review}</h2>
      <ol className="space-y-3">
        {result.questions.map((question, i) => (
          <li key={question.id}>
            <Card className={cn("p-5", question.correct ? "border-success/30" : "border-warn/30")}>
              <div className="flex items-start gap-3">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", question.correct ? "bg-success text-white" : "bg-warn-soft text-warn")} aria-hidden>
                  {question.correct ? <Check className="size-4" /> : <X className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {i + 1}. {question.prompt}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{fmt(q.yourAnswerWas, { answer: question.yourAnswer || q.noAnswer })}</p>
                  {question.correctAnswer && !question.correct ? (
                    <p className="mt-1 text-sm">
                      <span className="font-medium">{q.correctAnswer}: </span>
                      {question.correctAnswer}
                    </p>
                  ) : null}
                  {question.explanation ? <p className="mt-2 rounded-lg bg-muted/60 p-3 text-sm">{question.explanation}</p> : null}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function QuizPlayer({ quiz }: { quiz: { id: string; title: string; lessonId: string | null; questions: StudentQuizQuestion[] } }) {
  const { dict } = useI18n();
  const q = dict.student.quiz;
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<AttemptView | null>(null);
  const unanswered = quiz.questions.filter((question) => {
    const a = answers[question.id];
    return !a || (a.optionIds.length === 0 && !a.text.trim());
  }).length;

  const submit = async () => {
    setConfirm(false);
    setBusy(true);
    setError(null);
    try {
      const { result: r } = await api<{ result: AttemptView }>(`/api/quizzes/${quiz.id}/attempts`, { body: { answers } });
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  if (result) return <QuizResultView result={result} quizId={quiz.id} lessonId={quiz.lessonId} />;

  return (
    <div className="space-y-4">
      {quiz.questions.map((question, i) => {
        const answer = answers[question.id] ?? { optionIds: [], text: "" };
        const setAnswer = (a: Answer) => setAnswers((prev) => ({ ...prev, [question.id]: a }));
        return (
          <Card key={question.id} className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink-muted">{fmt(q.questionOf, { n: i + 1, m: quiz.questions.length })}</span>
              <Badge>{fmt(q.points, { n: question.points })}</Badge>
            </div>
            <h2 id={`q-${question.id}`} className="fc-prose mt-2 text-lg font-semibold">
              {question.prompt}
            </h2>
            <div className="mt-4">
              {question.type === "numerical" ? (
                <Input aria-labelledby={`q-${question.id}`} inputMode="decimal" value={answer.text} onChange={(e) => setAnswer({ optionIds: [], text: e.target.value })} placeholder={q.numberPlaceholder} className="h-12 max-w-xs text-lg" />
              ) : (
                <AnswerInput type={question.type === "short_answer" ? "short_answer" : "multiple_choice"} options={question.options} value={answer} onChange={setAnswer} labelId={`q-${question.id}`} />
              )}
            </div>
          </Card>
        );
      })}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex items-center justify-between gap-3">
        {quiz.lessonId ? (
          <Link href={`/student/learn/${quiz.lessonId}`} className="text-sm text-ink-muted hover:underline">
            {q.backToTopic}
          </Link>
        ) : (
          <span />
        )}
        <Button size="lg" onClick={() => (unanswered ? setConfirm(true) : void submit())} disabled={busy} data-testid="submit-quiz">
          {busy ? q.submitting : q.submit}
        </Button>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={q.submit}
        description={fmt(q.unanswered, { n: unanswered })}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              {dict.common.cancel}
            </Button>
            <Button onClick={submit}>{q.submit}</Button>
          </>
        }
      />
    </div>
  );
}
