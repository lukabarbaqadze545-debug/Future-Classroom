import Link from "next/link";
import { ArrowRight, Code2, Terminal } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { fmtCount } from "@/lib/i18n/config";
import { studentCourse } from "@/lib/courses/service";
import { PageContainer, SiteHeader } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { pick } from "@/components/courses/text";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.courses.metaCourses };
}

/** Open to everyone: courses need no account, and progress lives in the visitor's own browser. */
export default async function CoursesPage() {
  const { dict, locale } = await getDictionary();
  const t = dict.courses;
  const cpp = studentCourse("cpp");
  const lessons = cpp.modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <div className="space-y-8">
          <PageHeader title={t.title} description={t.list.lead} />
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card className="group relative flex flex-col gap-4 p-6 transition-shadow hover:shadow-lg" data-testid="course-card">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                  <Code2 aria-hidden className="size-6" />
                </span>
                <Badge tone="brand">{t.list.cppBadge}</Badge>
                <Badge tone="neutral">{fmtCount(t.roadmap.lessons, lessons)}</Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{pick(cpp.title, locale)}</h2>
              <p className="text-[15px] text-ink-muted">{pick(cpp.tagline, locale)}</p>
              <Link href="/courses/cpp" className="mt-auto inline-flex items-center gap-2 font-medium text-brand-ink after:absolute after:inset-0" data-testid="open-cpp">
                {t.list.open}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Card>
            <Card className="relative flex flex-col gap-4 p-6 transition-shadow hover:shadow-lg">
              <span className="grid size-12 place-items-center rounded-2xl bg-muted text-ink-muted">
                <Terminal aria-hidden className="size-6" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-ink">{t.playground.title}</h2>
              <p className="text-[15px] text-ink-muted">{t.list.playgroundText}</p>
              <Link href="/courses/playground" className="mt-auto inline-flex items-center gap-2 font-medium text-brand-ink after:absolute after:inset-0" data-testid="open-playground">
                {t.list.playground}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
