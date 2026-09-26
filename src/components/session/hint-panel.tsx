"use client";

import { useState } from "react";
import { BookOpenCheck, Lightbulb } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { HintResult } from "@/lib/ai/hint-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

export function hintText(dict: ReturnType<typeof useI18n>["dict"], hint: HintResult): string {
  if (hint.text) return hint.text;
  return (dict.hints.generic as Record<string, string>)[hint.genericKey ?? ""] ?? dict.hints.generic.solve_1;
}

/**
 * The hint ladder. Each click reveals one more specific level; the full
 * solution sits behind a "try once more?" confirmation.
 */
export function HintPanel({
  hints,
  maxLevel,
  onRequest,
  disabled,
  solutionLocked,
  className,
}: {
  hints: HintResult[];
  maxLevel: number;
  onRequest: () => Promise<void>;
  disabled?: boolean;
  /** The solution contains the answer: it opens only after a first attempt (enforced on the server too). */
  solutionLocked?: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const used = hints.length;
  const nextLevel = used + 1;
  const canRequest = maxLevel > 0 && nextLevel <= maxLevel;
  const nextIsSolution = nextLevel === 5;

  const request = async () => {
    setLoading(true);
    try {
      await onRequest();
    } finally {
      setLoading(false);
    }
  };

  if (maxLevel === 0) return null;

  return (
    <section aria-labelledby="hint-title" className={cn("rounded-2xl border border-warn/25 bg-warn-soft/40 p-4 sm:p-5", className)} data-testid="hint-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="hint-title" className="flex items-center gap-2 font-semibold">
            <Lightbulb aria-hidden className="size-5 text-warn" />
            {dict.hints.title}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">{dict.hints.philosophy}</p>
        </div>
        {canRequest && nextIsSolution && solutionLocked ? (
          <p className="max-w-56 text-sm text-ink-muted" data-testid="solution-locked">
            {dict.hints.solutionAfterAttempt}
          </p>
        ) : canRequest ? (
          <Button
            variant={nextIsSolution ? "secondary" : "subtle"}
            onClick={() => (nextIsSolution ? setConfirmOpen(true) : void request())}
            disabled={disabled || loading}
            data-testid="request-hint"
          >
            {nextIsSolution ? <BookOpenCheck aria-hidden className="size-4" /> : <Lightbulb aria-hidden className="size-4" />}
            {nextIsSolution ? dict.hints.showSolution : used === 0 ? dict.hints.request : dict.hints.requestNext}
          </Button>
        ) : null}
      </div>

      {hints.length ? (
        <ol className="mt-4 space-y-3" aria-live="polite">
          {hints.map((hint) => (
            <li key={hint.level} className={cn("fc-fade-in rounded-xl border bg-surface p-4", hint.isSolution ? "border-success/30" : "border-warn/20")} data-testid="hint-item">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-ink">{fmt(dict.hints.levelOf, { n: hint.level, max: maxLevel })}</span>
                <span className="text-ink-muted">· {dict.hints.levels[hint.kind]}</span>
                <Badge tone={hint.source === "ai" ? "ai" : hint.source === "generic" ? "neutral" : "brand"}>{dict.hints.source[hint.source]}</Badge>
              </div>
              <p className="fc-prose text-[16px] leading-relaxed">{hintText(dict, hint)}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {loading ? (
        <p className="mt-3 text-sm text-ink-muted">
          <Spinner label={dict.hints.loading} />
        </p>
      ) : null}
      {!canRequest && hints.length ? <p className="mt-3 text-sm text-ink-muted">{dict.hints.noMore}</p> : null}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={dict.hints.confirmSolutionTitle}
        description={dict.hints.confirmSolutionText}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="primary" onClick={() => setConfirmOpen(false)}>
              {dict.hints.confirmSolutionNo}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setConfirmOpen(false);
                await request();
              }}
            >
              {dict.hints.confirmSolutionYes}
            </Button>
          </>
        }
      />
    </section>
  );
}
