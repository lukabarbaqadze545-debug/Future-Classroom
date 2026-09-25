import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { listLessonsForTeacher, listPublishedLessons } from "@/lib/services/lessons";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DuplicateLessonButton } from "@/components/lesson/duplicate-button";

export const metadata = { title: "Lessons" };

export default async function LessonsPage() {
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const l = dict.teacher.lessons;
  const lessons = listLessonsForTeacher(user.id);
  const shared = listPublishedLessons().filter((lesson) => lesson.teacherId !== user.id);
  return (
    <PageContainer>
      <PageHeader
        title={l.title}
        description={l.lead}
        actions={
          <ButtonLink href="/teacher/lessons/new" size="lg">
            <Plus aria-hidden className="size-5" />
            {l.new}
          </ButtonLink>
        }
      />
      {lessons.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/teacher/lessons/${lesson.id}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-brand/40">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={lesson.status === "published" ? "success" : "neutral"} dot>
                  {dict.status[lesson.status]}
                </Badge>
                <Badge tone={lesson.origin === "ai" ? "ai" : lesson.origin === "template" ? "brand" : "neutral"}>{dict.origin[lesson.origin]}</Badge>
                {lesson.language === "ka" ? <Badge>ქარ</Badge> : null}
              </div>
              <h2 className="mt-3 text-lg font-semibold group-hover:text-brand">{lesson.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {dict.subjects[lesson.subject]} · {fmt(dict.common.grade, { n: lesson.grade })} · {fmt(dict.common.minutes, { n: lesson.durationMin })}
              </p>
              <p className="mt-auto pt-4 text-sm text-ink-subtle">
                {fmtCount(l.activities, lesson.activityCount)} · {fmt(l.updated, { when: relativeTime(dict, lesson.updatedAt) })}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={l.empty} action={<ButtonLink href="/teacher/lessons/new">{dict.teacher.dashboard.createLesson}</ButtonLink>} />
      )}

      {shared.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">{l.schoolLessons}</h2>
          <p className="mt-1 text-sm text-ink-muted">{l.schoolLessonsLead}</p>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
            {shared.map((lesson) => (
              <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-sm text-ink-muted">
                    {dict.subjects[lesson.subject]} · {fmt(dict.common.grade, { n: lesson.grade })} · {fmt(dict.common.by, { name: lesson.teacherName })}
                  </p>
                </div>
                <DuplicateLessonButton lessonId={lesson.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
