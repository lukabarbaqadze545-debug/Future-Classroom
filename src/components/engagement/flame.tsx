"use client";

import { useId } from "react";
import { cn } from "@/components/ui/cn";

/** The streak flame: alive while the streak is, grey and still when it is not. */
export function Flame({ lit, className }: { lit: boolean; className?: string }) {
  const id = useId();
  const outer = `${id}-out`;
  const inner = `${id}-in`;
  return (
    <svg viewBox="0 0 64 80" aria-hidden className={cn("shrink-0", lit && "fc-flame", className)}>
      <defs>
        <linearGradient id={outer} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? "#f97316" : "#98a2b3"} />
          <stop offset="1" stopColor={lit ? "#fbbf24" : "#cbd2dc"} />
        </linearGradient>
        <linearGradient id={inner} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? "#fde68a" : "#e4e7ec"} />
          <stop offset="1" stopColor={lit ? "#fffbeb" : "#f2f4f7"} />
        </linearGradient>
      </defs>
      <path d="M32 4c2 14 18 22 18 44a18 18 0 0 1-36 0c0-10 5-15 9-21 1 6 4 9 7 10C27 28 28 14 32 4Z" fill={`url(#${outer})`} />
      <path d="M32 40c1 7 9 10 9 19a9 9 0 0 1-18 0c0-6 4-8 5-12 1 2 2 3 4 3 0-3 0-7 0-10Z" fill={`url(#${inner})`} />
    </svg>
  );
}
