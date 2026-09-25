import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { findChallengeSet, getRecord, itemClassRecords, toStudentItems } from "@/lib/labs/stem/service";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { ItemChallenge } from "@/components/labs/stem/item-challenge";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, dict } = await getDictionary();
  const set = findChallengeSet((await params).id);
  return { title: set ? tr(set.title, locale) : dict.labs.hub.rooms.stem.name };
}

export default async function ChallengePage({ params }: Props) {
  const { id } = await params;
  const set = findChallengeSet(id);
  if (!set) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const staff = isStaff(user);
  const record = getRecord(user.id, "challenge", id);
  const classRecords = staff ? itemClassRecords("challenge", id) : [];
  return (
    <PageContainer>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={tr(set.title, locale)}
        lead={
          <span className="block space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <ModeBadge mode="simulation" label={s.modes.simulation} />
              <span>{set.area === "electronics" ? s.tabs.electronics : s.tabs.robotics}</span>
            </span>
            <span className="block">{tr(set.summary, locale)}</span>
          </span>
        }
        actions={
          staff ? (
            <ButtonLink href={`/teacher/assignments/new?kind=stem_challenge&ref=${id}`} variant="secondary">
              <ClipboardList aria-hidden className="size-4" />
              {dict.labs.common.assign}
            </ButtonLink>
          ) : null
        }
      />
      {staff ? null : <AssignmentBanner assignments={openAssignmentsFor(user.id, "stem_challenge", id)} dict={dict} locale={locale} />}
      <ItemChallenge kind="challenge" id={id} items={toStudentItems(set.items)} initialBest={record && record.score !== null && record.maxScore !== null ? { score: record.score, max: record.maxScore } : null} title={tr(set.title, locale)} />
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
