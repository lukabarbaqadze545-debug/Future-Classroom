import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, unique, userContext, userPage } from "./helpers";

// The e2e server runs with no AI key (ANTHROPIC_API_KEY=""), so every test in
// this suite also checks that the labs never depend on AI.

test("labs work with AI disabled and never say a feature is unavailable", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "mariam");
  await page.goto("/student");
  await expect(page.getByText("AI offline").first()).toBeVisible();
  for (const path of ["/labs", "/labs/programming/l2-count-vowels", "/labs/critical-thinking/ct-claims-1", "/labs/stem/simulations/projectile", "/labs/research", "/library", "/career"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(/feature cannot be used|AI unavailable/i);
  }
  expect(errors).toEqual([]);
  await context.close();
});

test("network interruption: work stays on the computer and saves once back online", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "saba");
  await page.goto("/labs/research");
  await page.getByTestId("research-title").fill(unique("Offline test"));
  await page.getByTestId("create-research").click();
  await expect(page.getByTestId("research-workspace")).toBeVisible();

  await context.setOffline(true);
  await page.getByTestId("research-question").fill("How far do students travel to school?");
  await page.getByTestId("save-research").click();
  await expect(page.getByText("Can't reach the classroom server. Check the connection.")).toBeVisible();
  await expect(page.getByText("Unsaved changes")).toBeVisible();

  // Back online: even after a reload the typed work is still there.
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByTestId("research-question")).toHaveValue("How far do students travel to school?");
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await page.getByTestId("save-research").click();
  await expect(page.getByText(/Draft · Last saved/)).toBeVisible();

  // Saved on the server, not only locally.
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("research-question")).toHaveValue("How far do students travel to school?");
  expect(errors).toEqual([]);
  await context.close();
});

test("the same work open in two tabs stays consistent", async ({ browser }) => {
  const { context, page: first, errors } = await userPage(browser, "tamar");
  await first.goto("/labs/stem#projects");
  await first.getByTestId("start-project-water-filter").click();
  await expect(first).toHaveURL(/\/labs\/stem\/projects\/\w+/);
  const second = await context.newPage();
  second.on("pageerror", (error) => errors.push(error.message));
  await second.goto(first.url());

  // A draft typed in one tab appears in the other.
  await first.getByTestId("project-problem").fill("Muddy water from the school garden needs to be clear enough to water seedlings.");
  await expect(second.getByTestId("project-problem")).toHaveValue(/Muddy water from the school garden/);

  // Saved in one tab, a reload of the other shows the saved version.
  await first.getByTestId("save-project").click();
  await expect(first.getByText(/Draft · Last saved/)).toBeVisible();
  await second.reload();
  await expect(second.getByTestId("project-problem")).toHaveValue(/Muddy water from the school garden/);
  await expect(second.getByText(/Draft · Last saved/)).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("shared workstation: the next student never sees the previous student's drafts", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const signInHere = async (username: string) => {
    const res = await page.request.post("/api/auth/login", { data: { username, password: "demo1234" } });
    expect(res.ok()).toBeTruthy();
  };

  await signInHere("ana");
  await page.goto("/labs/programming/l1-sum-to-n");
  await page.getByTestId("code-editor").fill("# Ana's unfinished solution\nprint(42)");
  await page.goto("/labs/critical-thinking/ct-fallacies-1");
  await page.getByTestId("ct-item").first().getByTestId("ct-option").first().click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await signInHere("nika");
  await page.goto("/labs/programming/l1-sum-to-n");
  await expect(page.getByTestId("code-editor")).not.toHaveValue(/Ana's unfinished solution/);
  await page.goto("/labs/critical-thinking/ct-fallacies-1");
  await expect(page.getByTestId("ct-item").first().locator("input:checked")).toHaveCount(0);

  // Even without signing out, drafts belong to the account that wrote them.
  await page.goto("/labs/programming/l1-sum-to-n");
  await page.getByTestId("code-editor").fill("# Nika's draft\nprint(7)");
  await signInHere("ana");
  await page.goto("/labs/programming/l1-sum-to-n");
  await expect(page.getByTestId("code-editor")).not.toHaveValue(/Nika's draft/);
  await context.close();
});

test("touchscreen: simulations respond to taps", async ({ browser }) => {
  const context = await userContext(browser, "mariam", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/labs/stem/simulations/probability");
  await page.getByRole("button", { name: "Roll 100 times" }).tap();
  await expect(page.getByText("100 rolls", { exact: true })).toBeVisible();
  await page.goto("/labs/stem/simulations/projectile");
  await page.getByRole("button", { name: "Launch" }).tap();
  await expectNoHorizontalScroll(page);
  await context.close();
});

const STUDENT_PAGES = [
  "/student",
  "/labs",
  "/labs/programming",
  "/labs/programming/l1-sum-to-n",
  "/labs/critical-thinking",
  "/labs/critical-thinking/ct-fallacies-1",
  "/labs/stem",
  "/labs/stem/experiments/pendulum",
  "/labs/stem/simulations/circuit",
  "/labs/stem/robotics/line-follower",
  "/labs/research",
  "/labs/research/research-mariam-sleep",
  "/library",
  "/library/lib-think-python",
  "/career",
  "/career/portfolio",
  "/student/assignments",
  "/student/progress",
];

const TEACHER_PAGES = ["/teacher", "/teacher/sessions/new", "/teacher/lessons/review", "/account", "/teacher/assignments", "/teacher/assignments/new", "/teacher/students", "/teacher/sessions/labs", "/library/labels", "/labs/programming/new"];

for (const [label, width, height, touch, locale] of [
  ["phone", 390, 844, true, "en"],
  ["phone in Georgian", 390, 844, true, "ka"],
  ["tablet", 768, 1024, true, "en"],
  ["laptop", 1366, 900, false, "en"],
  ["classroom display", 1920, 1080, false, "en"],
] as const) {
  test(`no sideways scrolling on a ${label} (${width}px)`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    for (const [username, pages] of [
      ["mariam", STUDENT_PAGES],
      ["nino", TEACHER_PAGES],
    ] as const) {
      const context = await userContext(browser, username, { viewport: { width, height }, hasTouch: touch, isMobile: touch && width < 500 });
      // Georgian words are long: the layout must still wrap instead of scrolling.
      await context.addCookies([{ name: "fc_locale", value: locale, url: baseURL! }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const path of pages) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(200);
        await expectNoHorizontalScroll(page);
      }
      expect(errors).toEqual([]);
      await context.close();
    }
  });
}
