import { notFound } from "next/navigation";
import { now } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt, fmtCount, formatDate } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { SKILLS } from "@/lib/labs/career/skills";
import { listGoals, skillProfile } from "@/lib/labs/career/service";
import { listPortfolio } from "@/lib/services/portfolio";
import { canViewStudent, getStudent } from "@/lib/services/classes";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/labs/library/print-button";

export async function generateMetadata() {
  return pageTitle((p) => p.portfolioOverview);
}

/** A printable one-page portfolio for the student, their teachers and mentors. */
export default async function PortfolioOverviewPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const viewer = await requirePageUser(["student", "teacher", "admin"], `/portfolio/${userId}`);
  const student = getStudent(userId);
  if (!student || !canViewStudent(viewer, userId)) notFound();
  const { dict, locale } = await getDictionary();
  const p = dict.labs.career.portfolio;
  const items = listPortfolio(userId);
  const skills = skillProfile(userId).filter((s) => s.level !== null || s.evidence > 0);
  const goals = listGoals(userId);
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-sm font-medium text-lab-career">{p.studentOverview}</p>
              <h1 className="text-3xl font-semibold">{student.displayName}</h1>
              <p className="text-sm text-ink-muted">
                {fmtCount(p.items, items.length)} · {fmt(p.printedOn, { date: formatDate(locale, now()) })}
              </p>
            </div>
            <PrintButton label={dict.labs.common.print} />
          </div>
          {skills.length ? (
            <section className="mt-6 break-inside-avoid">
              <h2 className="text-lg font-semibold">{dict.labs.career.tabs.skills}</h2>
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {skills.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{tr(s.name, locale)}</span>
                    <span className="text-ink-muted tabular-nums">
                      {s.level ? `${s.level}/4 · ${dict.labs.career.skills.levels[s.level - 1]}` : dict.labs.career.skills.notRated}
                      {s.evidence ? ` · ${fmtCount(dict.labs.career.skills.evidence, s.evidence)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="mt-6">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            {items.length ? (
              <ol className="mt-2 space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="break-inside-avoid border-l-2 border-lab-career/40 pl-4">
                    <p className="text-sm text-ink-muted">
                      {formatDate(locale, new Date(`${item.date}T12:00:00`).getTime())} · {p.categories[item.category]}
                    </p>
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.description ? <p className="mt-1 text-[15px] whitespace-pre-line">{item.description}</p> : null}
                    {item.reflection ? <p className="mt-1 text-sm whitespace-pre-line text-ink-muted italic">{item.reflection}</p> : null}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.skills.map((s) => (
                        <Badge key={s}>{tr(SKILLS.find((k) => k.id === s)!.name, locale)}</Badge>
                      ))}
                    </div>
                    {item.link ? <p className="mt-1 text-sm break-all text-brand">{item.link}</p> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{p.empty}</p>
            )}
          </section>
          {goals.length ? (
            <section className="mt-6 break-inside-avoid">
              <h2 className="text-lg font-semibold">{dict.labs.career.goals.title}</h2>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {goals.map((g) => (
                  <li key={g.id}>
                    <span className="font-medium">{g.title}</span>
                    <span className="text-sm text-ink-muted"> · {g.status === "done" ? dict.labs.career.goals.done : dict.labs.career.goals.active}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
