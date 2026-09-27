import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, userContext, userPage } from "./helpers";

/**
 * The Learning Assistant with AI disabled (the e2e server has no API key):
 * every task works from the school's own materials and lessons, shows its
 * sources and never presents generated text as coming from them.
 */

test("a student explains a topic in Georgian, saves it with a note and checks their understanding", async ({ browser }) => {
  const context = await userContext(browser, "mariam");
  await context.addCookies([{ name: "fc_locale", value: "ka", url: "http://localhost" }]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/student");
  await page.getByTestId("home-assistant").getByRole("link").click();
  await expect(page).toHaveURL(/\/learning-assistant$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("სასწავლო ასისტენტი");

  await page.getByTestId("assistant-text").fill("რა არის ინერცია?");
  await page.getByTestId("assistant-submit").click();
  const result = page.getByTestId("assistant-result");
  await expect(result).toHaveAttribute("data-found", "yes");
  await expect(page.getByTestId("assistant-lead")).toContainText("მასალებში ამ თემასთან დაკავშირებული მონაკვეთები მოიძებნა.");
  await expect(page.getByTestId("assistant-key")).toContainText("ინერცია ეწოდება");
  await expect(page.getByTestId("assistant-passages")).toContainText("ნიუტონის კანონები — მოკლე კონსპექტი");
  // No AI: nothing is presented as an explanation, and the page says where everything comes from.
  await expect(page.getByTestId("assistant-ai")).toHaveCount(0);
  await expect(page.getByTestId("assistant-ai-note")).toHaveText("AI-ის ახსნა არ დაწერილა. აქ ყველაფერი პირდაპირ მასალიდანაა.");
  // The address can be shared or bookmarked.
  await expect(page).toHaveURL(/mode=explain&q=/);

  // Save with a note; it is still there after a reload.
  await page.getByTestId("assistant-save").click();
  await expect(page.getByTestId("assistant-save")).toHaveText("შენახულია");
  const saved = page.getByTestId("saved-question").first();
  await expect(saved).toContainText("რა არის ინერცია?");
  await saved.getByLabel("ჩემი შენიშვნა").fill("ავტობუსის მაგალითი კარგად ხსნის.");
  await saved.getByRole("button", { name: "შენიშვნის შენახვა" }).click();
  await expect(saved.getByRole("button", { name: "შენიშვნის შენახვა" })).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId("saved-question").first().getByLabel("ჩემი შენიშვნა")).toHaveValue("ავტობუსის მაგალითი კარგად ხსნის.");

  // Next step: check my understanding, sentence by sentence.
  await page.getByTestId("assistant-next").getByRole("button", { name: "შემამოწმე" }).click();
  await expect(page.getByTestId("assistant-topic")).toHaveValue("რა არის ინერცია?");
  await page.getByTestId("assistant-text").fill("სხეულის თვისებას, შეინარჩუნოს სიჩქარე, ინერცია ეწოდება. მთვარე ყველი ყოფილა.");
  await page.getByTestId("assistant-submit").click();
  const checks = page.getByTestId("assistant-checks");
  await expect(checks.locator("[data-status=found]")).toHaveCount(1);
  await expect(checks.locator("[data-status=not_found]")).toHaveCount(1);
  await expect(checks).toContainText("„ვერ მოიძებნა“ არ ნიშნავს „არასწორია“");

  expect(errors).toEqual([]);
  await context.close();
});

test("evidence, questions and a research project that starts from real quotations", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "mariam");
  await page.goto("/learning-assistant");

  // What kind of statement is this, what does it assume, what in the material matches it?
  await page.getByTestId("assistant-mode-evidence").click();
  await page.getByTestId("assistant-text").fill("There are always fewer wolves than deer because energy is lost at each level of a food chain.");
  await page.getByTestId("assistant-submit").click();
  const evidence = page.getByTestId("assistant-evidence");
  await expect(evidence).toContainText("A statement about a cause");
  await expect(evidence).toContainText("There are no exceptions");
  await expect(evidence).toContainText("energy");

  // Questions built from the material, and straight into an explanation.
  await page.getByTestId("assistant-mode-questions").click();
  await page.getByTestId("assistant-text").fill("discriminant of a quadratic equation");
  await page.getByTestId("assistant-submit").click();
  const questions = page.getByTestId("assistant-questions");
  await expect(questions).toContainText(/What does each letter in .+ = .+ stand for, and in which units\?/);
  await questions.getByRole("button", { name: "Explain this" }).first().click();
  await expect(page.getByTestId("assistant-mode-explain")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("assistant-result")).toHaveAttribute("data-found", "yes");

  // Research: choose a question, and the Research Lab project opens with sources and quotations.
  await page.getByTestId("assistant-mode-research").click();
  await page.getByTestId("assistant-text").fill("food chains in Georgian forests");
  await page.getByTestId("assistant-submit").click();
  const research = page.getByTestId("assistant-research");
  await research.getByRole("radio").nth(1).check();
  await expect(page.getByTestId("research-question")).toHaveValue(/^How does/);
  await page.getByTestId("start-research").click();
  await expect(page).toHaveURL(/\/labs\/research\/\w+/);
  await expect(page.locator("main")).toContainText("food chains in Georgian forests");

  expect(errors).toEqual([]);
  await context.close();
});

