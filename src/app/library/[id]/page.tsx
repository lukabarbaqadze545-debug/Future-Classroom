import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, ExternalLink, FileText, Pencil, QrCode } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { resolveActivity } from "@/lib/labs/activity-links";
import { findCopyByCode, getReading, getResource, lessonsForResource, listCopies } from "@/lib/labs/library/service";
import { publicOrigin, qrSvg } from "@/lib/labs/library/qr";
import { canView, getMaterial } from "@/lib/services/materials";
import { listLessonsForTeacher } from "@/lib/services/lessons";
import { listStudents } from "@/lib/services/classes";
import { isBookmarked } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";
import { ReadingControl } from "@/components/labs/library/reading-control";
import { CopyManager } from "@/components/labs/library/copy-manager";
import { LessonAttach } from "@/components/labs/library/lesson-attach";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ copy?: string }> };

export async function generateMetadata({ params }: Props) {
  const r = getResource((await params).id);
  return { title: r ? r.title : "School Library" };
}

function materialFor(id: string | null, user: Parameters<typeof canView>[1]) {
  if (!id) return null;
  try {
    const m = getMaterial(id, user);
    return canView(m, user) ? m : null;
  } catch {
    return null;
  }
}

export default async function ResourcePage({ params, searchParams }: Props) {
  const { id } = await params;
  const resource = getResource(id);
  if (!resource) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const b = dict.labs.library;
  const staff = isStaff(user);
  const { copy: scanned } = await searchParams;
  const scannedCopy = scanned ? findCopyByCode(scanned) : null;
  const copies = listCopies(id);
  const material = materialFor(resource.materialId, user);
  const exercises = resource.exercises.map((e) => resolveActivity(e.kind, e.id, locale)).filter((x): x is { title: string; href: string } => x !== null);
  const origin = await publicOrigin();
  const resourceQr = await qrSvg(`${origin}/library/${id}`, 150);
  const reading = getReading(user.id, id);

  return (
    <PageContainer wide>
      <LabHeader
        lab="library"
        hubLabel={dict.labs.hub.title}
        labName={b.title}
        title={<span lang={resource.language === "ka" ? "ka" : resource.language === "en" ? "en" : undefined}>{resource.title}</span>}
        lead={
          <span className="block space-y-2">
            {resource.authors ? <span className="block text-ink">{resource.authors}</span> : null}
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge>{b.kinds[resource.kind]}</Badge>
              <Badge>{b.languages[resource.language]}</Badge>
              {resource.categories.map((c) => (
                <Badge key={c} tone="neutral">
                  {b.categories[c]}
                </Badge>
              ))}
              {resource.gradeFrom && resource.gradeTo ? <span className="text-sm">{fmt(b.grades, { from: resource.gradeFrom, to: resource.gradeTo })}</span> : null}
              {resource.year ? <span className="text-sm">· {resource.year}</span> : null}
              {resource.publisher ? <span className="text-sm">· {resource.publisher}</span> : null}
            </span>
          </span>
        }
        actions={
          <>
            <BookmarkButton kind="library" refId={id} initial={isBookmarked(user.id, "library", id)} size="md" />
            {staff ? (
              <>
                <ButtonLink href={`/teacher/assignments/new?kind=library&ref=${id}`} variant="secondary">
                  <ClipboardList aria-hidden className="size-4" />
                  {dict.labs.common.assign}
                </ButtonLink>
                <ButtonLink href={`/library/${id}/edit`} variant="ghost">
                  <Pencil aria-hidden className="size-4" />
                  {dict.labs.common.edit}
                </ButtonLink>
              </>
            ) : null}
          </>
        }
      />
      {staff ? null : <AssignmentBanner assignments={openAssignmentsFor(user.id, "library", id)} dict={dict} locale={locale} />}
      {scannedCopy && scannedCopy.resourceId === id ? (
        <Notice tone="success" className="mb-5" title={fmt(b.youScanned, { code: scannedCopy.code })}>
          {b.copyStatus[scannedCopy.status]}
          {scannedCopy.shelf ? ` · ${b.shelf}: ${scannedCopy.shelf}` : ""}
        </Notice>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <p className="text-[15px] leading-relaxed">{tr(resource.description, locale)}</p>
          </Card>
          <Card className="p-5" data-testid="digital-version">
            <h2 className="font-semibold">{b.digitalVersion}</h2>
            {material ? (
              <div className="mt-2 space-y-2">
                <Badge tone="success">{b.licenses.school}</Badge>
                <div>
                  <ButtonLink href={`/api/materials/${material.id}/file`} variant="secondary">
                    <FileText aria-hidden className="size-4" />
                    {b.openSchoolCopy}
                  </ButtonLink>
                </div>
              </div>
            ) : resource.digitalUrl ? (
              <div className="mt-2 space-y-2">
                <Badge tone="success">
                  {b.licenses[resource.license]}
                  {resource.licenseNote ? ` · ${resource.licenseNote}` : ""}
                </Badge>
                <div>
                  <a href={resource.digitalUrl} target="_blank" rel="noreferrer noopener" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-4 font-medium hover:bg-muted">
                    <ExternalLink aria-hidden className="size-4" />
                    {b.openDigital}
                  </a>
                </div>
                <p className="text-xs text-ink-subtle">{b.externalNote}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{b.noDigital}</p>
            )}
          </Card>
          {resource.supplementary.length ? (
            <Card className="p-5">
              <h2 className="font-semibold">{b.supplementary}</h2>
              <ul className="mt-2 space-y-1.5">
                {resource.supplementary.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-brand hover:underline">
                      <ExternalLink aria-hidden className="size-3.5" />
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {exercises.length ? (
            <Card className="p-5">
              <h2 className="font-semibold">{b.exercises}</h2>
              <ul className="mt-2 space-y-1.5">
                {exercises.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href} className="text-brand hover:underline">
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {staff ? (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">{b.lessons}</h2>
              <LessonAttach resourceId={id} lessons={listLessonsForTeacher(user.id).map((l) => ({ id: l.id, title: l.title }))} initial={lessonsForResource(id)} />
            </Card>
          ) : (
            <Card className="p-5">
              <h2 className="font-semibold">{b.addAsSource}</h2>
              <p className="mt-1 text-sm text-ink-muted">{b.addAsSourceHelp}</p>
              <Link href="/labs/research" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                {dict.labs.research.title}
              </Link>
            </Card>
          )}
        </div>
        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">{b.reading.title}</h2>
            <ReadingControl resourceId={id} initial={reading ? { status: reading.status, percent: reading.percent, note: reading.note } : null} />
          </Card>
          <Card>
            <CardHeader title={b.physicalCopies} description={copies.length ? fmt(b.copiesAvailable, { available: resource.copies.available, total: resource.copies.total }) : undefined} />
            <div className="px-5 py-4">
              {staff ? (
                <CopyManager resourceId={id} initial={copies} students={listStudents().map((s) => ({ id: s.id, name: s.displayName }))} />
              ) : copies.length ? (
                <ul className="space-y-2">
                  {copies.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-mono">{c.code}</span> · {c.shelf}
                      </span>
                      <Badge tone={c.status === "available" ? "success" : c.status === "on_loan" ? "warn" : "neutral"}>
                        {b.copyStatus[c.status]}
                        {c.status === "on_loan" && c.dueAt ? ` · ${formatDate(locale, c.dueAt)}` : ""}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">{b.noCopies}</p>
              )}
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="shrink-0 rounded-xl border border-line bg-white p-1.5" dangerouslySetInnerHTML={{ __html: resourceQr }} aria-hidden />
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <QrCode aria-hidden className="size-4.5" />
                {b.qrTitle}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{b.qrHelp}</p>
              {staff && copies.length ? (
                <Link href={`/library/labels?resource=${id}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                  {b.printLabels}
                </Link>
              ) : null}
              <p className="mt-1 hidden font-mono text-xs break-all text-ink-subtle print:block">{`${origin}/library/${id}`}</p>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
