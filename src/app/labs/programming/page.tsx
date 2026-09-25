import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { tr } from "@/lib/labs/localized";
import { getProblem, listProblems, problemStatuses, programmingProgress } from "@/lib/labs/programming/service";
import { listBookmarks } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { ProblemBrowser, type ProblemSummary } from "@/components/labs/programming/problem-browser";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.labs.hub.rooms.programming.name };
}

export default async function ProgrammingLabPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const p = dict.labs.programming;
  const statuses = problemStatuses(user.id);
  const bookmarks = new Set(listBookmarks(user.id, "programming").map((b) => b.refId));
  const progress = programmingProgress(user.id);
  const staff = isStaff(user);
  const problems: ProblemSummary[] = listProblems().map((x) => ({
    id: x.id,
    kind: x.kind,
    level: x.level,
    topic: x.topic,
    difficulty: x.difficulty,
    title: x.title,
    authorName: x.authorName ?? null,
    status: statuses.get(x.id) ?? null,
    bookmarked: bookmarks.has(x.id),
  }));
  const recommended = !staff && progress.recommendedId ? getProblem(progress.recommendedId) : null;
  const assignments = staff ? [] : openAssignmentsFor(user.id, "programming").filter((a) => a.recipient.status !== "completed");

  return (
    <PageContainer wide>
      <LabHeader
        lab="programming"
        hubLabel={dict.labs.hub.title}
        labName={p.title}
        lead={p.lead}
        actions={
          staff ? (
            <ButtonLink href="/labs/programming/new">
              <Plus aria-hidden className="size-4" />
              {p.newProblem}
            </ButtonLink>
          ) : null
        }
      />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      {recommended ? (
        <Link
          href={`/labs/programming/${recommended.id}`}
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-lab-programming/30 bg-lab-programming/5 px-5 py-4 transition-colors hover:bg-lab-programming/10"
        >
          <span>
            <span className="block text-xs font-semibold tracking-wide text-lab-programming uppercase">{p.recommended}</span>
            <span className="mt-0.5 block font-semibold">{tr(recommended.title, locale)}</span>
            <span className="block text-sm text-ink-muted">
              {p.levels[recommended.level].name} · {p.topics[recommended.topic]}
              {recommended.authorName ? ` · ${recommended.authorName}` : ""}
            </span>
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0 text-lab-programming" />
        </Link>
      ) : null}
      <ProblemBrowser problems={problems} progress={progress.byLevel} />
      <p className="mt-8 flex items-start gap-2 text-sm text-ink-muted">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
        {p.safety}
      </p>
    </PageContainer>
  );
}
