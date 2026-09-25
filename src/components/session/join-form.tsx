"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export function JoinForm({ initialCode = "", signedInName, compact = false }: { initialCode?: string; signedInName?: string | null; compact?: boolean }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { sessionId } = await api<{ sessionId: string }>("/api/sessions/join", { body: { code, name: signedInName ?? name } });
      router.push(`/session/${sessionId}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label={dict.join.code}>
        {(ids) => (
          <Input
            {...ids}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={dict.join.codePlaceholder}
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            className={compact ? "h-12 text-lg font-semibold tracking-widest" : "h-14 text-center text-2xl font-semibold tracking-[0.2em]"}
            data-testid="join-code"
          />
        )}
      </Field>
      {signedInName ? (
        <p className="text-sm text-ink-muted">{fmt(dict.join.joinAs, { name: signedInName })}</p>
      ) : (
        <Field label={dict.join.name} hint={dict.join.nameHelp}>
          {(ids) => <Input {...ids} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="given-name" data-testid="join-name" />}
        </Field>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !code.trim() || (!signedInName && !name.trim())} data-testid="join-submit">
        {busy ? dict.join.joining : dict.join.join}
      </Button>
      {!signedInName && !compact ? (
        <p className="text-center text-sm text-ink-muted">
          <Link href="/login?next=/join" className="font-medium text-brand hover:underline">
            {dict.join.signInForProgress}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
