import { expect, type Browser, type BrowserContext, type BrowserContextOptions, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo1234";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;
const signedIn = new Map<string, StorageState>();

/**
 * A browser context signed in as one of the demo accounts. Each account signs
 * in once per test run and the session is reused, so the suite stays well
 * under the login rate limit.
 */
export async function userContext(browser: Browser, username: string, options: BrowserContextOptions = {}) {
  let state = signedIn.get(username);
  if (!state) {
    const context = await browser.newContext();
    const res = await context.request.post("/api/auth/login", { data: { username, password: DEMO_PASSWORD } });
    expect(res.ok(), `sign in as ${username}`).toBeTruthy();
    state = await context.storageState();
    signedIn.set(username, state);
    await context.close();
  }
  return browser.newContext({ ...options, storageState: state });
}

/** A signed-in page with page errors collected. */
export async function userPage(browser: Browser, username: string, viewport = { width: 1366, height: 900 }) {
  const context = await userContext(browser, username, { viewport });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

/** A short unique suffix so repeated runs against one database never collide. */
export function unique(label: string) {
  return `${label} ${Date.now().toString(36).slice(-5)}`;
}

/** The page must not scroll sideways at the current viewport width. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(1);
}
