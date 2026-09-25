"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "./cn";

/** WAI-ARIA tabs with arrow-key navigation. Controlled by the parent. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  size = "md",
}: {
  tabs: { id: T; label: ReactNode; badge?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "md" | "lg";
}) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto rounded-xl border border-line bg-muted/70 p-1", className)}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            type="button"
            id={`${baseId}-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") focusTab(index + 1);
              if (event.key === "ArrowLeft") focusTab(index - 1);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 font-medium transition-colors",
              size === "lg" ? "h-12 text-base" : "h-10 text-sm",
              selected ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
