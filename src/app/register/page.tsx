import { redirect } from "next/navigation";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata() {
  return pageTitle((p) => p.register);
}

export default async function RegisterPage() {
  const [{ dict }, user] = await Promise.all([getDictionary(), getCurrentUser()]);
  if (user) redirect(user.role === "student" ? "/student" : "/teacher");
  return (
    <AuthShell title={dict.auth.registerTitle} lead={dict.auth.registerLead}>
      <RegisterForm />
    </AuthShell>
  );
}
