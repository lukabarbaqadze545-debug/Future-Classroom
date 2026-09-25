import { notFound } from "next/navigation";
import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getCustomProblemInput } from "@/lib/labs/programming/service";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { LabHeader } from "@/components/labs/lab-shell";
import { ProblemForm } from "@/components/labs/programming/problem-form";

export const metadata = { title: "Edit problem" };

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(STAFF_ROLES, `/labs/programming/${id}/edit`);
  const { dict } = await getDictionary();
  let initial;
  try {
    initial = getCustomProblemInput(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  return (
    <PageContainer>
      <LabHeader lab="programming" hubLabel={dict.labs.hub.title} labName={dict.labs.programming.title} title={dict.labs.programming.editProblem} />
      <ProblemForm id={id} initial={initial} />
    </PageContainer>
  );
}
