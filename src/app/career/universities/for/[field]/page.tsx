import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { tr } from "@/lib/labs/localized";
import { getFieldGuide, getUniversity } from "@/lib/labs/career/universities";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { AbroadSteps, CheckedNotice } from "@/components/labs/career/university-guide-panel";

type Props = { params: Promise<{ field: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, dict } = await getDictionary();
  const f = getFieldGuide((await params).field);
  return { title: f ? tr(f.title, locale) : dict.labs.career.guide.title };
}

export default async function FieldGuidePage({ params }: Props) {
  const guide = getFieldGuide((await params).field);
  if (!guide) notFound();
  const { dict, locale } = await getDictionary();
  const c = dict.labs.career;
  const g = c.guide;

  return (
    <PageContainer>
      <Link href="/career#guide" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        {g.back}
      </Link>
      <LabHeader lab="career" hubLabel={dict.labs.hub.title} labName={c.title} title={tr(guide.title, locale)} lead={tr(guide.intro, locale)} />
      <div className="space-y-6" data-testid="field-guide">
        <CheckedNotice dict={dict} locale={locale} />
        <Card className="p-5">
          <h2 className="font-semibold">{g.lookFor}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
            {guide.lookFor.map((x, i) => (
              <li key={i}>{tr(x, locale)}</li>
            ))}
          </ul>
        </Card>
        <section>
          <h2 className="mb-3 text-lg font-semibold">{g.paths}</h2>
          <ol className="space-y-4" data-testid="field-paths">
            {guide.paths.map((p, i) => (
              <li key={i}>
                <Card className="p-5">
                  <h3 className="font-semibold text-lab-career">{tr(p.title, locale)}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{tr(p.text, locale)}</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {p.universities.map((id) => {
                      const u = getUniversity(id)!;
                      return (
                        <li key={id}>
                          <Link href={`/career/universities/${id}?field=${guide.id}`} className="flex h-full items-start justify-between gap-2 rounded-xl border border-line p-3 transition-colors hover:border-lab-career/50 hover:bg-lab-career/5">
                            <span className="min-w-0">
                              <span className="block font-medium">{tr(u.name, locale)}</span>
                              <span className="block text-sm text-ink-muted">
                                {tr(u.city, locale)}, {tr(u.country, locale)}
                              </span>
                              <Badge tone={u.kind === "public" ? "success" : "neutral"} className="mt-1">
                                {g.kind[u.kind]}
                              </Badge>
                            </span>
                            <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </li>
            ))}
          </ol>
        </section>
        <Card className="border-lab-career/40 bg-lab-career/5 p-5" data-testid="field-bottom-line">
          <h2 className="font-semibold">{g.bottomLine}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed">{tr(guide.bottomLine, locale)}</p>
        </Card>
        <AbroadSteps dict={dict} locale={locale} />
      </div>
    </PageContainer>
  );
}
