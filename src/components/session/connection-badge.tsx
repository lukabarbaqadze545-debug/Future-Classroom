"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/components/ui/cn";
import type { ConnectionState } from "./use-live-state";

export function ConnectionBadge({ state, className }: { state: ConnectionState; className?: string }) {
  const { dict } = useI18n();
  const label = state === "live" ? dict.connection.live : state === "reconnecting" ? dict.connection.reconnecting : dict.connection.offline;
  return (
    <span
      role="status"
      data-testid="connection-badge"
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        state === "live" ? "bg-success-soft text-success" : state === "reconnecting" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger",
        className,
      )}
    >
      {state === "offline" ? <WifiOff aria-hidden className="size-3.5" /> : <Wifi aria-hidden className={cn("size-3.5", state === "reconnecting" && "fc-pulse")} />}
      {label}
    </span>
  );
}
