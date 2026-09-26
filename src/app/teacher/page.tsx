import Link from "next/link";
import { BookPlus, FileUp, Radio } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { inLocale, listLessonsForTeacher } from "@/lib/services/lessons";
import { listSessionsForTeacher } from "@/lib/services/sessions";
import { listQuizzesForTeacher } from "@/lib/services/quizzes";
import { listMaterials } from "@/lib/services/materials";
import { listClassesForTeacher } from "@/lib/services/classes";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { listAssignmentsForTeacher } from "@/lib/services/assignments";
import { LAB_IDS, LAB_ROUTES } from "@/lib/labs/registry";
import { LabIcon } from "@/components/labs/lab-shell";

export async function generateMetadata() {
  return pageTitle((p) => p.teacher);
}

export default async function TeacherDashboard() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const d = dict.teacher.dashboard;
  const lessons = inLocale(listLessonsForTeacher(user.id), locale);
  const sessions = listSessionsForTeacher(user.id);
  const live = sessions.filter((s) => s.status !== "ended");
  const ended = sessions.filter((s) => s.status === "ended").slice(0, 5);
  const quizzes = listQuizzesForTeacher(user.id).filter((q) => q.attemptCount > 0).slice(0, 4);
  const materials = listMaterials(user).slice(0, 4);
  const assignments = listAssignmentsForTeacher(user.id).sort((a, b) => b.toReview - a.toReview);
  const firstName = user.displayName.split(" ")[0];
  const classes = listClassesForTeacher(user.id);

  return (
    <PageContainer>
      <PageHeader title={fmt(d.greeting, { name: firstName })} description={d.lead} />

      {live.length ? (
        <Card className="mb-6 border-success/40 bg-success-soft/30" data-testid="teacher-live-sessions">
          <CardHeader title={<span className="flex items-center gap-2"><span className="fc-pulse size-2.5 rounded-full bg-success" />{d.liveNow}</span>} />
          <ul className="divide-y divide-line">
            {live.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium">{s.title} {s.classLabel ? <span className="text-ink-subtle">· {s.classLabel}</span> : null}</p>
                  <p className="text-sm text-ink-muted">
                    <span className="font-mono font-semibold text-ink">{s.joinCode}</span> · {fmtCount(d.participants, s.participantCount)} · {dict.status[s.status]}
                  </p>
                </div>
                <ButtonLink href={`/teacher/sessions/${s.id}`} size="lg">{d.resume}</ButtonLink>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/teacher/sessions/new" className="group rounded-2xl border border-brand/20 bg-brand p-6 text-white shadow-[var(--shadow-card)] transition-colors hover:bg-brand-hover" data-testid="dashboard-start-session">
          <Radio aria-hidden className="size-7" />
          <p className="mt-4 text-lg font-semibold">{d.startSession}</p>
          <p className="mt-1 text-sm text-white/80">{d.startSessionText}</p>
        </Link>
        <Link href="/teacher/lessons/new" className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong" data-testid="create-lesson">
          <BookPlus aria-hidden className="size-7 text-brand" />
          <p className="mt-4 text-lg font-semibold">{d.createLesson}</p>
          <p className="mt-1 text-sm text-ink-muted">{d.createLessonText}</p>
        </Link>
        <Link href="/teacher/materials" className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
          <FileUp aria-hidden className="size-7 text-brand" />
          <p className="mt-4 text-lg font-semibold">{d.uploadMaterial}</p>
          <p className="mt-1 text-sm text-ink-muted">{d.uploadMaterialText}</p>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader
            title={dict.labs.assignments.title}
            action={
              <ButtonLink href="/teacher/assignments/new" size="sm" variant="secondary">
                {dict.labs.assignments.new}
              </ButtonLink>
            }
          />
          {assignments.length ? (
            <ul className="divide-y divide-line" data-testid="dashboard-teacher-assignments">
              {assignments.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <Link href={`/teacher/assignments/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block font-medium">{x.title}</span>
                      <span className="text-sm text-ink-muted">{fmt(dict.labs.assignments.progressCount, { done: x.done, total: x.total })}</span>
                    </span>
                    <span className="flex gap-1.5">
                      {x.toReview ? <Badge tone="warn">{fmt(dict.labs.assignments.toReview, { n: x.toReview })}</Badge> : null}
                      {x.overdue ? <Badge tone="danger">{fmt(dict.labs.assignments.overdueCount, { n: x.overdue })}</Badge> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 text-sm text-ink-muted">{dict.labs.assignments.empty}</p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-semibold">{dict.labs.hub.title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{dict.labs.hub.teacherLead}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {LAB_IDS.map((id) => (
              <li key={id}>
                <Link href={LAB_ROUTES[id]} className="flex items-center gap-2 rounded-xl border border-line p-2 text-sm font-medium hover:bg-muted/60">
                  <LabIcon lab={id} size="sm" />
                  <span className="leading-tight">{dict.labs.hub.rooms[id].name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/teacher/sessions/labs" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-1 text-sm font-medium text-brand hover:underline">
            <Radio aria-hidden className="size-4 shrink-0" />
            {dict.labs.bridge.title}
          </Link>
        </Card>
      </div>


      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={dict.labs.classes.myClasses} action={<ButtonLink href="/teacher/students" variant="ghost" size="sm">{dict.common.viewAll}</ButtonLink>} />
          {classes.length ? (
            <ul className="divide-y divide-line" data-testid="dashboard-classes">
              {classes.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <Link href={`/teacher/classes/${c.id}`} className="min-w-0 hover:text-brand hover:underline">
                    <span className="block font-medium">{c.name}</span>
                    <span className="text-sm text-ink-muted">{fmtCount(dict.labs.classes.membersCount, c.members.length)}</span>
                  </Link>
                  <ButtonLink href={`/teacher/sessions/new?class=${c.id}`} size="sm" variant="secondary">
                    {dict.labs.classes.startLesson}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 text-sm text-ink-muted">
              <Link href="/teacher/students" className="font-medium text-brand hover:underline">
                {dict.labs.classes.noClasses}
              </Link>
            </p>
          )}
        </Card>
        <Card>
          <CardHeader title={d.recentLessons} action={<ButtonLink href="/teacher/lessons" variant="ghost" size="sm">{dict.common.viewAll}</ButtonLink>} />
          {lessons.length ? (
            <ul className="divide-y divide-line">
              {lessons.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <Link href={`/teacher/lessons/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.title}</p>
                      <p className="text-sm text-ink-muted">
                        {dict.subjects[l.subject]} · {fmt(dict.common.grade, { n: l.grade })} · {fmtCount(dict.teacher.lessons.activities, l.activityCount)}
                      </p>
                    </div>
                    <Badge tone={l.status === "published" ? "success" : "neutral"}>{dict.status[l.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{d.noLessons}</p>
          )}
        </Card>

        <Card>
          <CardHeader title={d.recentSessions} action={<ButtonLink href="/teacher/sessions" variant="ghost" size="sm">{dict.common.viewAll}</ButtonLink>} />
          {ended.length ? (
            <ul className="divide-y divide-line">
              {ended.map((s) => (
                <li key={s.id}>
                  <Link href={`/teacher/sessions/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.title} {s.classLabel ? <span className="text-ink-subtle">· {s.classLabel}</span> : null}</p>
                      <p className="text-sm text-ink-muted">{relativeTime(dict, s.endedAt ?? s.createdAt)} · {fmtCount(d.participants, s.participantCount)}</p>
                    </div>
                    <span className="text-sm font-medium text-brand">{d.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{d.noSessions}</p>
          )}
        </Card>

        <Card>
          <CardHeader title={d.quizResults} action={<ButtonLink href="/teacher/quizzes" variant="ghost" size="sm">{dict.common.viewAll}</ButtonLink>} />
          {quizzes.length ? (
            <ul className="divide-y divide-line">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <Link href={`/teacher/quizzes/${q.id}?tab=results`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{q.title}</p>
                      <p className="text-sm text-ink-muted">{fmtCount(d.attempts, q.attemptCount)}</p>
                    </div>
                    {q.averagePercent !== null ? <Badge tone={q.averagePercent >= 70 ? "success" : q.averagePercent >= 50 ? "warn" : "danger"}>{fmt(d.averageScore, { n: q.averagePercent })}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{d.noQuizzes}</p>
          )}
        </Card>

        <Card>
          <CardHeader title={d.recentMaterials} action={<ButtonLink href="/teacher/materials" variant="ghost" size="sm">{dict.common.viewAll}</ButtonLink>} />
          {materials.length ? (
            <ul className="divide-y divide-line">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="text-sm text-ink-muted">{dict.subjects[m.subject]} · {relativeTime(dict, m.createdAt)}</p>
                  </div>
                  <Badge tone={m.visibility === "students" ? "brand" : "neutral"}>{dict.visibility[m.visibility]}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{d.noMaterials}</p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
