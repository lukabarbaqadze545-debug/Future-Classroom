import { notFound } from "next/navigation";
import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getTeacherSessionView } from "@/lib/services/sessions";
import { ApiError } from "@/lib/http/errors";
import { PresentSession } from "@/components/present/present-session";
import { pageTitle } from "@/lib/i18n/server";

export async function generateMetadata() {
  return pageTitle((p) => p.presentation);
}

export default async function PresentSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser(STAFF_ROLES, "/teacher");
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
