import { redirect } from "next/navigation";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { Notice } from "@/components/ui/notice";
import { SupabaseRegisterForm } from "@/components/auth/supabase-register-form";
import { selfRegistrationEnabled } from "@/lib/config";
import { supabaseConfig } from "@/lib/supabase/config";

export async function generateMetadata() {
  return pageTitle((p) => p.register);
}

export default async function RegisterPage() {
  const [{ dict }, user] = await Promise.all([getDictionary(), getCurrentUser()]);
  if (user) redirect(user.role === "student" ? "/student" : "/teacher");
  const supabase = supabaseConfig();
  const open = selfRegistrationEnabled();
  return (
    <AuthShell title={dict.auth.registerTitle} lead={supabase ? dict.auth.registerLeadEmail : dict.auth.registerLead}>
      {!open ? (
        <Notice tone="info">{dict.auth.askTeacher}</Notice>
      ) : supabase ? (
        <div className="space-y-6">
          <SupabaseRegisterForm config={supabase} />
          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-brand">{dict.auth.registerWithName}</summary>
            <div className="mt-4">
              <RegisterForm />
            </div>
          </details>
        </div>
      ) : (
        <RegisterForm />
      )}
    </AuthShell>
  );
}
