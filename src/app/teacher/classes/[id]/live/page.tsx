import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { ApiError } from "@/lib/http/errors";
import { classroomControlAvailable, classroomState } from "@/lib/services/classroom";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";
import { LiveClassroom } from "@/components/classroom/live-classroom";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.classroom.title };
}

/** The live classroom of one class: what every student is doing, and controls for the teacher. */
export default async function LiveClassroomPage({ params }: Props) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const c = dict.classroom;
  if (!classroomControlAvailable()) {
    return (
      <PageContainer wide>
        <PageHeader eyebrow={<Link href={`/teacher/classes/${id}`} className="hover:underline">{c.back}</Link>} title={c.title} description={c.lead} />
        <div className="max-w-3xl" data-testid="live-unavailable">
          <Notice tone="info" title={c.unavailable.title}>
            {c.unavailable.text}
          </Notice>
        </div>
      </PageContainer>
    );
  }
  let state;
  try {
    state = classroomState(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={
          <Link href={`/teacher/classes/${id}`} className="hover:underline">
            {c.back} · {state.class.name}
          </Link>
        }
        title={`${c.title} — ${state.class.name}`}
        description={c.lead}
      />
      <LiveClassroom classId={id} initial={state} />
    </PageContainer>
  );
}
