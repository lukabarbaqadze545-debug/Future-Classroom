"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

type Status = "want" | "reading" | "finished";

/** Reading list status, progress and personal notes for one resource. */
export function ReadingControl({ resourceId, initial }: { resourceId: string; initial: { status: Status; percent: number; note: string } | null }) {
  const { dict } = useI18n();
  const r = dict.labs.library.reading;
  const [status, setStatus] = useState<Status | null>(initial?.status ?? null);
  const [percent, setPercent] = useState(initial?.percent ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState("");

  async function save(next: { status: Status | null; percent: number; note: string }) {
    setError("");
    try {
      const res = await api<{ reading: { percent: number } | null }>(`/api/library/resources/${resourceId}/reading`, { body: next });
      if (res.reading) setPercent(res.reading.percent);
      setSaved(true);
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  return (
    <div className="space-y-4" data-testid="reading-control">
      <div role="radiogroup" aria-label={r.title} className="flex flex-wrap gap-2">
        {(["want", "reading", "finished"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            onClick={() => {
              const next = status === s ? null : s;
              setStatus(next);
              void save({ status: next, percent: next === "finished" ? 100 : percent, note });
            }}
            className={cn("h-11 rounded-xl border px-4 font-medium", status === s ? "border-lab-library bg-lab-library text-white" : "border-line-strong hover:bg-muted")}
            data-testid={`reading-${s}`}
          >
            {r.status[s]}
          </button>
        ))}
      </div>
      {status === "reading" ? (
        <label className="block">
          <span className="flex justify-between text-sm font-medium">
            {r.percent}
            <span className="tabular-nums">{percent}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={percent}
            onChange={(e) => {
              setPercent(Number(e.target.value));
              setSaved(false);
            }}
            onPointerUp={() => void save({ status, percent, note })}
            onKeyUp={() => void save({ status, percent, note })}
            className="mt-1 h-10 w-full accent-[var(--color-lab-library)]"
          />
        </label>
      ) : null}
      {status ? (
        <div className="space-y-2">
          <Textarea
            aria-label={r.note}
            placeholder={r.notePlaceholder}
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
          />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => save({ status, percent, note })} disabled={saved}>
              {saved ? r.saved : r.save}
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
