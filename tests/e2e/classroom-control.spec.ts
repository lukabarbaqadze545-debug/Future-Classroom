import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, unique, userContext, userPage } from "./helpers";

/**
 * Classroom control: the teacher sees what each student is doing, answers raised
 * hands, sends messages and pages, and pauses screens.
 */

interface Created {
  username: string;
  password: string;
}

async function newClass(teacher: Page, label: string, names: string[]) {
  const name = unique(label);
  const cls = (await (await teacher.request.post("/api/classes", { data: { name } })).json()).class as { id: string };
  const res = await teacher.request.post(`/api/classes/${cls.id}/members`, { data: { newStudents: names } });
  expect(res.ok()).toBeTruthy();
  const created = (await res.json()).created as Created[];
  return { id: cls.id, name, created };
}

async function studentOn(browser: Browser, who: Created, path = "/student", locale = "en"): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const login = await context.request.post("/api/auth/login", { data: { username: who.username, password: who.password } });
  expect(login.ok()).toBeTruthy();
  await context.addCookies([{ name: "fc_locale", value: locale, url: "http://localhost" }]);
  const page = await context.newPage();
  await page.goto(path);
  return { context, page };
}

test("a teacher sees where students are, answers a raised hand, messages, sends a page and pauses screens", async ({ browser }) => {
  test.setTimeout(120_000);
  const { context: tc, page: teacher, errors } = await userPage(browser, "nino");
  const cls = await newClass(teacher, "Live 9A", ["Live Anna", "Live Beka"]);
  const anna = await studentOn(browser, cls.created[0]);
  const beka = await studentOn(browser, cls.created[1]);

  await teacher.goto(`/teacher/classes/${cls.id}/live`);
  const card = (name: string) => teacher.getByTestId("live-student").filter({ hasText: name });
  await expect(teacher.getByRole("heading", { level: 1 })).toContainText("Live classroom");
  await expect(card("Live Anna")).toHaveAttribute("data-status", "active", { timeout: 15_000 });
  await expect(card("Live Beka")).toHaveAttribute("data-status", "active", { timeout: 15_000 });
  await expect(card("Live Anna").getByTestId("live-page")).toHaveText("Home");

  // --- Where is each student? -------------------------------------------------
  await anna.page.goto("/labs/stem");
  await expect(card("Live Anna").getByTestId("live-page")).toHaveText("STEM Lab", { timeout: 15_000 });
  await expect(card("Live Beka").getByTestId("live-page")).toHaveText("Home");

  // --- A raised hand: the note, "I'm coming", then done ---------------------------
  await anna.page.getByTestId("help-button").click();
  await anna.page.getByTestId("help-note").fill("I do not understand the pendulum");
  await anna.page.getByTestId("help-send").click();
  await expect(anna.page.getByTestId("help-raised")).toHaveAttribute("data-acked", "no");
  await expect(card("Live Anna")).toHaveAttribute("data-help", "yes", { timeout: 15_000 });
  await expect(card("Live Anna")).toContainText("I do not understand the pendulum");
  await expect(teacher.getByTestId("live-summary")).toContainText("1 need help");
  // The student who needs help is first.
  await expect(teacher.getByTestId("live-student").first()).toHaveAttribute("data-name", "Live Anna");
  await card("Live Anna").getByTestId("live-help-ack").click();
  await expect(anna.page.getByTestId("help-raised")).toHaveAttribute("data-acked", "yes", { timeout: 15_000 });
  await expect(anna.page.getByTestId("help-raised")).toContainText("Your teacher is on the way.");
  await card("Live Anna").getByTestId("live-help-done").click();
  await expect(card("Live Anna")).toHaveAttribute("data-help", "no");
  await expect(anna.page.getByTestId("help-raised")).toHaveCount(0, { timeout: 15_000 });

  // --- A message to one student ---------------------------------------------------
  await card("Live Beka").getByTestId("live-select").check();
  await expect(teacher.getByTestId("live-target")).toHaveText("1 selected student");
  await teacher.getByTestId("live-message").click();
  await teacher.getByTestId("message-text").fill("Finish question 4, then raise your hand.");
  await teacher.getByTestId("confirm-message").click();
  await expect(teacher.getByTestId("live-notice")).toHaveText("Sent to 1 student.");
  await expect(beka.page.getByTestId("teacher-message")).toContainText("Finish question 4, then raise your hand.", { timeout: 15_000 });
  await expect(beka.page.getByTestId("teacher-message")).toContainText("Message from");
  await expect(anna.page.getByTestId("teacher-message")).toHaveCount(0);
  await expect(card("Live Beka")).toContainText("Message not read yet", { timeout: 10_000 });
  await beka.page.getByTestId("teacher-message-ok").click();
  await expect(beka.page.getByTestId("teacher-message")).toHaveCount(0);
  await expect(card("Live Beka")).not.toContainText("Message not read yet", { timeout: 10_000 });
  // The student's day, in detail, with the message marked as read.
  await card("Live Beka").getByTestId("live-detail").click();
  const detail = teacher.getByTestId("student-detail");
  await expect(detail.getByTestId("detail-pages")).toContainText("Home");
  await expect(detail).toContainText("Finish question 4, then raise your hand.");
  await expect(detail).toContainText("Read");
  await teacher.getByRole("button", { name: "Close" }).first().click();

  // --- Send one student to a page -----------------------------------------------
  await teacher.getByTestId("live-open").click();
  await teacher.getByTestId("open-preset").selectOption("/library");
  await teacher.getByTestId("confirm-open").click();
  await expect(beka.page).toHaveURL(/\/library$/, { timeout: 20_000 });
  await expect(beka.page.getByTestId("classroom-toast")).toContainText("Your teacher opened this page for you.");
  await expect(anna.page).toHaveURL(/\/labs\/stem$/);
  await expect(card("Live Beka").getByTestId("live-page")).toHaveText("Library", { timeout: 15_000 });

  // --- Pause every screen, and resume -----------------------------------------------
  await teacher.getByRole("button", { name: "Clear selection" }).click();
  await teacher.getByTestId("live-pause").click();
  await teacher.getByTestId("pause-message").fill("Eyes on the board, please.");
  await teacher.getByTestId("confirm-pause").click();
  await expect(teacher.getByTestId("live-notice")).toHaveText("Paused 2 screens.");
  for (const s of [anna, beka]) {
    await expect(s.page.getByTestId("screen-paused")).toBeVisible({ timeout: 15_000 });
    await expect(s.page.getByTestId("paused-message")).toHaveText("Eyes on the board, please.");
    // Nothing behind the notice can be used or reached with the keyboard.
    expect(await s.page.evaluate(() => document.querySelector("#main")?.closest("[inert]") !== null)).toBe(true);
  }
  await expect(card("Live Anna")).toHaveAttribute("data-locked", "yes");
  await teacher.getByTestId("live-resume").click();
  await expect(teacher.getByTestId("live-notice")).toHaveText("Resumed 2 screens.");
  for (const s of [anna, beka]) {
    await expect(s.page.getByTestId("screen-paused")).toHaveCount(0, { timeout: 15_000 });
    expect(await s.page.evaluate(() => document.querySelector("#main")?.closest("[inert]") !== null)).toBe(false);
  }

  // --- A closed tab goes offline -------------------------------------------------
  await anna.page.close({ runBeforeUnload: true });
  await anna.context.close();
  await expect(card("Live Anna")).toHaveAttribute("data-status", "offline", { timeout: 15_000 });
  await expect(card("Live Anna").getByTestId("live-page")).toHaveText("STEM Lab");

  expect(errors).toEqual([]);
  await beka.context.close();
  await tc.close();
});

