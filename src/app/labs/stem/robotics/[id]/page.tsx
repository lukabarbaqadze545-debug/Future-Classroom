import { notFound } from "next/navigation";
import { Cpu } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { tr } from "@/lib/labs/localized";
import { findRoboticsProject } from "@/lib/labs/stem/robotics";
import { PageContainer } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { LabHeader, ModeBadge } from "@/components/labs/lab-shell";
import { CopyableCode } from "@/components/labs/stem/code-copy";
import { StartProjectButton } from "@/components/labs/stem/project-workspace";
import { getCurrentUser, isStaff } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const p = findRoboticsProject((await params).id);
  return { title: p ? p.title.en : "STEM Lab" };
}

export default async function RoboticsProjectPage({ params }: Props) {
  const { id } = await params;
  const project = findRoboticsProject(id);
  if (!project) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.labs.stem;
  const section = (title: string, items: typeof project.parts, ordered = false) => {
    const Tag = ordered ? "ol" : "ul";
    return (
      <Card className="p-5">
        <h2 className="font-semibold">{title}</h2>
        <Tag className={`mt-2 space-y-1.5 pl-5 text-[15px] ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((x, i) => (
            <li key={i}>{tr(x, locale)}</li>
          ))}
        </Tag>
      </Card>
    );
  };
  return (
    <PageContainer>
      <LabHeader
        lab="stem"
        hubLabel={dict.labs.hub.title}
        labName={s.title}
        title={tr(project.title, locale)}
        lead={
          <span className="block space-y-2">
            <ModeBadge mode="physical" label={s.modes.physical} />
            <span className="block">{tr(project.goal, locale)}</span>
          </span>
        }
        actions={isStaff(user) ? null : <StartProjectButton templateId="free" title={tr(project.title, locale)} label={s.startProject} />}
      />
      <Notice tone="warn" title={s.modes.physical} className="mb-6">
        {s.kitNote}
      </Notice>
      <div className="grid gap-5 lg:grid-cols-2">
        {section(s.parts, project.parts)}
        {section(s.wiring, project.wiring)}
      </div>
      <Card className="mt-5 p-5">
        <CopyableCode code={project.code} label={`${s.code} (Arduino C++)`} />
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {section(s.steps, project.steps, true)}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Cpu aria-hidden className="size-4.5 text-lab-stem" />
            {s.extensions}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
            {project.extensions.map((x, i) => (
              <li key={i}>{tr(x, locale)}</li>
            ))}
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
