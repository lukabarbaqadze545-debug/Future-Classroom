import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { findLesson } from "@/lib/courses/data";
import { studentLesson } from "@/lib/courses/service";
import { PageContainer, SiteHeader } from "@/components/layout/site-header";
import { LessonView } from "@/components/courses/lesson-view";
import { pick } from "@/components/courses/text";

type Props = { params: Promise<{ course: string; lesson: string }> };

export async function generateMetadata({ params }: Props) {
  const { lesson } = await params;
  const { locale, dict } = await getDictionary();
  const ref = findLesson(lesson);
  return { title: ref ? pick(ref.lesson.title, locale) : dict.courses.metaLesson };
}

export default async function LessonPage({ params }: Props) {
  const { course, lesson } = await params;
  const ref = findLesson(lesson);
  if (!ref || ref.course.id !== course) notFound();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <LessonView lesson={studentLesson(lesson)} courseHref={`/courses/${course}`} />
      </PageContainer>
    </>
  );
}
