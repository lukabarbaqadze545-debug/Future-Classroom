import Link from "next/link";
import { now } from "@/lib/db";
import { Plus, Printer, ShieldCheck } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/config";
import { isSubject } from "@/lib/domain/catalog";
import { listAllCopies, listReading, listResources, loansFor } from "@/lib/labs/library/service";
import { listBookmarks } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/misc";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { TabPanels } from "@/components/labs/shared/tab-panels";
import { Catalogue, type CatalogueItem } from "@/components/labs/library/catalogue";
import { LibraryAsk } from "@/components/student/library-ask";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.labs.hub.rooms.library.name };
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const { subject } = await searchParams;
  const b = dict.labs.library;
  const staff = isStaff(user);
  const reading = listReading(user.id);
  const readingMap = new Map(reading.map((r) => [r.resourceId, r.status]));
  const bookmarks = new Set(listBookmarks(user.id, "library").map((x) => x.refId));
  const items: CatalogueItem[] = listResources().map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors,
    kind: r.kind,
    categories: r.categories,
    subjects: r.subjects,
    gradeFrom: r.gradeFrom,
    gradeTo: r.gradeTo,
    language: r.language,
    description: r.description,
    digital: Boolean(r.digitalUrl || r.materialId),
    copies: r.copies,
    reading: readingMap.get(r.id) ?? null,
    bookmarked: bookmarks.has(r.id),
  }));
  const loans = loansFor(user.id);
  const onLoan = staff ? listAllCopies().filter((c) => c.status === "on_loan") : [];
  const assignments = staff ? [] : openAssignmentsFor(user.id, "library").filter((a) => a.recipient.status !== "completed");

  const readingPanel = (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title={b.reading.title} />
        {reading.length ? (
          <ul className="divide-y divide-line">
            {reading.map((r) => (
              <li key={r.resourceId}>
                <Link href={`/library/${r.resourceId}`} className="block px-5 py-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium" lang={r.language}>
                      {r.title}
                    </span>
                    <Badge tone={r.status === "finished" ? "success" : r.status === "reading" ? "brand" : "neutral"}>{b.reading.status[r.status]}</Badge>
                  </div>
                  {r.status === "reading" ? <Meter value={r.percent} tone="success" className="mt-2" label={`${r.percent}%`} /> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{b.reading.empty}</p>
        )}
      </Card>
      <Card>
        <CardHeader title={b.reading.loans} />
        {loans.length ? (
          <ul className="divide-y divide-line">
            {loans.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-3">
                <Link href={`/library/${c.resourceId}`} className="font-medium hover:underline">
                  {c.title}
                </Link>
                <span className="text-sm text-ink-muted">{c.dueAt ? fmt(b.dueBack, { date: formatDate(locale, c.dueAt) }) : c.code}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{b.manage.noLoans}</p>
        )}
      </Card>
    </div>
  );

  const managePanel = (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/library/new">
          <Plus aria-hidden className="size-4" />
          {b.manage.newResource}
        </ButtonLink>
        <ButtonLink href="/library/labels" variant="secondary">
          <Printer aria-hidden className="size-4" />
          {b.printLabels}
        </ButtonLink>
      </div>
      <Card>
        <CardHeader title={b.manage.onLoan} />
        {onLoan.length ? (
          <ul className="divide-y divide-line">
            {onLoan.map((c) => {
              const overdue = c.dueAt !== null && c.dueAt < now();
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span>
                    <Link href={`/library/${c.resourceId}`} className="font-medium hover:underline">
                      {c.title}
                    </Link>
                    <span className="text-sm text-ink-muted"> · {c.code}{c.borrowerName ? ` · ${c.borrowerName}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    {c.dueAt ? fmt(b.dueBack, { date: formatDate(locale, c.dueAt) }) : null}
                    {overdue ? <Badge tone="danger">{b.manage.overdue}</Badge> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{b.manage.noLoans}</p>
        )}
      </Card>
    </div>
  );

  return (
    <PageContainer wide>
      <LabHeader lab="library" hubLabel={dict.labs.hub.title} labName={b.title} lead={b.lead} />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <p className="mb-6 flex items-start gap-2 rounded-2xl border border-lab-library/25 bg-lab-library/5 px-4 py-3 text-[15px]">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-lab-library" />
        {b.legalNote}
      </p>
      <TabPanels
        panels={[
          { id: "catalogue", label: b.tabs.catalogue, content: <Catalogue items={items} initialSubject={subject && isSubject(subject) ? subject : ""} /> },
          { id: "reading", label: b.tabs.reading, content: readingPanel },
          { id: "ask", label: b.tabs.ask, content: <LibraryAsk initialSubject={subject && isSubject(subject) ? subject : ""} /> },
          ...(staff ? [{ id: "manage" as const, label: b.tabs.manage, content: managePanel }] : []),
        ]}
      />
    </PageContainer>
  );
}
