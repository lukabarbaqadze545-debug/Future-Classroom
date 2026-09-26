"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

/** One-click join for a signed-in student (no code to type). */
export function JoinSessionButton({ code, label }: { code: string; label: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const { sessionId } = await api<{ sessionId: string }>("/api/sessions/join", { body: { code, name: "" } });
      router.push(`/session/${sessionId}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };
  return (
    <span className="flex flex-col items-end gap-1">
      <Button size="lg" onClick={join} disabled={busy} data-testid="join-class-session">
        <LogIn aria-hidden className="size-5" />
        {busy ? dict.join.joining : label}
      </Button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </span>
  );
}
