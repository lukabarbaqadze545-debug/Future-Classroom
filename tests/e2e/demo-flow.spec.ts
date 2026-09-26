import { expect, test, type Page } from "@playwright/test";

/**
 * The demonstration scenario from the product brief, end to end:
 * Teacher → Lesson → Classroom → Student → Activity → Hint → Answer → Teacher results → Summary.
 */
test("complete classroom demo flow", async ({ browser }) => {
  const teacherContext = await browser.newContext();
  const studentContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const teacher = await teacherContext.newPage();
  const student = await studentContext.newPage();
  const pageErrors: string[] = [];
  for (const page of [teacher, student]) page.on("pageerror", (error) => pageErrors.push(error.message));

  // --- Teacher: sign in and create a lesson -------------------------------
  await teacher.goto("/");
  await teacher.getByTestId("demo-teacher").click();
  await expect(teacher).toHaveURL(/\/teacher$/);
  await teacher.getByTestId("create-lesson").click();
  await expect(teacher).toHaveURL(/\/teacher\/lessons\/new/);
  await teacher.getByTestId("lesson-subject").selectOption("mathematics");
  await teacher.getByTestId("lesson-grade").selectOption("11");
  await teacher.getByTestId("lesson-topic").fill("Quadratic equations");
  await teacher.getByTestId("generate-lesson").click();
  await expect(teacher).toHaveURL(/\/teacher\/lessons\/\w+\?generated=curated/);
  // Without an API key the platform says so honestly.
  await expect(teacher.getByText("It is not AI-generated")).toBeVisible();

  // --- Teacher: review and edit ------------------------------------------
  await teacher.getByRole("tab", { name: /Activities/ }).click();
  await expect(teacher.getByTestId("activity-card")).toHaveCount(7);
  await teacher.getByTestId("activity-card").first().locator("button[aria-expanded]").click();
  await teacher.getByLabel("Short title").fill("Warm-up: spot the quadratic");
  await teacher.getByTestId("save-lesson").click();
  await expect(teacher.getByTestId("save-lesson")).toHaveText(/Saved/);

  // --- Teacher: start the classroom session -------------------------------
  await teacher.getByTestId("start-session").click();
  await teacher.getByTestId("confirm-start-session").click();
  await expect(teacher).toHaveURL(/\/teacher\/sessions\/\w+$/);
  const code = (await teacher.getByTestId("join-code-display").innerText()).trim();
  expect(code).toMatch(/^FC-\d{4}$/);

  // --- Student: join with the code ---------------------------------------
  await student.goto("/join");
  await student.getByTestId("join-code").fill(code.replace("FC-", ""));
  await student.getByTestId("join-name").fill("Giorgi");
  await student.getByTestId("join-submit").click();
  await expect(student.getByTestId("waiting-screen")).toBeVisible();

  // Teacher sees the student arrive without refreshing.
  await expect(teacher.getByTestId("participant-count")).toHaveText("1/1");

  // --- First activity: multiple choice ------------------------------------
  await teacher.getByTestId("launch-first").click();
  await expect(student.getByTestId("student-activity")).toContainText("Which of these is a quadratic equation?");
  await student.getByTestId("answer-option").filter({ hasText: "x² − 4x + 3 = 0" }).click();
  await student.getByTestId("submit-answer").click();
  await expect(student.getByText("Correct — well done!")).toBeVisible();
  await expect(teacher.getByTestId("answered-count")).toHaveText("1 of 1 answered");

  // --- Second activity: exercise with hints -------------------------------
  await teacher.getByTestId("next-activity").click();
  await expect(student.getByTestId("student-activity")).toContainText("x² − 5x + 6 = 0");
  await student.getByTestId("request-hint").click();
  await expect(student.getByTestId("hint-item")).toHaveCount(1);
  await expect(student.getByTestId("hint-item").first()).toContainText("product of two brackets");
  await student.getByTestId("request-hint").click();
  await expect(student.getByTestId("hint-item").nth(1)).toContainText("What two numbers multiply to 6 and add to −5?");

  await student.getByTestId("answer-text").fill("-2, -3");
  await student.getByTestId("submit-answer").click();
  await expect(student.getByText("Not quite yet")).toBeVisible();
  await student.getByTestId("answer-text").fill("x = 2 or x = 3");
  await student.getByTestId("submit-answer").click();
  await expect(student.getByText("Correct — well done!")).toBeVisible();

  // --- Teacher sees the response and the hints used -----------------------
  const answers = teacher.getByTestId("answers-list");
  await expect(answers).toContainText("Giorgi");
  await expect(answers).toContainText("correct");
  await expect(answers).toContainText("2 hints");
  await expect(answers).toContainText("2 attempts");
  await teacher.getByTestId("reveal-results").click();
  await expect(student.getByTestId("class-results")).toContainText("2, 3");

  // --- Presentation view mirrors the session -------------------------------
  const presenter = await teacherContext.newPage();
  await presenter.goto(teacher.url().replace("/teacher/sessions/", "/present/session/"));
  await expect(presenter.getByRole("heading", { level: 1 })).toContainText("x² − 5x + 6 = 0");
  await presenter.close();

  // --- Finish and review the summary --------------------------------------
  await teacher.getByTestId("end-session").click();
  await teacher.getByTestId("confirm-end-session").click();
  await expect(teacher.getByTestId("session-summary")).toBeVisible();
  await expect(teacher.getByTestId("session-summary")).toContainText("Giorgi");
  await expect(student.getByTestId("session-ended")).toBeVisible();

  expect(pageErrors).toEqual([]);
  await teacherContext.close();
  await studentContext.close();
});

