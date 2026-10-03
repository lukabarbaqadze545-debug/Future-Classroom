import { defineConfig } from "@playwright/test";

const APP_PORT = Number(process.env.E2E_SUPABASE_PORT ?? 3212);
const MOCK_PORT = Number(process.env.E2E_MOCK_SUPABASE_PORT ?? 3299);

/**
 * The email sign-up flow against a stand-in for Supabase (tests/e2e-supabase/
 * mock-supabase.mjs): the site runs with the two NEXT_PUBLIC_SUPABASE_*
 * variables pointing at it. The ordinary e2e suite (playwright.config.ts) runs
 * with Supabase off, as a school without internet would.
 *
 *   npm run test:e2e:supabase
 *
 * Set PLAYWRIGHT_CHROMIUM_PATH to use a system Chromium.
 */
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const ANON_KEY = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role: "anon", iss: "supabase" })}.mock-signature`;

export default defineConfig({
  testDir: "tests/e2e-supabase",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1366, height: 900 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  webServer: [
    {
      command: `node tests/e2e-supabase/mock-supabase.mjs ${MOCK_PORT}`,
      url: `http://127.0.0.1:${MOCK_PORT}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `node scripts/e2e-server.mjs ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: "pipe",
      env: { NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY },
    },
  ],
});
