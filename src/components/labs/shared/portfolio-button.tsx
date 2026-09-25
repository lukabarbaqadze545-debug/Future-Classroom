"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

/** Turns a piece of lab work into a portfolio item (cross-module integration). */
export function PortfolioButton({ kind, id, initial }: { kind: "programming" | "stem_project" | "stem_record" | "research"; id: string; initial: boolean }) {
  const { dict } = useI18n();
  const [added, setAdded] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (added) {
    return (
      <Link href="/career/portfolio" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-success hover:bg-success-soft">
        <Check aria-hidden className="size-4" />
        {dict.labs.common.addedToPortfolio}
      </Link>
    );
  }
  return (
    <span className="inline-flex flex-col">
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api("/api/portfolio/from-source", { body: { kind, id } });
            setAdded(true);
          } catch (e) {
            setError(errorMessage(dict, e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <BriefcaseBusiness aria-hidden className="size-4" />
        {dict.labs.common.addToPortfolio}
      </Button>
      {error ? <span className="mt-1 text-xs text-danger">{error}</span> : null}
    </span>
  );
}
