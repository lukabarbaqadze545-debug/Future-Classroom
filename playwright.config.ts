import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);

/**
 * End-to-end tests run against a production build with a fresh demo
 * database and AI disabled, so they exercise the offline behaviour a school
 * gets without an API key. Set PLAYWRIGHT_CHROMIUM_PATH to use a system
 * Chromium instead of a Playwright-managed one.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1366, height: 900 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `node scripts/e2e-server.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
  },
});
