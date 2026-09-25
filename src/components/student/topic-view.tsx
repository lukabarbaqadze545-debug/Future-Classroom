"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, Download, Library, ListChecks, MessageCircleQuestion } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import type { Section } from "@/lib/domain/schemas";
import type { Subject } from "@/lib/domain/catalog";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FunctionPlot } from "@/components/charts/function-plot";
import { Practice, type PracticeItem } from "./practice";
import { TutorChat } from "./tutor-chat";

export interface StudentLesson {
  id: string;
  title: string;
  subject: Subject;
  grade: number;
  language: "en" | "ka";
  objectives: string[];
  sections: Section[];
  discussionQuestions: string[];
  homework: string[];
  practice: PracticeItem[];
  quizzes: { id: string; title: string; questionCount: number; best: string | null }[];
  materials: { id: string; title: string }[];
  libraryResources: { id: string; title: string }[];
}

type TabId = "learn" | "practice" | "quiz" | "ask";

export function TopicView({ lesson, aiAvailable, initialTab }: { lesson: StudentLesson; aiAvailable: boolean; initialTab: TabId }) {
  const { dict } = useI18n();
  const l = dict.student.lesson;
  const [tab, setTab] = useState<TabId>(initialTab);
  return (
    <div>
      <Link href={`/student/learn?subject=${lesson.subject}`} className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" />
        {dict.subjects[lesson.subject]}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" lang={lesson.language}>
        {lesson.title}
      </h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="brand">{dict.subjects[lesson.subject]}</Badge>
        <Badge>{fmt(dict.common.grade, { n: lesson.grade })}</Badge>
      </div>
      <Tabs
        className="mt-5"
        size="lg"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "learn", label: l.tabs.learn },
          { id: "practice", label: l.tabs.practice, badge: <Badge>{lesson.practice.length}</Badge> },
          { id: "quiz", label: l.tabs.quiz },
          { id: "ask", label: l.tabs.ask },
        ]}
      />
      <div className="mt-6" lang={tab === "learn" || tab === "practice" ? lesson.language : undefined}>
        {tab === "learn" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              {lesson.objectives.length ? (
                <Card className="p-5">
                  <h2 className="font-semibold">{l.objectives}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {lesson.objectives.map((o) => (
                      <li key={o} className="flex gap-2 text-ink-muted">
                        <ListChecks aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
              {lesson.sections
                .filter((s) => s.kind !== "practice")
                .map((section) => (
                  <Card key={section.id} className="p-5 sm:p-6">
                    <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{dict.sectionKinds[section.kind]}</p>
                    <h2 className="mt-1 text-xl font-semibold">{section.title}</h2>
                    <p className="fc-prose mt-3 text-[16px] leading-relaxed">{section.body}</p>
                    {section.visual ? <FunctionPlot className="mt-4 max-w-xl" {...section.visual} /> : null}
                  </Card>
                ))}
            </div>
            <aside className="space-y-5">
              {lesson.discussionQuestions.length ? (
                <Card className="p-5">
                  <h2 className="font-semibold">{l.discussion}</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
                    {lesson.discussionQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}
              {lesson.homework.length ? (
                <Card className="p-5">
                  <h2 className="font-semibold">{l.homework}</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
                    {lesson.homework.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}
              <Card className="p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Library aria-hidden className="size-4 text-brand" />
                  {l.materials}
                </h2>
                {lesson.materials.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {lesson.materials.map((m) => (
                      <li key={m.id}>
                        <a href={`/api/materials/${m.id}/file`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                          <Download aria-hidden className="size-3.5" />
                          {m.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {lesson.libraryResources.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {lesson.libraryResources.map((r) => (
                      <li key={r.id}>
                        <Link href={`/library/${r.id}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                          <BookOpen aria-hidden className="size-3.5" />
                          {r.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ButtonLink href={`/library?subject=${lesson.subject}#ask`} variant="ghost" size="sm" className="mt-2">
                  {l.openInLibrary}
                </ButtonLink>
              </Card>
            </aside>
          </div>
        ) : null}
        {tab === "practice" ? <Practice lessonId={lesson.id} items={lesson.practice} /> : null}
        {tab === "quiz" ? (
          <div className="space-y-3">
            <p className="text-ink-muted">{l.quizLead}</p>
            {lesson.quizzes.length ? (
              lesson.quizzes.map((q) => (
                <Card key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-semibold">{q.title}</p>
                    <p className="text-sm text-ink-muted">{fmtCount(dict.teacher.quizzes.questions, q.questionCount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.best ? <Badge tone="success">{fmt(dict.student.dashboard.taken, { score: q.best })}</Badge> : null}
                    <ButtonLink href={`/student/quizzes/${q.id}`}>{q.best ? dict.student.dashboard.retake : l.startQuiz}</ButtonLink>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-ink-muted">{l.noQuiz}</p>
            )}
          </div>
        ) : null}
        {tab === "ask" ? (
          <div className="max-w-3xl">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <MessageCircleQuestion aria-hidden className="size-5 text-ai" />
              {dict.student.tutor.title}
            </h2>
            <TutorChat lessonId={lesson.id} aiAvailable={aiAvailable} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
