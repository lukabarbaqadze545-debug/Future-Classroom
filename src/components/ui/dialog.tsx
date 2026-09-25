"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

/** Accessible modal built on the native <dialog> element (focus trap and Esc handled by the browser). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn("m-auto w-[min(560px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow-raised)]", className)}
    >
      {open ? (
        <div className="fc-fade-in">
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="-mr-2 rounded-lg p-2 text-ink-subtle hover:bg-muted hover:text-ink" aria-label={closeLabel}>
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children ? <div className="px-6 py-4">{children}</div> : <div className="h-4" />}
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-muted/40 px-6 py-4">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
