import { ArrowRight, BookOpenCheck, Compass, Library, Lightbulb, MonitorSmartphone, ShieldCheck, Users } from "lucide-react";
import { LAB_IDS, LAB_ROUTES } from "@/lib/labs/registry";
import { LabIcon } from "@/components/labs/lab-shell";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { demoModeEnabled, openAccessEnabled } from "@/lib/config";
import { BUILT_IN_LESSONS } from "@/lib/content/lessons";
import { SUBJECTS } from "@/lib/domain/catalog";
import { poolFor, publicChallenge } from "@/lib/daily/pick";
import { todayInSchool } from "@/lib/services/daily";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoLoginButtons } from "@/components/auth/demo-login";
import { Aurora } from "@/components/motion/aurora";
import { CountNumber } from "@/components/motion/count-stat";
import Link from "next/link";

const PRINCIPLE_ICONS = [ShieldCheck, Lightbulb, Users, Library, Compass];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function HomePage() {
  const { dict, locale } = await getDictionary();
  const l = dict.landing;
  const challenge = publicChallenge(todayInSchool(), locale);
  const openAccess = openAccessEnabled();
  // Real numbers, counted from what the platform contains.
  const stats = [
    { value: BUILT_IN_LESSONS.filter((lesson) => lesson.language === locale).length, label: l.stats.lessons },
    { value: poolFor("wildcard", locale).length, label: l.stats.questions },
    { value: SUBJECTS.length, label: l.stats.subjects },
    { value: LAB_IDS.length, label: l.stats.labs },
  ];
  const words = l.title.split(" ");

  return (
    <>
      <SiteHeader />
      <PageContainer>
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[32px] bg-night text-white shadow-[var(--shadow-raised)] ring-1 ring-white/10">
          <Aurora />
          <div className="relative grid gap-10 px-5 py-8 sm:px-12 sm:py-14 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
            <div>
              <p className="fc-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur">
                <MonitorSmartphone aria-hidden className="size-4 text-glow-c" />
                {l.eyebrow}
              </p>
              <h1 className="mt-5 text-[27px] leading-[1.18] font-semibold tracking-tight sm:text-[40px]">
                {words.map((word, i) => (
                  <span key={`${word}-${i}`} className="fc-rise inline-block" style={rise(i + 1)}>
                    {word}
                    {i < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </h1>
              <p className="fc-rise mt-4 max-w-2xl text-[15px] text-white/70 sm:mt-5 sm:text-[17px]" style={rise(words.length + 2)}>
                {l.lead}
              </p>
              {openAccess ? (
                <div className="fc-rise mt-7 max-w-xl rounded-3xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-md" style={rise(words.length + 3)} data-testid="open-access-choice">
                  <h2 className="text-xl font-semibold">{dict.open.chooseTitle}</h2>
                  <p className="mt-1 text-sm text-white/65">{dict.open.chooseText}</p>
                  <DemoLoginButtons className="mt-4" />
                </div>
              ) : (
                <div className="fc-rise mt-7 flex flex-wrap gap-3" style={rise(words.length + 3)}>
                  <ButtonLink href="/teacher" size="lg">
                    {l.ctaTeacher}
                    <ArrowRight aria-hidden className="size-4" />
                  </ButtonLink>
                  <ButtonLink href="/join" size="lg" variant="secondary">
                    {l.ctaJoin}
                  </ButtonLink>
                  <ButtonLink href="/student" size="lg" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                    {l.ctaStudent}
                  </ButtonLink>
                </div>
              )}
            </div>

            <Link
              href="/today"
              data-testid="landing-today"
              className="fc-rise fc-spotlight fc-spotlight-dark group relative block rounded-3xl lg:mt-14 lg:self-start border border-white/12 bg-white/[0.06] p-6 backdrop-blur-md transition-colors hover:bg-white/[0.09] sm:p-7"
              style={rise(words.length + 4)}
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-glow-c uppercase">
                <span aria-hidden className="relative flex size-2">
                  <span className="fc-ping absolute inline-flex size-full rounded-full bg-glow-c/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-glow-c" />
                </span>
                {fmt(dict.today.challenge.title, { n: challenge.number })}
              </span>
              <span className="mt-1.5 block text-sm text-white/55">
                {dict.today.weekdays[challenge.weekday - 1]} · {dict.today.themes[challenge.theme]}
              </span>
              <span className="mt-4 line-clamp-4 block text-xl leading-snug font-semibold whitespace-pre-line text-white">{challenge.prompt.split("\n\n")[0]}</span>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                {dict.today.challenge.start}
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          </div>
        </section>

        {/* What it contains, counted */}
        <section aria-label={dict.meta.title} className="fc-reveal mt-6">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[var(--shadow-card)] lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface px-6 py-6">
                <dd className="text-4xl font-semibold tracking-tight text-ink">
                  <CountNumber value={stat.value} scroll />
                </dd>
                <dt className="mt-1 text-sm text-ink-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Flow */}
        <section className="py-14">
          <h2 className="fc-reveal text-2xl font-semibold tracking-tight">{l.flowTitle}</h2>
          <ol className="relative mt-8 grid gap-4 md:grid-cols-5">
            <span aria-hidden className="absolute top-5 right-[10%] left-[10%] hidden h-px bg-linear-to-r from-transparent via-line-strong to-transparent md:block" />
            {l.flow.map((step, i) => (
              <li key={step.title} className="fc-reveal relative">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-brand/25 bg-surface text-sm font-semibold text-brand shadow-[var(--shadow-card)]">{i + 1}</span>
                <p className="mt-4 font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Principles */}
        <section aria-labelledby="principles" className="py-6">
          <h2 id="principles" className="fc-reveal text-2xl font-semibold tracking-tight">
            {l.principlesTitle}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {l.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              return (
                <div key={p.title} className="fc-reveal fc-spotlight fc-lift rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{p.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Audiences + demo */}
        <section className="grid gap-6 py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="fc-reveal text-2xl font-semibold tracking-tight">{l.audiencesTitle}</h2>
            <div className="mt-6 space-y-4">
              {l.audiences.map((a) => (
                <div key={a.title} className="fc-reveal fc-spotlight fc-lift flex gap-4 rounded-2xl border border-line bg-surface p-5">
                  <BookOpenCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {demoModeEnabled() && !openAccess ? (
            <div className="fc-reveal rounded-3xl border border-brand/20 bg-brand-soft/50 p-6 sm:p-8">
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
        <section aria-labelledby="labs" className="py-6">
          <h2 id="labs" className="fc-reveal text-2xl font-semibold tracking-tight">
            {l.labsTitle}
          </h2>
          <p className="fc-reveal mt-1.5 text-ink-muted">{l.labsText}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_IDS.map((id) => (
              <Link key={id} href={LAB_ROUTES[id]} className="fc-reveal fc-spotlight fc-lift flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
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

        <footer className="mt-10 flex flex-col gap-2 border-t border-line pt-6 pb-4 text-sm text-ink-subtle sm:flex-row sm:justify-between">
          <p>{l.footerNote}</p>
          <Link href="/privacy" className="font-medium text-ink-muted underline-offset-4 hover:underline">
            {dict.nav.privacy}
          </Link>
        </footer>
      </PageContainer>
    </>
  );
}
