import { redirect } from "next/navigation";
import { getParticipant } from "@/lib/auth/participant";
import { getCurrentUser } from "@/lib/auth/session";
import { getSession, getStudentSessionView, getUnlockedHints } from "@/lib/services/sessions";
import { StudentSession } from "@/components/session/student-session";
import { pageTitle } from "@/lib/i18n/server";

export async function generateMetadata() {
  return pageTitle((p) => p.classSession);
}

export default async function StudentSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) redirect("/join");
  const participant = await getParticipant(id);
  if (!participant) redirect(session.status === "ended" ? "/join" : `/join?code=${encodeURIComponent(session.joinCode)}`);
  const user = await getCurrentUser();
  const view = getStudentSessionView(id, participant);
  const unlockedHints = view.current ? await getUnlockedHints(id, participant, view.current.id) : [];
  return <StudentSession initial={{ ...view, unlockedHints }} signedIn={user?.role === "student"} />;
}
