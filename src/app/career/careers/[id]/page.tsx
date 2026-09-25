import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { tr } from "@/lib/labs/localized";
import { findCareer, FIELDS } from "@/lib/labs/career/careers";
import { SKILLS } from "@/lib/labs/career/skills";
import { isBookmarked } from "@/lib/services/bookmarks";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { LabHeader } from "@/components/labs/lab-shell";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const career = findCareer((await params).id);
  return { title: career ? career.title.en : "Career" };
}

export default async function CareerDetailPage({ params }: Props) {
  const { id } = await params;
  const career = findCareer(id);
  if (!career) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.career;
  return (
    <PageContainer>
      <LabHeader
        lab="career"
        hubLabel={dict.labs.hub.title}
        labName={c.title}
        title={tr(career.title, locale)}
        lead={tr(career.summary, locale)}
        actions={<BookmarkButton kind="career" refId={id} initial={isBookmarked(user.id, "career", id)} size="md" />}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">{c.careers.dayToDay}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
            {career.dayToDay.map((x, i) => (
              <li key={i}>{tr(x, locale)}</li>
            ))}
          </ul>
          <h2 className="mt-5 font-semibold">{c.careers.skills}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {career.skills.map((s) => (
              <Badge key={s} tone="brand">
                {tr(SKILLS.find((k) => k.id === s)!.name, locale)}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">{c.careers.pathway}</h2>
          <p className="mt-2 text-[15px]">{tr(career.pathway, locale)}</p>
          <h2 className="mt-5 font-semibold">{c.careers.fields}</h2>
          <ul className="mt-2 space-y-1.5">
            {career.fields.map((f) => (
              <li key={f}>
                <Link href={`/career?field=${f}#universities`} className="text-brand hover:underline">
                  {tr(FIELDS.find((x) => x.id === f)!.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-5 font-semibold">{c.careers.tryAtSchool}</h2>
          <ul className="mt-2 space-y-1.5">
            {career.tryAtSchool.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="text-brand hover:underline">
                  {tr(t.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Notice tone="info" className="mt-5">
        {c.careers.noNumbers}
      </Notice>
    </PageContainer>
  );
}
