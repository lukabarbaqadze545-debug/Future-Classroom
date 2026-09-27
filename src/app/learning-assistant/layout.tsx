import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function LearningAssistantLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/learning-assistant");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
