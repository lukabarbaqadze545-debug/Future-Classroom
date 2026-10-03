import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_OPEN_PORT ?? 3214);

/**
 * The site in open-access mode (the default): no sign-in or registration,
 * the visitor picks the demo teacher or the demo student view.
 *
 *   npm run test:e2e:open
 *
 * Set PLAYWRIGHT_CHROMIUM_PATH to use a system Chromium.
 */
export default defineConfig({
  testDir: "tests/e2e-open",
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
    env: { OPEN_ACCESS: "true" },
  },
});
