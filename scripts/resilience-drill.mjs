#!/usr/bin/env node
// Classroom resilience drill: runs a live lesson in real browsers and breaks it
// on purpose — duplicate tabs, a page reload with a half-typed answer, a slow
// network, and a server restart in the middle of an activity.
//
//   npm run build && node scripts/resilience-drill.mjs
//
// Starts its own production server on a temporary database (port 3300 or
// --port), prints PASS/FAIL per check and exits 1 if any check fails.
// Set PLAYWRIGHT_CHROMIUM_PATH to use a system Chromium.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const portArg = process.argv.indexOf("--port");
const PORT = portArg > 0 ? Number(process.argv[portArg + 1]) : 3300;
const BASE = `http://localhost:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-drill-"));
const env = {
  ...process.env,
  DATABASE_PATH: path.join(dataDir, "fc.db"),
  UPLOAD_DIR: path.join(dataDir, "uploads"),
  SEED_DEMO: "true",
  DEMO_MODE: "false",
  ANTHROPIC_API_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
const nextBin = path.resolve("node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

let server = null;
async function startServer() {
  server = spawn(nextBin, ["start", "-p", String(PORT)], { env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(d));
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}
/** Stops the server like a service manager does; returns how long it took (ms), or throws if it had to be killed. */
async function stopServer() {
  const proc = server;
  server = null;
  if (!proc || proc.exitCode !== null) return 0;
  const started = Date.now();
  const exited = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 10_000);
    proc.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });
    proc.kill("SIGTERM");
  });
  if (!exited) {
    proc.kill("SIGKILL");
    throw new Error("the server did not stop within 10 s of SIGTERM (killed)");
  }
  return Date.now() - started;
}

const results = [];
async function check(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`PASS  ${name} (${Date.now() - started} ms)`);
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started });
    console.log(`FAIL  ${name}: ${String(error.message ?? error).split("\n")[0]}`);
  }
}
async function until(fn, what, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await fn().catch(() => false)) return;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}
const visible = (page, testId) => page.getByTestId(testId).first().isVisible();
const text = (page, testId) => page.getByTestId(testId).first().innerText();

async function main() {
  if (!fs.existsSync(".next/BUILD_ID")) throw new Error("Run `npm run build` first.");
  console.log(`Starting a server on ${BASE} with a temporary database…`);
  await startServer();
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  const errors = [];

  // Teacher: sign in, start the quadratic lesson, open the console.
  const teacherContext = await browser.newContext({ baseURL: BASE, viewport: { width: 1366, height: 900 } });
  const login = await teacherContext.request.post("/api/auth/login", { data: { username: "nino", password: "demo1234" } });
  if (!login.ok()) throw new Error("teacher sign-in failed");
  const { lessons } = await (await teacherContext.request.get("/api/lessons")).json();
  const lesson = lessons.find((l) => /quadratic/i.test(l.title)) ?? lessons[0];
  const { sessionId } = await (await teacherContext.request.post("/api/sessions", { data: { lessonId: lesson.id, classLabel: "drill" } })).json();
  const teacher = await teacherContext.newPage();
  teacher.on("pageerror", (e) => errors.push(`teacher: ${e.message}`));
  await teacher.goto(`/teacher/sessions/${sessionId}`);
  const code = (await text(teacher, "join-code-display")).trim().replace("FC-", "");

  // Three students join with the code.
  const students = [];
  for (const name of ["Ana", "Beka", "Cira"]) {
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
    await page.goto("/join");
    await page.getByTestId("join-code").fill(code);
    await page.getByTestId("join-name").fill(name);
    await page.getByTestId("join-submit").click();
    await page.getByTestId("waiting-screen").waitFor();
    students.push({ name, context, page });
  }
  const [ana, beka, cira] = students;
  console.log("Teacher console open, three students joined.");
  await teacher.getByTestId("launch-first").click();
  for (const s of students) await s.page.getByTestId("student-activity").waitFor();

  await check("duplicate tab: an answer given in one tab shows in the other", async () => {
    const second = await ana.context.newPage();
    second.on("pageerror", (e) => errors.push(`Ana tab 2: ${e.message}`));
    await second.goto(ana.page.url());
    await second.getByTestId("student-activity").waitFor();
    await ana.page.getByTestId("answer-option").first().click();
    await ana.page.getByTestId("submit-answer").click();
    await until(() => teacher.getByTestId("answered-count").innerText().then((t) => t.startsWith("1 ")), "the teacher to see 1 answer");
    // The second tab catches up when it is looked at again (or within the 15 s safety poll).
    await second.bringToFront();
    await second.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await until(async () => !(await second.getByTestId("submit-answer").isVisible()) || (await second.getByText(/Correct|Not quite|Answer sent/i).first().isVisible()), "tab 2 to show the answer", 20_000);
    await second.close();
  });

  await check("slow network: a delayed answer is counted once", async () => {
    await cira.page.route("**/respond", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });
    await cira.page.getByTestId("answer-option").first().click();
    await cira.page.getByTestId("submit-answer").click();
    await until(() => teacher.getByTestId("answered-count").innerText().then((t) => t.startsWith("2 ")), "the teacher to see 2 answers", 15_000);
    await cira.page.unroute("**/respond");
    await new Promise((r) => setTimeout(r, 1500));
    const count = await teacher.getByTestId("answered-count").innerText();
    if (!count.startsWith("2 ")) throw new Error(`teacher sees "${count}"`);
  });

  await teacher.getByTestId("next-activity").click();
  for (const s of students) await until(() => s.page.getByTestId("answer-text").isVisible(), `${s.name} to see activity 2`);

  await check("reload: a half-typed answer is still there", async () => {
    await beka.page.getByTestId("answer-text").fill("x = 2 and");
    await beka.page.reload();
    await until(() => beka.page.getByTestId("answer-text").inputValue().then((v) => v === "x = 2 and"), "the draft to come back", 10_000);
  });

  await check("teacher reload: the console shows the same lesson", async () => {
    await teacher.reload();
    await until(() => visible(teacher, "answered-count"), "the console");
  });

  await check("server restart: screens say so, a queued answer is sent after, the lesson continues", async () => {
    const stopMs = await stopServer();
    console.log(`      (server stopped ${stopMs} ms after SIGTERM with live event streams open)`);
    await until(() => beka.page.getByTestId("connection-badge").getAttribute("data-state").then((s) => s !== "live"), "Beka's screen to show the lost connection", 20_000);
    await beka.page.getByTestId("answer-text").fill("x = 2 and x = 3");
    await beka.page.getByTestId("submit-answer").click();
    await beka.page.getByTestId("answer-queued").waitFor({ timeout: 10_000 });
    await startServer();
    await beka.page.getByTestId("answer-sent-late").waitFor({ timeout: 20_000 });
    await until(() => teacher.getByTestId("answered-count").innerText().then((t) => t.startsWith("1 ")), "the teacher to see Beka's answer", 20_000);
    for (const s of students) await until(() => s.page.getByTestId("connection-badge").getAttribute("data-state").then((st) => st === "live"), `${s.name} to reconnect`, 20_000);
    await teacher.getByTestId("next-activity").click();
    for (const s of students) await until(() => s.page.getByTestId("student-activity").innerText().then((t) => t.length > 0), `${s.name} to see activity 3`);
  });

  await check("no page errors in any browser", async () => {
    if (errors.length) throw new Error(errors.slice(0, 3).join(" | "));
  });

  await browser.close();
  await stopServer().catch(() => {});
  fs.rmSync(dataDir, { recursive: true, force: true });
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `${failed} of ${results.length} checks failed.` : `All ${results.length} checks passed.`);
  process.exit(failed ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await stopServer().catch(() => {});
  process.exit(1);
});