test("a material's scope is respected, and nothing hidden reaches a student", async ({ browser }) => {
  const teacher = await userPage(browser, "nino");
  await teacher.page.goto("/teacher/materials");
  const card = teacher.page.locator("li", { hasText: "Assessment rubric for problem-solving tasks" });
  await card.getByTestId("material-ask").click();
  await expect(teacher.page).toHaveURL(/\/learning-assistant\?material=\w+/);
  const materialId = new URL(teacher.page.url()).searchParams.get("material")!;
  await expect(teacher.page.getByTestId("assistant-scope")).toContainText("Assessment rubric");
  await teacher.page.getByTestId("assistant-mode-locate").click();
  await teacher.page.getByTestId("assistant-text").fill("method and calculation mistakes");
  await teacher.page.getByTestId("assistant-submit").click();
  const passages = teacher.page.getByTestId("assistant-passage");
  await expect(passages.first()).toContainText("Assessment rubric");
  for (const text of await passages.allInnerTexts()) expect(text).toContain("Assessment rubric");
  await teacher.context.close();

  // The rubric is for teachers only: a student neither gets it as a scope nor through the API.
  const student = await userPage(browser, "mariam");
  await student.page.goto(`/learning-assistant?material=${materialId}`);
  await expect(student.page.getByTestId("assistant-scope")).toHaveCount(0);
  const response = await student.page.request.post("/api/learning-assistant", { data: { mode: "locate", text: "rubric levels", materialId } });
  expect(response.status()).toBe(404);
  const everything = await (await student.page.request.post("/api/learning-assistant", { data: { mode: "locate", text: "assessment rubric method levels" } })).json();
  expect(JSON.stringify(everything)).not.toContain("Assessment rubric");
  await student.context.close();
});

test("a teacher turns a research start into an assignment for students", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "nino");
  await page.goto("/learning-assistant?mode=research&q=food%20chains%20in%20Georgian%20forests");
  await expect(page.getByTestId("assistant-research")).toBeVisible();
  await page.getByTestId("assign-research").click();
  await expect(page).toHaveURL(/\/teacher\/assignments\/new\?kind=research/);
  await expect(page.getByTestId("assignment-title")).toHaveValue(/food chains in Georgian forests/);
  await expect(page.getByLabel("Instructions for students")).toHaveValue(/^Research question: .*food chains in Georgian forests/);
  expect(errors).toEqual([]);
  await context.close();
});

test("says honestly when the material does not cover a question, or covers only part of it", async ({ browser }) => {
  const { context, page } = await userPage(browser, "mariam");
  await page.goto("/learning-assistant?mode=explain&q=zebrafish%20fin%20regeneration");
  await expect(page.getByTestId("assistant-result")).toHaveAttribute("data-found", "no");
  await expect(page.getByText("The material does not seem to cover this.")).toBeVisible();
  await expect(page.getByTestId("assistant-passage")).toHaveCount(0);
  await expect(page.getByTestId("assistant-ai")).toHaveCount(0);

  // "Volcanic" appears in a geography lesson, "eruptions in Iceland" nowhere: said so, and no AI is asked.
  await page.goto("/learning-assistant?mode=explain&q=volcanic%20eruptions%20in%20Iceland");
  await expect(page.getByTestId("assistant-result")).toHaveAttribute("data-found", "partial");
  await expect(page.getByTestId("assistant-lead")).toContainText("Only part of your question appears in the material.");
  await expect(page.getByTestId("assistant-lead")).toContainText("Not found in the material: eruptions, Iceland");
  await expect(page.getByTestId("assistant-ai-note")).toHaveCount(0);
  await context.close();
});

test("opens from a library book with its school copy as the scope", async ({ browser }) => {
  const { context, page } = await userPage(browser, "mariam");
  await page.goto("/library/lib-newton-notes");
  await page.getByTestId("ask-about-material").click();
  await expect(page.getByTestId("assistant-scope")).toContainText("Newton");
  await page.getByTestId("assistant-text").fill("third law");
  await page.getByTestId("assistant-submit").click();
  await expect(page.getByTestId("assistant-result")).toHaveAttribute("data-found", "yes");
  await context.close();
});

for (const [label, width, height] of [
  ["phone", 390, 844],
  ["tablet", 820, 1180],
] as const) {
  test(`works by touch on a ${label}, without sideways scrolling`, async ({ browser }) => {
    const context = await userContext(browser, "mariam", { viewport: { width, height }, hasTouch: true, isMobile: width < 600 });
    await context.addCookies([{ name: "fc_locale", value: "ka", url: "http://localhost" }]);
    const page = await context.newPage();
    await page.goto("/learning-assistant");
    await page.getByTestId("assistant-mode-research").tap();
    await page.getByTestId("assistant-text").fill("კვებითი ჯაჭვები საქართველოს ტყეებში");
    await page.getByTestId("assistant-submit").tap();
    await expect(page.getByTestId("assistant-research")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByTestId("assistant-passage").first().getByRole("button").tap();
    await expectNoHorizontalScroll(page);
    await context.close();
  });
}

test("the built-in books are in the library, with their text searchable", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "mariam");
  await page.goto("/library");
  await page.getByTestId("library-search").fill("Business courses");
  await expect(page.getByTestId("library-results")).toContainText("Business courses");
  await page.goto("/library/lib-cpp-code-to-olympiad-1");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("C++: From Code to Olympiad, Vol. 1");
  await page.getByTestId("ask-about-material").click();
  await page.getByTestId("assistant-text").fill("რა არის ვექტორი?");
  await page.getByTestId("assistant-submit").click();
  await expect(page.getByTestId("assistant-result")).toHaveAttribute("data-found", "yes");
  await expect(page.getByTestId("assistant-passage").first()).toContainText("C++: From Code to Olympiad, Vol. 1");
  expect(errors).toEqual([]);
  await context.close();
});
