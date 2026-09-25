import { requirePageUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/library");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
