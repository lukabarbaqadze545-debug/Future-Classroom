import Link from "next/link";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { COMPONENTS, ELECTRONICS_CHALLENGES, ELECTRONICS_TOPICS } from "@/lib/labs/stem/electronics";
import { EXPERIMENTS, findExperiment } from "@/lib/labs/stem/experiments";
import { PROJECT_TEMPLATES } from "@/lib/labs/stem/projects";
import { ROBOTICS_CHALLENGES, ROBOTICS_CONCEPTS, ROBOTICS_PROJECTS } from "@/lib/labs/stem/robotics";
import { findChallengeSet, listProjects, listRecords } from "@/lib/labs/stem/service";
import { findSimulation, SIMULATIONS } from "@/lib/labs/stem/simulations";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { TabPanels } from "@/components/labs/shared/tab-panels";
import { ModeLegend, StemCard } from "@/components/labs/stem/stem-cards";
import { SchematicSymbol } from "@/components/labs/stem/schematic-symbol";
import { StartProjectButton } from "@/components/labs/stem/project-workspace";

export const metadata = { title: "STEM Lab" };

export default async function StemLabPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const staff = isStaff(user);
  const records = listRecords(user.id);
  const recordOf = (kind: string, id: string) => records.find((r) => r.itemKind === kind && r.itemId === id);
  const projects = staff ? [] : listProjects(user.id);
  const assignments = staff
    ? []
    : [...openAssignmentsFor(user.id, "experiment"), ...openAssignmentsFor(user.id, "simulation"), ...openAssignmentsFor(user.id, "stem_challenge"), ...openAssignmentsFor(user.id, "stem_project")].filter(
        (a) => !["completed", "submitted"].includes(a.recipient.status),
      );

  const statusBadge = (kind: "experiment" | "simulation" | "challenge", id: string) => {
    const r = recordOf(kind, id);
    if (!r) return null;
    if (r.score !== null && r.maxScore) return <Badge tone={r.score === r.maxScore ? "success" : "warn"}>{fmt(s.bestScore, { score: r.score, max: r.maxScore })}</Badge>;
    return <Badge tone={r.status === "submitted" ? "success" : "neutral"}>{s.recordStatus[r.status]}</Badge>;
  };

  const experiments = (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="experiment-list">
      {EXPERIMENTS.map((e) => (
        <li key={e.id}>
          <StemCard
            href={`/labs/stem/experiments/${e.id}`}
            mode="experiment"
            title={tr(e.title, locale)}
            text={tr(e.summary, locale)}
            meta={`${s.subjects[e.subject]} · ${fmt(s.grades, { from: e.grades[0], to: e.grades[1] })} · ${fmt(s.minutes, { n: e.minutes })}`}
            difficulty={e.difficulty}
            status={statusBadge("experiment", e.id)}
            dict={dict}
          />
        </li>
      ))}
    </ul>
  );

  const simulations = (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {SIMULATIONS.filter((x) => x.area === "simulation").map((x) => (
        <li key={x.id}>
          <StemCard
            href={`/labs/stem/simulations/${x.id}`}
            mode="simulation"
            title={tr(x.title, locale)}
            text={tr(x.summary, locale)}
            meta={`${s.subjects[x.subject]} · ${fmt(s.grades, { from: x.grades[0], to: x.grades[1] })}`}
            difficulty={x.difficulty}
            status={statusBadge("simulation", x.id)}
            dict={dict}
          />
        </li>
      ))}
    </ul>
  );

  const electronics = (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.topics}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ELECTRONICS_TOPICS.map((t) => (
            <Card key={t.id} className="p-5">
              <h3 className="font-semibold">{tr(t.title, locale)}</h3>
              <p className="mt-1.5 text-[15px] text-ink-muted">{tr(t.text, locale)}</p>
              {t.formula ? <p className="mt-2 font-mono text-lg font-semibold text-lab-stem">{t.formula}</p> : null}
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.components}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COMPONENTS.map((c) => (
            <li key={c.id}>
              <Card className="flex h-full flex-col items-start gap-2 p-4">
                <SchematicSymbol id={c.id} label={tr(c.name, locale)} />
                <h3 className="font-semibold">{tr(c.name, locale)}</h3>
                <p className="text-sm text-ink-muted">{tr(c.text, locale)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.challenges}</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SIMULATIONS.filter((x) => x.area === "electronics").map((x) => (
            <li key={x.id}>
              <StemCard href={`/labs/stem/simulations/${x.id}`} mode="simulation" title={tr(x.title, locale)} text={tr(x.summary, locale)} meta={s.subjects[x.subject]} difficulty={x.difficulty} status={statusBadge("simulation", x.id)} dict={dict} />
            </li>
          ))}
          {ELECTRONICS_CHALLENGES.map((c) => (
            <li key={c.id}>
              <StemCard href={`/labs/stem/challenges/${c.id}`} mode="simulation" title={tr(c.title, locale)} text={tr(c.summary, locale)} meta={s.challenge} difficulty={c.difficulty} status={statusBadge("challenge", c.id)} dict={dict} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const robotics = (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.concepts}</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["sensors", "actuators", "control"] as const).map((group) => (
            <Card key={group} className="p-5">
              <h3 className="font-semibold text-lab-stem">{s.conceptGroups[group]}</h3>
              <dl className="mt-2 space-y-2.5">
                {ROBOTICS_CONCEPTS.filter((c) => c.group === group).map((c) => (
                  <div key={c.id}>
                    <dt className="font-medium">{tr(c.name, locale)}</dt>
                    <dd className="text-sm text-ink-muted">{tr(c.text, locale)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.challenges}</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SIMULATIONS.filter((x) => x.area === "robotics").map((x) => (
            <li key={x.id}>
              <StemCard href={`/labs/stem/simulations/${x.id}`} mode="simulation" title={tr(x.title, locale)} text={tr(x.summary, locale)} meta={s.subjects[x.subject]} difficulty={x.difficulty} status={statusBadge("simulation", x.id)} dict={dict} />
            </li>
          ))}
          {ROBOTICS_CHALLENGES.map((c) => (
            <li key={c.id}>
              <StemCard href={`/labs/stem/challenges/${c.id}`} mode="simulation" title={tr(c.title, locale)} text={tr(c.summary, locale)} meta={s.challenge} difficulty={c.difficulty} status={statusBadge("challenge", c.id)} dict={dict} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">{s.projects}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {ROBOTICS_PROJECTS.map((p) => (
            <li key={p.id}>
              <StemCard href={`/labs/stem/robotics/${p.id}`} mode="physical" title={tr(p.title, locale)} text={tr(p.goal, locale)} meta={s.subjects.computing} difficulty={p.difficulty} dict={dict} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  const projectsPanel = (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {PROJECT_TEMPLATES.map((t) => (
        <li key={t.id}>
          <Card className="flex h-full flex-col p-5">
            <ModeBadge mode={t.mode} label={s.modes[t.mode]} />
            <h3 className="mt-2.5 font-semibold">{tr(t.title, locale)}</h3>
            <p className="mt-1 text-sm text-ink-muted">{tr(t.brief, locale)}</p>
            <p className="mt-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{s.criteria}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {t.criteria.map((c, i) => (
                <li key={i}>{tr(c, locale)}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{s.constraints}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {t.constraints.map((c, i) => (
                <li key={i}>{tr(c, locale)}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-medium">{s.safety}: </span>
              {t.safety.map((x) => tr(x, locale)).join(" ")}
            </p>
            <div className="mt-auto pt-4">{staff ? null : <StartProjectButton templateId={t.id} title={tr(t.title, locale)} label={s.startProject} />}</div>
          </Card>
        </li>
      ))}
    </ul>
  );

  const mine = (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="border-b border-line px-5 py-4 font-semibold">{s.myProjects}</h2>
        {projects.length ? (
          <ul className="divide-y divide-line">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/labs/stem/projects/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.title}</span>
                    <span className="text-sm text-ink-muted">{relativeTime(dict, p.updatedAt)}</span>
                  </span>
                  <Badge tone={p.status === "submitted" ? "success" : "neutral"}>{s.recordStatus[p.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{s.noProjects}</p>
        )}
      </Card>
      <Card>
        <h2 className="border-b border-line px-5 py-4 font-semibold">{s.myRecords}</h2>
        {records.length ? (
          <ul className="divide-y divide-line">
            {records.map((r) => {
              const title = r.itemKind === "experiment" ? findExperiment(r.itemId)?.title : r.itemKind === "simulation" ? findSimulation(r.itemId)?.title : findChallengeSet(r.itemId)?.title;
              const href = r.itemKind === "experiment" ? `/labs/stem/experiments/${r.itemId}` : r.itemKind === "simulation" ? `/labs/stem/simulations/${r.itemId}` : `/labs/stem/challenges/${r.itemId}`;
              return (
                <li key={r.id}>
                  <Link href={href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{title ? tr(title, locale) : r.itemId}</span>
                      <span className="text-sm text-ink-muted">{relativeTime(dict, r.updatedAt)}</span>
                    </span>
                    {r.score !== null && r.maxScore ? <Badge tone="success">{fmt(s.bestScore, { score: r.score, max: r.maxScore })}</Badge> : <Badge>{s.recordStatus[r.status]}</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{s.noRecords}</p>
        )}
      </Card>
    </div>
  );

  return (
    <PageContainer wide>
      <LabHeader lab="stem" hubLabel={dict.labs.hub.title} labName={s.title} lead={s.lead} />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <ModeLegend dict={dict} />
      <TabPanels
        panels={[
          { id: "experiments", label: s.tabs.experiments, content: experiments },
          { id: "simulations", label: s.tabs.simulations, content: simulations },
          { id: "electronics", label: s.tabs.electronics, content: electronics },
          { id: "robotics", label: s.tabs.robotics, content: robotics },
          { id: "projects", label: s.tabs.projects, content: projectsPanel },
          ...(staff ? [] : [{ id: "mine" as const, label: s.tabs.mine, content: mine }]),
        ]}
      />
    </PageContainer>
  );
}
