"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

/** Editable, reorderable list of short texts (objectives, homework, …). */
export function ListEditor({ label, items, onChange, addLabel, rows = 2, max = 12 }: { label: string; items: string[]; onChange: (items: string[]) => void; addLabel?: string; rows?: number; max?: number }) {
  const { dict } = useI18n();
  const update = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium text-ink">{label}</legend>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span aria-hidden className="mt-3 w-5 shrink-0 text-right text-sm text-ink-subtle tabular-nums">{index + 1}.</span>
          <Textarea aria-label={`${label} ${index + 1}`} value={item} rows={rows} onChange={(e) => update(index, e.target.value)} className="flex-1" />
          <div className="flex shrink-0 flex-col">
            <button type="button" className="rounded-md p-1.5 text-ink-subtle hover:bg-muted hover:text-ink disabled:opacity-30" onClick={() => move(index, -1)} disabled={index === 0} aria-label={dict.common.moveUp}>
              <ArrowUp aria-hidden className="size-4" />
            </button>
            <button type="button" className="rounded-md p-1.5 text-ink-subtle hover:bg-muted hover:text-ink disabled:opacity-30" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={dict.common.moveDown}>
              <ArrowDown aria-hidden className="size-4" />
            </button>
          </div>
          <button type="button" className="mt-1.5 rounded-md p-2 text-ink-subtle hover:bg-danger-soft hover:text-danger" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`${dict.common.remove} ${index + 1}`}>
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      {items.length < max ? (
        <Button variant="ghost" size="sm" onClick={() => onChange([...items, ""])}>
          <Plus aria-hidden className="size-4" />
          {addLabel ?? dict.teacher.editor.addItem}
        </Button>
      ) : null}
    </fieldset>
  );
}
