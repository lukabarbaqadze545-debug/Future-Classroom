import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { studentCourse } from "@/lib/courses/service";
import { COURSES } from "@/lib/courses/data";
import { PageContainer, SiteHeader } from "@/components/layout/site-header";
import { CourseMap } from "@/components/courses/course-map";
import { pick } from "@/components/courses/text";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props) {
  const { course } = await params;
  const { locale, dict } = await getDictionary();
  const c = COURSES[course];
  return { title: c ? pick(c.title, locale) : dict.courses.metaCourse };
}

export default async function CoursePage({ params }: Props) {
  const { course } = await params;
  if (!COURSES[course]) notFound();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <CourseMap course={studentCourse(course)} />
      </PageContainer>
    </>
  );
}
