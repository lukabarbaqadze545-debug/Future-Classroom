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

test("the sign-in and registration pages and routes are gone", async ({ page, request }) => {
  for (const path of ["/login", "/register"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/$/);
    await expect(page.getByTestId("open-access-choice"), path).toBeVisible();
  }
  const login = await request.post("/api/auth/login", { data: { username: "nino", password: "demo1234" } });
  expect(login.status()).toBe(404);
  const register = await request.post("/api/auth/register", { data: { name: "Someone New", password: "my-first-password" } });
  expect(register.status()).toBe(404);
});

test("a link to an inner page lets the visitor straight in, to that part of the site as the view it is for", async ({ browser, baseURL }) => {
  const visit = async (path: string) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto(path);
    return { context, page };
  };

  // The guard of each part of the site (its layout) knows the part, not the page: the visitor arrives at the part's first page.
  const teacher = await visit("/teacher/lessons");
  await expect(teacher.page).toHaveURL(/\/teacher$/);
  await expect(teacher.page.getByTestId("account-link")).toContainText("Teacher");
  await teacher.context.close();

  const student = await visit("/student/progress");
  await expect(student.page).toHaveURL(/\/student$/);
  await expect(student.page.getByTestId("account-link")).toContainText("Student");
  // A page both roles use opens as the student view.
  await student.context.close();
  const library = await visit("/library");
  await expect(library.page).toHaveURL(/\/library$/);
  await expect(library.page.getByTestId("account-link")).toContainText("Student");
  await library.context.close();
});

test("switching the role forgets the choice", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-teacher").click();
  await expect(page).toHaveURL(/\/teacher$/);
  expect((await page.context().cookies()).some((c) => c.name === "fc_open")).toBe(true);
  await page.getByRole("button", { name: "Switch role" }).click();
  await expect(page.getByTestId("open-access-choice")).toBeVisible();
  expect((await page.context().cookies()).some((c) => c.name === "fc_open")).toBe(false);
});

test("the entry link only leads to pages of this site", async ({ request }) => {
  const location = async (query: string) => {
    const response = await request.get(`/enter?${query}`, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    return response.headers().location;
  };
  expect(await location("as=teacher&next=/teacher/quizzes")).toBe("/teacher/quizzes");
  expect(await location("as=teacher")).toBe("/teacher");
  expect(await location("next=/library")).toBe("/library");
  for (const next of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)"]) {
    expect(await location(`as=student&next=${encodeURIComponent(next)}`), next).toBe("/student");
  }
});

test("joining a live class with a code is still there, without the sign-in link", async ({ page }) => {
  await page.goto("/join");
  await expect(page.getByTestId("join-name")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign in/ })).toHaveCount(0);
});
