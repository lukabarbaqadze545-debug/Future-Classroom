import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student"], "/student");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
