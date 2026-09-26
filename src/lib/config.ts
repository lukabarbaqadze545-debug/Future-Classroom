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
 * Students may create their own accounts (SELF_REGISTRATION). Off by default
 * in production: teachers create student accounts from the class page.
 */
export function selfRegistrationEnabled(): boolean {
  return flag("SELF_REGISTRATION", developmentDefault());
}

/** Seed the demo school into an empty database (SEED_DEMO). */
export function seedDemoEnabled(): boolean {
  return flag("SEED_DEMO", developmentDefault());
}
