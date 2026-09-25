import { ArrowRight, BookOpenCheck, Compass, Library, Lightbulb, MonitorSmartphone, ShieldCheck, Users } from "lucide-react";
import { LAB_IDS, LAB_ROUTES } from "@/lib/labs/registry";
import { LabIcon } from "@/components/labs/lab-shell";
import { getDictionary } from "@/lib/i18n/server";
import { demoModeEnabled } from "@/lib/config";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoLoginButtons } from "@/components/auth/demo-login";
import Link from "next/link";

const PRINCIPLE_ICONS = [ShieldCheck, Lightbulb, Users, Library, Compass];

export default async function HomePage() {
  const { dict } = await getDictionary();
  const l = dict.landing;
  return (
    <>
      <SiteHeader />
      <PageContainer>
        {/* Hero */}
        <section className="grid items-center gap-10 pt-4 pb-12 lg:grid-cols-[1.15fr_1fr] lg:pt-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink-muted">
              <MonitorSmartphone aria-hidden className="size-4 text-brand" />
              {l.eyebrow}
            </p>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">{l.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-muted">{l.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/teacher" size="lg">
                {l.ctaTeacher}
                <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink href="/join" size="lg" variant="secondary">
                {l.ctaJoin}
              </ButtonLink>
              <ButtonLink href="/student" size="lg" variant="ghost">
                {l.ctaStudent}
              </ButtonLink>
            </div>
          </div>

          {/* Flow */}
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{l.flowTitle}</h2>
            <ol className="mt-5 space-y-1">
              {l.flow.map((step, i) => (
                <li key={step.title} className="relative flex gap-4 pb-4 last:pb-0">
                  {i < l.flow.length - 1 ? <span aria-hidden className="absolute top-10 bottom-0 left-[19px] w-px bg-line" /> : null}
                  <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">{i + 1}</span>
                  <div className="pt-1.5">
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="text-sm text-ink-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Principles */}
        <section aria-labelledby="principles" className="py-10">
          <h2 id="principles" className="text-2xl font-semibold tracking-tight">{l.principlesTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {l.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              return (
                <div key={p.title} className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                  <Icon aria-hidden className="size-6 text-brand" />
                  <h3 className="mt-3 font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{p.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Audiences + demo */}
        <section className="grid gap-6 py-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{l.audiencesTitle}</h2>
            <div className="mt-6 space-y-4">
              {l.audiences.map((a) => (
                <div key={a.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                  <BookOpenCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {demoModeEnabled() ? (
            <div className="rounded-3xl border border-brand/20 bg-brand-soft/50 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">{l.demoTitle}</h2>
              <p className="mt-1 text-sm text-ink-muted">{l.demoText}</p>
              <DemoLoginButtons className="mt-5" />
              <h3 className="mt-7 text-sm font-semibold">{l.demoFlowTitle}</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-muted">
                {l.demoFlow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>

        {/* Laboratories */}
        <section aria-labelledby="labs" className="py-10">
          <h2 id="labs" className="text-2xl font-semibold tracking-tight">{l.labsTitle}</h2>
          <p className="mt-1.5 text-ink-muted">{l.labsText}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_IDS.map((id) => (
              <Link key={id} href={LAB_ROUTES[id]} className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
                <LabIcon lab={id} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{dict.labs.hub.rooms[id].name}</span>
                    <Badge tone="success">{l.included}</Badge>
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">{dict.labs.hub.rooms[id].text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-line pt-6 pb-4 text-sm text-ink-subtle sm:flex-row sm:justify-between">
          <p>{l.footerNote}</p>
          <Link href="/privacy" className="font-medium text-ink-muted underline-offset-4 hover:underline">
            {dict.nav.privacy}
          </Link>
        </footer>
      </PageContainer>
    </>
  );
}
