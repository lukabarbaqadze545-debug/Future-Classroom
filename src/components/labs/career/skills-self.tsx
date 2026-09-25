"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr, type L } from "@/lib/labs/localized";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

export interface SkillRow {
  id: string;
  name: L;
  group: "thinking" | "technical" | "people";
  level: number | null;
  evidence: number;
}

/** Self-assessment (1–4) shown next to the evidence the portfolio contains. */
export function SkillsSelf({ initial, readOnly }: { initial: SkillRow[]; readOnly?: boolean }) {
  const { dict, locale } = useI18n();
  const s = dict.labs.career.skills;
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState("");
  const rate = async (id: string, level: number | null) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, level } : r)));
    try {
      await api("/api/career/skills", { method: "PUT", body: { skillId: id, level } });
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };
  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink-muted">{s.lead}</p>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="grid gap-5 lg:grid-cols-3">
        {(["thinking", "technical", "people"] as const).map((group) => (
          <Card key={group} className="p-5">
            <h3 className="font-semibold text-lab-career">{s.groups[group]}</h3>
            <ul className="mt-3 space-y-4">
              {rows
                .filter((r) => r.group === group)
                .map((r) => (
                  <li key={r.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{tr(r.name, locale)}</span>
                      <span className="text-xs text-ink-muted">{r.evidence ? fmtCount(s.evidence, r.evidence) : s.noEvidence}</span>
                    </div>
                    <div role="radiogroup" aria-label={tr(r.name, locale)} className="mt-1.5 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((lv) => (
                        <button
                          key={lv}
                          type="button"
                          role="radio"
                          aria-checked={r.level === lv}
                          disabled={readOnly}
                          title={s.levels[lv - 1]}
                          onClick={() => rate(r.id, r.level === lv ? null : lv)}
                          className={cn(
                            "h-9 rounded-lg text-sm font-semibold transition-colors",
                            r.level !== null && lv <= r.level ? "bg-lab-career text-white" : "bg-muted text-ink-muted hover:bg-line",
                          )}
                        >
                          {lv}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-ink-subtle">{r.level ? s.levels[r.level - 1] : s.notRated}</p>
                    {r.level !== null && r.level >= 3 && r.evidence === 0 ? (
                      <p className="mt-1 flex items-start gap-1 text-xs text-warn">
                        <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                        {s.gap}
                      </p>
                    ) : null}
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
