import { afterEach, describe, expect, it } from "vitest";
import { demoModeEnabled, demoSignInEnabled, openAccessEnabled, seedDemoEnabled } from "@/lib/config";
import { supabaseConfig } from "@/lib/supabase/config";

const VARIABLES = ["OPEN_ACCESS", "DEMO_MODE", "SEED_DEMO", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const saved = Object.fromEntries(VARIABLES.map((name) => [name, process.env[name]]));
const mode = process.env.NODE_ENV;

afterEach(() => {
  for (const name of VARIABLES) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  (process.env as Record<string, string | undefined>).NODE_ENV = mode;
});

describe("Open access (no sign-in)", () => {
  it("is off unless it is switched on explicitly", () => {
    delete process.env.OPEN_ACCESS;
    expect(openAccessEnabled()).toBe(false);
    process.env.OPEN_ACCESS = "false";
    expect(openAccessEnabled()).toBe(false);
    process.env.OPEN_ACCESS = "yes";
    expect(openAccessEnabled()).toBe(false);
    process.env.OPEN_ACCESS = "true";
    expect(openAccessEnabled()).toBe(true);
  });

  it("allows the one-click demo sign-in and seeds the demo school, even in a production build", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.DEMO_MODE;
    delete process.env.SEED_DEMO;
    delete process.env.OPEN_ACCESS;
    expect(demoModeEnabled()).toBe(false);
    expect(demoSignInEnabled()).toBe(false);
    expect(seedDemoEnabled()).toBe(false);
    process.env.OPEN_ACCESS = "true";
    expect(demoModeEnabled()).toBe(false);
    expect(demoSignInEnabled()).toBe(true);
    expect(seedDemoEnabled()).toBe(true);
    // An explicit SEED_DEMO=false still wins.
    process.env.SEED_DEMO = "false";
    expect(seedDemoEnabled()).toBe(false);
  });

  it("turns email sign-in through Supabase off, whatever is configured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_abc";
    delete process.env.OPEN_ACCESS;
    expect(supabaseConfig()).toEqual({ url: "https://abcd.supabase.co", anonKey: "sb_publishable_abc" });
    process.env.OPEN_ACCESS = "true";
    expect(supabaseConfig()).toBeNull();
  });
});
