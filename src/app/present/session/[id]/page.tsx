import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTeacherSessionView } from "@/lib/services/sessions";
import { ApiError } from "@/lib/http/errors";
import { PresentSession } from "@/components/present/present-session";

export const metadata = { title: "Presentation" };

export default async function PresentSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  let view;
  try {
    view = getTeacherSessionView(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  return <PresentSession initial={view} />;
}
