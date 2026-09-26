import { requirePageUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { SiteHeader, PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.account.title };
}

export default async function AccountPage() {
  const user = await requirePageUser(["student", "teacher", "admin"], "/account");
  const { dict } = await getDictionary();
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <PageHeader title={dict.account.title} description={`${user.displayName} · @${user.username} · ${dict.roles[user.role]}`} />
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">{dict.account.changePassword}</h2>
          <ChangePasswordForm />
        </Card>
      </PageContainer>
    </>
  );
}
