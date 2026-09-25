import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getAIProvider } from "@/lib/ai";
import { curatedTopicsFor } from "@/lib/ai/templates";
import { listMaterials } from "@/lib/services/materials";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { CreateLessonForm } from "@/components/lesson/create-lesson-form";

export const metadata = { title: "Create lesson" };

export default async function NewLessonPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const materials = listMaterials(user)
    .filter((m) => m.textStatus === "indexed")
    .map((m) => ({ id: m.id, title: m.title, subject: m.subject }));
  const topics = curatedTopicsFor(locale)
    .map((t) => `${t.title} (${dict.subjects[t.subject]})`)
    .join(", ");
  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={dict.teacher.create.title} description={dict.teacher.create.lead} />
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8">
          <CreateLessonForm aiAvailable={getAIProvider() !== null} materials={materials} builtInTopics={topics} />
        </div>
      </div>
    </PageContainer>
  );
}
