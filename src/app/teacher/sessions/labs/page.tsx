import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { bridgeItems } from "@/lib/labs/session-bridge";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { SessionPicker } from "@/components/labs/session-picker";

export async function generateMetadata() {
  return pageTitle((p) => p.labSession);
}

export default async function LabSessionPage({ searchParams }: { searchParams: Promise<{ add?: string | string[] }> }) {
  const { dict, locale } = await getDictionary();
  const { add } = await searchParams;
  const initial = (Array.isArray(add) ? add : add ? [add] : []).map((k) => (k.startsWith("stem_challenge:") ? k.replace("stem_challenge:", "challenge:") : k));
  return (
    <PageContainer wide>
      <PageHeader title={dict.labs.bridge.title} description={dict.labs.bridge.lead} />
      <SessionPicker items={bridgeItems(locale)} initial={initial} />
    </PageContainer>
  );
}
