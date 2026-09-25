import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function LabsLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/labs");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
