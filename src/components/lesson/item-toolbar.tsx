"use client";

import { ArrowDown, ArrowUp, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/** Reorder / delete / regenerate controls shown on each section and activity card. */
export function ItemToolbar({
  index,
  count,
  onMove,
  onDelete,
  onRegenerate,
  regenerateLabel,
  aiAvailable,
  onUndo,
}: {
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  regenerateLabel?: string;
  aiAvailable: boolean;
  onUndo?: (() => void) | null;
}) {
  const { dict } = useI18n();
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-muted hover:bg-muted hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent";
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {onUndo ? (
        <button type="button" className={btn} onClick={onUndo}>
          <Undo2 aria-hidden className="size-4" />
          {dict.common.undo}
        </button>
      ) : null}
      {onRegenerate ? (
        <button type="button" className={`${btn} text-ai hover:text-ai`} onClick={onRegenerate} disabled={!aiAvailable} title={aiAvailable ? undefined : dict.ai.needsAI}>
          <Sparkles aria-hidden className="size-4" />
          <span className="hidden sm:inline">{regenerateLabel}</span>
        </button>
      ) : null}
      <button type="button" className={btn} onClick={() => onMove(-1)} disabled={index === 0} aria-label={dict.common.moveUp}>
        <ArrowUp aria-hidden className="size-4" />
      </button>
      <button type="button" className={btn} onClick={() => onMove(1)} disabled={index === count - 1} aria-label={dict.common.moveDown}>
        <ArrowDown aria-hidden className="size-4" />
      </button>
      <button type="button" className={`${btn} hover:bg-danger-soft hover:text-danger`} onClick={onDelete} aria-label={dict.common.delete}>
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}
