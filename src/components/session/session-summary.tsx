import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fmt, fmtCount, formatDateTime, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/en";
import type { SessionSummary as Summary } from "@/lib/services/sessions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter, Stat } from "@/components/ui/misc";
import { ResultBars } from "./result-bars";
import { PrintButton } from "./print-button";

/** Post-session summary: simple, teacher-readable numbers and answers. */
export function SessionSummaryView({ summary, dict, locale, rerun }: { summary: Summary; dict: Dictionary; locale: Locale; rerun?: React.ReactNode }) {
  const s = dict.teacher.summary;
  const { session } = summary;
  return (
    <div className="space-y-6" data-testid="session-summary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {session.lessonId ? (
            <Link href={`/teacher/lessons/${session.lessonId}`} className="no-print mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" />
              {s.backToLesson}
            </Link>
          ) : null}
          <p className="text-sm font-medium text-ink-subtle">{s.title}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {session.title} {session.classLabel ? <span className="text-ink-subtle">· {session.classLabel}</span> : null}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {session.endedAt ? formatDateTime(locale, session.endedAt) : null} · {fmt(s.activitiesRun, { a: summary.activitiesRun, b: summary.activitiesPlanned })}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <PrintButton label={s.print} />
          {rerun}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={s.participants} value={summary.participantCount} />
        <Stat label={s.participation} value={summary.participationPercent === null ? "—" : `${summary.participationPercent}%`} />
        <Stat label={s.correctRate} value={summary.correctPercent === null ? "—" : `${summary.correctPercent}%`} />
        <Stat label={s.hintsUsed} value={summary.hintsUsed} hint={summary.durationMin ? `${s.duration}: ${fmt(dict.common.minutes, { n: summary.durationMin })}` : undefined} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{s.perActivity}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.activities.map((a, i) => {
            const r = a.results;
            const correct = r.gradedCount ? Math.round((r.correctCount / r.gradedCount) * 100) : null;
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{i + 1}</span>
                  <Badge tone="brand">{dict.activityTypes[a.activity.type]}</Badge>
                  <span className="text-sm text-ink-muted">{fmt(dict.teacher.console.answered, { a: r.responseCount, b: r.participantCount })}</span>
                </div>
                <p className="fc-prose mt-3 font-medium">{a.activity.prompt}</p>
                {a.gradable ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted">{s.correctRate}</span>
                      <span className="font-semibold tabular-nums">{correct === null ? "—" : `${correct}%`}</span>
                    </div>
                    <Meter value={correct ?? 0} tone={correct !== null && correct < 50 ? "warn" : "success"} className="mt-1.5" />
                  </div>
                ) : null}
                {r.distribution.length ? (
                  <div className="mt-4">
                    <ResultBars distribution={r.distribution} showCorrect={a.activity.type === "multiple_choice"} correctLabel={dict.teacher.console.correctMark} />
                  </div>
                ) : null}
                {r.commonWrongAnswers.length ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium">{dict.teacher.console.commonWrong}: </span>
                    {r.commonWrongAnswers.map((w) => `${w.answer} (×${w.count})`).join(", ")}
                  </p>
                ) : null}
                {!a.gradable && a.activity.type !== "poll" && r.answers.length ? (
                  <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-sm">
                    {r.answers.map((ans) => (
                      <li key={ans.participantId} className="rounded-lg bg-muted/60 px-3 py-2">
                        <span className="font-medium">{ans.name}: </span>
                        {ans.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.hintsRequested ? <p className="mt-3 text-xs text-ink-subtle">{fmtCount(dict.teacher.console.hintsRequested, r.hintsRequested)}</p> : null}
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader title={s.perStudent} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-ink-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">{dict.teacher.quizzes.student}</th>
                <th className="px-5 py-2.5 font-medium">{s.answered}</th>
                <th className="px-5 py-2.5 font-medium">{s.correct}</th>
                <th className="px-5 py-2.5 font-medium">{s.hints}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.students.map((st) => (
                <tr key={st.name}>
                  <td className="px-5 py-2.5 font-medium">{st.name}</td>
                  <td className="px-5 py-2.5 tabular-nums">{st.answered}</td>
                  <td className="px-5 py-2.5 tabular-nums">{st.graded ? `${st.correct}/${st.graded}` : "—"}</td>
                  <td className="px-5 py-2.5 tabular-nums">{st.hintsUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
