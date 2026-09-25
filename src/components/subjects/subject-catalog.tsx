"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { GRADES } from "@/lib/domain/catalog";
import { SUBJECT_CATEGORIES, type SubjectCategory, type SubjectIcon as IconName } from "@/lib/content/subjects";
import { ACTIVITY_KINDS, type ActivityKind } from "@/lib/content/subject-kinds";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { SubjectIcon } from "./subject-icon";

export interface CatalogSubject {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  category: SubjectCategory;
  grades: [number, number];
  counts: Partial<Record<ActivityKind, number>>;
  /** Topic and item titles, for search. */
  keywords: string;
}

/** The subject catalogue with a few filters: text, grade and activity type. */
export function SubjectCatalog({ subjects }: { subjects: CatalogSubject[] }) {
  const { dict } = useI18n();
  const c = dict.subjectCatalog;
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [kind, setKind] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return subjects.filter(
      (s) =>
        (!needle || `${s.name} ${s.description} ${s.keywords}`.toLowerCase().includes(needle)) &&
        (!grade || (Number(grade) >= s.grades[0] && Number(grade) <= s.grades[1])) &&
        (!kind || (s.counts[kind as ActivityKind] ?? 0) > 0),
    );
  }, [subjects, q, grade, kind]);
  const filtered = Boolean(q || grade || kind);

  return (
    <div>
      <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_220px]">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
          <Input type="search" aria-label={c.search} placeholder={c.search} value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" data-testid="subject-search" />
        </div>
        <Select aria-label={c.grade} value={grade} onChange={(e) => setGrade(e.target.value)} data-testid="subject-grade">
          <option value="">{c.anyGrade}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {fmt(dict.common.grade, { n: g })}
            </option>
          ))}
        </Select>
        <Select aria-label={c.activity} value={kind} onChange={(e) => setKind(e.target.value)} data-testid="subject-kind">
          <option value="">{c.anyActivity}</option>
          {ACTIVITY_KINDS.map((k) => (
            <option key={k} value={k}>
              {c.kinds[k]}
            </option>
          ))}
        </Select>
      </div>

      {shown.length ? (
        <div className="space-y-10">
          {SUBJECT_CATEGORIES.map((category) => {
            const group = shown.filter((s) => s.category === category);
            if (!group.length) return null;
            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2 id={`cat-${category}`} className="mb-3 text-sm font-semibold tracking-wide text-ink-subtle uppercase">
                  {c.categories[category]}
                </h2>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="subject-list">
                  {group.map((s) => (
                    <li key={s.id}>
                      <Link href={`/subjects/${s.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-brand/40" data-testid="subject-card">
                        <div className="flex items-start gap-3">
                          <SubjectIcon icon={s.icon} category={s.category} />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-balance group-hover:text-brand">{s.name}</h3>
                            <p className="text-sm text-ink-subtle">{fmt(c.grades, { from: s.grades[0], to: s.grades[1] })}</p>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm text-ink-muted">{s.description}</p>
                        <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-ink-subtle">
                          {ACTIVITY_KINDS.filter((k) => s.counts[k]).map((k) => (
                            <span key={k}>{fmtCount(c.kindCounts[k], s.counts[k]!)}</span>
                          ))}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">
          <p>{c.noResults}</p>
          {filtered ? (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => {
                setQ("");
                setGrade("");
                setKind("");
              }}
            >
              {c.clearFilters}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
