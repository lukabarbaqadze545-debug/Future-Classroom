import { expect, test } from "@playwright/test";
import { unique, userPage } from "./helpers";

// One flow per laboratory, as a student would use it. AI is disabled for the
// whole e2e run (see scripts/e2e-server.mjs), so everything here works offline.

test("programming: open a problem, submit, see the checked result", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "saba");
  await page.goto("/labs/programming");
  await page.getByTestId("problem-list").getByRole("link", { name: /Sum from 1 to n/ }).click();
  await expect(page).toHaveURL(/\/labs\/programming\/l1-sum-to-n/);

  // Hints are written by teachers and shown one at a time — no AI involved.
  await page.getByRole("button", { name: "Show hint 1" }).click();
  await expect(page.getByRole("button", { name: "Show hint 2" }).or(page.getByText("No more hints"))).toBeVisible();

  // A wrong program: hidden tests fail without revealing their expected output.
  const editor = page.getByTestId("code-editor");
  await editor.fill("n = int(input())\nprint(n)");
  await page.getByTestId("submit-code").click();
  const result = page.getByTestId("submission-result");
  await expect(result).toContainText("Wrong answer", { timeout: 90_000 });

  // The draft survives a refresh.
  await page.reload();
  await expect(page.getByTestId("code-editor")).toHaveValue("n = int(input())\nprint(n)");

  await page.getByTestId("code-editor").fill("n = int(input())\nprint(n * (n + 1) // 2)");
  await page.getByTestId("submit-code").click();
  await expect(page.getByTestId("submission-result")).toContainText("Accepted — all tests passed", { timeout: 90_000 });
  await expect(page.getByText("Solved").first()).toBeVisible();

  // Solved work can go straight into the portfolio.
  await page.getByTestId("submission-result").getByRole("button", { name: "Add to portfolio" }).click();
  await page.goto("/career/portfolio");
  await expect(page.getByTestId("portfolio-list")).toContainText("Sum from 1 to n");

  expect(errors).toEqual([]);
  await context.close();
});

test("critical thinking: complete an exercise, get deterministic feedback, see progress", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "elene");
  await page.goto("/labs/critical-thinking");
  await page.getByRole("link", { name: /Spot the fallacy: school life/ }).first().click();
  await expect(page).toHaveURL(/\/labs\/critical-thinking\/ct-fallacies-1/);

  const answer = async () => {
    const items = page.getByTestId("ct-item");
    await expect(items).toHaveCount(10);
    for (let i = 0; i < 10; i++) await items.nth(i).getByTestId("ct-option").nth(i % 2).click();
    await page.getByTestId("ct-submit").click();
    await expect(page.getByTestId("ct-result")).toBeVisible();
    return (await page.getByTestId("ct-result").getByRole("status").innerText()).trim();
  };

  const first = await answer();
  expect(first).toMatch(/^\d+ of 10$/);
  // Every item explains the reasoning, right or wrong.
  await expect(page.getByTestId("ct-item").first()).toContainText(/Levan attacks Nika’s punctuality/);

  // The same answers always get the same score.
  await page.getByRole("button", { name: "Try again" }).click();
  expect(await answer()).toBe(first);

  await page.goto("/student/progress");
  await expect(page.getByTestId("learning-profile")).toContainText("Spot the fallacy: school life");
  expect(errors).toEqual([]);
  await context.close();
});

test("STEM: complete an experiment record, then build and save a project", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "tamar");
  await page.goto("/labs/stem");
  await page.getByRole("link", { name: /Sink or float\? Measuring density/ }).first().click();
  await expect(page).toHaveURL(/\/labs\/stem\/experiments\/density/);
  // Real materials are listed: this is a classroom experiment, not a simulation.
  await expect(page.getByText("Measuring cylinder or jug with ml marks")).toBeVisible();
  // Expected results stay hidden until the record is submitted.
  await expect(page.getByTestId("expected-results")).toHaveCount(0);

  const record = page.getByTestId("experiment-record");
  await record.getByLabel(/^Your prediction/).fill("The cork and the apple will float.");
  await record.getByLabel("Object 1").fill("Cork");
  await record.getByLabel("Mass (g) 1").fill("4");
  await record.getByLabel("Volume (cm³) 1").fill("16");
  await record.getByLabel("Density (g/cm³) 1").fill("0.25");
  await record.getByLabel("Floats? 1").fill("yes");
  await page.getByTestId("experiment-conclusion").fill("Objects less dense than water float.");
  await page.getByTestId("submit-experiment").click();
  await expect(page.getByTestId("expected-results")).toContainText("Objects with a density below about 1 g/cm³");

  // Engineering project from a brief.
  await page.goto("/labs/stem#projects");
  await page.getByTestId("start-project-tower").click();
  await expect(page).toHaveURL(/\/labs\/stem\/projects\/\w+/);
  const title = unique("Spaghetti tower");
  await page.getByLabel("Project title").fill(title);
  await page.getByTestId("project-problem").fill("Build the tallest free-standing tower from 20 sticks of spaghetti and tape.");
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await page.getByTestId("save-project").click();
  await expect(page.getByText(/Draft · Last saved/)).toBeVisible();

  // Saved on the server: a reload shows the same work.
  await page.reload();
  await expect(page.getByTestId("project-problem")).toHaveValue(/tallest free-standing tower/);

  // Cross-module: submitted project → portfolio.
  await page.getByTestId("submit-project").click();
  await expect(page.getByText(/Submitted · Last saved/)).toBeVisible();
  await page.getByRole("button", { name: "Add to portfolio" }).click();
  await expect(page.getByText("Added to your portfolio")).toBeVisible();
  await page.goto("/career/portfolio");
  await expect(page.getByTestId("portfolio-list")).toContainText(title);

  expect(errors).toEqual([]);
  await context.close();
});

