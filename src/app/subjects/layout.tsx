import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function SubjectsLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/subjects");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
