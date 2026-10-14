import { expect, test } from "@playwright/test";
import { userContext } from "./helpers";

/**
 * Loading a page must not produce a failed request or a console error, and the
 * page must be light. A silent failure (a request that is refused and retried
 * a few seconds later) shows nowhere else.
 */

const PAGES = ["/student", "/today", "/subjects", "/labs", "/labs/programming", "/labs/stem", "/library", "/learning-assistant", "/career", "/career/universities/mit", "/student/progress"];

test("student pages load without failed requests or console errors, and stay light", async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await userContext(browser, "mariam", { viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const problems: string[] = [];
  let current = "";
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`${current}: console error: ${m.text().slice(0, 160)}`);
  });
  page.on("pageerror", (e) => problems.push(`${current}: ${e.message.slice(0, 160)}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url() || "http://localhost").origin) problems.push(`${current}: ${r.status()} ${new URL(r.url()).pathname}`);
  });
  const heavy: string[] = [];
  for (const path of PAGES) {
    current = path;
    let bytes = 0;
    const count = (r: import("@playwright/test").Response) => {
      void r.body().then((b) => (bytes += b.length)).catch(() => undefined);
    };
    page.on("response", count);
    await page.goto(path);
    // The first heartbeat goes out as the page opens; wait for it, and for the page to settle.
    await page.waitForResponse((r) => r.url().endsWith("/api/classroom/heartbeat"), { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    page.off("response", count);
    // Uncompressed bytes on the wire for one page load (scripts, styles, fonts, data), warm cache excluded.
    if (bytes > 2_500_000) heavy.push(`${path}: ${(bytes / 1e6).toFixed(1)} MB`);
  }
  expect(problems).toEqual([]);
  expect(heavy).toEqual([]);
  await context.close();
});
