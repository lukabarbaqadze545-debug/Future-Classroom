import { expect, test } from "@playwright/test";
import { userContext, userPage } from "./helpers";

test("student finds a subject, follows its learning path and reads a lesson in Georgian", async ({ browser }) => {
  const context = await userContext(browser, "mariam", { viewport: { width: 1366, height: 900 } });
  await context.addCookies([{ name: "fc_locale", value: "ka", url: test.info().project.use.baseURL! }]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/student");
  await page.getByRole("link", { name: "საგნები", exact: true }).first().click();
  await expect(page).toHaveURL(/\/subjects$/);
  await expect(page.getByTestId("subject-card")).toHaveCount(18);

  // Filters narrow the catalogue; search finds topics, not only subject names.
  await page.getByTestId("subject-search").fill("ნიუტონ");
  await expect(page.getByTestId("subject-card").filter({ hasText: "ფიზიკა" })).toBeVisible();
  expect(await page.getByTestId("subject-card").count()).toBeLessThan(18);
  await page.getByTestId("subject-card").filter({ hasText: "ფიზიკა" }).click();
  await expect(page).toHaveURL(/\/subjects\/physics$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ფიზიკა");
  await expect(page).toHaveTitle(/^ფიზიკა ·/);

  // The learning path links to real content; lessons open in the interface language.
  const path = page.getByTestId("learning-path");
  await expect(path.getByTestId("subject-item").first()).toBeVisible();
  await page.getByTestId("explorer-kind").selectOption("lesson");
  await page.getByTestId("subject-item").getByRole("link", { name: /ნიუტონის კანონები/ }).first().click();
  await expect(page).toHaveURL(/\/student\/learn\//);
  await expect(page.locator("html")).toHaveAttribute("lang", "ka");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ნიუტონ");

  // Switching the interface language swaps the built-in lesson for its English version.
  await page.getByRole("button", { name: /English/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Newton");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
  await context.close();
});

test("teacher can preview, assign and run subject content", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "nino");
  await page.goto("/subjects/mathematics");
  const item = page.getByTestId("subject-item").filter({ has: page.getByRole("link", { name: /Assign/ }) }).first();
  await expect(item).toBeVisible();
  await item.getByRole("link", { name: /Assign/ }).click();
  await expect(page).toHaveURL(/\/teacher\/assignments\/new\?kind=\w+&ref=/);
  await expect(page.getByTestId("assignment-item")).not.toHaveValue("");

  await page.goto("/subjects/computer_science");
  await expect(page.getByTestId("subject-item").getByRole("link", { name: /Run in class/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("dynamic simulation text follows a language switch", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "giorgi");
  await context.addCookies([{ name: "fc_locale", value: "ka", url: test.info().project.use.baseURL! }]);
  await page.goto("/labs/stem/simulations/projectile");
  const challenge = page.getByTestId("stem-challenge");
  await expect(challenge).toContainText("მ/წმ");
  await expect(page.getByTestId("simulation")).toContainText("თავისუფალი ვარდნის აჩქარება");
  await page.getByRole("button", { name: /English/ }).click();
  await expect(challenge).toContainText("m/s");
  await expect(challenge).not.toContainText("მ/წმ");
  await expect(page.getByTestId("simulation")).toContainText("Gravity");
  expect(errors).toEqual([]);
  await context.close();
});
