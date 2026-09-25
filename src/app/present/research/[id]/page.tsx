import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/http/errors";
import { getResearchBundle } from "@/lib/labs/research/service";
import { ResearchPresentation } from "@/components/labs/research/research-presentation";

export const metadata = { title: "Research presentation" };

/** Students present their own research; teachers can present any student's. */
export default async function PresentResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  let bundle;
  try {
    bundle = getResearchBundle(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const { project } = bundle;
  return (
    <ResearchPresentation
      id={id}
      title={project.title}
      author={project.userName}
      subject={project.subject}
      data={project.data}
      sources={bundle.sources}
      notes={bundle.notes}
      datasets={bundle.datasets}
    />
  );
}
