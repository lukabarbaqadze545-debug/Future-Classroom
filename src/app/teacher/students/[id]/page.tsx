import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { canViewStudent, getStudent, listClassesForStudent } from "@/lib/services/classes";
import { learningProfile } from "@/lib/services/learning-profile";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { LearningProfileView } from "@/components/profile/learning-profile-view";

export async function generateMetadata() {
  return pageTitle((p) => p.studentProfile);
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = getStudent(id);
  const user = (await getCurrentUser())!;
  if (!student || !canViewStudent(user, id)) notFound();
  const { dict, locale } = await getDictionary();
  const classes = listClassesForStudent(id);
  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={
          <Link href="/teacher/students" className="hover:underline">
            {dict.labs.classes.title}
          </Link>
        }
        title={student.displayName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {dict.labs.profile.lead}
            {classes.map((c) => (
              <Badge key={c.id}>{c.name}</Badge>
            ))}
          </span>
        }
      />
      <LearningProfileView profile={learningProfile(id, user, locale)} dict={dict} locale={locale} studentId={id} audience="staff" />
    </PageContainer>
  );
}
