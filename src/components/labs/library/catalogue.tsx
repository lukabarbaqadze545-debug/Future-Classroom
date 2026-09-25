"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookmarkCheck, Globe, Library, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { tr, type L } from "@/lib/labs/localized";
import { LIBRARY_CATEGORIES, LIBRARY_KINDS, LIBRARY_LANGUAGES } from "@/lib/labs/library/model";
import { SUBJECTS, GRADES, type Subject } from "@/lib/domain/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";

export interface CatalogueItem {
  id: string;
  title: string;
  authors: string;
  kind: (typeof LIBRARY_KINDS)[number];
  categories: (typeof LIBRARY_CATEGORIES)[number][];
  subjects: Subject[];
  gradeFrom: number | null;
  gradeTo: number | null;
  language: (typeof LIBRARY_LANGUAGES)[number];
  description: L;
  digital: boolean;
  copies: { total: number; available: number };
  reading: "want" | "reading" | "finished" | null;
  bookmarked: boolean;
}

export function Catalogue({ items, initialSubject }: { items: CatalogueItem[]; initialSubject: Subject | "" }) {
  const { dict, locale } = useI18n();
  const b = dict.labs.library;
  const f = b.filters;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState<string>(initialSubject);
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState("");
  const [kind, setKind] = useState("");
  const [availability, setAvailability] = useState("");

  const filtered = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((r) => {
      const hay = [r.title, r.authors, r.description.en, r.description.ka].join(" ").toLowerCase();
      if (words.length && !words.every((w) => hay.includes(w))) return false;
      if (category && !(r.categories as string[]).includes(category)) return false;
      if (subject && !(r.subjects as string[]).includes(subject)) return false;
      if (grade && r.gradeFrom !== null && r.gradeTo !== null && (Number(grade) < r.gradeFrom || Number(grade) > r.gradeTo)) return false;
      if (language && r.language !== language) return false;
      if (kind && r.kind !== kind) return false;
      if (availability === "digital" && !r.digital) return false;
      if (availability === "physical" && !r.copies.total) return false;
      if (availability === "available" && !r.copies.available) return false;
      if (availability === "bookmarked" && !r.bookmarked) return false;
      return true;
    });
  }, [items, q, category, subject, grade, language, kind, availability]);
  const active = q || category || subject || grade || language || kind || availability;

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
          <Input type="search" aria-label={b.search} placeholder={b.search} value={q} onChange={(e) => setQ(e.target.value)} className="h-12 pl-11 text-base" data-testid="library-search" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Select aria-label={f.category} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{f.category}: {f.any}</option>
            {LIBRARY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {b.categories[c]}
              </option>
            ))}
          </Select>
          <Select aria-label={f.subject} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">{f.subject}: {f.any}</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {dict.subjects[s]}
              </option>
            ))}
          </Select>
          <Select aria-label={f.grade} value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">{f.grade}: {f.any}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {fmt(dict.common.grade, { n: g })}
              </option>
            ))}
          </Select>
          <Select aria-label={f.language} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">{f.language}: {f.any}</option>
            {LIBRARY_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {b.languages[l]}
              </option>
            ))}
          </Select>
          <Select aria-label={f.kind} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">{f.kind}: {f.any}</option>
            {LIBRARY_KINDS.map((k) => (
              <option key={k} value={k}>
                {b.kinds[k]}
              </option>
            ))}
          </Select>
          <Select aria-label={f.availability} value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">{f.availability}: {f.any}</option>
            <option value="digital">{f.digital}</option>
            <option value="physical">{f.physical}</option>
            <option value="available">{f.available}</option>
            <option value="bookmarked">{f.bookmarked}</option>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
          <span aria-live="polite">{fmtCount(b.results, filtered.length)}</span>
          {active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setCategory("");
                setSubject("");
                setGrade("");
                setLanguage("");
                setKind("");
                setAvailability("");
              }}
            >
              {b.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>
      {filtered.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="library-results">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link href={`/library/${r.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-library/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge>{b.kinds[r.kind]}</Badge>
                  <Badge tone="neutral">{b.languages[r.language]}</Badge>
                  {r.reading ? <Badge tone={r.reading === "finished" ? "success" : "brand"}>{b.reading.status[r.reading]}</Badge> : null}
                  {r.bookmarked ? <BookmarkCheck aria-label={dict.labs.common.bookmarked} className="ml-auto size-4 text-brand" /> : null}
                </div>
                <h3 className="mt-2.5 font-semibold group-hover:text-lab-library" lang={r.language === "ka" ? "ka" : r.language === "en" ? "en" : undefined}>
                  {r.title}
                </h3>
                {r.authors ? <p className="text-sm text-ink-muted">{r.authors}</p> : null}
                <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{tr(r.description, locale)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-ink-muted">
                  {r.digital ? (
                    <span className="inline-flex items-center gap-1 font-medium text-lab-library">
                      <Globe aria-hidden className="size-3.5" />
                      {b.digitalVersion}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Library aria-hidden className="size-3.5" />
                    {r.copies.total ? fmt(b.copiesAvailable, { available: r.copies.available, total: r.copies.total }) : b.noCopies}
                  </span>
                  {r.gradeFrom && r.gradeTo ? <span>{fmt(b.grades, { from: r.gradeFrom, to: r.gradeTo })}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">{b.noResults}</p>
      )}
    </div>
  );
}