test("only the class's own teacher can see or control it, and students cannot", async ({ browser }) => {
  const { context: tc, page: teacher } = await userPage(browser, "nino");
  const cls = await newClass(teacher, "Live 10B", ["Live Cato"]);
  const cato = await studentOn(browser, cls.created[0]);

  // Another teacher: neither the view nor any control.
  const davit = await userPage(browser, "davit");
  expect((await davit.page.request.get(`/api/classroom/${cls.id}`)).status()).toBe(403);
  expect((await davit.page.request.post(`/api/classroom/${cls.id}/control`, { data: { action: "lock", studentIds: null, message: "" } })).status()).toBe(403);
  // (The page streams, so a missing class is shown as the not-found page rather than as a 404 status.)
  await davit.page.goto(`/teacher/classes/${cls.id}/live`);
  await expect(davit.page.getByTestId("live-classroom")).toHaveCount(0);
  await expect(davit.page.locator("body")).not.toContainText(cls.name);
  await davit.context.close();

  // A student: no view of the class and no controls.
  expect((await cato.page.request.get(`/api/classroom/${cls.id}`)).status()).toBe(403);
  expect((await cato.page.request.post(`/api/classroom/${cls.id}/control`, { data: { action: "message", studentIds: null, text: "hi" } })).status()).toBe(403);
  expect((await cato.page.goto(`/teacher/classes/${cls.id}/live`))?.url()).not.toContain("/live");

  // The teacher cannot send students to another site or to the API.
  for (const path of ["https://example.com/", "//example.com", "/api/auth/logout"]) {
    const res = await teacher.request.post(`/api/classroom/${cls.id}/control`, { data: { action: "open", studentIds: null, path } });
    expect(res.status(), path).toBe(400);
  }
  // Only the path of a page is recorded, never its query.
  await cato.page.goto("/library?q=secret-query");
  await expect.poll(async () => JSON.stringify(await (await teacher.request.get(`/api/classroom/${cls.id}`)).json()), { timeout: 15_000 }).toContain('"/library"');
  expect(JSON.stringify(await (await teacher.request.get(`/api/classroom/${cls.id}`)).json())).not.toContain("secret-query");

  await cato.context.close();
  await tc.close();
});

