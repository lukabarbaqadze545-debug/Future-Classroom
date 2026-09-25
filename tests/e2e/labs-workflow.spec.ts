import { expect, test } from "@playwright/test";
import { unique, userPage } from "./helpers";

/**
 * Teacher → create → assign → student completes and submits → teacher
 * reviews → student sees the feedback and their progress. Uses a
 * critical-thinking exercise, which is checked automatically on the server.
 */
test("teacher assigns lab work, student completes it, teacher reviews", async ({ browser }) => {
  const teacher = await userPage(browser, "nino");
  const student = await userPage(browser, "luka", { width: 1280, height: 800 });
  const title = unique("Fallacy practice");

  // --- Teacher creates the assignment -------------------------------------
  await teacher.page.goto("/teacher/assignments/new");
  await teacher.page.getByTestId("assignment-kind").selectOption("critical");
  await teacher.page.getByTestId("assignment-item").selectOption("ct-fallacies-1");
  await teacher.page.getByTestId("assignment-title").fill(title);
  await teacher.page.getByLabel("Instructions for students").fill("Read each situation twice before you choose.");
  await teacher.page.getByTestId("assignment-class").selectOption("");
  await teacher.page.getByRole("checkbox", { name: "ლუკა მ." }).check();
  await teacher.page.getByTestId("create-assignment").click();
  await expect(teacher.page).toHaveURL(/\/teacher\/assignments\/(?!new$)\w+$/);
  const assignmentUrl = teacher.page.url();
  await expect(teacher.page.getByTestId("recipient-row")).toHaveCount(1);
  await expect(teacher.page.getByTestId("recipient-row")).toContainText("Not started");

  // --- Student finds it and completes the exercise ------------------------
  await student.page.goto("/student/assignments");
  await student.page.getByTestId("student-assignments").getByRole("link", { name: new RegExp(title) }).click();
  await expect(student.page.getByText("Read each situation twice before you choose.")).toBeVisible();
  await student.page.getByTestId("open-activity").click();
  await expect(student.page).toHaveURL(/\/labs\/critical-thinking\/ct-fallacies-1/);
  const items = student.page.getByTestId("ct-item");
  await expect(items).toHaveCount(10);
  for (let i = 0; i < 10; i++) await items.nth(i).getByTestId("ct-option").first().click();
  await student.page.getByTestId("ct-submit").click();
  await expect(student.page.getByTestId("ct-result")).toContainText(/\d+ of 10/);

  // The assignment is now completed with the score recorded by the server
  // (finished work moves from "To do" to "Done").
  await student.page.goto("/student/assignments?filter=done");
  const row = student.page.getByTestId("student-assignments").getByRole("link", { name: new RegExp(title) });
  await expect(row).toContainText("Completed");

  // --- Teacher sees the result and writes feedback -------------------------
  await teacher.page.goto(assignmentUrl);
  const recipient = teacher.page.getByTestId("recipient-row");
  await expect(recipient).toContainText("Completed");
  await expect(recipient).toContainText(/\d+\/10/);
  await recipient.getByTestId("review-button").click();
  await teacher.page.getByTestId("review-feedback").fill("Good work — look again at the straw man examples.");
  await teacher.page.getByTestId("mark-reviewed").click();
  await expect(recipient).toContainText("Reviewed");

  // --- Student reads the feedback and sees it on the progress page ---------
  await student.page.goto("/student/assignments?filter=all");
  await student.page.getByTestId("student-assignments").getByRole("link", { name: new RegExp(title) }).click();
  await expect(student.page.getByText("Good work — look again at the straw man examples.")).toBeVisible();
  await student.page.goto("/student/progress");
  const profile = student.page.getByTestId("learning-profile");
  await expect(profile).toContainText(title);
  await expect(profile).toContainText("Spot the fallacy: school life");

  expect([...teacher.errors, ...student.errors]).toEqual([]);
  await teacher.context.close();
  await student.context.close();
});

/** A student hands in their own research project for an open-work assignment. */
test("student hands in their own lab work for an open assignment", async ({ browser }) => {
  const teacher = await userPage(browser, "nino");
  const student = await userPage(browser, "ana");
  const title = unique("Mini research");

  await teacher.page.goto("/teacher/assignments/new?kind=research");
  await teacher.page.getByTestId("assignment-title").fill(title);
  await teacher.page.getByTestId("assignment-class").selectOption("");
  await teacher.page.getByRole("checkbox", { name: "ანა კ." }).check();
  await teacher.page.getByTestId("create-assignment").click();
  await expect(teacher.page).toHaveURL(/\/teacher\/assignments\/(?!new$)\w+$/);
  const assignmentUrl = teacher.page.url();

  // The student starts a project in the Research Lab first.
  const project = unique("Does music help concentration?");
  await student.page.goto("/labs/research");
  await student.page.getByTestId("research-title").fill(project);
  await student.page.getByTestId("create-research").click();
  await expect(student.page.getByTestId("research-workspace")).toBeVisible();

  await student.page.goto("/student/assignments");
  await student.page.getByTestId("student-assignments").getByRole("link", { name: new RegExp(title) }).click();
  await student.page.getByTestId("choose-work").selectOption({ label: project });
  await student.page.getByTestId("response-text").fill("My question and first sources are ready.");
  await student.page.getByTestId("hand-in-button").click();
  await expect(student.page.getByText("Handed in").first()).toBeVisible();

  await teacher.page.goto(assignmentUrl);
  const recipient = teacher.page.getByTestId("recipient-row");
  await expect(recipient).toContainText("Handed in");
  await expect(recipient).toContainText("My question and first sources are ready.");
  await recipient.getByRole("link", { name: "View work" }).click();
  await expect(teacher.page.getByRole("heading", { level: 1 })).toContainText(project);

  expect([...teacher.errors, ...student.errors]).toEqual([]);
  await teacher.context.close();
  await student.context.close();
});

/** Lab content in a live classroom session: join with a code and answer. */
test("teacher runs a live session from lab items; student joins and answers", async ({ browser }) => {
  const teacher = await userPage(browser, "nino");
  const student = await userPage(browser, "giorgi", { width: 390, height: 844 });

  await teacher.page.goto("/teacher/sessions/labs?add=critical:ct-fallacies-1");
  await expect(teacher.page.getByTestId("bridge-title")).toHaveValue("Spot the fallacy: school life");
  await teacher.page.getByTestId("bridge-start").click();
  await expect(teacher.page).toHaveURL(/\/teacher\/sessions\/(?!labs$)\w+$/);
  const code = (await teacher.page.getByTestId("join-code-display").innerText()).trim();

  await student.page.goto("/join");
  await student.page.getByTestId("join-code").fill(code.replace("FC-", ""));
  const name = student.page.getByTestId("join-name");
  if (await name.isVisible()) await name.fill("Giorgi");
  await student.page.getByTestId("join-submit").click();
  await expect(student.page.getByTestId("waiting-screen")).toBeVisible();

  await teacher.page.getByTestId("launch-first").click();
  await expect(student.page.getByTestId("student-activity")).toContainText("Nika proposes a recycling bin");
  await student.page.getByTestId("answer-option").filter({ hasText: "Ad hominem" }).click();
  await student.page.getByTestId("submit-answer").click();
  await expect(student.page.getByText("Correct — well done!")).toBeVisible();
  await expect(teacher.page.getByTestId("answered-count")).toHaveText("1 of 1 answered");

  expect([...teacher.errors, ...student.errors]).toEqual([]);
  await teacher.context.close();
  await student.context.close();
});
