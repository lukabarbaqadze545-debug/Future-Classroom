"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

export function BookmarkButton({ kind, refId, initial, size = "sm" }: { kind: "programming" | "library" | "career" | "experiment" | "simulation" | "critical"; refId: string; initial: boolean; size?: "sm" | "md" }) {
  const { dict } = useI18n();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={on ? "subtle" : "ghost"}
      size={size}
      aria-pressed={on}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const next = !on;
        setOn(next);
        try {
          await api("/api/bookmarks", { body: { kind, refId, on: next } });
        } catch {
          setOn(!next);
        } finally {
          setBusy(false);
        }
      }}
    >
      {on ? <BookmarkCheck aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
      {on ? dict.labs.common.bookmarked : dict.labs.common.bookmark}
    </Button>
  );
}
