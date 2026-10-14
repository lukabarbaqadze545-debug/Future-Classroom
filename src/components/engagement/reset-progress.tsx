"use client";

import { useI18n } from "@/lib/i18n/client";
import { useEngagement } from "./engagement-provider";

/** Starts the streak, experience and badges of this browser over, after asking. */
export function ResetProgress() {
  const { dict } = useI18n();
  const { ready, reset } = useEngagement();
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        if (window.confirm(dict.today.resetConfirm)) reset();
      }}
      className="self-start rounded-lg px-2 py-1 font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      data-testid="today-reset"
    >
      {dict.today.reset}
    </button>
  );
}
