"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";

/** The breadcrumb landmark, labelled in the reader's language. */
export function BreadcrumbNav({ className, children }: { className?: string; children: ReactNode }) {
  const { dict } = useI18n();
  return (
    <nav aria-label={dict.common.breadcrumb} className={className}>
      {children}
    </nav>
  );
}
