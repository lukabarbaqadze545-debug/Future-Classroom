"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { buttonClasses } from "@/components/ui/button";
import { useWords } from "./use-words";

/** A button to the practice page that says how many words are waiting. */
export function MyWordsLink({ className }: { className?: string }) {
  const { dict } = useI18n();
  const w = dict.assistant.words;
  const { ready, stats } = useWords();
  return (
    <Link href="/learning-assistant/words" className={buttonClasses("secondary", "md", className)} data-testid="my-words-link">
      <Layers aria-hidden className="size-4" />
      {w.myWordsLink}
      {ready && stats.total > 0 ? <span className="text-ink-muted">({stats.total})</span> : null}
      {ready && stats.due > 0 ? (
        <span className="rounded-full bg-brand-solid px-2 py-0.5 text-xs font-semibold text-white" data-testid="my-words-due">
          {fmt(w.dueBadge, { n: stats.due })}
        </span>
      ) : null}
    </Link>
  );
}
