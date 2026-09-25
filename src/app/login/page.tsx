import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";
import { demoModeEnabled } from "@/lib/config";
import { fmt } from "@/lib/i18n/config";
import { DEMO_PASSWORD } from "@/lib/db/seed";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLoginButtons } from "@/components/auth/demo-login";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ dict }, user, params] = await Promise.all([getDictionary(), getCurrentUser(), searchParams]);
  if (user) redirect(user.role === "student" ? "/student" : "/teacher");
  return (
    <AuthShell
      title={dict.auth.signInTitle}
      lead={dict.auth.signInLead}
      aside={
        demoModeEnabled() ? (
          <div className="rounded-3xl border border-brand/20 bg-brand-soft/50 p-6">
            <h2 className="font-semibold">{dict.auth.demoAccounts}</h2>
            <p className="mt-1 text-sm text-ink-muted">{dict.landing.demoText}</p>
            <DemoLoginButtons className="mt-4" size="md" />
            <p className="mt-4 text-xs text-ink-subtle">
              teacher: <code>nino</code> · student: <code>mariam</code> · {fmt(dict.auth.demoHint, { password: DEMO_PASSWORD })}
            </p>
          </div>
        ) : null
      }
    >
      <LoginForm next={params.next ?? null} />
    </AuthShell>
  );
}
