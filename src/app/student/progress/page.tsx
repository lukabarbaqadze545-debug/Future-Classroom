import Link from "next/link";
import { Flame } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { getMistakesToReview, getStudentProgress } from "@/lib/services/progress";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, Meter, PageHeader, Stat } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ActivityChart } from "@/components/student/activity-chart";
import { learningProfile } from "@/lib/services/learning-profile";
import { LearningProfileView } from "@/components/profile/learning-profile-view";

export async function generateMetadata() {
  return pageTitle((p) => p.progress);
}

export default async function ProgressPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const p = dict.student.progress;
  const progress = getStudentProgress(user.id);
  const mistakes = getMistakesToReview(user.id, 12);
  const empty = progress.completedActivities === 0 && progress.topics.length === 0;
  return (
    <PageContainer>
      <PageHeader title={p.title} description={p.lead} />
      <section className="mb-8" aria-label={dict.labs.profile.title}>
        <h2 className="mb-3 text-lg font-semibold">{dict.labs.profile.title}</h2>
        <LearningProfileView profile={learningProfile(user.id, user, locale)} dict={dict} locale={locale} studentId={user.id} />
      </section>
      <h2 className="mb-3 text-lg font-semibold">{dict.labs.profile.lessons}</h2>
      {empty ? (
        <EmptyState title={p.empty} action={<ButtonLink href="/student/learn">{dict.student.dashboard.startLearning}</ButtonLink>} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={p.completed} value={progress.completedActivities} hint={`${p.correct}: ${progress.correctActivities}`} />
            <Stat label={p.lessons} value={progress.lessonsStudied} />
            <Stat label={p.quizAverage} value={progress.quizAveragePercent === null ? "—" : `${progress.quizAveragePercent}%`} hint={`${p.quizzes}: ${progress.quizzesTaken}`} />
            <Stat
              label={p.streak}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Flame aria-hidden className="size-6 text-warn" />
                  {progress.streakDays}
                </span>
              }
              hint={fmtCount(p.activeDays, progress.activeDays)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">{p.history}</h2>
              <div className="mt-4">
                <ActivityChart days={progress.activityByDay} label={p.history} locale={locale} />
              </div>
            </Card>
            <Card>
              <CardHeader title={p.topics} />
              <ul className="space-y-4 px-5 py-4">
                {progress.topics.slice(0, 8).map((t) => {
                  const percent = t.answered ? Math.round((t.correct / t.answered) * 100) : 0;
                  return (
                    <li key={`${t.subject}-${t.topic}`}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        {t.lessonId ? (
                          <Link href={`/student/learn/${t.lessonId}`} className="font-medium hover:text-brand">
                            {t.topic}
                          </Link>
                        ) : (
                          <span className="font-medium">{t.topic}</span>
                        )}
                        <span className="shrink-0 text-ink-muted">{fmt(p.answered, { n: t.answered, c: t.correct })}</span>
                      </div>
                      <Meter value={percent} tone={percent < 50 ? "warn" : "success"} className="mt-1.5" />
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title={p.mistakes} description={p.mistakesLead} />
            {mistakes.length ? (
              <ul className="divide-y divide-line">
                {mistakes.map((m) => (
                  <li key={m.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                        <Badge>{p.sources[m.kind]}</Badge>
                        <span>{m.source}</span>
                        <span>· {relativeTime(dict, m.createdAt)}</span>
                      </div>
                      <p className="mt-1 font-medium">{m.prompt}</p>
                      {m.given ? (
                        <p className="text-sm text-ink-muted">
                          {p.youAnswered}: <span className="font-mono">{m.given}</span>
                        </p>
                      ) : null}
                    </div>
                    {m.lessonId ? (
                      <ButtonLink href={`/student/learn/${m.lessonId}?tab=practice`} variant="secondary" size="sm">
                        {p.practiceAgain}
                      </ButtonLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-muted">{p.noMistakes}</p>
            )}
          </Card>

          <Card>
            <CardHeader title={p.quizResults} />
            {progress.recentQuizzes.length ? (
              <ul className="divide-y divide-line">
                {progress.recentQuizzes.map((q) => (
                  <li key={q.attemptId}>
                    <Link href={`/student/quizzes/${q.quizId}?attempt=${q.attemptId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                      <span>
                        <span className="font-medium">{q.title}</span>
                        <span className="ml-2 text-sm text-ink-subtle">{relativeTime(dict, q.submittedAt)}</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        {q.score}/{q.maxScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-muted">{p.noQuizzes}</p>
            )}
          </Card>
          <p className="text-sm text-ink-subtle">{p.whatWeStore}</p>
        </div>
      )}
    </PageContainer>
  );
}
