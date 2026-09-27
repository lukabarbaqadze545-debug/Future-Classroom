"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import type { GuideField, Region } from "@/lib/labs/career/universities";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";

/** One university, already in the reader's language. */
export interface GuideItem {
  id: string;
  name: string;
  short: string;
  place: string;
  region: Region;
  kind: "public" | "private";
  fields: GuideField[];
  languages: string;
  summary: string;
}

const REGION_ORDER: (Region | "all")[] = ["all", "georgia", "europe", "north_america", "asia"];

/** The guide's university list with field and region filters. */
export function UniversityGuideList({ items }: { items: GuideItem[] }) {
  const { dict } = useI18n();
  const g = dict.labs.career.guide;
  const [field, setField] = useState<GuideField | "">("");
  const [region, setRegion] = useState<Region | "all">("all");
  const shown = items.filter((u) => (!field || u.fields.includes(field)) && (region === "all" || u.region === region));

  return (
    <section data-testid="guide-list">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select aria-label={g.filterField} value={field} onChange={(e) => setField(e.target.value as GuideField | "")} className="h-11 sm:w-64" data-testid="guide-field">
          <option value="">{g.anyField}</option>
          {(["cs", "medicine", "art"] as const).map((f) => (
            <option key={f} value={f}>
              {g.fieldNames[f]}
            </option>
          ))}
        </Select>
        <div role="group" aria-label={g.filterRegion} className="flex flex-wrap gap-1.5">
          {REGION_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
              data-testid={`guide-region-${r}`}
              className={`min-h-11 rounded-full border px-3.5 text-sm font-medium transition-colors ${region === r ? "border-lab-career bg-lab-career/10 text-ink" : "border-line bg-surface hover:border-lab-career/40"}`}
            >
              {g.regions[r]}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-muted sm:ml-auto" aria-live="polite">
          {fmtCount(g.count, shown.length)}
        </p>
      </div>
      {shown.length === 0 ? <p className="text-sm text-ink-muted">{g.noResults}</p> : null}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((u) => (
          <li key={u.id} data-testid="guide-university">
            <Link href={`/career/universities/${u.id}`} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-lab-career/50">
              <h3 className="font-semibold text-lab-career">
                {u.name}
                {u.short && !u.name.includes(u.short) ? <span className="text-ink-subtle"> · {u.short}</span> : null}
              </h3>
              <p className="text-sm text-ink-muted">{u.place}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={u.kind === "public" ? "success" : "neutral"}>{g.kind[u.kind]}</Badge>
                {u.fields.map((f) => (
                  <Badge key={f} tone="brand" className="whitespace-normal">
                    {g.fieldNames[f]}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{u.summary}</p>
              <p className="mt-2 text-sm text-ink-muted">
                <span className="font-medium text-ink">{g.teaching}: </span>
                {u.languages}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-brand">
                {g.open}
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
