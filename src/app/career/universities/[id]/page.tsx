import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getUniversity, isGuideField } from "@/lib/labs/career/universities";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { AbroadSteps, CheckedNotice, SourceList } from "@/components/labs/career/university-guide-panel";
import { SaveGuideCard } from "@/components/labs/career/save-guide-card";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ field?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, dict } = await getDictionary();
  const u = getUniversity((await params).id);
  return { title: u ? tr(u.name, locale) : dict.labs.career.guide.title };
}

export default async function UniversityGuidePage({ params, searchParams }: Props) {
  const u = getUniversity((await params).id);
  if (!u) notFound();
  const { field } = await searchParams;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.career;
  const g = c.guide;
  const short = tr(u.short, locale);
  const chosen = field && isGuideField(field) && u.fields.includes(field) ? field : null;
  const section = (title: string, children: React.ReactNode, testid?: string) => (
    <Card className="p-5" data-testid={testid}>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed">{children}</div>
    </Card>
  );
  const list = (items: { en: string; ka: string }[]) => (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((x, i) => (
        <li key={i}>{tr(x, locale)}</li>
      ))}
    </ul>
  );

  return (
    <PageContainer>
      <Link href="/career#guide" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        {g.back}
      </Link>
      <LabHeader
        lab="career"
        hubLabel={dict.labs.hub.title}
        labName={c.title}
        title={
          <span>
            {tr(u.name, locale)}
            {short && !tr(u.name, locale).includes(short) ? <span className="text-ink-subtle"> · {short}</span> : null}
          </span>
        }
        lead={
          <span className="block space-y-2">
            <span className="block">
              {tr(u.city, locale)}, {tr(u.country, locale)}
            </span>
            <span className="flex flex-wrap gap-1.5">
              <Badge tone={u.kind === "public" ? "success" : "neutral"}>{g.kind[u.kind]}</Badge>
              {u.fields.map((f) => (
                <Badge key={f} tone="brand" className="whitespace-normal">
                  {g.fieldNames[f]}
                </Badge>
              ))}
            </span>
          </span>
        }
        actions={
          <>
            <a href={u.website} target="_blank" rel="noreferrer noopener" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-4 font-medium hover:bg-muted">
              <ExternalLink aria-hidden className="size-4" />
              {g.officialSite}
            </a>
            <SaveGuideCard id={u.id} field={chosen} />
          </>
        }
      />
      <div className="space-y-5" data-testid="guide-detail">
        <CheckedNotice dict={dict} locale={locale} />
        <Card className="p-5">
          <p className="text-[16px] leading-relaxed">{tr(u.summary, locale)}</p>
          <p className="mt-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{g.teaching}: </span>
            {tr(u.languages, locale)}
          </p>
        </Card>
        {u.fields.map((f) =>
          u.strengths[f] ? (
            <Card key={f} className="border-lab-career/30 p-5">
              <h2 className="font-semibold">{fmt(g.whyFor, { field: g.fieldNames[f] })}</h2>
              <p className="mt-2 text-[15px] leading-relaxed">{tr(u.strengths[f]!, locale)}</p>
              <Link href={`/career/universities/for/${f}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                {g.fieldCta}: {g.fieldNames[f]}
              </Link>
            </Card>
          ) : null,
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          {section(
            g.admission,
            <ol className="list-decimal space-y-1.5 pl-5">
              {u.admission.map((x, i) => (
                <li key={i}>{tr(x, locale)}</li>
              ))}
            </ol>,
            "guide-admission",
          )}
          {section(g.tuition, <p>{tr(u.tuition, locale)}</p>, "guide-tuition")}
          {section(g.funding, list(u.funding), "guide-funding")}
          {section(g.deadlines, <p>{tr(u.deadlines, locale)}</p>)}
        </div>
        {section(g.considerations, list(u.considerations))}
        <Card className="p-5">
          <SourceList sources={u.sources} label={g.sources} />
        </Card>
        {u.region !== "georgia" ? <AbroadSteps dict={dict} locale={locale} /> : null}
      </div>
    </PageContainer>
  );
}
