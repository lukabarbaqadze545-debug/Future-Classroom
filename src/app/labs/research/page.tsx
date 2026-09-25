import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { RESEARCH_STEPS } from "@/lib/labs/research/model";
import { getResearchBundle, listAllStudentResearch, listResearchProjects, researchStepStatus } from "@/lib/labs/research/service";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { NewResearchForm } from "@/components/labs/research/new-research-form";

export const metadata = { title: "Research Lab" };

export default async function ResearchLabPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const r = dict.labs.research;
  const staff = isStaff(user);
  const projects = staff ? listAllStudentResearch() : listResearchProjects(user.id);
  const rows = projects.map((p) => {
    const bundle = getResearchBundle(p.id, user);
    const steps = researchStepStatus(bundle);
    return { project: p, done: Object.values(steps).filter(Boolean).length, sources: bundle.sources.length };
  });
  const assignments = staff ? [] : openAssignmentsFor(user.id, "research").filter((a) => !["submitted", "completed"].includes(a.recipient.status));

  return (
    <PageContainer wide>
      <LabHeader lab="research" hubLabel={dict.labs.hub.title} labName={r.title} lead={r.lead} />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <p className="mb-6 flex items-start gap-2 rounded-2xl border border-lab-research/25 bg-lab-research/5 px-4 py-3 text-[15px]">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-lab-research" />
        {r.noInvent}
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title={staff ? r.studentProjects : r.myProjects} />
          {rows.length ? (
            <ul className="divide-y divide-line" data-testid="research-list">
              {rows.map(({ project, done, sources }) => (
                <li key={project.id}>
                  <Link href={`/labs/research/${project.id}`} className="block px-5 py-4 hover:bg-muted/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{project.title}</p>
                        <p className="text-sm text-ink-muted">
                          {staff ? `${project.userName} · ` : ""}
                          {project.subject ? `${project.subject} · ` : ""}
                          {fmtCount(r.sourcesCount, sources)} · {relativeTime(dict, project.updatedAt)}
                        </p>
                      </div>
                      <Badge tone={project.status === "submitted" ? "success" : "neutral"}>{dict.labs.stem.recordStatus[project.status]}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Meter value={(done / RESEARCH_STEPS.length) * 100} tone="success" className="max-w-xs" label={fmt(r.stepsDone, { n: done, m: RESEARCH_STEPS.length })} />
                      <span className="text-xs text-ink-muted tabular-nums">{fmt(r.stepsDone, { n: done, m: RESEARCH_STEPS.length })}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">{staff ? r.noStudentProjects : r.noProjects}</p>
          )}
        </Card>
        <div className="space-y-6">
          {!staff ? (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-semibold">{r.newProject}</h2>
              <NewResearchForm />
            </Card>
          ) : null}
          <Card className="p-5">
            <h2 className="text-lg font-semibold">{r.workflowTitle}</h2>
            <ol className="mt-3 space-y-2.5">
              {RESEARCH_STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-lab-research/10 text-sm font-semibold text-lab-research">{i + 1}</span>
                  <span>
                    <span className="font-medium">{r.steps[s]}</span>
                    <span className="block text-sm text-ink-muted">{r.stepHelp[s]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
