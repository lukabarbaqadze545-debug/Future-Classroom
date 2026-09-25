import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { resolveCatalog } from "@/lib/content/subject-items";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { SubjectCatalog, type CatalogSubject } from "@/components/subjects/subject-catalog";

export async function generateMetadata() {
  return pageTitle((p) => p.subjects);
}

export default async function SubjectsPage() {
  const [{ dict, locale }, user] = await Promise.all([getDictionary(), getCurrentUser()]);
  const c = dict.subjectCatalog;
  const subjects: CatalogSubject[] = resolveCatalog(locale, c.tools).map((s) => ({
    id: s.id,
    name: dict.subjects[s.id],
    description: s.description,
    icon: s.entry.icon,
    category: s.entry.category,
    grades: s.entry.grades,
    counts: s.counts,
    keywords: [...s.topics.map((t) => t.name), ...s.topics.flatMap((t) => t.items.map((i) => i.title))].join(" "),
  }));
  return (
    <PageContainer wide>
      <PageHeader
        title={c.title}
        description={c.lead}
        actions={
          user?.role === "student" ? (
            <Link href="/student/learn" className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-brand hover:bg-brand-soft">
              {c.allLessons}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : null
        }
      />
      <SubjectCatalog subjects={subjects} />
    </PageContainer>
  );
}
