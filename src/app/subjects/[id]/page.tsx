import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { findSubjectEntry } from "@/lib/content/subjects";
import { resolveSubjectPage } from "@/lib/content/subject-items";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/misc";
import { SubjectIcon } from "@/components/subjects/subject-icon";
import { ItemRow, SubjectExplorer, type Viewer } from "@/components/subjects/subject-explorer";

export const metadata = { title: "Subject" };

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user, { dict, locale }] = await Promise.all([params, getCurrentUser(), getDictionary()]);
  const entry = findSubjectEntry(id);
  if (!entry || !user) notFound();
  const c = dict.subjectCatalog;
  const staff = isStaff(user);
  const viewer: Viewer = { id: user.id, staff };
  const subject = resolveSubjectPage(entry, locale, c.tools, staff ? null : user.id);
  const done = subject.path.filter((i) => i.status === "done").length;

  return (
    <PageContainer wide>
      <Link href="/subjects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" />
        {c.allSubjects}
      </Link>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <SubjectIcon icon={entry.icon} category={entry.category} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">{dict.subjects[entry.id]}</h1>
            <p className="mt-1.5 max-w-3xl text-[15px] text-ink-muted">{subject.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{fmt(c.grades, { from: entry.grades[0], to: entry.grades[1] })}</Badge>
              <Badge tone="neutral">{c.categories[entry.category]}</Badge>
            </div>
          </div>
        </div>
        {staff ? (
          <ButtonLink href={`/teacher/lessons/new?subject=${entry.id}`} variant="secondary" className="shrink-0">
            <Plus aria-hidden className="size-4" />
            {dict.teacher.lessons.new}
          </ButtonLink>
        ) : null}
      </header>

      {subject.path.length ? (
        <section aria-labelledby="path" className="mb-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="path" className="text-xl font-semibold">
                {c.path}
              </h2>
              <p className="text-sm text-ink-muted">{c.pathLead}</p>
            </div>
            {staff ? null : (
              <div className="w-full max-w-60">
                <p className="text-right text-sm text-ink-muted">{fmt(c.pathProgress, { done, total: subject.path.length })}</p>
                <Meter value={(done / subject.path.length) * 100} tone="success" className="mt-1" label={fmt(c.pathProgress, { done, total: subject.path.length })} />
              </div>
            )}
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]" data-testid="learning-path">
            {subject.path.map((item, i) => (
              <ItemRow key={item.key} item={item} viewer={viewer} prefix={<span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums text-ink-muted">{i + 1}</span>} />
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="topics" className="mb-10">
        <h2 id="topics" className="mb-3 text-xl font-semibold">
          {c.topics}
        </h2>
        <SubjectExplorer topics={subject.topics} viewer={viewer} />
      </section>

      {subject.schoolLessons.length ? (
        <section aria-labelledby="school-lessons">
          <h2 id="school-lessons" className="mb-3 text-xl font-semibold">
            {c.schoolLessons}
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
            {subject.schoolLessons.map((item) => (
              <ItemRow key={item.key} item={item} viewer={viewer} />
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
