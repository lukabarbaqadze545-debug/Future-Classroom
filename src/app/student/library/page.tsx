import { Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { isSubject } from "@/lib/domain/catalog";
import { listMaterials } from "@/lib/services/materials";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { LibraryAsk } from "@/components/student/library-ask";

export const metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ dict }, { subject }] = await Promise.all([getDictionary(), searchParams]);
  const materials = listMaterials(user);
  return (
    <PageContainer>
      <PageHeader title={dict.student.library.title} description={dict.student.library.lead} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <LibraryAsk initialSubject={subject && isSubject(subject) ? subject : ""} />
        <Card className="h-fit">
          <CardHeader title={dict.student.library.browse} />
          {materials.length ? (
            <ul className="divide-y divide-line">
              {materials.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <a href={`/api/materials/${m.id}/file`} className="inline-flex items-start gap-2 font-medium text-ink hover:text-brand">
                    <Download aria-hidden className="mt-1 size-3.5 shrink-0" />
                    {m.title}
                  </a>
                  <p className="pl-5 text-xs text-ink-subtle">
                    {dict.subjects[m.subject]}
                    {m.author ? ` · ${m.author}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{dict.student.library.noMaterials}</p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
