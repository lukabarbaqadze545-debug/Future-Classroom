"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export function RegisterForm() {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { redirect } = await api<{ redirect: string }>("/api/auth/register", {
        body: { name: String(data.get("name")), password: String(data.get("password")) },
      });
      router.push(redirect);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label={dict.auth.name} hint={dict.auth.nameHelp}>
        {(ids) => <Input {...ids} name="name" required minLength={2} maxLength={40} autoComplete="username" spellCheck={false} data-testid="register-name" />}
      </Field>
      <Field label={dict.auth.password} hint={dict.auth.passwordHelp}>
        {(ids) => <Input {...ids} name="password" type="password" required minLength={8} autoComplete="new-password" data-testid="register-password" />}
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="register-submit">
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
