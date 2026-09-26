import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { listMaterials } from "@/lib/services/materials";
import { inLocale, listLessonsForTeacher } from "@/lib/services/lessons";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { MaterialsLibrary } from "@/components/materials/materials-library";

export async function generateMetadata() {
  return pageTitle((p) => p.materials);
}

export default async function MaterialsPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  return (
    <PageContainer>
      <PageHeader title={dict.teacher.materials.title} description={dict.teacher.materials.lead} />
      <MaterialsLibrary
        initial={listMaterials(user)}
        currentUserId={user.id}
        isAdmin={user.role === "admin"}
        lessons={inLocale(listLessonsForTeacher(user.id), locale).map((l) => ({ id: l.id, title: l.title }))}
      />
    </PageContainer>
  );
}
