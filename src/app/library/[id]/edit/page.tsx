import { notFound } from "next/navigation";
import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { getResource } from "@/lib/labs/library/service";
import { resourceSchema } from "@/lib/labs/library/model";
import { listMaterials } from "@/lib/services/materials";
import { PageContainer } from "@/components/layout/site-header";
import { LabHeader } from "@/components/labs/lab-shell";
import { ResourceForm } from "@/components/labs/library/resource-form";

export async function generateMetadata() {
  return pageTitle((p) => p.editResource);
}

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(STAFF_ROLES, `/library/${id}/edit`);
  const resource = getResource(id);
  if (!resource) notFound();
  const { dict } = await getDictionary();
  // The schema keeps only the editable fields.
  const input = resourceSchema.parse(resource);
  return (
    <PageContainer>
      <LabHeader lab="library" hubLabel={dict.labs.hub.title} labName={dict.labs.library.title} title={dict.labs.library.manage.edit} />
      <ResourceForm id={id} initial={input} initialMaterialId={resource.materialId} materials={listMaterials(user).map((m) => ({ id: m.id, title: m.title }))} />
    </PageContainer>
  );
}
