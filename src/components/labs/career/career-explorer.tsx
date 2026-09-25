"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { tr } from "@/lib/labs/localized";
import { CAREERS, FIELDS } from "@/lib/labs/career/careers";
import { SKILLS } from "@/lib/labs/career/skills";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";

export function CareerExplorer({ bookmarked }: { bookmarked: string[] }) {
  const { dict, locale } = useI18n();
  const c = dict.labs.career.careers;
  const [field, setField] = useState("");
  const [skill, setSkill] = useState("");
  const list = CAREERS.filter((x) => (!field || (x.fields as string[]).includes(field)) && (!skill || (x.skills as string[]).includes(skill)));
  return (
    <div className="space-y-4">
      <div className="grid max-w-2xl gap-2 sm:grid-cols-2">
        <Select aria-label={c.filterField} value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">{c.anyField}</option>
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>
              {tr(f.name, locale)}
            </option>
          ))}
        </Select>
        <Select aria-label={c.filterSkill} value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">{c.anySkill}</option>
          {SKILLS.map((s) => (
            <option key={s.id} value={s.id}>
              {tr(s.name, locale)}
            </option>
          ))}
        </Select>
      </div>
      {list.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="career-list">
          {list.map((x) => (
            <li key={x.id}>
              <Link href={`/career/careers/${x.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-career/40">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold group-hover:text-lab-career">{tr(x.title, locale)}</h3>
                  {bookmarked.includes(x.id) ? <Badge tone="brand">{dict.labs.common.bookmarked}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{tr(x.summary, locale)}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {x.skills.slice(0, 3).map((s) => (
                    <Badge key={s}>{tr(SKILLS.find((k) => k.id === s)!.name, locale)}</Badge>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">{c.none}</p>
      )}
      <p className="text-sm text-ink-muted">{c.noNumbers}</p>
    </div>
  );
}
