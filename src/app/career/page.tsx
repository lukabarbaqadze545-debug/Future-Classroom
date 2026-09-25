import Link from "next/link";
import { now } from "@/lib/db";
import { ArrowRight, Printer } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmtCount } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { CAREERS, FIELDS, FIELD_IDS, type FieldId } from "@/lib/labs/career/careers";
import { SKILLS } from "@/lib/labs/career/skills";
import { listGoals, listOwnCards, listSharedCards, skillProfile } from "@/lib/labs/career/service";
import { listPortfolio } from "@/lib/services/portfolio";
import { listBookmarks } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { TabPanels } from "@/components/labs/shared/tab-panels";
import { CareerExplorer } from "@/components/labs/career/career-explorer";
import { UniversityCards } from "@/components/labs/career/university-cards";
import { SkillsSelf } from "@/components/labs/career/skills-self";
import { Goals } from "@/components/labs/career/goals";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.labs.hub.rooms.career.name };
}

export default async function CareerPage({ searchParams }: { searchParams: Promise<{ field?: string }> }) {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.career;
  const staff = isStaff(user);
  const { field } = await searchParams;
  const initialField = field && (FIELD_IDS as readonly string[]).includes(field) ? (field as FieldId) : null;
  const portfolio = staff ? [] : listPortfolio(user.id);
  const assignments = staff ? [] : openAssignmentsFor(user.id, "portfolio").filter((a) => !["submitted", "completed"].includes(a.recipient.status));

  const fieldsPanel = (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {FIELDS.map((f) => (
        <li key={f.id}>
          <Card className="flex h-full flex-col p-5">
            <h3 className="text-lg font-semibold text-lab-career">{tr(f.name, locale)}</h3>
            <p className="mt-1 text-[15px]">{tr(f.description, locale)}</p>
            <p className="mt-3 text-sm">
              <span className="font-medium">{c.fields.schoolSubjects}: </span>
              {tr(f.schoolSubjects, locale)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.skills.map((s) => (
                <Badge key={s}>{tr(SKILLS.find((k) => k.id === s)!.name, locale)}</Badge>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{c.fields.ask}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {f.askWhenResearching.map((q, i) => (
                <li key={i}>{tr(q, locale)}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-medium">{c.fields.careers}: </span>
              {CAREERS.filter((x) => x.fields.includes(f.id))
                .map((x) => tr(x.title, locale))
                .join(", ") || "—"}
            </p>
            <div className="mt-auto pt-4">
              <ButtonLink href={`/career?field=${f.id}#universities`} variant="secondary" size="sm">
                {c.fields.research}
              </ButtonLink>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );

  const portfolioPanel = (
    <Card className="p-5">
      <p className="text-[15px] text-ink-muted">{c.portfolio.lead}</p>
      <p className="mt-3 text-lg font-semibold">{fmtCount(c.portfolio.items, portfolio.length)}</p>
      <ul className="mt-2 space-y-1.5">
        {portfolio.slice(0, 5).map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <Badge tone="brand">{c.portfolio.categories[item.category]}</Badge>
            {item.title}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/career/portfolio">
          {c.portfolio.manage}
          <ArrowRight aria-hidden className="size-4" />
        </ButtonLink>
        <ButtonLink href={`/portfolio/${user.id}`} variant="secondary">
          <Printer aria-hidden className="size-4" />
          {c.portfolio.overview}
        </ButtonLink>
      </div>
    </Card>
  );

  return (
    <PageContainer wide>
      <LabHeader lab="career" hubLabel={dict.labs.hub.title} labName={c.title} lead={c.lead} />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <TabPanels
        initial={initialField ? "universities" : "careers"}
        panels={[
          { id: "careers", label: c.tabs.careers, content: <CareerExplorer bookmarked={listBookmarks(user.id, "career").map((b) => b.refId)} /> },
          { id: "fields", label: c.tabs.fields, content: fieldsPanel },
          {
            id: "universities",
            label: c.tabs.universities,
            content: <UniversityCards own={listOwnCards(user.id)} shared={staff ? [] : listSharedCards()} staff={staff} initialField={initialField} now={now()} />,
          },
          ...(staff
            ? []
            : [
                { id: "skills" as const, label: c.tabs.skills, content: <SkillsSelf initial={skillProfile(user.id)} /> },
                { id: "portfolio" as const, label: c.tabs.portfolio, content: portfolioPanel },
                { id: "development" as const, label: c.tabs.development, content: <Goals initial={listGoals(user.id)} /> },
              ]),
        ]}
      />
      {staff ? (
        <p className="mt-6 text-sm text-ink-muted">
          <Link href="/teacher/students" className="font-medium text-brand hover:underline">
            {dict.labs.profile.title}
          </Link>
        </p>
      ) : null}
    </PageContainer>
  );
}
