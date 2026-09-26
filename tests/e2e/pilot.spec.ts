import { expect, test, type Browser, type Page } from "@playwright/test";
import { unique, userPage } from "./helpers";

/**
 * The classroom pilot, end to end, with AI disabled (the e2e server has no
 * API key): a teacher creates a class and student accounts, starts a lesson
 * for the class, students sign in with their slips and join from their home
 * page, answer (one of them through a network drop), the teacher moves
 * through activities, ends the lesson, and the results are saved on the
 * class page and in each student's progress.
 */

async function studentPage(browser: Browser, username: string, password: string) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student$/);
  return { context, page, errors };
}

async function answerCurrent(page: Page) {
  await expect(page.getByTestId("student-activity")).toBeVisible();
  const options = page.getByTestId("answer-option");
  if (await options.count()) await options.first().click();
  else await page.getByTestId("answer-text").fill("x = 1");
  await page.getByTestId("submit-answer").click();
}

test("classroom pilot: class, accounts, live lesson and saved results", async ({ browser }) => {
  const { context: teacherContext, page: teacher, errors } = await userPage(browser, "nino");
  const className = unique("Pilot 9A");

  // --- A class with three new students -----------------------------------
  await teacher.goto("/teacher/students");
  await teacher.getByRole("button", { name: "New class" }).click();
  await teacher.getByLabel("Class name").fill(className);
  await teacher.getByRole("button", { name: "Save class" }).click();
  await expect(teacher).toHaveURL(/\/teacher\/classes\/\w+$/);
  const classUrl = teacher.url();
  await teacher.getByTestId("add-students").click();
  await teacher.getByTestId("new-student-names").fill("ნუცა პილოტი\nდათო პილოტი\nლიზა პილოტი");
  await teacher.getByTestId("confirm-add-students").click();
  await expect(teacher.getByTestId("credential-slips")).toBeVisible();
  const usernames = await teacher.getByTestId("slip-username").allInnerTexts();
  const passwords = await teacher.getByTestId("slip-password").allInnerTexts();
  expect(usernames).toHaveLength(3);
  expect(usernames[0]).toMatch(/^nutsa\.p\d*$/);
  await expect(teacher.getByTestId("class-members")).toContainText("ნუცა პილოტი");

  // --- Start a built-in lesson for this class ------------------------------
  await teacher.getByTestId("class-start-lesson").click();
  await expect(teacher).toHaveURL(/\/teacher\/sessions\/new\?class=/);
  await expect(teacher.getByTestId("session-class").locator("option:checked")).toContainText(className);
  await teacher.getByTestId("session-lesson-search").fill("Quadratic");
  await teacher.getByTestId("session-lesson-option").first().click();
  await expect(teacher.getByTestId("chosen-lesson")).toContainText("Quadratic");
  await teacher.getByTestId("start-session-confirm").click();
  await expect(teacher).toHaveURL(/\/teacher\/sessions\/\w+$/);
  const sessionId = teacher.url().split("/").pop()!;

  // Before anyone joins, the console lists the whole class as not joined.
  await expect(teacher.getByTestId("console-absent")).toContainText("ლიზა პილოტი");

  // --- Two students sign in with their slips and join from the home page ---
  const students = [];
  for (const i of [0, 1]) {
    const s = await studentPage(browser, usernames[i], passwords[i]);
    // A temporary password is flagged until the student chooses their own.
    await expect(s.page.getByTestId("temporary-password")).toBeVisible();
    await expect(s.page.getByTestId("live-sessions")).toContainText("Quadratic");
    await s.page.getByTestId("join-class-session").click();
    await expect(s.page).toHaveURL(new RegExp(`/session/${sessionId}`));
    await expect(s.page.getByTestId("waiting-screen")).toBeVisible();
    students.push(s);
  }
  await expect(teacher.getByTestId("participant-count")).toHaveText("2/2");
  await expect(teacher.getByTestId("console-absent")).toContainText("ლიზა პილოტი");
  await expect(teacher.getByTestId("console-absent")).not.toContainText("ნუცა პილოტი");

  // --- Activity 1: everyone answers ---------------------------------------
  await teacher.getByTestId("launch-first").click();
  await answerCurrent(students[0].page);
  await answerCurrent(students[1].page);
  await expect(teacher.getByTestId("answered-count")).toHaveText("2 of 2 answered");
  await expect(teacher.getByTestId("console-students").locator("[data-status=waiting]")).toHaveCount(0);

  // A student reloads the page: the answer is still there, nothing is lost.
  await students[0].page.reload();
  await expect(students[0].page.getByTestId("student-activity")).toBeVisible();
  await expect(students[0].page.getByTestId("submit-answer")).toBeVisible();

  // The teacher reloads the console: same state.
  await teacher.reload();
  await expect(teacher.getByTestId("answered-count")).toHaveText("2 of 2 answered");

  // --- Activity 2: one student's network drops while answering -------------
  await teacher.getByTestId("next-activity").click();
  await expect(students[1].page.getByTestId("student-activity")).toBeVisible();
  await answerCurrent(students[0].page);
  await students[1].context.setOffline(true);
  await answerCurrent(students[1].page);
  await expect(students[1].page.getByTestId("answer-queued")).toBeVisible();
  await expect(teacher.getByTestId("answered-count")).toHaveText("1 of 2 answered");
  await students[1].context.setOffline(false);
  await expect(students[1].page.getByTestId("answer-sent-late")).toBeVisible({ timeout: 20_000 });
  await expect(teacher.getByTestId("answered-count")).toHaveText("2 of 2 answered");

  // --- The projector view follows the lesson --------------------------------
  const presenter = await teacherContext.newPage();
  presenter.on("pageerror", (error) => errors.push(error.message));
  await presenter.goto(`/present/session/${sessionId}`);
  await expect(presenter.getByTestId("present-position")).toContainText("2 /");
  // Nothing private on the projector: no student usernames.
  await expect(presenter.locator("body")).not.toContainText(usernames[0]);
  await presenter.close();

  // --- The late student joins mid-lesson ------------------------------------
  const late = await studentPage(browser, usernames[2], passwords[2]);
  await late.page.getByTestId("join-class-session").click();
  await expect(late.page.getByTestId("student-activity")).toBeVisible();
  await expect(teacher.getByTestId("participant-count")).toHaveText("3/3");
  students.push(late);

  // --- End and review ----------------------------------------------------------
  await teacher.getByTestId("end-session").click();
  await teacher.getByTestId("confirm-end-session").click();
  await expect(teacher.getByTestId("session-summary")).toBeVisible();
  await expect(teacher.getByTestId("session-summary")).toContainText("ნუცა პილოტი");
  for (const s of students) await expect(s.page.getByTestId("session-ended")).toBeVisible();

  // Results are saved on the class page …
  await teacher.goto(classUrl);
  await expect(teacher.getByTestId("class-sessions")).toContainText("Quadratic");
  const row = teacher.getByTestId("class-progress").getByRole("row").filter({ hasText: "ნუცა პილოტი" });
  await expect(row).toContainText("1 lesson");
  await expect(row).toContainText("/2");

  // … and in the student's own progress.
  await students[0].page.goto("/student/progress");
  await expect(students[0].page.getByTestId("profile-live-lessons")).toContainText("Quadratic");

  // The student replaces the temporary password.
  await students[0].page.goto("/account");
  await students[0].page.getByLabel("Current password").fill(passwords[0]);
  await students[0].page.getByLabel("New password", { exact: true }).fill("my-pilot-pass");
  await students[0].page.getByLabel("Repeat the new password").fill("my-pilot-pass");
  await students[0].page.getByRole("button", { name: "Change password" }).click();
  await expect(students[0].page.getByTestId("temporary-password")).toHaveCount(0);

  for (const s of students) {
    expect(s.errors).toEqual([]);
    await s.context.close();
  }
  expect(errors).toEqual([]);
  await teacherContext.close();
});

test("content review: a teacher previews a lesson with its answers and records a review step", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "davit");
  await page.goto("/subjects/mathematics");
  // Another teacher's lesson opens as a read-only preview with the answer key.
  await page.getByTestId("subject-item").getByRole("link", { name: /Quadratic/ }).first().click();
  await expect(page).toHaveURL(/\/teacher\/lessons\/\w+\/preview$/);
  await expect(page.getByTestId("preview-activities").locator("[data-correct]").first()).toBeVisible();
  await expect(page.getByTestId("review-step").first()).toHaveAttribute("data-state", "done");

  await page.getByTestId("review-note").fill("Answers and units checked.");
  await page.getByTestId("review-next").click();
  await expect(page.getByTestId("review-history")).toContainText("Answers and units checked.");
  await expect(page.getByTestId("review-history")).toContainText("Technically reviewed");

  await page.goto("/teacher/lessons/review?status=technical");
  await expect(page.getByTestId("review-queue")).toContainText("Quadratic");

  // Students never see review states.
  const student = await userPage(browser, "mariam");
  await student.page.goto("/subjects/mathematics");
  await expect(student.page.locator("body")).not.toContainText("Technically reviewed");
  await student.context.close();
  expect(errors).toEqual([]);
  await context.close();
});
