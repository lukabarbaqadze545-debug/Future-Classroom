import Link from "next/link";
import { ArrowRight, Code2, ExternalLink, Palette, Stethoscope } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/en";
import { fmt, formatDate, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { ABROAD_STEPS, CHECKED, GEORGIA_2026, UNIVERSITY_GUIDE, guideIsStale, type GuideField, type Source } from "@/lib/labs/career/universities";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { UniversityGuideList, type GuideItem } from "./university-guide";

const FIELD_ICONS: Record<GuideField, typeof Code2> = { cs: Code2, medicine: Stethoscope, art: Palette };

export function SourceList({ sources, label }: { sources: Source[]; label: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{label}</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-start gap-1 break-all text-brand hover:underline">
              <ExternalLink aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span className="break-words">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** When the guide was checked, and a warning once that is more than a year ago. */
export function CheckedNotice({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const g = dict.labs.career.guide;
  const date = formatDate(locale, Date.parse(`${CHECKED}T12:00:00Z`));
  return guideIsStale() ? (
    <div data-testid="guide-checked" data-stale="yes">
      <Notice tone="warn">
        {g.stale} ({date})
      </Notice>
    </div>
  ) : (
    <p className="rounded-2xl border border-lab-career/25 bg-lab-career/5 px-4 py-3 text-sm" data-testid="guide-checked">
      {fmt(g.checked, { date })}
    </p>
  );
}

export function AbroadSteps({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const g = dict.labs.career.guide;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5" data-testid="guide-abroad">
        <h2 className="text-lg font-semibold">{g.abroadTitle}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px]">
          {ABROAD_STEPS.steps.map((s, i) => (
            <li key={i}>{tr(s, locale)}</li>
          ))}
        </ol>
      </Card>
      <Card className="p-5" data-testid="guide-scholarships">
        <h2 className="text-lg font-semibold">{g.scholarshipsTitle}</h2>
        <ul className="mt-3 space-y-3 text-[15px]">
          {ABROAD_STEPS.scholarships.map((s) => (
            <li key={s.source.url}>
              <p className="font-medium">{tr(s.name, locale)}</p>
              <p className="text-ink-muted">{tr(s.text, locale)}</p>
              <a href={s.source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                <ExternalLink aria-hidden className="size-3.5" />
                {s.source.label}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** The "University guide" tab of Career & University. */
export function UniversityGuidePanel({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const g = dict.labs.career.guide;
  const items: GuideItem[] = UNIVERSITY_GUIDE.map((u) => ({
    id: u.id,
    name: tr(u.name, locale),
    short: tr(u.short, locale),
    place: `${tr(u.city, locale)}, ${tr(u.country, locale)}`,
    region: u.region,
    kind: u.kind,
    fields: u.fields,
    languages: tr(u.languages, locale),
    summary: tr(u.summary, locale),
  }));
  return (
    <div className="space-y-6" data-testid="university-guide">
      <div>
        <h2 className="text-xl font-semibold">{g.title}</h2>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-muted">{g.lead}</p>
      </div>
      <CheckedNotice dict={dict} locale={locale} />

      <section>
        <h3 className="mb-2 font-semibold">{g.chooseField}</h3>
        <ul className="grid gap-3 sm:grid-cols-3" data-testid="guide-fields">
          {(["cs", "medicine", "art"] as const).map((f) => {
            const Icon = FIELD_ICONS[f];
            return (
              <li key={f}>
                <Link href={`/career/universities/for/${f}`} className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-career/50">
                  <Icon aria-hidden className="size-6 shrink-0 text-lab-career" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{g.fieldNames[f]}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-brand">
                      {g.fieldCta}
                      <ArrowRight aria-hidden className="size-3.5" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="p-5" data-testid="guide-georgia">
        <h3 className="font-semibold">{g.georgiaNotice}</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
          {GEORGIA_2026.points.map((p, i) => (
            <li key={i}>{tr(p, locale)}</li>
          ))}
        </ul>
        <div className="mt-3">
          <SourceList sources={GEORGIA_2026.sources} label={g.sources} />
        </div>
      </Card>

      <UniversityGuideList items={items} />
      <AbroadSteps dict={dict} locale={locale} />
    </div>
  );
}
