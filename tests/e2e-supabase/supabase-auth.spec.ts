import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Sign-up and sign-in with an email, against a stand-in for Supabase
 * (tests/e2e-supabase/mock-supabase.mjs). What the real service would do is
 * decided by the address: see the comment at the top of the mock.
 */
const MOCK = `http://127.0.0.1:${process.env.E2E_MOCK_SUPABASE_PORT ?? 3299}`;
const PASSWORD = "my-first-password";
const run = Date.now().toString(36);
const address = (local: string) => `${local}@${run}.example.org`;

async function signUp(page: Page, name: string, email: string, password = PASSWORD) {
  await page.goto("/register");
  await page.getByTestId("su-name").fill(name);
  await page.getByTestId("su-email").fill(email);
  await page.getByTestId("su-password").fill(password);
  await page.getByTestId("su-submit").click();
}

/** What the confirmation email's link carries once the address is confirmed (the mock plays the part of Supabase's verify page). */
async function confirmationLink(request: APIRequestContext, email: string, confirm = true) {
  const res = await request.post(`${MOCK}/__mock/link`, { data: { email, confirm } });
  expect(res.ok(), `link for ${email}`).toBeTruthy();
  const { accessToken } = (await res.json()) as { accessToken: string };
  return `#access_token=${accessToken}&token_type=bearer&type=signup&expires_in=3600&refresh_token=r`;
}

/** A person who signed up and has not opened the link yet (done without a browser). */
/** Opens the callback page afresh: going from one hash to another on the same page would not reload it. */
async function openLink(page: Page, hash: string) {
  await page.goto("/login");
  await page.goto(`/auth/callback${hash}`);
}

async function registeredViaApi(request: APIRequestContext, email: string, name: string) {
  const res = await request.post(`${MOCK}/auth/v1/signup`, { data: { email, password: PASSWORD, data: { full_name: name } } });
  expect(res.ok()).toBeTruthy();
}

test("sign up with an email, open the confirmation link, land signed in, sign out and back in", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = address("lika");

  await page.goto("/register");
  await expect(page.getByTestId("supabase-register-form")).toBeVisible();
  await expect(page.getByText("No email? Create an account with just a name")).toBeVisible();
  await signUp(page, "Lika Email", email);

  // Nothing is signed in yet: the person is told to open the link, and may ask for another.
  await expect(page.getByTestId("check-email")).toContainText(email);
  await expect(page.getByTestId("resend-link")).toBeDisabled();
  await expect(page.getByTestId("resend-link")).toContainText(/Send again in \d+ s/);
  await page.goto("/student");
  await expect(page).toHaveURL(/\/login/);
  const sent = (await (await request.get(`${MOCK}/__mock/signups`)).json()) as { email: string; name: string; redirectTo: string }[];
  expect(sent.find((s) => s.email === email)).toMatchObject({ name: "Lika Email", redirectTo: "http://localhost:3212/auth/callback" });

  // The link brings the person back: the server checks the token with Supabase and starts the site's own session.
  await page.goto(`/auth/callback${await confirmationLink(request, email)}`);
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText("Lika Email");
  await page.goto("/account");
  await expect(page.getByText(`You sign in with ${email}.`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Change password" })).toHaveCount(0);

  // Sign out, then sign in again with the email and password.
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Name, username or email").fill(email.toUpperCase());
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Name, username or email").fill(email);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText("Lika Email");
  expect(errors).toEqual([]);
});

test("says what went wrong when signing up fails", async ({ page }) => {
  const cases: [string, string][] = [
    ["taken", "This email already has an account."],
    ["dupconfirm", "This email already has an account."],
    ["weak", "This password is too weak."],
    ["ratelimit", "Too many confirmation emails were sent."],
    ["boom", "The sign-in service isn't answering right now."],
  ];
  for (const [local, message] of cases) {
    await signUp(page, "Someone", address(local));
    await expect(page.getByTestId("supabase-register-form").getByRole("alert"), local).toContainText(message);
    await expect(page.getByTestId("su-submit")).toBeEnabled();
    await expect(page.getByTestId("su-name")).toHaveValue("Someone");
  }
});

test("a project that does not ask for email confirmation signs the person in at once", async ({ page }) => {
  await signUp(page, "Auto Student", address("auto"));
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText("Auto Student");
});

test("signing in before confirming the address explains what to do, and sends the link again", async ({ page, request }) => {
  const email = address("pending");
  await registeredViaApi(request, email, "Pending Person");
  await page.goto("/login");
  await page.getByLabel("Name, username or email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByTestId("check-email")).toContainText(email);
  await page.getByTestId("resend-link").click();
  await expect(page.getByText("We sent a new link.")).toBeVisible();
  const sent = (await (await request.get(`${MOCK}/__mock/signups`)).json()) as { email: string; resend?: boolean }[];
  expect(sent.some((s) => s.email === email && s.resend)).toBe(true);
});

test("links that cannot be used end with a message and a way back, and the tokens never stay in the address", async ({ page, request }) => {
  // The link expired.
  await page.goto("/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  await expect(page.getByTestId("callback-failed")).toContainText("This link has expired or was already used.");
  expect(page.url()).not.toContain("#");
  await page.getByTestId("callback-failed").getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);

  // A token Supabase does not know.
  await openLink(page, "#access_token=mock-token-doesnotexist000000&type=signup");
  await expect(page.getByTestId("callback-failed")).toContainText("Your sign-in is no longer valid.");

  // A token of an address that was not confirmed: the site refuses to open an account for it.
  const email = address("unconfirmed");
  await registeredViaApi(request, email, "Unconfirmed");
  await openLink(page, await confirmationLink(request, email, false));
  await expect(page.getByTestId("callback-failed")).toContainText("Confirm your email first");

  // A password-reset link is not something this site can finish.
  await openLink(page, "#access_token=mock-token-whatever000000000&type=recovery");
  await expect(page.getByTestId("callback-failed")).toContainText("This kind of link isn't supported here.");

  // Opening the page directly just goes to sign-in.
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/login/);
});

test("a link that lands on another page (the redirect address was not allowed in the project) is sent on", async ({ page, request }) => {
  const email = address("elsewhere");
  await registeredViaApi(request, email, "Elsewhere Person");
  await page.goto(`/${await confirmationLink(request, email)}`);
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText("Elsewhere Person");
});

test("the school's own accounts keep signing in with a name, and the name-only registration is still there", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Name, username or email").fill("nino");
  await page.getByLabel("Password", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher/);
  await page.getByRole("button", { name: "Sign out" }).click();

  await page.goto("/register");
  await page.getByText("No email? Create an account with just a name").click();
  const name = `Name Only ${run}`;
  await page.getByTestId("register-name").fill(name);
  await page.getByTestId("register-password").fill(PASSWORD);
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByTestId("account-link")).toContainText(name);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
});

test("the privacy page says where the email is kept", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText("kept by the sign-in service Supabase")).toBeVisible();
});
