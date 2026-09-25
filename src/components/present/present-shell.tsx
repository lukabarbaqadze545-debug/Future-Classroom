"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Maximize, Minimize, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/components/ui/cn";

export type PresentTheme = "light" | "dark";

// Presentation theme persisted per device (projectors differ); falls back to memory.
const THEME_KEY = "fc:present-theme";
const themeListeners = new Set<() => void>();
let memoryTheme: PresentTheme = "light";
function readTheme(): PresentTheme {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // storage unavailable
  }
  return memoryTheme;
}
function writeTheme(theme: PresentTheme) {
  memoryTheme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage unavailable
  }
  themeListeners.forEach((listener) => listener());
}
function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

/** Full-screen, high-contrast frame for the classroom display. */
export function PresentShell({ children, controls, top, overlay }: { children: (theme: PresentTheme) => ReactNode; controls: (theme: PresentTheme) => ReactNode; top?: ReactNode; overlay?: ReactNode }) {
  const { dict } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as PresentTheme);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleTheme = () => writeTheme(theme === "light" ? "dark" : "light");
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };
  const dark = theme === "dark";
  const iconBtn = cn("inline-flex size-14 items-center justify-center rounded-2xl", dark ? "text-white/80 hover:bg-white/10" : "text-ink-muted hover:bg-muted");
  return (
    <div className={cn("flex min-h-screen flex-col", dark ? "bg-[#0b1020] text-white" : "bg-surface text-ink")} data-theme={theme}>
      <div className="flex items-center justify-between gap-4 px-6 pt-5 lg:px-10">
        <div className="min-w-0 flex-1">{top}</div>
        <div className="flex items-center gap-1">
          <button type="button" className={iconBtn} onClick={toggleTheme} aria-label={`${dict.present.theme}: ${dark ? dict.present.light : dict.present.dark}`}>
            {dark ? <Sun aria-hidden className="size-6" /> : <Moon aria-hidden className="size-6" />}
          </button>
          <button type="button" className={iconBtn} onClick={toggleFullscreen} aria-label={dict.present.fullscreen}>
            {fullscreen ? <Minimize aria-hidden className="size-6" /> : <Maximize aria-hidden className="size-6" />}
          </button>
        </div>
      </div>
      <main id="main" className="flex flex-1 flex-col px-6 py-6 lg:px-12">
        {children(theme)}
      </main>
      <div className={cn("sticky bottom-0 border-t px-4 py-4 lg:px-10", dark ? "border-white/10 bg-[#0b1020]/95" : "border-line bg-surface/95")}>
        <div className="flex flex-wrap items-center justify-center gap-3">{controls(theme)}</div>
      </div>
      {overlay}
    </div>
  );
}

/** Large touch-friendly button for the presentation control bar. */
export function PresentButton({ children, onClick, variant = "default", disabled, theme, href, ...rest }: { children: ReactNode; onClick?: () => void; variant?: "default" | "primary" | "danger"; disabled?: boolean; theme: PresentTheme; href?: string; "data-testid"?: string }) {
  const dark = theme === "dark";
  const cls = cn(
    "inline-flex h-16 min-w-16 items-center justify-center gap-3 rounded-2xl px-6 text-lg font-semibold transition-colors disabled:opacity-40",
    variant === "primary" && "bg-brand text-white hover:bg-brand-hover",
    variant === "danger" && (dark ? "bg-white/5 text-red-300 hover:bg-red-500/20" : "bg-danger-soft text-danger hover:bg-danger/15"),
    variant === "default" && (dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-muted text-ink hover:bg-line"),
  );
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
