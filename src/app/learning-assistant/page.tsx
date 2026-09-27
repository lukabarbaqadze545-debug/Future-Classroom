import { ShieldCheck } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { isSubject } from "@/lib/domain/catalog";
import { getAIProvider } from "@/lib/ai";
import { getMaterial } from "@/lib/services/materials";
import { ASSISTANT_MODES, listSaved, type AssistantMode } from "@/lib/services/learning-assistant";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { LearningAssistant } from "@/components/assistant/learning-assistant";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.assistant.title };
}

type Props = { searchParams: Promise<{ mode?: string; q?: string; material?: string; subject?: string }> };

export default async function LearningAssistantPage({ searchParams }: Props) {
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const a = dict.assistant;
  const params = await searchParams;
  const mode: AssistantMode = ASSISTANT_MODES.includes(params.mode as AssistantMode) ? (params.mode as AssistantMode) : "explain";
  // A material named in the address is used only if this person may see it.
  let material: { id: string; title: string } | null = null;
  if (params.material) {
    try {
      const record = getMaterial(params.material.slice(0, 40), user);
      material = { id: record.id, title: record.title };
    } catch {
      material = null;
    }
  }

  return (
    <PageContainer>
      <PageHeader title={a.title} description={isStaff(user) ? a.staffLead : a.lead} />
      <p className="mb-6 flex items-start gap-2 rounded-2xl border border-brand/20 bg-brand-soft/30 px-4 py-3 text-sm text-ink-muted">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
        {a.honesty}
      </p>
      <LearningAssistant
        initialMode={mode}
        initialText={(params.q ?? "").slice(0, 2000)}
        material={material}
        initialSubject={params.subject && isSubject(params.subject) ? params.subject : ""}
        aiAvailable={getAIProvider() !== null}
        initialSaved={listSaved(user)}
      />
    </PageContainer>
  );
}
