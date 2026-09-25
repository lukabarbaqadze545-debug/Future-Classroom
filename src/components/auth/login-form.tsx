"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

function safeNext(next: string | null): string | null {
  // Only allow same-site relative paths.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function LoginForm({ next }: { next: string | null }) {
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
      const { redirect, user } = await api<{ redirect: string; user: { role: string } }>("/api/auth/login", {
        body: { username: String(data.get("username")), password: String(data.get("password")) },
      });
      const target = safeNext(next);
      const allowed = target && (user.role === "student" ? !target.startsWith("/teacher") : true);
      router.push(allowed ? target : redirect);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label={dict.auth.username}>{(ids) => <Input {...ids} name="username" autoComplete="username" required autoCapitalize="none" spellCheck={false} />}</Field>
      <Field label={dict.auth.password}>{(ids) => <Input {...ids} name="password" type="password" autoComplete="current-password" required />}</Field>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? dict.auth.signingIn : dict.auth.signIn}
      </Button>
      <div className="space-y-1 pt-2 text-center text-sm text-ink-muted">
        <p>
          {dict.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            {dict.auth.createStudentAccount}
          </Link>
        </p>
        <p>
          <Link href="/join" className="font-medium text-brand hover:underline">
            {dict.auth.joinWithoutAccount}
          </Link>
        </p>
      </div>
    </form>
  );
}
