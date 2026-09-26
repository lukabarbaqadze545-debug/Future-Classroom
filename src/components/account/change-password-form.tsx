"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export function ChangePasswordForm() {
  const { dict } = useI18n();
  const a = dict.account;
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== repeat) {
      setMessage({ tone: "danger", text: a.mismatch });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/auth/password", { body: { current, next } });
      setMessage({ tone: "success", text: a.changed });
      // Clears the temporary-password banner in the header.
      router.refresh();
      setCurrent("");
      setNext("");
      setRepeat("");
    } catch (e) {
      setMessage({ tone: "danger", text: errorMessage(dict, e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4" data-testid="change-password">
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      <Field label={a.current}>{(ids) => <Input {...ids} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}</Field>
      <Field label={a.next} hint={dict.auth.passwordHelp}>{(ids) => <Input {...ids} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />}</Field>
      <Field label={a.repeat}>{(ids) => <Input {...ids} type="password" autoComplete="new-password" minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} required />}</Field>
      <Button type="submit" disabled={busy}>
        {a.save}
      </Button>
    </form>
  );
}
