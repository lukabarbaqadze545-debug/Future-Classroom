"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpenCheck, Clock, Info, Lightbulb, Pin } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { CalloutTone, StudentBlock, StudentLesson } from "@/lib/courses/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";
import { ButtonLink } from "@/components/ui/button";
import { useEngagement } from "@/components/engagement/engagement-provider";
import { cn } from "@/components/ui/cn";
import { ExercisePanel } from "./exercise-panel";
import { PredictBlock, QuizBlock } from "./interactive-blocks";
import { ProgramRunner } from "./program-runner";
import { lessonStats, recordFinished, recordVisit, useCourseProgress } from "./progress";
import { RichText, inline, pick } from "./text";

const CALLOUTS: Record<CalloutTone, { icon: typeof Info; box: string; iconColor: string }> = {
  tip: { icon: Lightbulb, box: "border-brand/20 bg-brand-soft/50", iconColor: "text-brand-ink" },
  warn: { icon: AlertTriangle, box: "border-warn/25 bg-warn-soft", iconColor: "text-warn" },
  note: { icon: Info, box: "border-line-strong bg-muted/60", iconColor: "text-ink-muted" },
  remember: { icon: Pin, box: "border-success/25 bg-success-soft", iconColor: "text-success" },
};

function BlockView({ block, lessonId }: { block: StudentBlock; lessonId: string }) {
  const { dict, locale } = useI18n();
  switch (block.k) {
    case "text":
      return (
        <div className="space-y-3 text-[16px] leading-relaxed text-ink">
          <RichText text={block.text} locale={locale} />
        </div>
      );
    case "heading":
      return <h2 className="pt-3 text-xl font-semibold tracking-tight text-ink">{inline(pick(block.text, locale))}</h2>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={cn("space-y-1.5 pl-6 text-[16px] leading-relaxed text-ink", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((item, i) => (
            <li key={i}>{inline(pick(item, locale))}</li>
          ))}
        </Tag>
      );
    }
    case "callout": {
      const c = CALLOUTS[block.tone];
      const Icon = c.icon;
      return (
        <div className={cn("flex gap-3 rounded-xl border px-4 py-3 text-[15px]", c.box)} data-testid={`callout-${block.tone}`}>
          <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", c.iconColor)} />
          <div className="space-y-1 text-ink">
            <p className="font-semibold">{block.title ? pick(block.title, locale) : dict.courses.lesson.callout[block.tone]}</p>
            <RichText text={block.text} locale={locale} />
          </div>
        </div>
      );
    }
    case "code":
      return <ProgramRunner draftKey={`course:${lessonId}:${block.id}`} initial={block.code} stdin={block.stdin} expected={block.out} readOnly={block.readonly} caption={block.caption ? pick(block.caption, locale) : undefined} minRows={Math.min(14, Math.max(3, block.code.split("\n").length))} testId={`example-${block.id}`} />;
    case "predict":
      return <PredictBlock lessonId={lessonId} block={block} />;
    case "quiz":
      return <QuizBlock lessonId={lessonId} block={block} />;
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-ink-muted">
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} className="px-4 py-2 font-semibold">
                    {inline(pick(h, locale))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-line">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-2 align-top">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LessonView({ lesson, courseHref }: { lesson: StudentLesson; courseHref: string }) {
  const { dict, locale } = useI18n();
  const t = dict.courses;
  const progress = useCourseProgress();
  const { award } = useEngagement();
  const itemIds = lesson.blocks.filter((b) => b.k === "quiz" || b.k === "predict").map((b) => (b as { id: string }).id);
  const stats = lessonStats(lesson.id, lesson.exercises.map((e) => e.id), itemIds, progress);
  const georgianOnly = locale === "en" && lesson.blocks.some((b) => b.k === "text" && b.text.en === undefined);

  useEffect(() => {
    recordVisit(lesson.id);
  }, [lesson.id]);

  // Finishing every task of a lesson counts once (and earns experience once).
  useEffect(() => {
    if (stats.complete && stats.tasksTotal > 0 && recordFinished(lesson.id)) award({ kind: "lesson" });
  }, [stats.complete, stats.tasksTotal, lesson.id, award]);

  const total = stats.tasksTotal;
  const fraction = total ? stats.tasksDone / total : 0;
  return (
    <article className="mx-auto max-w-3xl space-y-8" data-testid="lesson" data-lesson={lesson.id}>
      <header className="space-y-3">
        <Link href={courseHref} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          {t.lesson.backToCourse}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{fmt(t.lesson.module, { n: lesson.moduleNumber })}</Badge>
          {lesson.kind === "checkpoint" ? <Badge tone="warn">{t.lesson.checkpointBadge}</Badge> : null}
          <Badge tone="neutral">
            <Clock aria-hidden className="size-3" />
            {fmt(t.lesson.minutesLong, { n: lesson.minutes })}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{pick(lesson.title, locale)}</h1>
        <p className="text-lg text-ink-muted">{pick(lesson.tagline, locale)}</p>
        {total ? (
          <div className="max-w-sm space-y-1">
            <Meter value={fraction * 100} tone={stats.complete ? "success" : "brand"} label={t.lesson.progressLabel} />
            <p className="text-xs text-ink-subtle">{fmt(t.lesson.tasksSolved, { done: stats.tasksDone, total })}</p>
          </div>
        ) : null}
      </header>

      {georgianOnly ? <Notice tone="info">{t.lesson.georgianOnly}</Notice> : null}

      <Card className="p-5">
        <p className="mb-2 text-sm font-semibold tracking-wide text-brand-ink uppercase">{t.lesson.goals}</p>
        <ul className="space-y-1.5">
          {lesson.goals.map((g, i) => (
            <li key={i} className="flex gap-2 text-[15px] text-ink">
              <BookOpenCheck aria-hidden className="mt-0.5 size-4.5 shrink-0 text-brand-ink" />
              <span>{inline(pick(g, locale))}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-6">
        {lesson.blocks.map((b, i) => (
          <BlockView key={`${b.k}-${i}`} block={b} lessonId={lesson.id} />
        ))}
      </div>

      {lesson.exercises.length ? (
        <section className="space-y-5" aria-labelledby="tasks">
          <h2 id="tasks" className="text-2xl font-semibold tracking-tight text-ink">
            {t.lesson.tasks}
          </h2>
          {lesson.exercises.map((e, i) => (
            <ExercisePanel key={e.id} exercise={e} index={i} />
          ))}
        </section>
      ) : null}

      {stats.complete && total > 0 ? <Notice tone="success" title={t.lesson.lessonDone}>{t.lesson.complete}</Notice> : null}

      {lesson.mistakes.length ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-ink">{t.lesson.mistakes}</h2>
          <ul className="list-disc space-y-1.5 pl-6 text-[15px] text-ink">
            {lesson.mistakes.map((m, i) => (
              <li key={i}>{inline(pick(m, locale))}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {lesson.summary.length ? (
        <section className="space-y-2 rounded-2xl border border-success/25 bg-success-soft p-5">
          <h2 className="text-xl font-semibold text-ink">{t.lesson.summary}</h2>
          <ul className="list-disc space-y-1.5 pl-6 text-[15px] text-ink">
            {lesson.summary.map((m, i) => (
              <li key={i}>{inline(pick(m, locale))}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6" aria-label={t.lesson.next}>
        {lesson.prev ? (
          <ButtonLink href={`${courseHref}/${lesson.prev.id}`} variant="secondary">
            <ArrowLeft aria-hidden className="size-4" />
            {t.lesson.prev}
          </ButtonLink>
        ) : (
          <span />
        )}
        {lesson.next ? (
          <ButtonLink href={`${courseHref}/${lesson.next.id}`} data-testid="next-lesson">
            {t.lesson.next}: {pick(lesson.next.title, locale)}
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        ) : null}
      </nav>
    </article>
  );
}
