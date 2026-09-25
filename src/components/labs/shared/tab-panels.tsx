"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";

/**
 * Tabs whose panels are rendered on the server and passed in, so large
 * static content (concept cards, guides) never ships as client data.
 * The chosen tab is kept in the URL hash so a refresh keeps it.
 */
export function TabPanels<T extends string>({ panels, initial, className }: { panels: { id: T; label: ReactNode; content: ReactNode }[]; initial?: T; className?: string }) {
  const hash = useSyncExternalStore(
    (listener) => {
      window.addEventListener("hashchange", listener);
      return () => window.removeEventListener("hashchange", listener);
    },
    () => window.location.hash.slice(1),
    () => "",
  );
  const [chosen, setValue] = useState<T | null>(null);
  const value = chosen ?? (panels.some((p) => p.id === hash) ? (hash as T) : (initial ?? panels[0].id));
  return (
    <div className={className}>
      <Tabs
        tabs={panels.map((p) => ({ id: p.id, label: p.label }))}
        value={value}
        onChange={(id) => {
          setValue(id);
          try {
            window.history.replaceState(null, "", `#${id}`);
          } catch {
            // History API unavailable: the tab just is not remembered.
          }
        }}
        size="lg"
        className="mb-6"
      />
      {panels.map((p) => (
        <div key={p.id} role="tabpanel" hidden={p.id !== value}>
          {p.content}
        </div>
      ))}
    </div>
  );
}
