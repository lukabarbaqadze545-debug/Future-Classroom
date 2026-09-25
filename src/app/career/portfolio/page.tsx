import { Printer } from "lucide-react";
import { requirePageUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { listPortfolio } from "@/lib/services/portfolio";
import { listAttachments } from "@/lib/services/attachments";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { LabHeader } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { PortfolioManager } from "@/components/labs/career/portfolio-manager";

export async function generateMetadata() {
  return pageTitle((p) => p.portfolio);
}

export default async function PortfolioPage() {
  const user = await requirePageUser(["student"], "/career/portfolio");
  const { dict, locale } = await getDictionary();
  const p = dict.labs.career.portfolio;
  const items = listPortfolio(user.id);
  const attachments = Object.fromEntries(items.map((i) => [i.id, listAttachments("portfolio", i.id)]));
  return (
    <PageContainer>
      <LabHeader
        lab="career"
        hubLabel={dict.labs.hub.title}
        labName={dict.labs.career.title}
        title={p.title}
        lead={p.lead}
        actions={
          <ButtonLink href={`/portfolio/${user.id}`} variant="secondary">
            <Printer aria-hidden className="size-4" />
            {p.overview}
          </ButtonLink>
        }
      />
      <AssignmentBanner assignments={openAssignmentsFor(user.id, "portfolio").filter((a) => !["submitted", "completed"].includes(a.recipient.status))} dict={dict} locale={locale} />
      <PortfolioManager initial={items} attachments={attachments} />
    </PageContainer>
  );
}
