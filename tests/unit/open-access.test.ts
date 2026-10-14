import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { demoModeEnabled, demoSignInEnabled, openAccessEnabled, seedDemoEnabled } from "@/lib/config";
import { supabaseConfig } from "@/lib/supabase/config";
import { databasePath } from "@/lib/db";
import { uploadDir } from "@/lib/db/material-index";

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
  it("is on unless it is switched off explicitly", () => {
    delete process.env.OPEN_ACCESS;
    expect(openAccessEnabled()).toBe(true);
    process.env.OPEN_ACCESS = "yes";
    expect(openAccessEnabled()).toBe(true);
    process.env.OPEN_ACCESS = "true";
    expect(openAccessEnabled()).toBe(true);
    process.env.OPEN_ACCESS = "false";
    expect(openAccessEnabled()).toBe(false);
  });

  it("allows the one-click demo sign-in and seeds the demo school, even in a production build", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.DEMO_MODE;
    delete process.env.SEED_DEMO;
    delete process.env.OPEN_ACCESS;
    expect(demoModeEnabled()).toBe(false);
    expect(demoSignInEnabled()).toBe(true);
    expect(seedDemoEnabled()).toBe(true);
    // An explicit SEED_DEMO=false still wins.
    process.env.SEED_DEMO = "false";
    expect(seedDemoEnabled()).toBe(false);
    // With open access off, a production build has none of it.
    delete process.env.SEED_DEMO;
    process.env.OPEN_ACCESS = "false";
    expect(demoSignInEnabled()).toBe(false);
    expect(seedDemoEnabled()).toBe(false);
  });

  it("turns email sign-in through Supabase off while it is on, whatever is configured", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_abc";
    delete process.env.OPEN_ACCESS;
    expect(supabaseConfig()).toBeNull();
    process.env.OPEN_ACCESS = "false";
    expect(supabaseConfig()).toEqual({ url: "https://abcd.supabase.co", anonKey: "sb_publishable_abc" });
  });
});

describe("Where the data lives", () => {
  it("is the data folder of the project, and the temporary folder on Vercel (a read-only deployment)", () => {
    const saved = { VERCEL: process.env.VERCEL, DATABASE_PATH: process.env.DATABASE_PATH, UPLOAD_DIR: process.env.UPLOAD_DIR };
    try {
      delete process.env.DATABASE_PATH;
      delete process.env.UPLOAD_DIR;
      delete process.env.VERCEL;
      expect(databasePath()).toBe(path.join(process.cwd(), "data", "future-classroom.db"));
      expect(uploadDir()).toBe(path.join(process.cwd(), "data", "uploads"));
      process.env.VERCEL = "1";
      expect(databasePath()).toBe(path.join(os.tmpdir(), "future-classroom", "future-classroom.db"));
      expect(uploadDir()).toBe(path.join(os.tmpdir(), "future-classroom", "uploads"));
      // Explicit settings win everywhere.
      process.env.DATABASE_PATH = "/data/school.db";
      process.env.UPLOAD_DIR = "/data/files";
      expect(databasePath()).toBe("/data/school.db");
      expect(uploadDir()).toBe("/data/files");
    } finally {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
