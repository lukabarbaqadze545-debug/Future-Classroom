import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";

/** Centred single-card layout for sign-in, registration and joining. */
export function AuthShell({ title, lead, children, aside }: { title: string; lead?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-10 sm:py-16 lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {lead ? <p className="mt-1.5 text-ink-muted">{lead}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {aside ? <div className="w-full max-w-md">{aside}</div> : null}
      </main>
    </>
  );
}
