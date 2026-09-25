import { requirePageUser } from "@/lib/auth/session";

/** Full-screen presentation pages. Each page checks who may present it. */
export default async function PresentLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["student", "teacher", "admin"], "/");
  return children;
}
