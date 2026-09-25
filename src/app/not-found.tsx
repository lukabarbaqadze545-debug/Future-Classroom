import { getDictionary } from "@/lib/i18n/server";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const { dict } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <EmptyState title={dict.errors.not_found} action={<ButtonLink href="/">{dict.nav.home}</ButtonLink>} className="mt-10" />
      </PageContainer>
    </>
  );
}
