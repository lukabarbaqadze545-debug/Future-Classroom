import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { findSimulation } from "@/lib/labs/stem/simulations";
import { getRecord, itemClassRecords, toStudentItems } from "@/lib/labs/stem/service";
import { isBookmarked } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";
import { SimulationView } from "@/components/labs/stem/simulation-view";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, dict } = await getDictionary();
  const sim = findSimulation((await params).id);
  return { title: sim ? tr(sim.title, locale) : dict.labs.hub.rooms.stem.name };
}

export default async function SimulationPage({ params }: Props) {
  const { id } = await params;
  const sim = findSimulation(id);
  if (!sim) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const staff = isStaff(user);
  const record = getRecord(user.id, "simulation", id);
  const classRecords = staff ? itemClassRecords("simulation", id) : [];

  return (
    <PageContainer wide>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={tr(sim.title, locale)}
        lead={
          <span className="block space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <ModeBadge mode="simulation" label={s.modes.simulation} />
              <span>
                {s.subjects[sim.subject]} · {fmt(s.grades, { from: sim.grades[0], to: sim.grades[1] })}
              </span>
            </span>
            <span className="block">{tr(sim.summary, locale)}</span>
          </span>
        }
        actions={
          <>
            <BookmarkButton kind="simulation" refId={id} initial={isBookmarked(user.id, "simulation", id)} size="md" />
            {staff ? (
              <ButtonLink href={`/teacher/assignments/new?kind=simulation&ref=${id}`} variant="secondary">
                <ClipboardList aria-hidden className="size-4" />
                {dict.labs.common.assign}
              </ButtonLink>
            ) : null}
          </>
        }
      />
      {staff ? null : <AssignmentBanner assignments={openAssignmentsFor(user.id, "simulation", id)} dict={dict} locale={locale} />}
      <Card className="mb-6 p-5">
        <h2 className="font-semibold">{s.explore}</h2>
        <ul className="mt-2 grid list-disc gap-x-8 gap-y-1 pl-5 text-[15px] md:grid-cols-2">
          {sim.explore.map((x, i) => (
            <li key={i}>{tr(x, locale)}</li>
          ))}
        </ul>
      </Card>
      <SimulationView
        id={sim.id}
        items={toStudentItems(sim.items)}
        best={record && record.score !== null && record.maxScore !== null ? { score: record.score, max: record.maxScore } : null}
        challengeTitle={s.challenge}
      />
      {staff ? (
        <Card className="mt-6">
          <CardHeader title={s.studentsWorked} />
          {classRecords.length ? (
            <ul className="divide-y divide-line">
              {classRecords.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link href={`/labs/stem/records/${r.id}`} className="font-medium hover:underline">
                    {r.userName}
                  </Link>
                  <span className="flex items-center gap-2 text-sm text-ink-muted">
                    {relativeTime(dict, r.updatedAt)}
                    <Badge tone={r.score === r.maxScore ? "success" : "warn"}>{fmt(s.bestScore, { score: r.score ?? 0, max: r.maxScore ?? 0 })}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-muted">{s.noStudentWork}</p>
          )}
        </Card>
      ) : null}
    </PageContainer>
  );
}
