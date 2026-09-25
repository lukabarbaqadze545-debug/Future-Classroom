import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { BIAS_CARDS, CONCEPTS, FALLACY_CARDS } from "@/lib/labs/critical/concepts";
import { bestScores, criticalProgress, exerciseClassStats, listExercises } from "@/lib/labs/critical/service";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { LabHeader, Stars } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { TabPanels } from "@/components/labs/shared/tab-panels";

export const metadata = { title: "Critical Thinking Lab" };

export default async function CriticalThinkingPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.critical;
  const staff = isStaff(user);
  const exercises = listExercises();
  const best = bestScores(user.id);
  const progress = criticalProgress(user.id);
  const assignments = staff ? [] : openAssignmentsFor(user.id, "critical").filter((a) => a.recipient.status !== "completed");

  const exercisesPanel = (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="ct-exercises">
      {exercises.map((e) => {
        const b = best.get(e.id);
        const stats = staff ? exerciseClassStats(e.id) : null;
        return (
          <li key={e.id}>
            <Link href={`/labs/critical-thinking/${e.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-critical/40">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-lab-critical uppercase">{c.kinds[e.kind]}</span>
                {b ? <Badge tone={b.score / Math.max(b.max, 1) >= 0.8 ? "success" : "warn"}>{fmt(c.best, { score: b.score, max: b.max })}</Badge> : null}
              </div>
              <h3 className="mt-2 font-semibold group-hover:text-lab-critical">{tr(e.title, locale)}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{tr(e.intro, locale)}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-ink-muted">
                <span>
                  {c.topics[e.topic]} · {fmt(c.minutes, { n: e.minutes })}
                </span>
                <Stars value={e.difficulty} label={`${dict.labs.common.difficulty}: ${e.difficulty}/3`} />
              </div>
              {stats ? (
                <p className="mt-2 border-t border-line pt-2 text-xs text-ink-subtle">
                  {stats.students ? fmt(c.classStats, { students: stats.students, avg: stats.average ?? 0 }) : c.noClassStats}
                </p>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const conceptsPanel = (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CONCEPTS.map((card) => (
        <li key={card.topic}>
          <Card className="h-full p-5">
            <h3 className="text-lg font-semibold text-lab-critical">{tr(card.title, locale)}</h3>
            <p className="mt-2 text-[15px] leading-relaxed">{tr(card.summary, locale)}</p>
            <p className="mt-3 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
              <span className="font-medium">{c.guide.example}: </span>
              {tr(card.example, locale)}
            </p>
            <p className="mt-3 text-sm">
              <span className="font-medium">{c.guide.ask}: </span>
              <em>{tr(card.ask, locale)}</em>
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );

  const guidePanel = (
    <div className="space-y-8">
      <p className="flex items-start gap-2 rounded-2xl border border-lab-critical/25 bg-lab-critical/5 px-4 py-3 text-[15px]">
        <HeartHandshake aria-hidden className="mt-0.5 size-5 shrink-0 text-lab-critical" />
        {c.respectNote}
      </p>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{c.topics.fallacies}</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {FALLACY_CARDS.map((f) => (
            <li key={f.id}>
              <Card className="h-full p-5">
                <h3 className="font-semibold">{tr(f.name, locale)}</h3>
                <dl className="mt-2 space-y-2 text-[15px]">
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{c.guide.definition}</dt>
                    <dd>{tr(f.definition, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{c.guide.example}</dt>
                    <dd className="italic">{tr(f.example, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{c.guide.respond}</dt>
                    <dd>{tr(f.respond, locale)}</dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{c.topics.biases}</h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {BIAS_CARDS.map((b) => (
            <li key={b.id}>
              <Card className="h-full p-5">
                <h3 className="font-semibold">{tr(b.name, locale)}</h3>
                <p className="mt-2 text-[15px]">{tr(b.definition, locale)}</p>
                <p className="mt-2 text-sm italic text-ink-muted">{tr(b.example, locale)}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{c.guide.counter}: </span>
                  {tr(b.counter, locale)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const progressPanel = (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-lg font-semibold">{fmt(c.progress.completed, { done: progress.completed, total: progress.total })}</p>
        {progress.accuracy !== null ? (
          <p className="mt-1 text-sm text-ink-muted">
            {c.progress.accuracy}: <span className="font-semibold text-ink">{progress.accuracy}%</span>
          </p>
        ) : null}
        <h3 className="mt-5 mb-2 font-semibold">{c.progress.byTopic}</h3>
        <ul className="space-y-2.5">
          {progress.byTopic.map((t) => (
            <li key={t.topic}>
              <div className="flex justify-between text-sm">
                <span>{c.topics[t.topic]}</span>
                <span className="tabular-nums text-ink-muted">
                  {t.done}/{t.total}
                </span>
              </div>
              <Meter value={(t.done / t.total) * 100} tone="success" className="mt-1" label={c.topics[t.topic]} />
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">{c.progress.fallacyMap}</h3>
        <p className="text-sm text-ink-muted">{c.progress.fallacyMapLead}</p>
        <ul className="mt-4 space-y-2.5">
          {progress.fallacies.map((f) => {
            const card = FALLACY_CARDS.find((x) => x.id === f.id);
            return (
              <li key={f.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span>{card ? tr(card.name, locale) : f.id}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{f.total ? `${f.correct}/${f.total}` : c.progress.notSeen}</span>
                </div>
                <Meter value={f.total ? (f.correct / f.total) * 100 : 0} tone={f.total && f.correct / f.total >= 0.75 ? "success" : "warn"} className="mt-1" label={card ? tr(card.name, locale) : f.id} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );

  return (
    <PageContainer wide>
      <LabHeader lab="critical" hubLabel={dict.labs.hub.title} labName={c.title} lead={c.lead} />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <TabPanels
        panels={[
          { id: "exercises", label: c.tabs.exercises, content: exercisesPanel },
          { id: "concepts", label: c.tabs.concepts, content: conceptsPanel },
          { id: "guide", label: c.tabs.guide, content: guidePanel },
          { id: "progress", label: c.tabs.progress, content: progressPanel },
        ]}
      />
    </PageContainer>
  );
}
