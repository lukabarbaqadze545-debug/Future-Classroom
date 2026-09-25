import { fmt, formatDateTime, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { getQuizResults } from "@/lib/services/quizzes";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, Meter, Stat } from "@/components/ui/misc";

export function QuizResults({ results, dict, locale }: { results: ReturnType<typeof getQuizResults>; dict: Dictionary; locale: Locale }) {
  const q = dict.teacher.quizzes;
  if (results.attempts.length === 0) return <EmptyState title={q.noAttempts} />;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label={q.average} value={results.averagePercent === null ? "—" : `${results.averagePercent}%`} />
        <Stat label={q.attemptsCount} value={results.attempts.length} />
      </div>
      <Card>
        <CardHeader title={q.perQuestion} />
        <ol className="divide-y divide-line">
          {results.questions.map((question, i) => (
            <li key={question.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium">
                  {i + 1}. {question.prompt}
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{question.correctPercent === null ? "—" : fmt(q.correctRate, { n: question.correctPercent })}</span>
              </div>
              <Meter value={question.correctPercent ?? 0} tone={(question.correctPercent ?? 0) < 50 ? "warn" : "success"} className="mt-2" />
              <p className="mt-2 text-sm text-ink-muted">
                {dict.student.quiz.correctAnswer}: <span className="font-medium text-ink">{question.correctAnswer}</span>
              </p>
              {question.commonWrongAnswers.length ? (
                <p className="mt-1 text-sm text-ink-muted">
                  {q.commonWrong}: {question.commonWrongAnswers.map((w) => `${w.answer} (×${w.count})`).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-ink-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">{q.student}</th>
                <th className="px-5 py-2.5 font-medium">{q.score}</th>
                <th className="px-5 py-2.5 font-medium">{q.submitted}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {results.attempts.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-2.5 font-medium">{a.studentName}</td>
                  <td className="px-5 py-2.5 tabular-nums">
                    {a.score}/{a.maxScore}
                  </td>
                  <td className="px-5 py-2.5 text-ink-muted">{formatDateTime(locale, a.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
