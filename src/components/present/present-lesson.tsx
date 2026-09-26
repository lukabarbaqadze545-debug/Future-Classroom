"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { LessonContent } from "@/lib/domain/schemas";
import type { Subject } from "@/lib/domain/catalog";
import { cn } from "@/components/ui/cn";
import { FunctionPlot } from "@/components/charts/function-plot";
import { StartSessionButton } from "@/components/teacher/start-session-dialog";
import { PresentButton, PresentShell } from "./present-shell";

type Slide =
  | { kind: "title" }
  | { kind: "objectives" }
  | { kind: "section"; index: number }
  | { kind: "discussion" };

/** Slide view of a lesson for the classroom display. Arrow keys move between slides. */
export function PresentLesson({ lesson }: { lesson: { id: string; title: string; subject: Subject; grade: number; language: string; content: LessonContent; activityCount: number } }) {
  const { dict } = useI18n();
  const p = dict.present;
  const slides: Slide[] = [
    { kind: "title" },
    ...(lesson.content.objectives.length ? [{ kind: "objectives" as const }] : []),
    ...lesson.content.sections.map((_, index) => ({ kind: "section" as const, index })),
    ...(lesson.content.discussionQuestions.length ? [{ kind: "discussion" as const }] : []),
  ];
  const [index, setIndex] = useState(0);
  const go = useCallback((delta: number) => setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + delta))), [slides.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);
  const slide = slides[index];

  return (
    <PresentShell
      top={<p className="truncate text-xl font-semibold opacity-70">{lesson.title}</p>}
      controls={(theme) => (
        <>
          <PresentButton theme={theme} onClick={() => go(-1)} disabled={index === 0}>
            <ChevronLeft aria-hidden className="size-7" />
            <span className="sr-only">{dict.common.previous}</span>
          </PresentButton>
          <span className="min-w-24 text-center text-lg tabular-nums opacity-70" aria-live="polite">
            {fmt(p.slide, { n: index + 1, m: slides.length })}
          </span>
          <PresentButton theme={theme} variant="primary" onClick={() => go(1)} disabled={index === slides.length - 1}>
            <ChevronRight aria-hidden className="size-7" />
            <span className="sr-only">{dict.common.next}</span>
          </PresentButton>
          {lesson.activityCount > 0 ? <StartSessionButton size="xl" label={p.startSession} lessonId={lesson.id} /> : null}
          <PresentButton theme={theme} href={`/teacher/lessons/${lesson.id}`}>
            <LogOut aria-hidden className="size-6" />
            <span className="sr-only">{p.exit}</span>
          </PresentButton>
        </>
      )}
    >
      {(theme) => {
        const muted = theme === "dark" ? "text-white/70" : "text-ink-muted";
        return (
          <div className="fc-fade-in mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center" key={index} lang={lesson.language}>
            {slide.kind === "title" ? (
              <div className="text-center">
                <p className={cn("text-2xl", muted)}>
                  {dict.subjects[lesson.subject]} · {fmt(dict.common.grade, { n: lesson.grade })}
                </p>
                <h1 className="mt-6 text-[clamp(30px,6vw,96px)] leading-tight wrap-break-word font-semibold tracking-tight">{lesson.title}</h1>
              </div>
            ) : null}
            {slide.kind === "objectives" ? (
              <div>
                <h1 className="text-[clamp(28px,4vw,64px)] font-semibold wrap-break-word">{p.objectives}</h1>
                <ul className="mt-10 space-y-6">
                  {lesson.content.objectives.map((o) => (
                    <li key={o} className="flex gap-5 text-[clamp(20px,2.4vw,38px)] leading-snug wrap-break-word">
                      <span aria-hidden className="mt-3 size-3.5 shrink-0 rounded-full bg-brand" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {slide.kind === "section"
              ? (() => {
                  const section = lesson.content.sections[slide.index];
                  return (
                    <div className={cn("grid items-start gap-10", section.visual && "lg:grid-cols-[1.1fr_1fr]")}>
                      <div>
                        <p className={cn("text-xl font-semibold tracking-wide uppercase", muted)}>{dict.sectionKinds[section.kind]}</p>
                        <h1 className="mt-3 text-[clamp(26px,3.6vw,58px)] leading-tight wrap-break-word font-semibold">{section.title}</h1>
                        <p className="fc-prose mt-8 text-[clamp(20px,1.9vw,30px)] leading-relaxed">{section.body}</p>
                      </div>
                      {section.visual ? <FunctionPlot {...section.visual} large className={theme === "dark" ? "bg-white" : undefined} /> : null}
                    </div>
                  );
                })()
              : null}
            {slide.kind === "discussion" ? (
              <div>
                <h1 className="text-[clamp(28px,4vw,64px)] font-semibold wrap-break-word">{p.discussion}</h1>
                <ol className="mt-10 list-decimal space-y-6 pl-10 text-[clamp(20px,2.4vw,38px)] leading-snug wrap-break-word">
                  {lesson.content.discussionQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        );
      }}
    </PresentShell>
  );
}
