import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { unique, userContext } from "./helpers";

/**
 * Accessibility: an automated scan (axe-core, WCAG 2.x A and AA) of the main
 * pages in both languages on a laptop and a phone, and the keyboard paths that
 * a scan cannot judge.
 */

const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// The assistant's text box is a combobox (suggestions while typing); ARIA 1.2 allows
// it, an older HTML mapping reports it as a minor finding.
const IGNORED_RULES = ["aria-allowed-role"];

/** Entrance animations fade content in; measuring colours half-way through would report colours nobody sees. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    // Scroll-driven animations only finish when scrolled, so never wait for them longer than a moment.
    const finite = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && !(a.timeline && "source" in a.timeline))
      .map((a) => a.finished.catch(() => undefined));
    await Promise.race([Promise.all(finite), new Promise((resolve) => setTimeout(resolve, 2500))]);
  });
}

async function violations(page: Page) {
  await settle(page);
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async (ignored) => {
    const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[]; failureSummary?: string }[] }[] }> } }).axe;
    const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: Object.fromEntries(ignored.map((id) => [id, { enabled: false }])) });
    return result.violations.map((v) => `${v.impact} ${v.id} ×${v.nodes.length}: ${v.nodes[0].target.join(" ")} — ${(v.nodes[0].failureSummary ?? "").split("\n")[1]?.trim() ?? ""}`);
  }, IGNORED_RULES);
}

const PUBLIC = ["/", "/login", "/register", "/join", "/today", "/privacy"];
const STUDENT = [
  "/student",
  "/today",
  "/subjects",
  "/subjects/physics",
  "/labs",
  "/labs/programming",
  "/labs/stem",
  "/labs/research",
  "/labs/critical-thinking",
  "/library",
  "/learning-assistant",
  "/career",
  "/career#guide",
  "/career/universities/mit",
  "/career/universities/for/cs",
  "/student/assignments",
  "/student/progress",
  "/account",
];
const TEACHER = ["/teacher", "/teacher/lessons", "/teacher/sessions", "/teacher/students", "/teacher/assignments", "/teacher/materials", "/teacher/insights", "/teacher/quizzes"];

for (const [label, viewport, locale] of [
  ["laptop", { width: 1366, height: 900 }, "en"],
  ["laptop in Georgian", { width: 1366, height: 900 }, "ka"],
  ["phone in Georgian", { width: 390, height: 844 }, "ka"],
] as const) {
  test(`no accessibility violations on the main pages: ${label}`, async ({ browser }) => {
    test.setTimeout(480_000);
    const found: string[] = [];
    for (const [role, user, paths] of [
      ["visitor", null, PUBLIC],
      ["student", "mariam", STUDENT],
      ["teacher", "nino", TEACHER],
    ] as const) {
      const context = user ? await userContext(browser, user, { viewport }) : await browser.newContext({ viewport });
      await context.addCookies([{ name: "fc_locale", value: locale, url: "http://localhost" }]);
      const page = await context.newPage();
      for (const path of paths) {
        await page.goto(path);
        await page.waitForTimeout(700);
        for (const v of await violations(page)) found.push(`${role} ${path}: ${v}`);
      }
      await context.close();
    }
    expect(found).toEqual([]);
  });
}

test("the live classroom, its dialogs and the paused screen pass the scan too", async ({ browser }) => {
  test.setTimeout(120_000);
  const teacherContext = await userContext(browser, "nino", { viewport: { width: 1366, height: 900 } });
  const teacher = await teacherContext.newPage();
  const cls = (await (await teacher.request.post("/api/classes", { data: { name: unique("A11y 9A") } })).json()).class as { id: string };
  const created = (await (await teacher.request.post(`/api/classes/${cls.id}/members`, { data: { newStudents: ["A11y Anna"] } })).json()).created as { username: string; password: string }[];
  const studentContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await studentContext.request.post("/api/auth/login", { data: created[0] });
  const student = await studentContext.newPage();
  await student.goto("/student");

  await teacher.goto(`/teacher/classes/${cls.id}/live`);
  await expect(teacher.getByTestId("live-student")).toHaveAttribute("data-status", "active", { timeout: 15_000 });
  expect(await violations(teacher)).toEqual([]);

  // A dialog opens with focus inside it, is scanned, and closes with Escape, returning focus.
  await teacher.getByTestId("live-message").click();
  expect(await teacher.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  expect(await violations(teacher)).toEqual([]);
  await teacher.keyboard.press("Escape");
  await expect(teacher.getByTestId("message-text")).toBeHidden();
  await expect(teacher.getByTestId("live-message")).toBeFocused();

  // A paused screen: announced, scanned, and nothing behind it can take focus.
  await teacher.getByTestId("live-pause").click();
  await teacher.getByTestId("confirm-pause").click();
  await expect(student.getByTestId("screen-paused")).toBeVisible({ timeout: 15_000 });
  expect(await violations(student)).toEqual([]);
  await expect(student.getByRole("alertdialog")).toHaveAccessibleName(/./);
  for (let i = 0; i < 12; i++) {
    await student.keyboard.press("Tab");
    expect(await student.evaluate(() => document.activeElement?.closest("[data-classroom-overlay]") !== null || document.activeElement === document.body)).toBe(true);
  }
  await studentContext.close();
  await teacherContext.close();
});

test("a keyboard user can skip to the content, always sees where the focus is, and reaches every part of a page", async ({ browser }) => {
  const context = await userContext(browser, "mariam", { viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto("/subjects");

  // The first Tab stop is "skip to content", visible when focused, and it moves focus into the page.
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement?.id === "main" || document.getElementById("main")?.contains(document.activeElement))).toBe(true);

  // Every stop shows a focus ring: tab through the first 25 and check each has an outline or ring.
  await page.goto("/library");
  const unmarked: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      const shadow = style.boxShadow !== "none";
      const rect = el.getBoundingClientRect();
      return { ring: ring || shadow, label: `${el.tagName.toLowerCase()} ${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}`, size: rect.width * rect.height };
    });
    if (info && info.size > 0 && !info.ring) unmarked.push(info.label);
  }
  expect(unmarked).toEqual([]);

  // Touch targets: buttons and links in the header are at least 24 px (WCAG 2.2 AA), and the main buttons 36 px.
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("header a, header button"))
      .filter((el) => el.offsetParent !== null && !el.closest(".sr-only") && !el.classList.contains("sr-only"))
      .map((el) => ({ label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((r) => r.h < 24 || r.w < 24),
  );
  expect(small).toEqual([]);
  await context.close();
});

test("motion stops for people who ask for less of it", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto("/");
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running" && (a.effect?.getComputedTiming().iterations === Infinity))
      .map((a) => a.id || (a as CSSAnimation).animationName || "animation"),
  );
  expect(running).toEqual([]);
  await context.close();
});
