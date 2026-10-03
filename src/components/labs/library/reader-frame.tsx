"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SIZES = ["text-[15px]", "text-base", "text-lg", "text-xl"];
const DEFAULT_SIZE = 1;
const KEY = "fc-reader-size";
const EVENT = "fc-reader-size-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function read(): number {
  try {
    const saved = Number(window.localStorage.getItem(KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < SIZES.length ? saved : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

/** Reading column with a text-size control; the choice stays in this browser. */
export function ReaderFrame({ children, labels, lang }: { children: ReactNode; labels: { textSize: string; smaller: string; larger: string }; lang?: string }) {
  const size = useSyncExternalStore(subscribe, read, () => DEFAULT_SIZE);
  const change = (next: number) => {
    try {
      window.localStorage.setItem(KEY, String(Math.min(SIZES.length - 1, Math.max(0, next))));
    } catch {
      /* private mode: the size just does not persist */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-1 text-sm text-ink-muted" role="group" aria-label={labels.textSize}>
        <Button variant="ghost" size="sm" aria-label={labels.smaller} disabled={size === 0} onClick={() => change(size - 1)}>
          <Minus aria-hidden className="size-4" />
        </Button>
        <span aria-hidden>Aa</span>
        <Button variant="ghost" size="sm" aria-label={labels.larger} disabled={size === SIZES.length - 1} onClick={() => change(size + 1)}>
          <Plus aria-hidden className="size-4" />
        </Button>
      </div>
      <div lang={lang} className={`${SIZES[size]} max-w-3xl leading-relaxed text-ink`} data-testid="reader-text">
        {children}
      </div>
    </div>
  );
}
