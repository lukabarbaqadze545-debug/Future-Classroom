"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LogOut, Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { ResearchProjectData } from "@/lib/labs/research/model";
import type { ResearchDataset, ResearchNote, ResearchSource } from "@/lib/labs/research/service";
import { formatReference, sortReferences } from "@/lib/labs/research/citation";
import { PresentButton, PresentShell } from "@/components/present/present-shell";
import { cn } from "@/components/ui/cn";
import { DatasetChart, defaultChart } from "./dataset-chart";
import { attribution } from "./notes-panel";

/** Slides generated from the student's own project — nothing is added that they did not write. */
export function ResearchPresentation({
  id,
  title,
  author,
  subject,
  data,
  sources,
  notes,
  datasets,
}: {
  id: string;
  title: string;
  author: string;
  subject: string;
  data: ResearchProjectData;
  sources: ResearchSource[];
  notes: ResearchNote[];
  datasets: ResearchDataset[];
}) {
  const { dict } = useI18n();
  const r = dict.labs.research;
  const s = r.presentation.slides;
  const evidence = notes.filter((n) => n.kind === "evidence");
  const quotes = notes.filter((n) => n.kind === "quote").slice(0, 2);
  const chartable = datasets.map((d) => ({ d, spec: defaultChart(d) })).filter((x) => x.spec && x.d.rows.length);
  const references = sortReferences(sources.map((src) => ({ id: src.id, reference: formatReference(src, { accessed: r.sources.accessedLabel, noDate: r.sources.noDate }) })));

  const slides: { key: string; render: (muted: string) => ReactNode }[] = [
    {
      key: "title",
      render: (muted) => (
        <div className="text-center">
          <p className={cn("text-2xl", muted)}>{subject}</p>
          <h1 className="mt-6 text-[clamp(40px,5.5vw,88px)] leading-tight font-semibold tracking-tight">{title}</h1>
          <p className={cn("mt-6 text-2xl", muted)}>{author}</p>
          {data.keyMessage ? <p className="mx-auto mt-10 max-w-4xl text-3xl">{data.keyMessage}</p> : null}
        </div>
      ),
    },
    ...(data.question
      ? [
          {
            key: "question",
            render: (muted: string) => (
              <div>
                <p className={cn("text-2xl font-medium", muted)}>{s.question}</p>
                <h2 className="mt-4 text-[clamp(32px,4vw,64px)] leading-tight font-semibold">{data.question}</h2>
                {data.hypothesis ? (
                  <>
                    <p className={cn("mt-12 text-2xl font-medium", muted)}>{s.hypothesis}</p>
                    <p className="mt-3 text-3xl">{data.hypothesis}</p>
                  </>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
    ...(data.method
      ? [{ key: "method", render: (muted: string) => <TextSlide title={s.method} muted={muted} text={data.method} /> }]
      : []),
    ...(sources.length || evidence.length
      ? [
          {
            key: "evidence",
            render: (muted: string) => (
              <div>
                <p className={cn("text-2xl font-medium", muted)}>
                  {s.sources} · {fmt(s.primary, { n: sources.filter((x) => x.primary === "primary").length })} · {fmt(s.secondary, { n: sources.filter((x) => x.primary === "secondary").length })}
                </p>
                {evidence.length ? (
                  <p className="mt-6 text-3xl tabular-nums">
                    {fmt(r.evidence.count, {
                      supports: evidence.filter((n) => n.stance === "supports").length,
                      contradicts: evidence.filter((n) => n.stance === "contradicts").length,
                      neutral: evidence.filter((n) => !n.stance || n.stance === "neutral").length,
                    })}
                  </p>
                ) : null}
                <div className="mt-10 space-y-8">
                  {quotes.map((q) => (
                    <blockquote key={q.id} className="flex gap-4 text-3xl italic">
                      <Quote aria-hidden className="mt-1 size-8 shrink-0 opacity-50" />
                      <span>
                        “{q.content}”
                        <span className={cn("mt-2 block text-xl not-italic", muted)}>{attribution(sources.find((x) => x.id === q.sourceId), q.page, r.sources.noDate)}</span>
                      </span>
                    </blockquote>
                  ))}
                </div>
              </div>
            ),
          },
        ]
      : []),
    ...chartable.slice(0, 2).map(({ d, spec }) => ({
      key: `data-${d.id}`,
      render: (muted: string) => (
        <div>
          <p className={cn("text-2xl font-medium", muted)}>
            {s.data}: {d.name}
          </p>
          <div className="mx-auto mt-6 max-w-5xl rounded-2xl bg-white p-4 text-ink">
            <DatasetChart dataset={d} spec={spec!} large />
          </div>
          {d.collection ? <p className={cn("mt-4 text-xl", muted)}>{d.collection}</p> : null}
        </div>
      ),
    })),
    ...(data.findings.some((f) => f.trim())
      ? [
          {
            key: "findings",
            render: (muted: string) => (
              <div>
                <p className={cn("text-2xl font-medium", muted)}>{s.findings}</p>
                <ol className="mt-6 list-decimal space-y-5 pl-10 text-3xl">
                  {data.findings
                    .filter((f) => f.trim())
                    .map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                </ol>
              </div>
            ),
          },
        ]
      : []),
    ...(data.conclusion
      ? [
          {
            key: "conclusion",
            render: (muted: string) => (
              <div>
                <TextSlide title={s.conclusion} muted={muted} text={data.conclusion} />
                {data.limitations ? (
                  <div className="mt-10">
                    <p className={cn("text-2xl font-medium", muted)}>{s.limitations}</p>
                    <p className="mt-3 text-2xl whitespace-pre-line">{data.limitations}</p>
                  </div>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
    ...(references.length
      ? [
          {
            key: "references",
            render: (muted: string) => (
              <div>
                <p className={cn("text-2xl font-medium", muted)}>{s.references}</p>
                <ol className="mt-6 space-y-3 text-xl">
                  {references.map((x) => (
                    <li key={x.id} className="break-words">
                      {x.reference}
                    </li>
                  ))}
                </ol>
              </div>
            ),
          },
        ]
      : []),
  ];

  const [index, setIndex] = useState(0);
  const go = useCallback((delta: number) => setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + delta))), [slides.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <PresentShell
      top={<p className="truncate text-xl font-semibold opacity-70">{title}</p>}
      controls={(theme) => (
        <>
          <PresentButton theme={theme} onClick={() => go(-1)} disabled={index === 0}>
            <ChevronLeft aria-hidden className="size-7" />
            <span className="sr-only">{dict.common.previous}</span>
          </PresentButton>
          <span className="min-w-24 text-center text-lg tabular-nums opacity-70" aria-live="polite">
            {fmt(dict.present.slide, { n: index + 1, m: slides.length })}
          </span>
          <PresentButton theme={theme} variant="primary" onClick={() => go(1)} disabled={index === slides.length - 1} data-testid="next-slide">
            <ChevronRight aria-hidden className="size-7" />
            <span className="sr-only">{dict.common.next}</span>
          </PresentButton>
          <PresentButton theme={theme} href={`/labs/research/${id}`}>
            <LogOut aria-hidden className="size-6" />
            <span className="sr-only">{r.presentation.exit}</span>
          </PresentButton>
        </>
      )}
    >
      {(theme) => (
        <div className="fc-fade-in mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center" key={index} data-testid="research-slide">
          {slides[index].render(theme === "dark" ? "text-white/70" : "text-ink-muted")}
        </div>
      )}
    </PresentShell>
  );
}

function TextSlide({ title, text, muted }: { title: string; text: string; muted: string }) {
  return (
    <div>
      <p className={cn("text-2xl font-medium", muted)}>{title}</p>
      <p className="mt-4 text-3xl leading-snug whitespace-pre-line">{text}</p>
    </div>
  );
}
