import Link from "next/link";
import { ArrowRight, ClipboardList, Radio, WifiOff } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { LAB_IDS, LAB_ROUTES, type LabId } from "@/lib/labs/registry";
import { programmingProgress } from "@/lib/labs/programming/service";
import { criticalProgress } from "@/lib/labs/critical/service";
import { stemProgress } from "@/lib/labs/stem/service";
import { researchProgress } from "@/lib/labs/research/service";
import { libraryProgress } from "@/lib/labs/library/service";
import { listPortfolio } from "@/lib/services/portfolio";
import { assignmentStats } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { LAB_ACCENT, LabIcon } from "@/components/labs/lab-shell";
import { cn } from "@/components/ui/cn";

export async function generateMetadata() {
  return pageTitle((p) => p.labs);
}

export default async function LabsHub() {
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const h = dict.labs.hub;
  const p = dict.labs.profile;
  const staff = isStaff(user);

  const stats: Partial<Record<LabId, { label: string; value: string; ratio: number | null }>> = {};
  if (!staff) {
    const prog = programmingProgress(user.id);
    const ct = criticalProgress(user.id);
    const stem = stemProgress(user.id);
    const research = researchProgress(user.id);
    const lib = libraryProgress(user.id);
    stats.programming = { label: p.solvedProblems, value: `${prog.solved} / ${prog.total}`, ratio: prog.total ? prog.solved / prog.total : 0 };
    stats.critical = { label: p.exercises, value: `${ct.completed} / ${ct.total}`, ratio: ct.total ? ct.completed / ct.total : 0 };
    stats.stem = { label: p.experiments, value: `${stem.experiments + stem.simulations + stem.challenges}`, ratio: null };
    stats.research = { label: p.researchProjects, value: String(research.projects), ratio: null };
    stats.library = { label: p.booksFinished, value: String(lib.finished), ratio: null };
    stats.career = { label: p.portfolioItems, value: String(listPortfolio(user.id).length), ratio: null };
  }
  const work = staff ? null : assignmentStats(user.id);

  return (
    <PageContainer wide>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{h.title}</h1>
          <p className="mt-1.5 max-w-3xl text-[15px] text-ink-muted">{staff ? h.teacherLead : h.lead}</p>
        </div>
        {staff ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/teacher/assignments/new" variant="secondary">
              <ClipboardList aria-hidden className="size-4" />
              {dict.labs.assignments.new}
            </ButtonLink>
            <ButtonLink href="/teacher/sessions/labs" variant="secondary">
              <Radio aria-hidden className="size-4" />
              {dict.labs.common.useInClass}
            </ButtonLink>
          </div>
        ) : work && work.toDo ? (
          <ButtonLink href="/student/assignments">
            <ClipboardList aria-hidden className="size-4" />
            {dict.labs.assignments.title} · {work.toDo}
          </ButtonLink>
        ) : null}
      </div>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="lab-rooms">
        {LAB_IDS.map((id) => {
          const room = h.rooms[id];
          const stat = stats[id];
          return (
            <li key={id}>
              <Link href={LAB_ROUTES[id]} className={cn("group flex h-full flex-col rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5", LAB_ACCENT[id].border)}>
                <div className="flex items-start gap-4">
                  <LabIcon lab={id} size="lg" />
                  <div className="min-w-0">
                    <h2 className={cn("text-lg font-semibold", LAB_ACCENT[id].text)}>{room.name}</h2>
                    <p className="mt-1 text-[15px] text-ink-muted">{room.text}</p>
                  </div>
                </div>
                {stat ? (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-muted">{stat.label}</span>
                      <span className="font-semibold tabular-nums">{stat.value}</span>
                    </div>
                    {stat.ratio !== null ? <Meter value={stat.ratio * 100} tone="success" className="mt-1.5" label={stat.label} /> : null}
                  </div>
                ) : null}
                <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold", LAB_ACCENT[id].text)}>
                  {h.open}
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Card className="mt-8 flex items-start gap-3 p-4 text-sm text-ink-muted">
        <WifiOff aria-hidden className="mt-0.5 size-4.5 shrink-0" />
        {dict.labs.common.offlineSafe}
        {staff ? null : <span className="sr-only">{fmt(dict.labs.assignments.progressCount, { done: work?.done ?? 0, total: work?.total ?? 0 })}</span>}
      </Card>
    </PageContainer>
  );
}
