import { expect, test, type Page } from "@playwright/test";
import { unique } from "./helpers";

/** Registration asks only for a name and a password; the name is the sign-in name. */

async function signIn(page: Page, name: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Name or username").fill(name);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("register with a name and a password, explore, sign out and back in", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const name = unique("Lika Test");
  const password = "my-first-password";

  // --- Register: two fields, nothing else ----------------------------------
  await page.goto("/login");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator("form", { has: page.getByTestId("register-name") }).locator("input")).toHaveCount(2);
  await page.getByTestId("register-name").fill(name);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-submit").click();

  // --- Straight into the platform -------------------------------------------
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText(name);
  for (const path of ["/subjects", "/subjects/physics", "/labs", "/labs/programming", "/labs/stem", "/library", "/career"]) {
    await page.goto(path);
    await expect(page.locator("main"), path).toBeVisible();
    await expect(page.locator("body"), path).not.toContainText("We couldn't find that");
  }
  await page.goto("/subjects/physics");
  await page.getByTestId("subject-item").getByRole("link", { name: /Waves/ }).first().click();
  await expect(page).toHaveURL(/\/student\/learn\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Waves");

  // --- The session persists across reloads and new tabs ----------------------
  await page.reload();
  await expect(page.getByTestId("account-link")).toContainText(name);
  const second = await context.newPage();
  await second.goto("/student");
  await expect(second.getByTestId("account-link")).toContainText(name);
  await second.close();

  // --- Sign out ----------------------------------------------------------------
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/student");
  await expect(page).toHaveURL(/\/login/);

  // --- Wrong password, then the right one (letter case of the name does not matter)
  await signIn(page, name, "not-my-password");
  await expect(page.getByText("Name or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, name.toUpperCase(), password);
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText(name);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  // --- The same name cannot be registered twice ------------------------------------
  await page.goto("/register");
  await page.getByTestId("register-name").fill(name.toLowerCase());
  await page.getByTestId("register-password").fill("another-password");
  await page.getByTestId("register-submit").click();
  await expect(page.getByText("This name is already taken. Add your surname or a number.")).toBeVisible();

  expect(errors).toEqual([]);
  await context.close();
});

test("existing teacher and student accounts still sign in", async ({ browser }) => {
  for (const [username, home] of [
    ["nino", /\/teacher$/],
    ["mariam", /\/student$/],
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, username, "demo1234");
    await expect(page).toHaveURL(home);
    await context.close();
  }
});

test("sign-in and registration screens are in Georgian", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addCookies([{ name: "fc_locale", value: "ka", url: "http://localhost" }]);
  const page = await context.newPage();
  await page.goto("/register");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ანგარიშის შექმნა");
  await expect(page.getByLabel("შენი სახელი")).toBeVisible();
  await expect(page.getByLabel("პაროლი", { exact: true })).toBeVisible();
  await expect(page.getByTestId("register-submit")).toHaveText("ანგარიშის შექმნა");

  const name = unique("ლიკა");
  await page.getByLabel("შენი სახელი").fill(name);
  await page.getByLabel("პაროლი", { exact: true }).fill("ჩემი-პაროლი-1");
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL(/\/student$/);
  await page.getByRole("button", { name: "გასვლა" }).click();

  await page.goto("/login");
  await expect(page.getByLabel("სახელი ან მომხმარებლის სახელი")).toBeVisible();
  await page.getByLabel("სახელი ან მომხმარებლის სახელი").fill(name);
  await page.getByLabel("პაროლი", { exact: true }).fill("არასწორი-პაროლი");
  await page.getByRole("button", { name: "შესვლა", exact: true }).click();
  await expect(page.getByText("სახელი ან პაროლი არასწორია.")).toBeVisible();
  await expect(page.getByRole("link", { name: "შექმენი ანგარიში" })).toBeVisible();
  await context.close();
});
