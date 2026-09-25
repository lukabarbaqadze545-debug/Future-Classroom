import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";

export default async function PresentLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(STAFF_ROLES, "/teacher");
  return children;
}
