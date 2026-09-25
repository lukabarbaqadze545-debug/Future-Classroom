import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Radio } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { getStudentProgress } from "@/lib/services/progress";
import { listAttemptsForStudent, listPublishedQuizzes } from "@/lib/services/quizzes";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JoinForm } from "@/components/session/join-form";
import { ActivityChart } from "@/components/student/activity-chart";

export const metadata = { title: "Student" };

export default async function StudentHome() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const d = dict.student.dashboard;
  const progress = getStudentProgress(user.id);
  const attempts = listAttemptsForStudent(user.id);
  const quizzes = listPublishedQuizzes();
  const bestByQuiz = new Map<string, { score: number; max: number }>();
  for (const a of attempts) {
    const best = bestByQuiz.get(a.quizId);
    if (!best || a.score / a.maxScore > best.score / best.max) bestByQuiz.set(a.quizId, { score: a.score, max: a.maxScore });
  }
  const continueTopics = progress.topics.filter((t) => t.lessonId).slice(0, 4);

  return (
    <PageContainer>
      <PageHeader title={fmt(d.greeting, { name: user.displayName.split(" ")[0] })} description={d.lead} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.continue} action={<ButtonLink href="/student/learn" variant="ghost" size="sm">{d.explore}</ButtonLink>} />
            {continueTopics.length ? (
              <ul className="grid gap-3 p-4 sm:grid-cols-2">
                {continueTopics.map((t) => (
                  <li key={`${t.subject}-${t.topic}`}>
                    <Link href={`/student/learn/${t.lessonId}`} className="group flex h-full flex-col rounded-xl border border-line p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/30">
                      <span className="text-xs font-medium text-ink-subtle">{dict.subjects[t.subject]}</span>
                      <span className="mt-1 font-semibold group-hover:text-brand">{t.topic}</span>
                      <span className="mt-auto pt-3 text-xs text-ink-muted">
                        {fmt(dict.student.progress.answered, { n: t.answered, c: t.correct })} · {relativeTime(dict, t.lastAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 p-5">
                <p className="text-sm text-ink-muted">{dict.student.progress.empty}</p>
                <ButtonLink href="/student/learn">
                  <BookOpen aria-hidden className="size-4" />
                  {d.startLearning}
                </ButtonLink>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={d.assigned} />
            {quizzes.length ? (
              <ul className="divide-y divide-line">
                {quizzes.map((q) => {
                  const best = bestByQuiz.get(q.id);
                  return (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium">{q.title}</p>
                        <p className="text-sm text-ink-muted">
                          {dict.subjects[q.subject]} · {fmtCount(dict.teacher.quizzes.questions, q.questions.length)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {best ? <Badge tone="success">{fmt(d.taken, { score: `${best.score}/${best.max}` })}</Badge> : null}
                        <ButtonLink href={`/student/quizzes/${q.id}`} size="sm" variant={best ? "ghost" : "primary"}>
                          {best ? d.retake : d.take}
                        </ButtonLink>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-muted">{d.noAssigned}</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-brand/25 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Radio aria-hidden className="size-5 text-brand" />
              {d.joinTitle}
            </h2>
            <p className="mt-1 mb-4 text-sm text-ink-muted">{d.joinText}</p>
            <JoinForm signedInName={user.displayName} compact />
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{d.progressTitle}</h2>
              <Link href="/student/progress" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                {dict.nav.progress}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{progress.completedActivities}</p>
                <p className="text-xs text-ink-muted">{d.activities}</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums">
                  <Flame aria-hidden className="size-5 text-warn" />
                  {progress.streakDays}
                </p>
                <p className="text-xs text-ink-muted">{d.streak}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{progress.topics.length}</p>
                <p className="text-xs text-ink-muted">{d.topics}</p>
              </div>
            </div>
            <div className="mt-5">
              <ActivityChart days={progress.activityByDay} label={dict.student.progress.history} locale={locale} />
            </div>
          </Card>

          {progress.recentQuizzes.length ? (
            <Card>
              <CardHeader title={d.recentQuizzes} />
              <ul className="divide-y divide-line">
                {progress.recentQuizzes.slice(0, 4).map((q) => (
                  <li key={q.attemptId}>
                    <Link href={`/student/quizzes/${q.quizId}?attempt=${q.attemptId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                      <span className="min-w-0 truncate text-sm font-medium">{q.title}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {q.score}/{q.maxScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
