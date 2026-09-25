"use client";

import { LogOut } from "lucide-react";
import { clearAllDrafts } from "@/components/labs/use-local-draft";

/** Signing out also removes unsaved drafts, so the next person at a shared workstation never sees them. */
export function SignOutButton({ label }: { label: string }) {
  return (
    <form action="/api/auth/logout" method="post" onSubmit={() => clearAllDrafts()}>
      <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-muted hover:bg-muted hover:text-ink" title={label}>
        <LogOut aria-hidden className="size-4" />
        <span className="sr-only sm:not-sr-only">{label}</span>
      </button>
    </form>
  );
}
