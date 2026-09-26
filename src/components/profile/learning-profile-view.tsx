import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/en";
import { fmt, fmtCount, formatDateTime, relativeTime, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import type { LearningProfile } from "@/lib/services/learning-profile";
import type { LabId } from "@/lib/labs/registry";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { LabIcon, LAB_ACCENT } from "@/components/labs/lab-shell";
import { STATUS_TONE } from "@/components/assignments/review-board";
import { cn } from "@/components/ui/cn";

function LabCard({ lab, title, href, children }: { lab: LabId; title: string; href: string; children: ReactNode }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <Link href={href} className="flex items-center gap-3 hover:underline">
        <LabIcon lab={lab} size="sm" />
        <h3 className={cn("font-semibold", LAB_ACCENT[lab].text)}>{title}</h3>
      </Link>
      <div className="mt-3 flex-1 space-y-2 text-sm">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Server-rendered overview of one student's work across all laboratories. */
export function LearningProfileView({ profile, dict, locale, studentId, audience = "student" }: { profile: LearningProfile; dict: Dictionary; locale: Locale; studentId: string; audience?: "student" | "staff" }) {
  const p = dict.labs.profile;
  const a = dict.labs.assignments;
  const labName = dict.labs.hub.rooms;
  return (
    <div className="space-y-6" data-testid="learning-profile">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <h3 className="font-semibold">{p.assignments}</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {profile.assignments.stats.done}/{profile.assignments.stats.total}
          </p>
          <Meter value={profile.assignments.stats.total ? (profile.assignments.stats.done / profile.assignments.stats.total) * 100 : 0} tone="success" className="mt-2" label={p.assignments} />
          {profile.assignments.stats.overdue ? <Badge tone="danger" className="mt-2">{fmt(a.overdueCount, { n: profile.assignments.stats.overdue })}</Badge> : null}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">{p.lessons}</h3>
          <div className="mt-2 space-y-1.5 text-sm">
            <Row label={dict.student.progress.completed} value={profile.lessons.completedActivities} />
            <Row label={dict.student.progress.quizAverage} value={profile.lessons.quizAveragePercent === null ? "—" : `${profile.lessons.quizAveragePercent}%`} />
            <Row label={dict.student.progress.lessons} value={profile.lessons.lessonsStudied} />
          </div>
        </Card>
        <LabCard lab="programming" title={labName.programming.name} href="/labs/programming">
          <Row label={p.solvedProblems} value={`${profile.programming.solved}/${profile.programming.total}`} />
          {profile.programming.byLevel.map((lv) => (
            <div key={lv.level}>
              <div className="flex justify-between text-xs text-ink-muted">
                <span>{fmt(dict.labs.common.level, { n: lv.level })}</span>
                <span className="tabular-nums">
                  {lv.solved}/{lv.total}
                </span>
              </div>
              <Meter value={lv.total ? (lv.solved / lv.total) * 100 : 0} tone="success" className="mt-0.5 h-1.5" label={fmt(dict.labs.common.level, { n: lv.level })} />
            </div>
          ))}
        </LabCard>
        <LabCard lab="critical" title={labName.critical.name} href="/labs/critical-thinking">
          <Row label={p.exercises} value={`${profile.critical.completed}/${profile.critical.total}`} />
          <Row label={p.accuracy} value={profile.critical.accuracy === null ? "—" : `${profile.critical.accuracy}%`} />
          {profile.critical.weakest.length ? (
            <p className="text-xs text-ink-muted">
              {dict.labs.critical.progress.fallacyMap}: {profile.critical.weakest.map((f) => `${f.name ? tr(f.name, locale).split(" (")[0] : f.id} ${f.correct}/${f.total}`).join(", ")}
            </p>
          ) : null}
        </LabCard>
        <LabCard lab="stem" title={labName.stem.name} href="/labs/stem">
          <Row label={dict.labs.stem.tabs.experiments} value={`${profile.stem.experiments}/${profile.stem.experimentsTotal}`} />
          <Row label={dict.labs.stem.tabs.simulations} value={`${profile.stem.simulations}/${profile.stem.simulationsTotal}`} />
          <Row label={dict.labs.stem.challenges} value={`${profile.stem.challenges}/${profile.stem.challengesTotal}`} />
          <Row label={p.projects} value={`${profile.stem.projectsSubmitted}/${profile.stem.projects.length}`} />
        </LabCard>
        <LabCard lab="research" title={labName.research.name} href="/labs/research">
          <Row label={p.researchProjects} value={profile.research.length} />
          {profile.research.slice(0, 3).map((r) => (
            <div key={r.id}>
              <Link href={`/labs/research/${r.id}`} className="text-xs font-medium hover:underline">
                {r.title}
              </Link>
              <Meter value={(r.done / r.total) * 100} tone="success" className="mt-0.5 h-1.5" label={r.title} />
            </div>
          ))}
        </LabCard>
        <LabCard lab="library" title={labName.library.name} href="/library">
          <Row label={p.booksFinished} value={profile.library.finished} />
          <Row label={p.reading} value={profile.library.reading} />
        </LabCard>
        <LabCard lab="career" title={labName.career.name} href="/career">
          <Row label={p.portfolioItems} value={profile.career.portfolio} />
          <Row label={p.universities} value={profile.career.universities} />
          <Row label={p.goals} value={profile.career.activeGoals} />
          {profile.portfolioItems.length ? (
            <ul className="space-y-0.5 text-xs text-ink-muted" data-testid="profile-portfolio">
              {profile.portfolioItems.map((i) => (
                <li key={i.id} className="truncate">
                  {i.title}
                </li>
              ))}
            </ul>
          ) : null}
          <Link href={`/portfolio/${studentId}`} className="inline-block text-sm font-medium text-brand hover:underline">
            {p.viewPortfolio}
          </Link>
        </LabCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={p.recent} />
          {profile.recent.length ? (
            <ul className="divide-y divide-line">
              {profile.recent.map((w, i) => (
                <li key={`${w.href}-${i}`}>
                  <Link href={w.href} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-muted/50">
                    <span className="flex min-w-0 items-center gap-2.5">
                      {w.lab !== "lessons" ? <LabIcon lab={w.lab} size="sm" /> : null}
                      <span className="truncate text-sm font-medium" lang={w.lang}>
                        {w.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">{relativeTime(dict, w.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothing}</p>
          )}
        </Card>
        <Card>
          <CardHeader title={p.liveLessons} />
          {profile.liveLessons.length ? (
            <ul className="divide-y divide-line" data-testid="profile-live-lessons">
              {profile.liveLessons.map((l) => (
                <li key={l.sessionId} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{l.title}</span>
                    <span className="text-xs text-ink-muted">
                      {formatDateTime(locale, l.at)}
                      {l.classLabel ? ` · ${l.classLabel}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{l.graded ? fmt(p.liveResult, { correct: l.correct, graded: l.graded }) : fmtCount(p.answeredOnly, l.answered)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothing}</p>
          )}
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={p.lessonsWorked} />
          {profile.lessonsWorked.length ? (
            <ul className="divide-y divide-line" data-testid="profile-lessons">
              {profile.lessonsWorked.map((l) => (
                <li key={l.lessonId} className="px-5 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    {audience === "student" ? (
                      <Link href={`/student/learn/${l.lessonId}`} className="min-w-0 truncate font-medium hover:text-brand hover:underline">
                        {l.title}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate font-medium">{l.title}</span>
                    )}
                    <span className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                      {l.quizBestPercent !== null ? <span className="tabular-nums">{fmt(p.quizBest, { n: l.quizBestPercent })}</span> : null}
                      {l.completed ? <Badge tone="success">{p.completed}</Badge> : null}
                    </span>
                  </div>
                  {l.activitiesTotal ? (
                    <div className="mt-1">
                      <p className="text-xs text-ink-muted">{fmt(p.exercisesDone, { done: l.activitiesDone, total: l.activitiesTotal })}</p>
                      <Meter value={(l.activitiesDone / l.activitiesTotal) * 100} tone="success" className="mt-0.5 h-1.5" label={l.title} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothing}</p>
          )}
        </Card>
        <Card>
          <CardHeader title={p.quizzesTitle} />
          {profile.quizzes.length ? (
            <ul className="divide-y divide-line" data-testid="profile-quizzes">
              {profile.quizzes.map((q) => (
                <li key={q.quizId} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  {audience === "student" ? (
                    <Link href={`/student/quizzes/${q.quizId}`} className="min-w-0 truncate font-medium hover:text-brand hover:underline">
                      {q.title}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate font-medium">{q.title}</span>
                  )}
                  <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                    {q.bestPercent === null ? "—" : fmt(p.best, { n: q.bestPercent })} · {fmtCount(p.attempts, q.attempts)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothing}</p>
          )}
        </Card>
        <Card>
          <CardHeader title={p.toDo} />
          {profile.assignments.pending.length ? (
            <ul className="divide-y divide-line" data-testid="profile-pending">
              {profile.assignments.pending.map((x) => (
                <li key={x.id}>
                  <Link href={audience === "student" ? `/student/assignments/${x.id}` : `/teacher/assignments/${x.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-muted/50">
                    <span className="min-w-0 truncate font-medium">{x.title}</span>
                    <Badge tone={x.overdue ? "danger" : STATUS_TONE[x.recipient.status]}>{x.overdue ? dict.labs.common.overdue : a.status[x.recipient.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothingToDo}</p>
          )}
        </Card>
        <Card>
          <CardHeader title={p.doneWork} />
          {profile.assignments.done.length ? (
            <ul className="divide-y divide-line" data-testid="profile-done">
              {profile.assignments.done.map((x) => (
                <li key={x.id}>
                  <Link href={audience === "student" ? `/student/assignments/${x.id}` : `/teacher/assignments/${x.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-muted/50">
                    <span className="min-w-0 truncate font-medium">{x.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {x.recipient.score !== null && x.recipient.maxScore ? <span className="tabular-nums">{`${x.recipient.score}/${x.recipient.maxScore}`}</span> : null}
                      <Badge tone={STATUS_TONE[x.recipient.status]}>{a.status[x.recipient.status]}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{p.nothing}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
