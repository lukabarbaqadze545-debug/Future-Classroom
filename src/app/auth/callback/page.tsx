import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthCallback } from "@/components/auth/auth-callback";
import { supabaseConfig } from "@/lib/supabase/config";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.auth.callbackTitle };
}

/** The page the confirmation email links to (see AuthCallback). */
export default async function AuthCallbackPage() {
  const config = supabaseConfig();
  if (!config) notFound();
  const { dict } = await getDictionary();
  return (
    <AuthShell title={dict.auth.callbackTitle}>
      <AuthCallback config={config} />
    </AuthShell>
  );
}
