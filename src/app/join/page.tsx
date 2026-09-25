import { getDictionary } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/layout/auth-shell";
import { JoinForm } from "@/components/session/join-form";

export const metadata = { title: "Join a class" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const [{ dict }, user, params] = await Promise.all([getDictionary(), getCurrentUser(), searchParams]);
  return (
    <AuthShell title={dict.join.title} lead={dict.join.lead}>
      <JoinForm initialCode={params.code?.slice(0, 12) ?? ""} signedInName={user?.role === "student" ? user.displayName : null} />
    </AuthShell>
  );
}
