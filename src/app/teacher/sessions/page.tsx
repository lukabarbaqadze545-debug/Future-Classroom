import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/i18n/config";
import { listSessionsForTeacher } from "@/lib/services/sessions";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Sessions" };

export default async function SessionsPage() {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const s = dict.teacher.sessions;
  const sessions = listSessionsForTeacher(user.id);
  return (
    <PageContainer>
      <PageHeader title={s.title} description={s.lead} />
      {sessions.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{dict.nav.lessons}</th>
                <th className="px-5 py-3 font-medium">{s.code}</th>
                <th className="px-5 py-3 font-medium">{s.participants}</th>
                <th className="px-5 py-3 font-medium">{s.activities}</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-5 py-3">
                    <Link href={`/teacher/sessions/${session.id}`} className="font-medium hover:text-brand">
                      {session.title}
                    </Link>
                    <div className="text-xs text-ink-subtle">
                      {session.classLabel ? `${session.classLabel} · ` : ""}
                      {formatDateTime(locale, session.startedAt ?? session.createdAt)}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono">{session.status === "ended" ? "—" : session.joinCode}</td>
                  <td className="px-5 py-3 tabular-nums">{session.participantCount}</td>
                  <td className="px-5 py-3 tabular-nums">{session.activityCount}</td>
                  <td className="px-5 py-3 text-right">
                    {session.status === "ended" ? (
                      <ButtonLink href={`/teacher/sessions/${session.id}`} variant="ghost" size="sm">
                        {s.summary}
                      </ButtonLink>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Badge tone="success" dot>
                          {dict.status[session.status]}
                        </Badge>
                        <ButtonLink href={`/teacher/sessions/${session.id}`} size="sm">
                          {s.open}
                        </ButtonLink>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={s.empty} action={<ButtonLink href="/teacher/lessons">{dict.nav.lessons}</ButtonLink>} />
      )}
    </PageContainer>
  );
}
