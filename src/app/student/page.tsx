import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Radio } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { getStudentProgress } from "@/lib/services/progress";
import { listAttemptsForStudent, listPublishedQuizzes } from "@/lib/services/quizzes";
import { inLocale } from "@/lib/services/lessons";
import { listActiveSessionsForStudent } from "@/lib/services/sessions";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JoinForm } from "@/components/session/join-form";
import { JoinSessionButton } from "@/components/session/join-button";
import { ActivityChart } from "@/components/student/activity-chart";
import { listAssignmentsForStudent } from "@/lib/services/assignments";
import { listClassesForStudent } from "@/lib/services/classes";
import { LAB_IDS, LAB_ROUTES } from "@/lib/labs/registry";
import { LabIcon } from "@/components/labs/lab-shell";
import { STATUS_TONE } from "@/components/assignments/review-board";
import { formatDateTime } from "@/lib/i18n/config";

export async function generateMetadata() {
  return pageTitle((p) => p.home);
}

export default async function StudentHome() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const d = dict.student.dashboard;
  const progress = getStudentProgress(user.id);
  const attempts = listAttemptsForStudent(user.id);
  const bestByQuiz = new Map<string, { score: number; max: number }>();
  for (const a of attempts) {
    const best = bestByQuiz.get(a.quizId);
    if (!best || a.score / a.maxScore > best.score / best.max) bestByQuiz.set(a.quizId, { score: a.score, max: a.maxScore });
  }
  // Built-in quizzes in the reader's language (plus any the student has already taken).
  const published = listPublishedQuizzes();
  const inLanguage = new Set(inLocale(published, locale).map((q) => q.id));
  const quizzes = published.filter((q) => inLanguage.has(q.id) || bestByQuiz.has(q.id));
  const continueTopics = progress.topics.filter((t) => t.lessonId).slice(0, 4);
  const activeSessions = listActiveSessionsForStudent(user.id);
  const todo = listAssignmentsForStudent(user.id).filter((a) => !["submitted", "completed", "reviewed"].includes(a.recipient.status));
  const classes = listClassesForStudent(user.id);
  const a = dict.labs.assignments;

  return (
    <PageContainer>
      <PageHeader title={fmt(d.greeting, { name: user.displayName.split(" ")[0] })} description={d.lead} />
      {activeSessions.length ? (
        <Card className="mb-6 border-success/40 bg-success-soft/30" data-testid="live-sessions">
          <CardHeader title={<span className="flex items-center gap-2"><span className="fc-pulse size-2.5 rounded-full bg-success" />{d.activeTitle}</span>} />
          <ul className="divide-y divide-line">
            {activeSessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-ink-muted">
                    {s.teacherName}
                    {s.classLabel ? ` · ${s.classLabel}` : ""}
                  </p>
                </div>
                <JoinSessionButton code={s.joinCode} label={s.joined ? d.rejoin : d.joinNow} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <nav aria-label={dict.labs.hub.title} className="mb-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" data-testid="dashboard-labs">
          {LAB_IDS.map((id) => (
            <li key={id}>
              <Link href={LAB_ROUTES[id]} className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition-colors hover:border-brand/40">
                <LabIcon lab={id} size="sm" />
                <span className="text-sm leading-tight font-medium">{dict.labs.hub.rooms[id].name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title={a.title} action={<ButtonLink href="/student/assignments" variant="ghost" size="sm">{a.filter.all}</ButtonLink>} />
            {todo.length ? (
              <ul className="divide-y divide-line" data-testid="dashboard-assignments">
                {todo.slice(0, 5).map((x) => (
                  <li key={x.id}>
                    <Link href={`/student/assignments/${x.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                      <span className="min-w-0">
                        <span className="block font-medium">{x.title}</span>
                        <span className="text-sm text-ink-muted">
                          {a.kinds[x.kind]}
                          {x.dueAt ? ` · ${fmt(dict.labs.common.due, { date: formatDateTime(locale, x.dueAt) })}` : ""}
                        </span>
                      </span>
                      <Badge tone={x.overdue ? "danger" : STATUS_TONE[x.recipient.status]}>{x.overdue ? dict.labs.common.overdue : a.status[x.recipient.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-ink-muted">{a.studentEmpty}</p>
            )}
          </Card>
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
          <Card className="p-5">
            <h2 className="text-lg font-semibold">{dict.labs.classes.myClasses}</h2>
            {classes.length ? (
              <ul className="mt-2 space-y-1.5">
                {classes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-ink-muted">{c.teacherName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">{dict.labs.classes.noStudentClasses}</p>
            )}
          </Card>
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
