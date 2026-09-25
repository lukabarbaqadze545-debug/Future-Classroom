import { notFound } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { ApiError } from "@/lib/http/errors";
import { getResearchBundle } from "@/lib/labs/research/service";
import { listAttachments } from "@/lib/services/attachments";
import { listFeedback } from "@/lib/services/feedback";
import { findPortfolioItemBySource } from "@/lib/services/portfolio";
import { libraryOptionsForResearch } from "@/lib/labs/library/service";
import { PageContainer } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { AttachmentPanel } from "@/components/labs/shared/attachment-panel";
import { FeedbackPanel } from "@/components/labs/shared/feedback-panel";
import { PortfolioButton } from "@/components/labs/shared/portfolio-button";
import { ResearchWorkspace } from "@/components/labs/research/research-workspace";

export async function generateMetadata() {
  return pageTitle((p) => p.researchProject);
}

export default async function ResearchProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let bundle;
  try {
    bundle = getResearchBundle(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { dict } = await getDictionary();
  const r = dict.labs.research;
  const { project } = bundle;
  const owner = project.userId === user.id;
  return (
    <PageContainer wide>
      <LabHeader
        lab="research"
        hubLabel={dict.labs.hub.title}
        labName={r.title}
        title={project.title}
        lead={owner ? project.subject : `${project.userName}${project.subject ? ` · ${project.subject}` : ""}`}
        actions={owner && project.status === "submitted" ? <PortfolioButton kind="research" id={id} initial={findPortfolioItemBySource(user.id, "research", id) !== null} /> : null}
      />
      <ResearchWorkspace
        id={id}
        initial={{ title: project.title, subject: project.subject, data: project.data, status: project.status, updatedAt: project.updatedAt }}
        initialSources={bundle.sources}
        initialNotes={bundle.notes}
        initialDatasets={bundle.datasets}
        library={owner ? libraryOptionsForResearch() : []}
        readOnly={!owner}
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <AttachmentPanel targetKind="research" targetId={id} initial={listAttachments("research", id)} canEdit={owner} />
        </Card>
        <Card className="p-5">
          <FeedbackPanel targetKind="research" targetId={id} initial={listFeedback("research", id)} canWrite={isStaff(user)} />
        </Card>
      </div>
    </PageContainer>
  );
}
