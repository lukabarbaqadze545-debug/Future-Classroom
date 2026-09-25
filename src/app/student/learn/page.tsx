import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { SUBJECTS, isSubject } from "@/lib/domain/catalog";
import { listPublishedLessons } from "@/lib/services/lessons";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const [{ dict }, { subject }] = await Promise.all([getDictionary(), searchParams]);
  const lessons = listPublishedLessons();
  const counts = new Map<string, number>();
  for (const l of lessons) counts.set(l.subject, (counts.get(l.subject) ?? 0) + 1);
  const active = subject && isSubject(subject) ? subject : null;
  const shown = active ? lessons.filter((l) => l.subject === active) : lessons;
  const available = SUBJECTS.filter((s) => counts.has(s));
  return (
    <PageContainer>
      <PageHeader title={dict.student.learn.title} description={dict.student.learn.lead} />
      <nav aria-label={dict.teacher.create.subject} className="mb-6 flex flex-wrap gap-2">
        <Link href="/student/learn" aria-current={!active ? "page" : undefined} className={cn("inline-flex h-11 items-center rounded-xl border px-4 text-sm font-medium", !active ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface hover:bg-muted")}>
          {dict.common.allSubjects}
        </Link>
        {available.map((s) => (
          <Link key={s} href={`/student/learn?subject=${s}`} aria-current={active === s ? "page" : undefined} className={cn("inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium", active === s ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface hover:bg-muted")}>
            {dict.subjects[s]}
            <span className="text-ink-subtle">{counts.get(s)}</span>
          </Link>
        ))}
      </nav>
      {shown.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/student/learn/${lesson.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-brand/40">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{dict.subjects[lesson.subject]}</Badge>
                  <Badge>{fmt(dict.common.grade, { n: lesson.grade })}</Badge>
                  {lesson.language === "ka" ? <Badge>ქარ</Badge> : null}
                </div>
                <h2 className="mt-3 text-lg font-semibold group-hover:text-brand">{lesson.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{lesson.objective}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-brand">
                  {dict.student.learn.open}
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={dict.student.learn.empty} />
      )}
    </PageContainer>
  );
}
