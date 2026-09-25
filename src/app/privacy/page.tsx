import { ShieldCheck } from "lucide-react";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";

export async function generateMetadata() {
  return pageTitle((p) => p.privacy);
}

export default async function PrivacyPage() {
  const { dict } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <PageHeader title={dict.privacy.title} description={dict.privacy.lead} />
          <div className="space-y-5">
            {dict.privacy.sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck aria-hidden className="size-5 text-brand" />
                  {section.title}
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-subtle">{dict.privacy.contact}</p>
        </div>
      </PageContainer>
    </>
  );
}
