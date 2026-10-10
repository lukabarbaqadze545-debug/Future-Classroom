"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, CheckCircle2, Circle, CircleDot, Clock, Flag, Library, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import type { StudentCourse } from "@/lib/courses/types";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";
import { lessonStats, resetCourseProgress, useCourseProgress, type CourseProgress } from "./progress";
import { inline, pick } from "./text";

type LessonRow = StudentCourse["modules"][number]["lessons"][number];

function statusOf(lesson: LessonRow, p: CourseProgress): "done" | "started" | "new" {
  const s = lessonStats(lesson.id, lesson.exerciseIds, lesson.itemIds, p);
  if (s.complete && s.tasksTotal > 0) return "done";
  const touched = s.tasksDone > 0 || s.itemsDone > 0 || lesson.exerciseIds.some((id) => (p.exercises[id]?.attempts ?? 0) > 0);
  return touched ? "started" : "new";
}

/** Where "continue" leads: the lesson opened last if unfinished, else the first unfinished one. */
export function nextLesson(course: StudentCourse, p: CourseProgress): { id: string; started: boolean } | null {
  const all = course.modules.flatMap((m) => m.lessons);
  if (!all.length) return null;
  const last = p.last ? all.find((l) => l.id === p.last) : undefined;
  if (last && statusOf(last, p) !== "done") return { id: last.id, started: true };
  const open = all.find((l) => statusOf(l, p) !== "done");
  const started = all.some((l) => statusOf(l, p) !== "new");
  return { id: (open ?? all[0]).id, started };
}

export function CourseMap({ course }: { course: StudentCourse }) {
  const { dict, locale } = useI18n();
  const t = dict.courses;
  const p = useCourseProgress();
  const base = `/courses/${course.id}`;
  const allExercises = course.modules.flatMap((m) => m.lessons.flatMap((l) => l.exerciseIds));
  const solved = allExercises.filter((id) => p.exercises[id]?.done).length;
  const go = nextLesson(course, p);

  return (
    <div className="space-y-10" data-testid="course-map">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{t.list.cppBadge}</Badge>
          {allExercises.length ? <Badge tone="neutral">{fmt(t.list.progress, { done: solved, total: allExercises.length })}</Badge> : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl">{pick(course.title, locale)}</h1>
        <p className="max-w-3xl text-lg text-ink-muted">{pick(course.tagline, locale)}</p>
        <p className="max-w-3xl text-[15px] text-ink-muted">
          <span className="font-semibold text-ink">{t.roadmap.audience}: </span>
          {pick(course.audience, locale)}
        </p>
        {go ? (
          <ButtonLink href={`${base}/${go.id}`} size="lg" data-testid="start-course">
            {go.started ? t.list.continue : t.list.start}
            <ArrowRight aria-hidden className="size-5" />
          </ButtonLink>
        ) : null}
      </section>

      <section>
        <Card className="space-y-2 p-5">
          <h2 className="text-lg font-semibold text-ink">{t.roadmap.howTitle}</h2>
          <ol className="list-decimal space-y-1.5 pl-6 text-[15px] text-ink-muted">
            {t.roadmap.how.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="space-y-6" aria-label={t.title}>
        {course.modules.map((m) => {
          const exerciseIds = m.lessons.flatMap((l) => l.exerciseIds);
          const done = exerciseIds.filter((id) => p.exercises[id]?.done).length;
          const minutes = m.lessons.reduce((sum, l) => sum + l.minutes, 0);
          return (
            <Card key={m.id} className="overflow-hidden" data-testid="module" data-module={m.id}>
              <div className="space-y-3 border-b border-line bg-muted/30 px-5 py-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                  <Badge tone="brand">{fmt(t.roadmap.moduleN, { n: m.number })}</Badge>
                  <span>{fmtCount(t.roadmap.lessons, m.lessons.length)}</span>
                  <span aria-hidden>·</span>
                  <span>{fmtCount(t.roadmap.tasks, exerciseIds.length)}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden className="size-3" />
                    {fmt(t.roadmap.minutes, { n: minutes })}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">{pick(m.title, locale)}</h2>
                <p className="text-[15px] text-ink-muted">{pick(m.summary, locale)}</p>
                {exerciseIds.length ? (
                  <div className="max-w-xs space-y-1">
                    <Meter value={(done / exerciseIds.length) * 100} tone={done === exerciseIds.length ? "success" : "brand"} label={pick(m.title, locale)} />
                    <p className="text-xs text-ink-subtle">{fmt(t.list.progress, { done, total: exerciseIds.length })}</p>
                  </div>
                ) : null}
              </div>
              <ul className="divide-y divide-line">
                {m.lessons.map((l, i) => {
                  const status = statusOf(l, p);
                  const Icon = status === "done" ? CheckCircle2 : status === "started" ? CircleDot : Circle;
                  return (
                    <li key={l.id}>
                      <Link href={`${base}/${l.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50" data-testid="lesson-link" data-lesson={l.id} data-status={status}>
                        <Icon aria-hidden className={cn("size-5 shrink-0", status === "done" ? "text-success" : status === "started" ? "text-brand-ink" : "text-ink-subtle")} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink">
                            {m.number}.{i + 1} {pick(l.title, locale)}
                          </span>
                          <span className="block truncate text-sm text-ink-muted">{pick(l.tagline, locale)}</span>
                        </span>
                        {l.kind === "checkpoint" ? (
                          <Badge tone="warn">
                            <Flag aria-hidden className="size-3" />
                            {t.roadmap.checkpoint}
                          </Badge>
                        ) : null}
                        <span className="hidden text-xs text-ink-subtle sm:block">{fmt(t.roadmap.minutes, { n: l.minutes })}</span>
                        <ArrowRight aria-hidden className="size-4 shrink-0 text-ink-subtle" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {m.outcomes.length ? (
                <div className="border-t border-line px-5 py-4">
                  <p className="text-sm font-semibold text-ink-muted">{t.roadmap.outcomes}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-6 text-sm text-ink-muted">
                    {m.outcomes.map((o, i) => (
                      <li key={i}>{inline(pick(o, locale))}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          );
        })}
      </section>

      {course.planned.length ? (
        <section className="space-y-4" aria-label={t.roadmap.planned}>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{t.roadmap.planned}</h2>
            <p className="max-w-3xl text-[15px] text-ink-muted">{t.roadmap.plannedLead}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {course.planned.map((m) => (
              <Card key={m.number} className="space-y-2 p-5" data-testid="planned-module">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{fmt(t.roadmap.moduleN, { n: m.number })}</Badge>
                  <Badge tone="neutral" dot>
                    {t.roadmap.planned}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-ink">{pick(m.title, locale)}</h3>
                <p className="text-sm text-ink-muted">{pick(m.summary, locale)}</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                  {m.topics.map((topic, i) => (
                    <li key={i}>{inline(pick(topic, locale))}</li>
                  ))}
                </ul>
                {m.book ? (
                  <p className="inline-flex items-center gap-1.5 text-sm text-ink-subtle">
                    <Library aria-hidden className="size-4" />
                    {fmt(t.roadmap.plannedBook, { n: m.book.chapter })}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2">
          <BookMarked aria-hidden className="size-4" />
          {t.roadmap.deviceNote}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm(t.progress.resetConfirm)) resetCourseProgress();
          }}
          data-testid="reset-course"
        >
          <Trash2 aria-hidden className="size-4" />
          {t.progress.reset}
        </Button>
      </section>
    </div>
  );
}
