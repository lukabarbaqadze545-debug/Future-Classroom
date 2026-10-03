"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { ClientApiError, errorMessage } from "@/lib/client/api";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { SupabaseConfig } from "@/lib/supabase/config";
import { startLocalSession, supabaseBrowser } from "@/lib/supabase/browser";
import { classifyAuthError, readAuthRedirect } from "@/lib/supabase/problems";

/**
 * Where the link in the confirmation email lands. It reads what Supabase put
 * in the address (tokens, a token hash to exchange, or an error such as an
 * expired link), removes it from the address bar and history, trades the
 * access token for this site's own session and moves on to the person's home
 * page. Anything that goes wrong ends in a message and a way back.
 */
export function AuthCallback({ config }: { config: SupabaseConfig }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [failure, setFailure] = useState<string | null>(null);
  // The effect may run twice in development; a link can only be used once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const found = readAuthRedirect(window.location.search, window.location.hash);
    window.history.replaceState(null, "", window.location.pathname);

    const finish = async (accessToken: string, type: string | null) => {
      // A password-reset link signs the person in but offers no way to choose the new password here.
      if (type === "recovery") return setFailure(dict.auth.problems.unsupported_link);
      const { redirect } = await startLocalSession(accessToken);
      router.replace(redirect);
      router.refresh();
    };

    void (async () => {
      try {
        if (found.kind === "empty") return router.replace("/login");
        if (found.kind === "error") return setFailure(dict.auth.problems[found.problem]);
        if (found.kind === "tokens") return await finish(found.accessToken, found.type);
        const { data, error } = await supabaseBrowser(config).auth.verifyOtp({ token_hash: found.tokenHash, type: found.type });
        if (error || !data.session) throw error ?? new Error("no session");
        await finish(data.session.access_token, found.type);
      } catch (e) {
        setFailure(e instanceof ClientApiError ? errorMessage(dict, e) : dict.auth.problems[classifyAuthError(e)]);
      }
    })();
  }, [config, dict, router]);

  if (!failure) {
    return (
      <p className="text-ink-muted" role="status" data-testid="callback-working">
        {dict.auth.callbackWorking}
      </p>
    );
  }
  return (
    <div className="space-y-4" data-testid="callback-failed">
      <Notice tone="danger">{failure}</Notice>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/login">{dict.auth.signIn}</ButtonLink>
        <Link href="/register" className="inline-flex items-center px-2 text-sm font-medium text-brand hover:underline">
          {dict.auth.createStudentAccount}
        </Link>
      </div>
    </div>
  );
}
