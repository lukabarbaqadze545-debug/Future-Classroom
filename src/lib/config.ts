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
 * Open access (OPEN_ACCESS, off by default): no sign-in and no registration.
 * Everyone who opens the site chooses "demo teacher" or "demo student" and is
 * signed in as that demo account. For showing the platform (for example to a
 * school's director) on a demo database; never for real students: anyone with
 * the link can then do everything the demo teacher can. `npm run doctor`
 * reports it as a problem while it is on.
 */
export function openAccessEnabled(): boolean {
  return flag("OPEN_ACCESS", false);
}

/** The one-click demo sign-in route works with DEMO_MODE and with open access. */
export function demoSignInEnabled(): boolean {
  return demoModeEnabled() || openAccessEnabled();
}

/** Seed the demo school into an empty database (SEED_DEMO); open access needs it. */
export function seedDemoEnabled(): boolean {
  return flag("SEED_DEMO", developmentDefault() || openAccessEnabled());
}
