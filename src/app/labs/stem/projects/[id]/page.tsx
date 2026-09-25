import { notFound } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { tr } from "@/lib/labs/localized";
import { findTemplate } from "@/lib/labs/stem/projects";
import { getProjectFor } from "@/lib/labs/stem/service";
import { ApiError } from "@/lib/http/errors";
import { listAttachments } from "@/lib/services/attachments";
import { listFeedback } from "@/lib/services/feedback";
import { findPortfolioItemBySource } from "@/lib/services/portfolio";
import { PageContainer } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { AttachmentPanel } from "@/components/labs/shared/attachment-panel";
import { FeedbackPanel } from "@/components/labs/shared/feedback-panel";
import { PortfolioButton } from "@/components/labs/shared/portfolio-button";
import { ProjectWorkspace } from "@/components/labs/stem/project-workspace";

export const metadata = { title: "Engineering project" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let project;
  try {
    project = getProjectFor(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const template = project.templateId ? findTemplate(project.templateId) : null;
  const owner = project.userId === user.id;
  return (
    <PageContainer>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={project.title}
        lead={
          <span className="block space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <ModeBadge mode={project.kind} label={s.modes[project.kind]} />
              {!owner ? <span>{project.userName}</span> : null}
            </span>
            {template ? <span className="block">{tr(template.brief, locale)}</span> : null}
          </span>
        }
        actions={owner && project.status === "submitted" ? <PortfolioButton kind="stem_project" id={id} initial={findPortfolioItemBySource(user.id, "stem_project", id) !== null} /> : null}
      />
      {template ? (
        <Card className="mb-5 grid gap-4 p-5 md:grid-cols-3">
          {(
            [
              [s.constraints, template.constraints],
              [s.criteria, template.criteria],
              [s.safety, template.safety],
            ] as const
          ).map(([title, items]) => (
            <div key={title}>
              <h2 className="text-sm font-semibold tracking-wide text-ink-subtle uppercase">{title}</h2>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                {items.map((x, i) => (
                  <li key={i}>{tr(x, locale)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      ) : null}
      <ProjectWorkspace id={id} initialTitle={project.title} initialData={project.data} initialStatus={project.status} initialUpdatedAt={project.updatedAt} readOnly={!owner} />
      <Card className="mt-5 p-5">
        <AttachmentPanel targetKind="stem_project" targetId={id} initial={listAttachments("stem_project", id)} canEdit={owner} title={s.photos} />
      </Card>
      <Card className="mt-5 p-5">
        <FeedbackPanel targetKind="stem_project" targetId={id} initial={listFeedback("stem_project", id)} canWrite={isStaff(user)} />
      </Card>
    </PageContainer>
  );
}
