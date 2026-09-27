import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, userContext, userPage } from "./helpers";

/**
 * The university guide in Career & University: built-in, sourced and dated
 * entries for computer science, medicine and the arts, in Georgia and abroad.
 */

test("a student compares universities for medicine and saves one to their research", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "elene");
  await page.goto("/career#guide");
  const guide = page.getByTestId("university-guide");
  await expect(guide).toBeVisible();
  // The date the facts were checked, and where to confirm them, come first.
  await expect(page.getByTestId("guide-checked")).toContainText("Checked on");
  await expect(page.getByTestId("guide-georgia")).toContainText("17 December 2025");

  // Filters: all → Asia → computer science in Georgia.
  const list = page.getByTestId("guide-list");
  const all = await list.getByTestId("guide-university").count();
  expect(all).toBeGreaterThanOrEqual(20);
  await page.getByTestId("guide-region-asia").click();
  await expect(page.getByTestId("guide-region-asia")).toHaveAttribute("aria-pressed", "true");
  await expect(list.getByTestId("guide-university")).toHaveCount(2);
  await expect(list).toContainText("KAIST");
  await page.getByTestId("guide-region-georgia").click();
  await page.getByTestId("guide-field").selectOption("medicine");
  await expect(list.getByTestId("guide-university")).toHaveCount(1);
  await expect(list).toContainText("Tbilisi State Medical University");
  await page.getByTestId("guide-field").selectOption("art");
  await page.getByTestId("guide-region-north_america").click();
  await expect(list.getByTestId("guide-university")).toHaveCount(1);
  await expect(list).toContainText("Rhode Island School of Design");

  // Which university for medicine? The comparison page.
  await page.getByTestId("guide-fields").getByRole("link", { name: /Medicine/ }).click();
  await expect(page).toHaveURL(/\/career\/universities\/for\/medicine$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which university for medicine?");
  await expect(page.getByTestId("field-bottom-line")).toContainText("Stipendium Hungaricum");

  // Semmelweis: how to get in, what it costs, how to pay.
  await page.getByTestId("field-paths").getByRole("link", { name: /Semmelweis/ }).click();
  await expect(page).toHaveURL(/\/career\/universities\/semmelweis\?field=medicine$/);
  await expect(page.getByTestId("guide-admission")).toContainText("entrance exam");
  await expect(page.getByTestId("guide-tuition")).toContainText("US$10,450");
  await expect(page.getByTestId("guide-funding")).toContainText("Stipendium Hungaricum");
  await expect(page.getByTestId("guide-detail").getByRole("link", { name: /Stipendium Hungaricum/ }).first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.getByTestId("guide-abroad")).toBeVisible();

  await page.getByTestId("guide-save").click();
  await expect(page.getByTestId("guide-save")).toHaveText("Saved to your university research");
  await expect(page.getByTestId("guide-save")).toBeDisabled();

  // It is now one of the student's own university cards, with the facts and a checked date.
  await page.goto("/career#universities");
  const card = page.getByTestId("university-card").filter({ hasText: "Semmelweis University" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Medicine");
  await expect(card).toContainText("US$10,450");

  expect(errors).toEqual([]);
  await context.close();
});

test("the guide in Georgian: Georgian universities, reform rules and scholarships", async ({ browser, baseURL }) => {
  const context = await userContext(browser, "tamar");
  await context.addCookies([{ name: "fc_locale", value: "ka", url: baseURL! }]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/career#guide");
  await expect(page.getByRole("tab", { name: "უნივერსიტეტების გზამკვლევი" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("guide-checked")).toContainText("გადამოწმების თარიღი");
  await expect(page.getByTestId("guide-georgia")).toContainText("2025 წლის 17 დეკემბერს გაუქმდა");
  await page.getByTestId("guide-region-georgia").click();
  await page.getByTestId("guide-field").selectOption("cs");
  const list = page.getByTestId("guide-list");
  await expect(list).toContainText("ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი · თსუ");
  await expect(list).toContainText("თავისუფალი უნივერსიტეტი");

  await list.getByRole("link", { name: /ქუთაისის საერთაშორისო უნივერსიტეტი/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ქუთაისის საერთაშორისო უნივერსიტეტი");
  await expect(page.getByTestId("guide-tuition")).toContainText("2 250 ლარი");
  await expect(page.getByTestId("guide-detail")).toContainText("რატომ ეს უნივერსიტეტი — კომპიუტერული მეცნიერება");

  await page.goto("/career/universities/for/art");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("რომელი უნივერსიტეტი ავირჩიო ხელოვნებისთვის, დიზაინისთვის, კინოსთვის ან მუსიკისთვის?");
  await expect(page.getByTestId("guide-scholarships")).toContainText("Stipendium Hungaricum (უნგრეთი)");

  // An unknown university is a plain 404.
  const missing = await page.goto("/career/universities/nowhere");
  expect(missing?.status()).toBe(404);
  expect((await page.request.post("/api/career/universities/from-guide", { data: { id: "nowhere", field: null } })).status()).toBe(404);

  expect(errors).toEqual([]);
  await context.close();
});

test("works by touch on a phone in Georgian, without sideways scrolling", async ({ browser, baseURL }) => {
  const context = await userContext(browser, "tamar", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addCookies([{ name: "fc_locale", value: "ka", url: baseURL! }]);
  const page = await context.newPage();
  await page.goto("/career#guide");
  await page.getByTestId("guide-region-europe").tap();
  await expect(page.getByTestId("guide-list")).toContainText("ციურიხის ფედერალური ტექნოლოგიური ინსტიტუტი");
  await expectNoHorizontalScroll(page);
  for (const path of ["/career/universities/eth", "/career/universities/charite", "/career/universities/for/cs"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
  await context.close();
});
