import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(STAFF_ROLES, "/teacher");
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
