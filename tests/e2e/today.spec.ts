import { expect, test, type Page } from "@playwright/test";
import { challengeFor } from "@/lib/daily/pick";
import { dayKey, emptyState } from "@/lib/engagement/model";

/**
 * "Today": the daily challenge, streak, experience and badges. It needs no
 * account, so these run signed out; what the visitor earns lives in the
 * browser. The tests read today's answer from the same module the server uses.
 */

const TZ = "Asia/Tbilisi";
const today = () => dayKey(new Date(), TZ);
const question = () => challengeFor(today(), "en");

async function answerWith(page: Page, right: boolean) {
  const q = question();
  if (q.type === "choice") {
    const option = q.options.find((o) => (o.text === q.answer) === right)!;
    await page.getByTestId(`option-${option.id}`).click();
  } else {
    await page.getByTestId("challenge-input").fill(right ? q.answer : "zzz-wrong");
  }
  await page.getByTestId("challenge-check").click();
}

async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/today");
  await expect(page.getByTestId("today-hero")).toBeVisible();
  return errors;
}

test("a first visit needs no account: the question, the missions and the badges are all there", async ({ page }) => {
  const errors = await open(page);
  await expect(page.getByTestId("today-name-input")).toBeVisible();
  await expect(page.getByTestId("streak-number")).toHaveText("0");
  await expect(page.getByTestId("challenge-prompt")).toContainText(question().prompt.split("\n\n")[0].slice(0, 30));
  await expect(page.getByTestId("quest-challenge")).toHaveAttribute("data-done", "false");
  await expect(page.getByTestId("badge-firstStep")).toHaveAttribute("data-earned", "false");
  // The header of every page carries the streak and leads here.
  await expect(page.getByTestId("streak-chip")).toBeVisible();
  await expect(page.getByRole("link", { name: "Today", exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the name is remembered in this browser", async ({ page }) => {
  await open(page);
  await page.getByTestId("today-name-input").fill("Luka");
  await page.getByTestId("today-name-save").click();
  await expect(page.getByTestId("today-greeting")).toContainText("Luka");
  await page.reload();
  await expect(page.getByTestId("today-greeting")).toContainText("Luka");
});

test("a wrong answer gives a hint and a retry, a right one earns the streak, experience and badges", async ({ page }) => {
  const errors = await open(page);
  await answerWith(page, false);
  await expect(page.getByTestId("challenge-wrong")).toBeVisible();
  await expect(page.getByTestId("challenge-try")).toContainText("Try 2 of 3");
  // Trying is not yet learning something: no streak day.
  await expect(page.getByTestId("streak-number")).toHaveText("0");

  await answerWith(page, true);
  await expect(page.getByTestId("challenge-result")).toBeVisible();
  await expect(page.getByTestId("daily-challenge")).toHaveAttribute("data-status", "solved");
  await expect(page.getByTestId("streak-number")).toHaveText("1");
  await expect(page.getByTestId("xp-total")).not.toHaveText("0");
  await expect(page.getByTestId("quest-challenge")).toHaveAttribute("data-done", "true");
  await expect(page.getByTestId("badge-firstStep")).toHaveAttribute("data-earned", "true");
  await expect(page.getByTestId("badge-challenge1")).toHaveAttribute("data-earned", "true");
  // Solved on the second try: no "first try" badge.
  await expect(page.getByTestId("badge-firstTry")).toHaveAttribute("data-earned", "false");
  await expect(page.getByTestId("next-challenge")).toContainText(/\d\d:\d\d:\d\d/);
  await expect(page.getByTestId("toasts")).toContainText("1-day streak");
  await expect(page.getByTestId("streak-chip")).toHaveAttribute("aria-label", /1 day streak/);

  // Everything survives a reload, and the question is closed for today.
  await page.reload();
  await expect(page.getByTestId("daily-challenge")).toHaveAttribute("data-status", "solved");
  await expect(page.getByTestId("streak-number")).toHaveText("1");
  await expect(page.getByTestId("challenge-check")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a first-try answer earns the sharp-shooter badge and can be shared", async ({ page }) => {
  await open(page);
  await answerWith(page, true);
  await expect(page.getByTestId("badge-firstTry")).toHaveAttribute("data-earned", "true");
  await page.getByTestId("challenge-share").click();
  const note = page.getByTestId("share-note");
  await expect(note).toBeVisible();
});

test("using up the tries shows the answer, keeps the streak and still counts the day", async ({ page }) => {
  // The browser has already seen two wrong tries today (kept across a reload).
  const fresh = emptyState(today());
  await page.addInitScript((state) => window.localStorage.setItem("fc:engagement:v1", JSON.stringify(state)), { ...fresh, today: { ...fresh.today, attempts: 2 } });
  await open(page);
  await expect(page.getByTestId("challenge-try")).toContainText("Try 3 of 3");
  await answerWith(page, false);
  await expect(page.getByTestId("daily-challenge")).toHaveAttribute("data-status", "missed");
  await expect(page.getByTestId("challenge-answer")).toContainText(question().answer);
  await expect(page.getByTestId("streak-number")).toHaveText("1");
  // Giving it a go counts as showing up, but it is not a solved challenge.
  await expect(page.getByTestId("badge-firstStep")).toHaveAttribute("data-earned", "true");
  await expect(page.getByTestId("badge-challenge1")).toHaveAttribute("data-earned", "false");
});

test("the question is graded on the server: the page carries no answer", async ({ page }) => {
  await open(page);
  const q = question();
  const html = await page.content();
  for (const secret of [q.solution, q.explanation, ...q.hints]) {
    if (secret.length > 12) expect(html.includes(secret)).toBe(false);
  }
  // Asking for another day's answer is refused.
  const stale = await page.request.post("/api/daily/check", { data: { day: "2020-01-01", answer: { optionIds: ["a"], text: "" }, attempt: 1 } });
  expect(stale.status()).toBe(409);
});

test("the streak and level are the visitor's own: a demo student still starts from zero", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-student").click();
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("today-strip")).toBeVisible();
  await expect(page.getByTestId("streak-chip")).toContainText("0");
  await page.getByTestId("today-strip").click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId("streak-number")).toHaveText("0");
});

test("starting over clears the streak, after asking", async ({ page }) => {
  await open(page);
  await answerWith(page, true);
  await expect(page.getByTestId("streak-number")).toHaveText("1");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByTestId("today-reset").click();
  await expect(page.getByTestId("streak-number")).toHaveText("0");
  await expect(page.getByTestId("daily-challenge")).toHaveAttribute("data-status", "open");
});

test("works by touch on a phone, without sideways scrolling", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL: baseURL!, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await open(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await answerWith(page, true);
  await expect(page.getByTestId("challenge-result")).toBeVisible();
  const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflowAfter).toBeLessThanOrEqual(0);
  await context.close();
});

