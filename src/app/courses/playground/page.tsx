import { getDictionary } from "@/lib/i18n/server";
import { PageContainer, SiteHeader } from "@/components/layout/site-header";
import { Playground } from "@/components/courses/playground";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.courses.metaPlayground };
}

export default async function PlaygroundPage() {
  const { dict } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <Playground template={dict.courses.playground.template} />
      </PageContainer>
    </>
  );
}
