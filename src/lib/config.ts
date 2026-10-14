/** Runtime feature flags read from the environment (server only). */

function flag(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/**
 * Demo features are on during development and off in a production build
 * (`next start`) unless explicitly enabled: a school that forgets the flags
 * must not end up with one-click teacher sign-in or accounts whose password
 * is published in the README.
 */
const developmentDefault = () => process.env.NODE_ENV !== "production";

/** One-click demo sign-in buttons (DEMO_MODE). */
export function demoModeEnabled(): boolean {
  return flag("DEMO_MODE", developmentDefault());
}

/**
 * Anyone may create a student account with a name and a password
 * (SELF_REGISTRATION, on by default). Set it to false when only teachers
 * should create accounts (from the class page).
 */
export function selfRegistrationEnabled(): boolean {
  return flag("SELF_REGISTRATION", true);
}

/**
 * Open access (OPEN_ACCESS, on by default): no sign-in and no registration.
 * Everyone who opens the site chooses "demo teacher" or "demo student" and
 * works as that demo account, so anyone with the link can do everything the
 * demo teacher can. Set OPEN_ACCESS=false for a school with real students:
 * the platform's own sign-in (and Supabase, when configured) is then back.
 * `npm run doctor` reports open access as a problem while it is on.
 */
export function openAccessEnabled(): boolean {
  return flag("OPEN_ACCESS", true);
}

/** The one-click demo sign-in route works with DEMO_MODE and with open access. */
export function demoSignInEnabled(): boolean {
  return demoModeEnabled() || openAccessEnabled();
}

/** Seed the demo school into an empty database (SEED_DEMO); open access needs it. */
export function seedDemoEnabled(): boolean {
  return flag("SEED_DEMO", developmentDefault() || openAccessEnabled());
}

/**
 * The time zone that decides when a school day begins and ends (SCHOOL_TIMEZONE,
 * an IANA name; Tbilisi by default): when the daily challenge changes and when a
 * streak day ends.
 */
export function schoolTimeZone(): string {
  const zone = process.env.SCHOOL_TIMEZONE?.trim();
  if (zone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return zone;
    } catch {
      // An unknown name falls back to the default rather than breaking every page.
    }
  }
  return "Asia/Tbilisi";
}
