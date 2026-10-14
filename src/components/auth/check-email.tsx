"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { callbackUrl, supabaseBrowser } from "@/lib/supabase/browser";
import { classifyAuthError } from "@/lib/supabase/problems";

/** Seconds before the link may be sent again: the provider limits how many emails one address gets. */
const COOLDOWN_SECONDS = 60;

/** "We sent you a link": what to do next, and a way to ask for another one. */
export function CheckEmail({ config, email, onChangeEmail, startWaiting = true }: { config: SupabaseConfig; email: string; onChangeEmail: () => void; startWaiting?: boolean }) {
  const { dict } = useI18n();
  const [wait, setWait] = useState(startWaiting ? COOLDOWN_SECONDS : 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const resend = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabaseBrowser(config).auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl() } });
      if (error) throw error;
      setMessage({ tone: "success", text: dict.auth.resent });
      setWait(COOLDOWN_SECONDS);
    } catch (error) {
      setMessage({ tone: "danger", text: dict.auth.problems[classifyAuthError(error)] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="check-email">
      <Notice tone="info" title={dict.auth.checkEmailTitle}>
        {fmt(dict.auth.checkEmailText, { email })}
      </Notice>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy || wait > 0} onClick={resend} data-testid="resend-link">
          {wait > 0 ? fmt(dict.auth.resendWait, { seconds: wait }) : dict.auth.resend}
        </Button>
        <Button type="button" variant="ghost" onClick={onChangeEmail}>
          {dict.auth.changeEmail}
        </Button>
      </div>
    </div>
  );
}
