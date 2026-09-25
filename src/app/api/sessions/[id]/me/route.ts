import { handler, json } from "@/lib/http/api";
import { requireParticipant } from "@/lib/auth/participant";
import { getStudentSessionView, getUnlockedHints } from "@/lib/services/sessions";

type Ctx = { params: Promise<{ id: string }> };

/** The student's view of the session, including hints already unlocked for the current activity. */
export const GET = handler(async (_req, { params }: Ctx) => {
  const { id } = await params;
  const participant = await requireParticipant(id);
  const view = getStudentSessionView(id, participant);
  const hints = view.current ? await getUnlockedHints(id, participant, view.current.id) : [];
  return json({ ...view, unlockedHints: hints });
});
