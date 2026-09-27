"use client";

import { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import type { GuideField } from "@/lib/labs/career/universities";
import { Button } from "@/components/ui/button";

/** Copies a guide entry into the student's own university research cards. */
export function SaveGuideCard({ id, field }: { id: string; field: GuideField | null }) {
  const { dict } = useI18n();
  const g = dict.labs.career.guide;
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        disabled={saved || busy}
        data-testid="guide-save"
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await api("/api/career/universities/from-guide", { body: { id, field } });
            setSaved(true);
          } catch (e) {
            setError(errorMessage(dict, e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? <Check aria-hidden className="size-4" /> : <BookmarkPlus aria-hidden className="size-4" />}
        {saved ? g.savedToCards : g.saveToCards}
      </Button>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
