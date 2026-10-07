import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Lightbulb, Search, X } from "lucide-react";
import { requirePageUser, ALL_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { getResource } from "@/lib/labs/library/service";
import { canView, getMaterial } from "@/lib/services/materials";
import { readerOutline, readerPage, searchInMaterial, type ReaderLocation, type ReaderSection } from "@/lib/services/material-reader";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { LabHeader } from "@/components/labs/lab-shell";
import { DocxViewer } from "@/components/labs/library/docx-viewer";
import { ReaderFrame } from "@/components/labs/library/reader-frame";
import { ReaderText } from "@/components/labs/library/reader-text";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string; p?: string; q?: string; hl?: string; view?: string }> };

export async function generateMetadata({ params }: Props) {
  const r = getResource((await params).id);
  return { title: r ? r.title : undefined };
}

function whereHref(id: string, at: ReaderLocation, extra: { hl?: string } = {}) {
  const query = new URLSearchParams({ view: "text", s: String(at.s), p: String(at.p) });
  if (extra.hl) query.set("hl", extra.hl);
  return `/library/${id}/read?${query}${extra.hl ? "#hit" : ""}`;
}

const label = (s: ReaderSection, fallback: string) => s.section ?? s.chapter ?? fallback;

export default async function ReadPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resource = getResource(id);
  if (!resource || !resource.materialId) notFound();
  const user = await requirePageUser(ALL_ROLES, "/library");
  let material;
  try {
    material = getMaterial(resource.materialId, user);
  } catch {
    notFound();
  }
  if (!canView(material, user)) notFound();
  const { dict } = await getDictionary();
  const b = dict.labs.library;
  const r = b.reader;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const hl = (sp.hl ?? "").trim().slice(0, 80);
  const lang = resource.language === "ka" ? "ka" : resource.language === "en" ? "en" : undefined;
  // A Word file opens as Word shows it; the text view (contents, pages, search) is one click away.
  const isWord = /\.docx$/i.test(material.fileName);
  const original = isWord && sp.view !== "text";
  const outline = !original && material.textStatus === "indexed" ? readerOutline(material.id, user) : [];
  const page = outline.length ? readerPage(material.id, user, { s: Number(sp.s) || 0, p: Number(sp.p) || 0 }) : null;
  const hits = q ? searchInMaterial(material.id, user, q) : null;
  const switcher = isWord ? (
    <div role="group" aria-label={r.viewLabel} className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1 text-sm font-medium">
      <Link
        href={`/library/${id}/read`}
        aria-current={original ? "page" : undefined}
        data-testid="view-original"
        className={`rounded-lg px-3 py-1.5 ${original ? "bg-brand-solid text-white" : "text-ink-muted hover:bg-muted"}`}
      >
        {r.viewOriginal}
      </Link>
      <Link
        href={`/library/${id}/read?view=text`}
        aria-current={original ? undefined : "page"}
        data-testid="view-text"
        className={`rounded-lg px-3 py-1.5 ${original ? "text-ink-muted hover:bg-muted" : "bg-brand-solid text-white"}`}
      >
        {r.viewText}
      </Link>
    </div>
  ) : null;
  const download = (
    <ButtonLink href={`/api/materials/${material.id}/file`} variant="secondary">
      <Download aria-hidden className="size-4" />
      {b.openSchoolCopy}
    </ButtonLink>
  );

  // Chapters group their sections in the contents; sections without a chapter stand alone.
  const groups: { chapter: string | null; items: ReaderSection[] }[] = [];
  for (const s of outline) {
    const last = groups[groups.length - 1];
    if (s.chapter && last?.chapter === s.chapter) last.items.push(s);
    else groups.push({ chapter: s.chapter, items: [s] });
  }

  return (
    <PageContainer wide>
      <LabHeader
        lab="library"
        hubLabel={dict.labs.hub.title}
        labName={b.title}
        crumbs={[
          { href: `/library/${id}`, label: resource.title },
          { href: `/library/${id}/read`, label: r.readOnline },
        ]}
        title={<span lang={lang}>{resource.title}</span>}
        actions={
          <>
            {material.textStatus === "indexed" ? (
              <ButtonLink href={`/learning-assistant?material=${material.id}`} variant="ghost">
                <Lightbulb aria-hidden className="size-4" />
                {dict.assistant.askAboutMaterial}
              </ButtonLink>
            ) : null}
            {download}
          </>
        }
      />
      {switcher}
      {original ? (
        <DocxViewer
          src={`/api/materials/${material.id}/file`}
          labels={{ contents: r.contents, loading: r.loading, failed: r.failed, zoom: r.zoom, zoomOut: r.zoomOut, zoomIn: r.zoomIn, note: r.originalNote }}
        />
      ) : !page ? (
        <Notice tone="warn" action={download}>
          {r.noText}
        </Notice>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <form method="get" action={`/library/${id}/read`} role="search" className="flex min-w-0 gap-2 lg:col-start-1 lg:row-start-1">
            <input type="hidden" name="view" value="text" />
            <input type="hidden" name="s" value={page.s} />
            <input type="hidden" name="p" value={page.p} />
            <input
              name="q"
              defaultValue={q}
              maxLength={80}
              aria-label={r.searchLabel}
              placeholder={r.searchPlaceholder}
              lang={lang}
              className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
              data-testid="reader-search"
            />
            <button type="submit" aria-label={r.search} className={buttonClasses("secondary", "md", "px-3")}>
              <Search aria-hidden className="size-4" />
            </button>
          </form>
          <section className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-live="polite">
            {hits ? (
              <div className="max-w-3xl space-y-3" data-testid="reader-results">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    “{q}” · {hits.length ? fmtCount(r.results, hits.length) : r.noResults}
                  </p>
                  <Link href={whereHref(id, { s: page.s, p: page.p })} className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                    <X aria-hidden className="size-3.5" />
                    {r.clearSearch}
                  </Link>
                </div>
                <ul className="space-y-2">
                  {hits.map((h) => (
                    <li key={h.position}>
                      <Link href={whereHref(id, h.at, { hl: q })} className="block rounded-xl border border-line bg-surface px-4 py-3 hover:bg-muted" lang={lang}>
                        <span className="block text-xs text-ink-subtle">{h.section ?? h.chapter ?? r.startOfBook}</span>
                        <span className="mt-0.5 block text-[15px]">{h.snippet}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {page.section.chapter && page.section.section ? (
                      <p lang={lang} className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                        {page.section.chapter}
                      </p>
                    ) : null}
                    <h2 lang={lang} className="text-2xl font-semibold text-ink">
                      {label(page.section, r.startOfBook)}
                    </h2>
                  </div>
                  <Badge tone="neutral">{fmt(r.pageOf, { p: page.p + 1, n: page.parts })}</Badge>
                </div>
                {hl ? (
                  <p className="mb-3 text-sm text-ink-muted">
                    “{hl}” ·{" "}
                    <Link href={whereHref(id, { s: page.s, p: page.p })} className="text-brand hover:underline">
                      {r.clearSearch}
                    </Link>
                  </p>
                ) : null}
                <ReaderFrame labels={r} lang={lang}>
                  <ReaderText paragraphs={page.paragraphs} highlight={hl} />
                </ReaderFrame>
                <nav aria-label={r.pageOf} className="mt-6 flex max-w-3xl items-center justify-between gap-3 border-t border-line pt-4">
                  {page.prev ? (
                    <ButtonLink href={whereHref(id, page.prev)} variant="secondary" data-testid="reader-prev">
                      <ChevronLeft aria-hidden className="size-4" />
                      {r.previous}
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                  {page.next ? (
                    <ButtonLink href={whereHref(id, page.next)} data-testid="reader-next">
                      {r.next}
                      <ChevronRight aria-hidden className="size-4" />
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                </nav>
                <p className="mt-4 max-w-3xl text-xs text-ink-subtle">{r.note}</p>
              </>
            )}
          </section>
          <Card className="min-w-0 overflow-hidden lg:sticky lg:top-20 lg:col-start-1 lg:row-start-2 lg:self-start">
            <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">{r.contents}</h2>
            <nav aria-label={r.contents} className="max-h-72 overflow-y-auto py-1 lg:max-h-[calc(100vh-17rem)]">
              {groups.map((g, gi) => (
                <div key={gi}>
                  {g.chapter && g.items.length > 0 && g.items[0].section ? (
                    <p lang={lang} className="px-4 pt-2 pb-0.5 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                      {g.chapter}
                    </p>
                  ) : null}
                  {g.items.map((s) => (
                    <Link
                      key={s.index}
                      href={whereHref(id, { s: s.index, p: 0 })}
                      lang={lang}
                      aria-current={!hits && page.s === s.index ? "page" : undefined}
                      className={`block px-4 py-1.5 text-sm hover:bg-muted ${!hits && page.s === s.index ? "bg-brand-soft font-medium text-brand-ink" : "text-ink-muted"}`}
                    >
                      {label(s, r.startOfBook)}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
