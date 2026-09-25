import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, formatDate } from "@/lib/i18n/config";
import { getTeacherInsights } from "@/lib/services/progress";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, Meter, PageHeader, Stat } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Class overview" };

export default async function InsightsPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const i = dict.teacher.insights;
  const data = getTeacherInsights(user.id);
  const percent = (n: number | null) => (n === null ? "—" : `${n}%`);
  return (
    <PageContainer>
      <PageHeader title={i.title} description={i.lead} />
      {data.sessionsCompleted === 0 && data.quizAttempts === 0 ? (
        <EmptyState title={i.noData} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={i.sessionsCompleted} value={data.sessionsCompleted} hint={data.averageParticipants !== null ? fmtCount(dict.teacher.dashboard.participants, data.averageParticipants) : undefined} />
            <Stat label={i.participation} value={percent(data.participationPercent)} hint={i.participationHelp} />
            <Stat label={i.correctRate} value={percent(data.correctPercent)} hint={`${i.hintsUsed}: ${data.hintsUsed}`} />
            <Stat label={i.quizAverage} value={percent(data.quizAveragePercent)} hint={fmtCount(dict.teacher.dashboard.attempts, data.quizAttempts)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={i.commonWrong} description={i.commonWrongHelp} />
              {data.commonWrongAnswers.length ? (
                <ul className="divide-y divide-line">
                  {data.commonWrongAnswers.map((w, index) => (
                    <li key={index} className="px-5 py-3">
                      <p className="line-clamp-2 text-sm text-ink-muted">{w.prompt}</p>
                      <p className="mt-1 flex items-center justify-between gap-3">
                        <span className="font-mono font-medium">{w.answer}</span>
                        <span className="text-sm font-semibold text-warn">{fmt(i.times, { n: w.count })}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-ink-muted">{dict.common.none}</p>
              )}
            </Card>
            <Card>
              <CardHeader title={i.topics} />
              {data.topics.length ? (
                <ul className="space-y-4 px-5 py-4">
                  {data.topics.map((t) => (
                    <li key={t.topic}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium">{t.topic}</span>
                        <span className="tabular-nums">{t.percent}%</span>
                      </div>
                      <Meter value={t.percent} tone={t.percent < 50 ? "warn" : "success"} className="mt-1.5" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-ink-muted">{dict.common.none}</p>
              )}
            </Card>
          </div>
          <Card>
            <CardHeader title={i.recentSessions} />
            <ul className="divide-y divide-line">
              {data.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/teacher/sessions/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="font-medium">
                      {s.title} {s.class_label ? <span className="text-ink-subtle">· {s.class_label}</span> : null}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {formatDate(locale, s.ended_at)} · {fmtCount(dict.teacher.dashboard.participants, s.participants)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
