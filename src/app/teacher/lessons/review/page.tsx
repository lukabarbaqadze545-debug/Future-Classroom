import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { isReviewStatus, REVIEW_STATUSES } from "@/lib/domain/review";
import { reviewQueue } from "@/lib/services/lesson-review";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";
import { ReviewBadge } from "@/components/lesson/review-badge";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.review.queue };
}

/** Lessons by review state, so reviewers can find what to check next. */
export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ dict }, { status: param }] = await Promise.all([getDictionary(), searchParams]);
  const r = dict.review;
  const filter = isReviewStatus(param) ? param : null;
  const { items, counts } = reviewQueue(user);
  const shown = filter ? items.filter((i) => i.status === filter) : items;
  const total = items.length;

  return (
    <PageContainer>
      <PageHeader eyebrow={<Link href="/teacher/lessons" className="hover:underline">{dict.teacher.lessons.title}</Link>} title={r.queue} description={`${r.lead} ${r.queueLead}`} />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label={r.queue}>
        {[null, ...REVIEW_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/teacher/lessons/review?status=${s}` : "/teacher/lessons/review"}
            aria-current={filter === s ? "page" : undefined}
            className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium", filter === s ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand/40")}
            data-testid="review-filter"
          >
            {s ? r.status[s] : r.all}
            <span className="tabular-nums opacity-80">{s ? counts[s] : total}</span>
          </Link>
        ))}
      </nav>
      {shown.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface" data-testid="review-queue">
          {shown.map((item) => (
            <li key={item.id}>
              <Link href={`/teacher/lessons/${item.id}/preview`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                <span className="min-w-0">
                  <span className="block font-medium" lang={item.language}>
                    {item.title}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {dict.subjects[item.subject]} · {fmt(dict.common.grade, { n: item.grade })} · {dict.contentLanguages[item.language]}
                    {item.builtIn ? ` · ${r.builtIn}` : ""}
                    {item.lastReviewAt ? ` · ${fmt(r.lastReview, { when: relativeTime(dict, item.lastReviewAt) })}` : ""}
                  </span>
                </span>
                <ReviewBadge status={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{r.empty}</p>
      )}
    </PageContainer>
  );
}
