"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Labels {
  contents: string;
  loading: string;
  failed: string;
  zoom: string;
  zoomOut: string;
  zoomIn: string;
  note: string;
}

const ZOOMS = [50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
/** Headings as docx-preview names them: a class per Word style (docx_heading1 …). */
const HEADING = /(?:^|\s)docx_(?:heading(\d)|title)(?:\s|$)/i;
const WIDE = "(min-width: 1024px)";

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const SAFE_HREF = /^(https?:|mailto:|#)/i;

/** Links in a Word file may point anywhere; keep only ordinary ones and open them in a new tab. */
function tidyLinks(root: HTMLElement) {
  root.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (!SAFE_HREF.test(href)) {
      a.removeAttribute("href");
      return;
    }
    if (!href.startsWith("#")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noreferrer noopener");
    }
  });
}

function collectHeadings(root: HTMLElement): Heading[] {
  const found: Heading[] = [];
  root.querySelectorAll<HTMLElement>("p").forEach((p) => {
    const match = HEADING.exec(p.className);
    const text = p.textContent?.trim();
    if (!match || !text) return;
    const id = `docx-h-${found.length}`;
    p.id = id;
    // A jump from the contents must not hide the heading under the site header.
    p.style.scrollMarginTop = "7.5rem";
    found.push({ id, text: text.slice(0, 120), level: match[1] ? Number(match[1]) : 1 });
  });
  return found;
}

/**
 * Shows a Word file the way Word does: its own fonts, colours, tables, page
 * breaks, headers and footers. The file is read and drawn in the reader's
 * browser (docx-preview, bundled with the site — no internet), so the server
 * only hands over the file it already serves for downloading.
 */
export function DocxViewer({ src, labels }: { src: string; labels: Labels }) {
  const host = useRef<HTMLDivElement>(null);
  const styles = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [zoom, setZoom] = useState(100);
  // The contents sit beside the page on a wide screen and fold away on a phone.
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  const [foldOpen, setFoldOpen] = useState(false);
  const showContents = wide || foldOpen;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [response, { renderAsync }] = await Promise.all([fetch(src, { credentials: "same-origin" }), import("docx-preview")]);
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.arrayBuffer();
        const target = host.current;
        if (cancelled || !target || !styles.current) return;
        target.replaceChildren();
        await renderAsync(data, target, styles.current, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderComments: false,
          useBase64URL: true,
        });
        if (cancelled) return;
        tidyLinks(target);
        setHeadings(collectHeadings(target));
        // On a narrow screen start with the page fitted to the width.
        const paper = target.querySelector<HTMLElement>("section.docx");
        if (paper && paper.offsetWidth > 0) {
          const fit = Math.floor(((target.clientWidth - 16) / paper.offsetWidth) * 100);
          if (fit < 100) setZoom(Math.max(ZOOMS[0], Math.floor(fit / 5) * 5));
        }
        setState("ready");
      } catch {
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  const step = (direction: 1 | -1) => {
    const index = ZOOMS.findIndex((z) => z >= zoom);
    const next = direction === 1 ? ZOOMS.find((z) => z > zoom) : [...ZOOMS].reverse().find((z) => z < zoom);
    setZoom(next ?? ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, index))]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      {headings.length > 0 ? (
        <Card className="min-w-0 overflow-hidden lg:sticky lg:top-28 lg:max-h-[calc(100vh-8.5rem)] lg:self-start lg:overflow-y-auto" data-testid="docx-contents">
          <h2 className="text-sm font-semibold">
            <button
              type="button"
              aria-expanded={showContents}
              onClick={() => setFoldOpen((open) => !open)}
              className="flex w-full items-center justify-between px-4 py-3 text-left lg:pointer-events-none"
            >
              {labels.contents}
              <ChevronDown aria-hidden className={`size-4 transition-transform lg:hidden ${showContents ? "rotate-180" : ""}`} />
            </button>
          </h2>
          <nav aria-label={labels.contents} hidden={!showContents} className="max-h-72 overflow-y-auto border-t border-line py-1 lg:max-h-none">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ block: "start", behavior: "smooth" });
                }}
                className={`block px-4 py-1.5 text-sm text-ink-muted hover:bg-muted ${h.level > 1 ? "pl-7" : "font-medium text-ink"}`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </Card>
      ) : (
        <div className="hidden lg:block" />
      )}
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-xs text-ink-subtle">{labels.note}</p>
          <div className="flex items-center gap-1 text-sm text-ink-muted" role="group" aria-label={labels.zoom}>
            <Button variant="ghost" size="sm" aria-label={labels.zoomOut} disabled={zoom <= ZOOMS[0]} onClick={() => step(-1)}>
              <Minus aria-hidden className="size-4" />
            </Button>
            <span className="w-12 text-center tabular-nums" aria-live="polite">
              {zoom}%
            </span>
            <Button variant="ghost" size="sm" aria-label={labels.zoomIn} disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => step(1)}>
              <Plus aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
        {state === "loading" ? (
          <Notice tone="info" className="mb-3">
            {labels.loading}
          </Notice>
        ) : null}
        {state === "failed" ? <Notice tone="warn">{labels.failed}</Notice> : null}
        <div ref={styles} hidden />
        <div
          ref={host}
          className="docx-host overflow-x-auto rounded-xl border border-line"
          style={{ ["--docx-zoom" as string]: zoom / 100 }}
          data-testid="docx-viewer"
          data-state={state}
        />
      </div>
    </div>
  );
}
