"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, ClientApiError, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { looksLikeEmail, startLocalSession, supabaseBrowser } from "@/lib/supabase/browser";
import { classifyAuthError } from "@/lib/supabase/problems";
import { CheckEmail } from "./check-email";

function safeNext(next: string | null): string | null {
  // Only allow same-site relative paths.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * Sign-in. With `supabase` set (the school connected Supabase), something that
 * looks like an email address signs in through Supabase and anything else
 * through this site's own name-and-password accounts, so teachers and
 * accounts created by the school keep working exactly as before.
 */
export function LoginForm({ next, allowRegister = true, supabase = null }: { next: string | null; allowRegister?: boolean; supabase?: SupabaseConfig | null }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // An address that signed up but did not open the confirmation link yet.
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("username")).trim();
    setBusy(true);
    setError(null);
    try {
      let signedIn: { redirect: string; user: { role: string } };
      if (supabase && looksLikeEmail(identifier)) {
        const { data: result, error: failure } = await supabaseBrowser(supabase).auth.signInWithPassword({ email: identifier, password: String(data.get("password")) });
        if (failure || !result.session) {
          if (failure && classifyAuthError(failure) === "not_confirmed") setUnconfirmed(identifier);
          throw failure ?? new Error("no session");
        }
        signedIn = await startLocalSession(result.session.access_token);
      } else {
        signedIn = await api<{ redirect: string; user: { role: string } }>("/api/auth/login", {
          body: { username: identifier, password: String(data.get("password")) },
        });
      }
      const { redirect, user } = signedIn;
      const target = safeNext(next);
      const allowed = target && (user.role === "student" ? !target.startsWith("/teacher") : true);
      router.push(allowed ? target : redirect);
      router.refresh();
    } catch (e) {
      setError(e instanceof ClientApiError || !supabase ? errorMessage(dict, e) : dict.auth.problems[classifyAuthError(e)]);
      setBusy(false);
    }
  };

  if (supabase && unconfirmed) return <CheckEmail config={supabase} email={unconfirmed} startWaiting={false} onChangeEmail={() => setUnconfirmed(null)} />;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label={supabase ? dict.auth.loginNameOrEmail : dict.auth.loginName}>
        {(ids) => <Input {...ids} name="username" autoComplete="username" required autoCapitalize="none" spellCheck={false} />}
      </Field>
      <Field label={dict.auth.password}>{(ids) => <Input {...ids} name="password" type="password" autoComplete="current-password" required />}</Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? dict.auth.signingIn : dict.auth.signIn}
      </Button>
      <div className="space-y-1 pt-2 text-center text-sm text-ink-muted">
        {allowRegister ? (
          <p>
            {dict.auth.noAccount}{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              {dict.auth.createStudentAccount}
            </Link>
          </p>
        ) : (
          <p>{dict.auth.askTeacher}</p>
        )}
        <p>
          <Link href="/join" className="font-medium text-brand hover:underline">
            {dict.auth.joinWithoutAccount}
          </Link>
        </p>
      </div>
    </form>
  );
}
