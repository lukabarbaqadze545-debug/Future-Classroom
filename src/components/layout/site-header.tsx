import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getAIStatus } from "@/lib/ai";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { LanguageSwitcher } from "./language-switcher";
import { AIStatusBadge } from "./ai-status";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const [{ dict }, user] = await Promise.all([getDictionary(), getCurrentUser()]);
  const staff = user?.role === "teacher" || user?.role === "admin";
  const items = staff
    ? [
        { href: "/teacher", label: dict.nav.dashboard, exact: true },
        { href: "/teacher/lessons", label: dict.nav.lessons },
        { href: "/teacher/sessions", label: dict.nav.sessions },
        { href: "/teacher/quizzes", label: dict.nav.quizzes },
        { href: "/labs", label: dict.nav.labs },
        { href: "/teacher/assignments", label: dict.nav.assignments },
        { href: "/teacher/students", label: dict.nav.students },
        { href: "/library", label: dict.nav.library },
        { href: "/teacher/materials", label: dict.nav.materials },
        { href: "/teacher/insights", label: dict.nav.insights },
      ]
    : user
      ? [
          { href: "/student", label: dict.nav.home, exact: true },
          { href: "/student/learn", label: dict.nav.learn },
          { href: "/labs", label: dict.nav.labs },
          { href: "/student/assignments", label: dict.nav.assignments },
          { href: "/library", label: dict.nav.library },
          { href: "/career", label: dict.nav.portfolio },
          { href: "/student/progress", label: dict.nav.progress },
          { href: "/join", label: dict.nav.join },
        ]
      : [{ href: "/join", label: dict.nav.join }];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Logo label={dict.common.appName} href={staff ? "/teacher" : user ? "/student" : "/"} />
        <div className="order-3 w-full">
          <NavLinks items={items} label={dict.nav.mainNavigation} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AIStatusBadge status={getAIStatus()} dict={dict} />
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right leading-tight md:block">
                <div className="text-sm font-medium text-ink">{user.displayName}</div>
                <div className="text-xs text-ink-subtle">{dict.roles[user.role]}</div>
              </div>
              <SignOutButton label={dict.nav.signOut} />
            </div>
          ) : (
            <ButtonLink href="/login" variant="secondary" size="sm">
              {dict.nav.signIn}
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}

export function PageContainer({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main id="main" className={`mx-auto w-full ${wide ? "max-w-[1600px]" : "max-w-7xl"} px-4 py-6 sm:px-6 sm:py-8 lg:px-8`}>
      {children}
    </main>
  );
}
