"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/components/ui/cn";

/** Countdown to a server timestamp, corrected for this device's clock offset. */
export function Countdown({ endsAt, clockOffset, label, className, large = false }: { endsAt: number; clockOffset: number; label: string; className?: string; large?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.round((endsAt - (now + clockOffset)) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold tabular-nums",
        remaining <= 10 ? "bg-danger-soft text-danger" : "bg-muted text-ink",
        large ? "px-5 py-2 text-3xl" : "px-3 py-1 text-sm",
        className,
      )}
      aria-label={`${label}: ${minutes}:${seconds}`}
    >
      <Timer aria-hidden className={large ? "size-7" : "size-4"} />
      {minutes}:{seconds}
    </span>
  );
}
