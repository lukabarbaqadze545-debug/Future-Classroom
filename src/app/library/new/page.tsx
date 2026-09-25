import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { listMaterials } from "@/lib/services/materials";
import { PageContainer } from "@/components/layout/site-header";
import { LabHeader } from "@/components/labs/lab-shell";
import { ResourceForm } from "@/components/labs/library/resource-form";

export const metadata = { title: "Add a library resource" };

export default async function NewResourcePage() {
  const user = await requirePageUser(STAFF_ROLES, "/library/new");
  const { dict } = await getDictionary();
  return (
    <PageContainer>
      <LabHeader lab="library" hubLabel={dict.labs.hub.title} labName={dict.labs.library.title} title={dict.labs.library.manage.newResource} />
      <ResourceForm materials={listMaterials(user).map((m) => ({ id: m.id, title: m.title }))} />
    </PageContainer>
  );
}
