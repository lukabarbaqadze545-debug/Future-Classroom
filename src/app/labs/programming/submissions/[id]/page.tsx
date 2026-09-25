import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, formatDateTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem, getSubmission } from "@/lib/labs/programming/service";
import { getStudent } from "@/lib/services/classes";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader } from "@/components/labs/lab-shell";
import { CodeBlock } from "@/components/labs/code-editor";

export const metadata = { title: "Submission" };

/** One submission: the code as handed in and how each test went. Owner and staff only. */
export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const submission = getSubmission(id);
  if (!submission || (submission.userId !== user.id && user.role === "student")) notFound();
  const problem = getProblem(submission.problemId);
  const { dict, locale } = await getDictionary();
  const p = dict.labs.programming;
  const solved = submission.verdict === "accepted" || submission.verdict === "correct";
  return (
    <PageContainer>
      <LabHeader
        lab="programming"
        hubLabel={dict.labs.hub.title}
        labName={p.title}
        title={problem ? tr(problem.title, locale) : submission.problemId}
        crumbs={problem ? [{ href: `/labs/programming/${problem.id}`, label: tr(problem.title, locale) }] : []}
        lead={`${getStudent(submission.userId)?.displayName ?? ""} · ${p.languages[submission.language]} · ${formatDateTime(locale, submission.createdAt)}`}
      />
      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
        <Badge tone={solved ? "success" : "danger"}>{p.verdicts[submission.verdict]}</Badge>
        {submission.total > 1 ? <span className="text-sm tabular-nums">{fmt(p.passedCount, { passed: submission.passed, total: submission.total })}</span> : null}
        <span className="text-sm text-ink-muted">{p.checkers[submission.checker]}</span>
      </Card>
      {submission.code ? (
        <Card className="mb-5 p-5">
          <h2 className="mb-2 font-semibold">{p.editor}</h2>
          <CodeBlock code={submission.code} />
        </Card>
      ) : null}
      {submission.answer ? (
        <Card className="mb-5 p-5">
          <h2 className="mb-2 font-semibold">{dict.labs.assignments.yourResponse}</h2>
          <CodeBlock code={submission.answer} />
        </Card>
      ) : null}
      {submission.details.length ? (
        <Card>
          <CardHeader title={p.examples} />
          <ul className="divide-y divide-line">
            {submission.details.map((t) => (
              <li key={t.index} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
                <span>{t.sample ? fmt(p.test, { n: t.index + 1 }) : fmt(p.hiddenTest, { n: t.index + 1 })}</span>
                <Badge tone={t.passed ? "success" : "danger"}>{p.testStatus[t.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </PageContainer>
  );
}
