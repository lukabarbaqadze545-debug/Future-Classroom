"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { ClientApiError, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { callbackUrl, startLocalSession, supabaseBrowser } from "@/lib/supabase/browser";
import { classifyAuthError } from "@/lib/supabase/problems";
import { CheckEmail } from "./check-email";

/**
 * Sign-up with a name, an email and a password through Supabase. Three ways it
 * can end: the account is ready at once (the project does not ask for email
 * confirmation), a confirmation email was sent (the person is told to open
 * it; the link brings them to /auth/callback), or it failed with a message
 * that says why.
 */
export function SupabaseRegisterForm({ config }: { config: SupabaseConfig }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    setBusy(true);
    setError(null);
    try {
      const { data: result, error: failure } = await supabaseBrowser(config).auth.signUp({
        email,
        password: String(data.get("password")),
        options: { emailRedirectTo: callbackUrl(), data: { full_name: String(data.get("name")).trim() } },
      });
      if (failure) throw failure;
      if (result.session) {
        // No email confirmation is required by the project: the person is signed in already.
        const { redirect } = await startLocalSession(result.session.access_token);
        router.push(redirect);
        router.refresh();
        return;
      }
      // For an address that already has an account, a project that asks for confirmation answers as if it had
      // created one (so addresses cannot be probed) but returns a user without any identities.
      if (result.user && result.user.identities?.length === 0) {
        setError(dict.auth.problems.already_registered);
        setBusy(false);
        return;
      }
      setSentTo(email);
      setBusy(false);
    } catch (e) {
      setError(e instanceof ClientApiError ? errorMessage(dict, e) : dict.auth.problems[classifyAuthError(e)]);
      setBusy(false);
    }
  };

  if (sentTo) return <CheckEmail config={config} email={sentTo} onChangeEmail={() => setSentTo(null)} />;

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="supabase-register-form">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label={dict.auth.name} hint={dict.auth.displayNameHelp}>
        {(ids) => <Input {...ids} name="name" required minLength={2} maxLength={40} autoComplete="name" data-testid="su-name" />}
      </Field>
      <Field label={dict.auth.email} hint={dict.auth.emailHelp}>
        {(ids) => <Input {...ids} name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} data-testid="su-email" />}
      </Field>
      <Field label={dict.auth.password} hint={dict.auth.passwordHelp}>
        {(ids) => <Input {...ids} name="password" type="password" required minLength={8} autoComplete="new-password" data-testid="su-password" />}
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="su-submit">
        {busy ? dict.auth.registering : dict.auth.register}
      </Button>
      <p className="pt-2 text-center text-sm text-ink-muted">
        {dict.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {dict.nav.signIn}
        </Link>
      </p>
    </form>
  );
}
