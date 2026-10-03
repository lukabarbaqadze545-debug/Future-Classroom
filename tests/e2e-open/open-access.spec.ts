import { expect, test } from "@playwright/test";

/** Open access: no sign-in, no registration; the visitor picks the demo teacher or the demo student. */

test("the link opens the site with two choices and no sign-in or registration", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("open-access-choice")).toBeVisible();
  await expect(page.getByTestId("demo-teacher")).toBeVisible();
  await expect(page.getByTestId("demo-student")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("choosing a view greets the teacher or the student, and the role can be switched", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-teacher").click();
  await expect(page).toHaveURL(/\/teacher$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, teacher!");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);

  // The same button that signed out switches the role: back to the two choices.
  await page.getByRole("button", { name: "Switch role" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("open-access-choice")).toBeVisible();

  await page.getByTestId("demo-student").click();
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, student!");
  for (const path of ["/subjects", "/labs", "/library"]) {
    await page.goto(path);
    await expect(page.locator("main"), path).toBeVisible();
  }
});

test("the sign-in and registration pages and routes are gone, and signed-out visits end at the choice", async ({ page, request }) => {
  for (const path of ["/login", "/register", "/teacher", "/student", "/student/progress"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/$/);
    await expect(page.getByTestId("open-access-choice"), path).toBeVisible();
  }
  const login = await request.post("/api/auth/login", { data: { username: "nino", password: "demo1234" } });
  expect(login.status()).toBe(404);
  const register = await request.post("/api/auth/register", { data: { name: "Someone New", password: "my-first-password" } });
  expect(register.status()).toBe(404);
});

test("joining a live class with a code is still there, without the sign-in link", async ({ page }) => {
  await page.goto("/join");
  await expect(page.getByTestId("join-name")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign in/ })).toHaveCount(0);
});
