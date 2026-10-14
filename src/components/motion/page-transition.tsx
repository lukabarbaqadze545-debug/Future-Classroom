"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The page content arrives with a short rise each time the address changes (not for a changed query or a re-render). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="fc-page-in">
      {children}
    </div>
  );
}