test("the home page shows today's question and leads to it", async ({ page }) => {
  await page.goto("/");
  const teaser = page.getByTestId("landing-today");
  await expect(teaser).toContainText(question().prompt.split("\n\n")[0].slice(0, 30));
  await teaser.click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId("daily-challenge")).toBeVisible();
});

test("a teacher puts today's challenge on the board, with hints and the answer behind buttons", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-teacher").click();
  await expect(page).toHaveURL(/\/teacher$/);
  await page.getByTestId("dashboard-warm-up").click();
  await expect(page).toHaveURL(/\/present\/daily$/);
  const q = question();
  await expect(page.getByTestId("present-daily")).toContainText(q.prompt.split("\n\n")[0].slice(0, 30));
  // Nothing about the answer until the teacher asks.
  await expect(page.getByTestId("present-daily-answer")).toHaveCount(0);
  if (q.hints.length > 1) {
    await page.getByTestId("present-daily-hint").click();
    await expect(page.getByTestId("present-daily-hints")).toContainText(q.hints[0]);
  }
  await page.getByTestId("present-daily-reveal").click();
  await expect(page.getByTestId("present-daily-answer")).toContainText(q.answer);
  await page.getByTestId("present-daily-reveal").click();
  await expect(page.getByTestId("present-daily-answer")).toHaveCount(0);
});

test("a student cannot open the board view", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-student").click();
  await expect(page).toHaveURL(/\/student$/);
  await page.goto("/present/daily");
  await expect(page).toHaveURL(/\/student$/);
});

test("answers from the keyboard: A–D choose, Enter checks", async ({ page }) => {
  await open(page);
  const q = question();
  if (q.type === "choice") {
    const index = q.options.findIndex((o) => o.text === q.answer);
    await page.keyboard.press(String.fromCharCode(97 + index));
    await expect(page.getByTestId("challenge-check")).toBeEnabled();
    await page.keyboard.press("Enter");
  } else {
    await page.getByTestId("challenge-input").fill(q.answer);
    await page.keyboard.press("Enter");
  }
  await expect(page.getByTestId("daily-challenge")).toHaveAttribute("data-status", "solved");
});

test("the activity map shows as many weeks as fit, and the navigation line sits under the current page", async ({ page, browser, baseURL }) => {
  await open(page);
  await expect(page.locator('[data-testid="activity-map"] .fc-cell:visible')).toHaveCount(26 * 7);
  const bar = page.locator(".fc-nav-bar");
  await expect(bar).toHaveCSS("opacity", "1");
  expect(await bar.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(10);

  const phone = await browser.newContext({ baseURL: baseURL!, viewport: { width: 390, height: 844 } });
  const small = await phone.newPage();
  await small.goto("/today");
  await expect(small.getByTestId("today-hero")).toBeVisible();
  await expect(small.locator('[data-testid="activity-map"] .fc-cell:visible')).toHaveCount(16 * 7);
  await phone.close();
});

test("the home page counts what the platform contains, and holds still when motion is off", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL: baseURL!, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const numbers = await page.locator("dl dd .sr-only").allInnerTexts();
  expect(numbers).toHaveLength(4);
  for (const n of numbers) expect(Number(n)).toBeGreaterThan(0);
  // Without motion nothing is waiting to appear and nothing drifts.
  const animated = await page.evaluate(() => [...document.querySelectorAll(".fc-reveal, .fc-rise, .fc-aurora > i, .fc-count")].filter((el) => getComputedStyle(el).animationName !== "none").length);
  expect(animated).toBe(0);
  await expect(page.locator(".fc-reveal").first()).toHaveCSS("opacity", "1");
  await context.close();
});