async function signInAsStudent(page: Page) {
  await page.goto("/");
  await page.getByTestId("demo-student").click();
  await expect(page).toHaveURL(/\/student$/);
}

test("student self-study: practice with hints, quiz and library", async ({ page }) => {
  await signInAsStudent(page);
  await page.getByRole("link", { name: "Subjects", exact: true }).first().click();
  await page.getByTestId("subject-card").filter({ hasText: "Physics" }).click();
  await page.getByTestId("subject-item").getByRole("link", { name: /Newton's Laws of Motion/ }).first().click();
  await page.getByRole("tab", { name: /Practice/ }).click();
  // Hints before answers.
  await page.getByTestId("request-hint").click();
  await expect(page.getByTestId("hint-item")).toHaveCount(1);
  await page.getByTestId("answer-option").first().click();
  await page.getByTestId("practice-check").click();
  await expect(page.getByText("Correct — well done!")).toBeVisible();

  // Quiz with review.
  await page.getByRole("tab", { name: "Quiz" }).click();
  await page.getByRole("link", { name: /Start quiz|Take again|Retake/ }).first().click();
  await page.getByTestId("submit-quiz").click();
  await page.getByRole("button", { name: "Submit quiz" }).last().click();
  await expect(page.getByTestId("quiz-result")).toBeVisible();

  // Library answers come with sources (passages only, since AI is off).
  await page.goto("/student/library");
  await page.getByTestId("library-question").fill("What does our physics material say about Newton's second law?");
  await page.getByTestId("library-ask").click();
  await expect(page.getByTestId("library-result")).toContainText("F = m · a");
  await expect(page.getByText("AI is not connected, so no summary was written.")).toBeVisible();
});

test("interface switches to Georgian", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /ქართული/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ქართული სკოლებისთვის შექმნილი თანამედროვე ციფრული სასწავლო პლატფორმა");
  await expect(page.locator("html")).toHaveAttribute("lang", "ka");
});

test("students cannot reach teacher pages or APIs", async ({ page }) => {
  await signInAsStudent(page);
  await page.goto("/teacher/lessons");
  await expect(page).toHaveURL(/\/student$/);
  const response = await page.request.get("/api/lessons");
  expect(response.status()).toBe(403);
});