test("the live classroom in Georgian, on a phone", async ({ browser }) => {
  const context = await userContext(browser, "nino", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addCookies([{ name: "fc_locale", value: "ka", url: "http://localhost" }]);
  const teacher = await context.newPage();
  const cls = await newClass(teacher, "ცოცხალი 9ა", ["ცოცხალი ანა", "ცოცხალი ბექა"]);
  const ana = await studentOn(browser, cls.created[0], "/student", "ka");
  await teacher.goto(`/teacher/classes/${cls.id}/live`);
  await expect(teacher.getByRole("heading", { level: 1 })).toContainText("საკლასო ოთახი ცოცხლად");
  const card = teacher.getByTestId("live-student").filter({ hasText: "ცოცხალი ანა" });
  await expect(card).toHaveAttribute("data-status", "active", { timeout: 15_000 });
  await expect(card).toContainText("მუშაობს");
  await expect(teacher.getByTestId("live-summary")).toContainText("კავშირგარეშეა: 1");

  await ana.page.getByTestId("help-button").click();
  await ana.page.getByTestId("help-send").click();
  await expect(card).toContainText("დახმარება სჭირდება", { timeout: 15_000 });
  await expectNoHorizontalScroll(teacher);

  await teacher.getByTestId("live-pause").tap();
  await teacher.getByTestId("confirm-pause").tap();
  await expect(ana.page.getByTestId("screen-paused")).toContainText("მასწავლებელმა ეკრანები შეაჩერა", { timeout: 15_000 });
  await expect(ana.page.getByTestId("paused-message")).toHaveText("ახლა მასწავლებელს მოუსმინე.");

  await ana.context.close();
  await context.close();
});

test("the class page links to the live classroom", async ({ browser }) => {
  const { context, page } = await userPage(browser, "nino");
  const cls = await newClass(page, "Live link", ["Live Dato"]);
  await page.goto(`/teacher/classes/${cls.id}`);
  await page.getByTestId("class-live").click();
  await expect(page).toHaveURL(new RegExp(`/teacher/classes/${cls.id}/live$`));
  await expect(page.getByTestId("live-student")).toHaveCount(1);
  await context.close();
});
