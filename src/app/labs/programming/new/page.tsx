import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { PageContainer } from "@/components/layout/site-header";
import { LabHeader } from "@/components/labs/lab-shell";
import { ProblemForm } from "@/components/labs/programming/problem-form";

export async function generateMetadata() {
  return pageTitle((p) => p.newProblem);
}

export default async function NewProblemPage() {
  await requirePageUser(STAFF_ROLES, "/labs/programming/new");
  const { dict } = await getDictionary();
  return (
    <PageContainer>
      <LabHeader lab="programming" hubLabel={dict.labs.hub.title} labName={dict.labs.programming.title} title={dict.labs.programming.newProblem} />
      <ProblemForm />
    </PageContainer>
  );
}
