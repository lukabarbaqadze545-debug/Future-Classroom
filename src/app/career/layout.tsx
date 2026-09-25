import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function CareerLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/career");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