test("research: create a project, add a source, notes and findings", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "nika");
  const title = unique("Sleep and screens");
  await page.goto("/labs/research");
  await page.getByTestId("research-title").fill(title);
  await page.getByTestId("create-research").click();
  await expect(page.getByTestId("research-workspace")).toBeVisible();

  await page.getByTestId("research-question").fill("Do students who use screens after 22:00 sleep less?");

  await page.getByTestId("step-sources").click();
  await page.getByTestId("add-source").click();
  const form = page.getByTestId("source-form");
  await form.getByLabel("Type").selectOption("article");
  await page.getByTestId("source-title").fill("Recommended Amount of Sleep for Pediatric Populations");
  await form.getByLabel("Author(s)").fill("Paruthi, S. et al.");
  await form.getByLabel("Year or date published").fill("2016");
  await form.getByLabel("Link").fill("https://doi.org/10.5664/jcsm.5866");
  await page.getByTestId("save-source").click();
  await expect(page.getByTestId("source-list")).toContainText("Recommended Amount of Sleep for Pediatric Populations");
  await expect(page.getByTestId("bibliography")).toContainText("Paruthi, S. et al. (2016)");

  await page.getByTestId("step-notes").click();
  // A quotation must be attributed to a source.
  await page.getByRole("radio", { name: "Quotation" }).click();
  await page.getByTestId("notes-content").fill("Teenagers 13 to 18 years of age should sleep 8 to 10 hours per 24 hours");
  await expect(page.getByTestId("add-notes")).toBeDisabled();
  await page.getByTestId("notes-source").selectOption({ label: "Recommended Amount of Sleep for Pediatric Populations" });
  await page.getByTestId("add-notes").click();
  await expect(page.getByText("“Teenagers 13 to 18 years of age should sleep 8 to 10 hours per 24 hours”")).toBeVisible();

  await page.getByTestId("step-findings").click();
  await page.getByTestId("add-finding").click();
  await page.getByTestId("finding").first().fill("Most students in our survey sleep less than the recommended 8 hours.");
  await page.getByTestId("save-research").click();
  await expect(page.getByText(/Draft · Last saved/)).toBeVisible();

  await page.reload();
  await page.getByTestId("step-findings").click();
  await expect(page.getByTestId("finding").first()).toHaveValue(/sleep less than the recommended 8 hours/);
  expect(errors).toEqual([]);
  await context.close();
});

test("library: search, open a resource, track reading, scan a copy's QR code", async ({ browser }) => {
  const teacher = await userPage(browser, "davit");
  const student = await userPage(browser, "giorgi", { width: 390, height: 844 });

  await student.page.goto("/library");
  await student.page.getByTestId("library-search").fill("python");
  const results = student.page.getByTestId("library-results");
  await expect(results).toContainText("Think Python (2nd edition)");
  await expect(results).not.toContainText("Biology 2e");
  await results.getByRole("link", { name: /Think Python/ }).click();
  await expect(student.page).toHaveURL(/\/library\/lib-think-python/);
  await expect(student.page.getByText("CC BY-NC 3.0").first()).toBeVisible();
  await student.page.getByTestId("reading-reading").click();
  await expect(student.page.getByTestId("reading-reading")).toHaveAttribute("aria-checked", "true");

  // The librarian prints QR labels; each label encodes the copy's own link.
  await teacher.page.goto("/library/labels?resource=lib-think-python");
  const code = (await teacher.page.locator("li p.font-mono").first().innerText()).trim();
  expect(code).toMatch(/^LIB-\d{4}$/);
  await expect(teacher.page.locator("li svg").first()).toBeVisible();

  // Scanning the label opens the book page and names the copy.
  await student.page.goto(`/library/qr/${code}`);
  await expect(student.page).toHaveURL(new RegExp(`/library/lib-think-python\\?copy=${code}`));
  await expect(student.page.getByText(`You scanned copy ${code}.`)).toBeVisible();

  // The book is on the student's reading list.
  await student.page.goto("/library#reading");
  await expect(student.page.getByRole("tabpanel").filter({ hasText: "Think Python" })).toBeVisible();

  expect([...teacher.errors, ...student.errors]).toEqual([]);
  await teacher.context.close();
  await student.context.close();
});

test("career: research a university and add a portfolio item", async ({ browser }) => {
  const { context, page, errors } = await userPage(browser, "ana");
  const uni = unique("Example Technical University");
  await page.goto("/career#universities");
  await expect(page.getByText(/Admission requirements, fees, scholarships and deadlines change every year/)).toBeVisible();
  await page.getByTestId("add-university").click();
  await page.getByTestId("uni-name").fill(uni);
  await page.getByTestId("uni-program").fill("Computer Science BSc");
  await page.getByTestId("university-form").getByLabel("Page where you checked these facts").fill("https://example.edu/admissions");
  await page.getByTestId("save-university").click();
  const card = page.getByTestId("university-card").filter({ hasText: uni });
  await expect(card).toContainText("Computer Science BSc");
  await expect(card).toContainText("Time-sensitive — confirm on the official website");

  const item = unique("Science fair poster");
  await page.goto("/career/portfolio");
  await page.getByTestId("add-portfolio-item").click();
  await page.getByTestId("portfolio-title").fill(item);
  await page.getByTestId("portfolio-form").getByLabel("What did you do?").fill("A poster on water filtration for the school science fair.");
  await page.getByTestId("save-portfolio-item").click();
  await expect(page.getByTestId("portfolio-list")).toContainText(item);
  await page.reload();
  await expect(page.getByTestId("portfolio-list")).toContainText(item);

  expect(errors).toEqual([]);
  await context.close();
});
