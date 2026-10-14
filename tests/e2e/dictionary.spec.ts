import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, userContext } from "./helpers";

/**
 * The Learning Assistant as a dictionary: a word typed or asked about is
 * answered with its entry in the school's English–Spanish book, with suggestions
 * while typing, spelling help, saving to "My words" and practising them. Runs
 * without AI. The saved words live in the browser, so each test starts clean.
 */

test("a student looks a word up, saves it and practises it", async ({ browser }) => {
  const context = await userContext(browser, "mariam");
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/learning-assistant");
  const input = page.getByTestId("assistant-text");

  // Suggestions appear while typing; the arrow keys and Enter choose one.
  await input.click();
  await input.pressSequentially("afte");
  const list = page.getByTestId("assistant-suggest");
  await expect(list).toBeVisible();
  await expect(page.getByTestId("assistant-suggest-item").first()).toContainText("afternoon");
  await expect(page.getByTestId("assistant-suggest-item").first()).toContainText("la tarde");
  await input.press("ArrowDown");
  await expect(page.getByTestId("assistant-suggest-item").first()).toHaveAttribute("aria-selected", "true");
  await input.press("Enter");

  // The entry, exactly as the book prints it.
  const card = page.getByTestId("word-card").first();
  await expect(card).toBeVisible();
  await expect(card.getByTestId("word-headword")).toHaveText("afternoon");
  await expect(card.getByTestId("word-spanish")).toHaveText("la tarde");
  await expect(card).toContainText("We usually have lunch in the early afternoon.");
  await expect(card).toContainText("Normalmente almorzamos a primera hora de la tarde.");
  await expect(card).toContainText("good afternoon");
  await expect(card.getByTestId("word-open-book")).toHaveAttribute("href", /\/library\/lib-english-spanish-dictionary-1\/read\?view=text&s=\d+&p=\d+&hl=AFTERNOON#hit/);
  // The passages of the book follow the entry, as before.
  await expect(page.getByTestId("assistant-passages")).toContainText("English–Spanish Learning Dictionary");

  // Save it; "My words" shows it on this device.
  await card.getByTestId("word-save").click();
  await expect(card.getByTestId("word-save")).toHaveAttribute("data-saved", "yes");
  await expect(page.getByTestId("my-words-link")).toContainText("(1)");
  await expect(page.getByTestId("my-words-due")).toContainText("1");

  await page.getByTestId("my-words-link").click();
  await expect(page).toHaveURL(/\/learning-assistant\/words$/);
  await expect(page.getByTestId("words-stat-total")).toHaveText("1");
  await expect(page.getByTestId("words-stat-due")).toHaveText("1");
  await expect(page.getByTestId("words-list-item")).toHaveAttribute("data-word", "afternoon");
  await expect(page.getByTestId("words-list-item")).toContainText("la tarde");

  // Practise with cards: front, answer, "I knew it".
  await page.getByTestId("words-start").click();
  await expect(page.getByTestId("words-front")).toContainText("afternoon");
  await expect(page.getByTestId("words-back")).toHaveCount(0);
  await page.getByTestId("words-show").click();
  await expect(page.getByTestId("words-answer")).toHaveText("la tarde");
  await page.getByTestId("words-knew").click();
  await expect(page.getByTestId("words-done")).toBeVisible();
  await expect(page.getByTestId("words-result")).toHaveText("1 of 1 known.");

  // The word moved up a box and is no longer due; the game gave experience for it.
  await page.getByTestId("words-close").click();
  await expect(page.getByTestId("words-stat-due")).toHaveText("0");
  await expect(page.getByTestId("words-none-due")).toBeVisible();
  await page.goto("/today");
  await expect(page.getByTestId("xp-total")).toHaveText("2");

  // The list survives a reload.
  await page.goto("/learning-assistant/words");
  await expect(page.getByTestId("words-stat-total")).toHaveText("1");

  expect(errors).toEqual([]);
  await context.close();
});

test("questions about a word are answered with its entry, and say how it was found", async ({ browser }) => {
  const context = await userContext(browser, "mariam");
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const ask = async (text: string) => {
    await page.goto(`/learning-assistant?mode=explain&q=${encodeURIComponent(text)}`);
    await expect(page.getByTestId("assistant-result")).toBeVisible();
  };

  // The question is searched by its subject, and the page says so.
  await ask("What does afternoon mean?");
  await expect(page.getByTestId("assistant-understood")).toHaveText("Searched for: „afternoon“");
  await expect(page.getByTestId("word-card").first()).toHaveAttribute("data-word", "afternoon");
  await expect(page.getByTestId("word-card").first()).toHaveAttribute("data-how", "headword");

  // A common word that the plain text search used to lose among thousands of "Meaning:" lines.
  await ask("what does have mean");
  await expect(page.getByTestId("word-card").first()).toHaveAttribute("data-word", "have");

  // A form of a word leads to the word, and says so.
  await ask("went");
  const form = page.getByTestId("word-card").first();
  await expect(form).toHaveAttribute("data-word", "go");
  await expect(form.getByTestId("word-how")).toHaveText("„went“ is a form of this word");

  // A Spanish word leads to the English one.
  await ask("What is la tarde in English?");
  const spanish = page.getByTestId("word-card").first();
  await expect(spanish).toHaveAttribute("data-word", "afternoon");
  await expect(spanish).toHaveAttribute("data-how", "translation");
  await expect(page.getByTestId("assistant-dictionary")).toContainText("Spanish → English");

  // A misspelling is not turned into an entry; a close word is offered.
  await ask("recieve");
  await expect(page.getByTestId("word-card")).toHaveCount(0);
  await expect(page.getByTestId("assistant-dictionary")).toContainText("No entry for „recieve“");
  await page.getByTestId("dictionary-suggestions").getByRole("button", { name: /^receive/ }).click();
  await expect(page.getByTestId("word-card").first()).toHaveAttribute("data-word", "receive");

  // Questions about ideas are not dictionary look-ups.
  await ask("How does photosynthesis work?");
  await expect(page.getByTestId("assistant-dictionary")).toHaveCount(0);

  expect(errors).toEqual([]);
  await context.close();
});

test("choosing the answer, in Georgian, on a phone", async ({ browser }) => {
  const context = await userContext(browser, "mariam", { viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: "fc_locale", value: "ka", url: "http://localhost" }]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // Nothing saved yet: the page says so, and offers today's words.
  await page.goto("/learning-assistant/words");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ჩემი სიტყვები");
  await expect(page.getByTestId("words-empty")).toBeVisible();
  await expect(page.getByTestId("words-daily").getByTestId("word-card")).toHaveCount(3);
  await page.getByTestId("words-save-all").click();
  await expect(page.getByTestId("words-stat-total")).toHaveText("3");
  await expectNoHorizontalScroll(page);

  // Choosing the answer: four options, the right one is marked after the choice.
  await page.getByTestId("words-mode-choice").click();
  await page.getByTestId("words-start").click();
  await expect(page.getByTestId("words-round")).toHaveAttribute("data-mode", "choice");
  await expect(page.getByTestId("words-option")).toHaveCount(4);
  await expectNoHorizontalScroll(page);
  await page.getByTestId("words-option").first().click();
  await expect(page.getByTestId("words-feedback")).toBeVisible();
  await expect(page.getByTestId("words-option").and(page.locator("[data-state=right]"))).toHaveCount(1);
  await page.getByTestId("words-next").click();
  await expect(page.getByTestId("words-progress")).toHaveText("2 3-დან");

  expect(errors).toEqual([]);
  await context.close();
});

test("the word of the day is on the Today page", async ({ browser }) => {
  const context = await userContext(browser, "mariam");
  const page = await context.newPage();
  await page.goto("/today");
  const word = page.getByTestId("word-of-day");
  await expect(word).toBeVisible();
  const text = (await page.getByTestId("word-of-day-word").textContent())!.trim();
  expect(text).toMatch(/^[a-z]+$/);
  await word.getByTestId("word-save").click();
  await page.goto("/learning-assistant/words");
  await expect(page.getByTestId("words-list-item")).toHaveAttribute("data-word", text);
  await context.close();
});
