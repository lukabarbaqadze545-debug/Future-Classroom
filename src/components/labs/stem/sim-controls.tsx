"use client";

import { useId } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/en";
import { cn } from "@/components/ui/cn";

export type SimText = Dictionary["labs"]["stem"]["simulations"];

/** Simulation texts plus numbers in the reader's convention (Georgian uses a decimal comma). */
export interface SimFormat {
  s: SimText;
  num: (v: number, digits?: number) => string;
}

export function useSimFormat(): SimFormat {
  const { dict, locale } = useI18n();
  return { s: dict.labs.stem.simulations, num: (v, digits = 2) => (locale === "ka" ? fixed(v, digits).replace(".", ",") : fixed(v, digits)) };
}

/** A large, touch-friendly slider with its value shown next to it. */
export function SimSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  const { num } = useSimFormat();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold tabular-nums">
          {format ? format(value) : num(value, 3)}
          {unit ? ` ${unit}` : ""}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-10 w-full accent-[var(--color-lab-stem)]" />
    </div>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-xl border border-line-strong p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn("h-9 rounded-lg px-3.5 text-sm font-semibold", value === o.id ? "bg-lab-stem text-white" : "text-ink-muted hover:bg-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function fixed(v: number, digits = 2) {
  return (Math.round(v * 10 ** digits) / 10 ** digits).toString();
}
