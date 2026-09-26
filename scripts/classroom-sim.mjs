#!/usr/bin/env node
// Simulates one live classroom against a running Future Classroom server:
// a teacher console, a presentation screen and N students, each with its own
// Server-Sent Events stream, exactly as browsers use the API. The teacher runs
// every activity of a lesson; students answer at the same time.
//
//   node scripts/classroom-sim.mjs --base http://localhost:3000 --students 16
//
// Options: --teacher nino --password demo1234 --lesson <id> --spread <ms>
// (students answer within this many ms of an activity opening; 0 = all at once).
// Prints latencies, request counts and any errors; exits 1 on errors or lost answers.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const BASE = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const STUDENTS = Number(args.students ?? 16);
const SPREAD = Number(args.spread ?? 3000);
const TEACHER = args.teacher ?? "nino";
const PASSWORD = args.password ?? "demo1234";

const stats = { requests: 0, errors: [], timings: {} };
const record = (name, ms) => (stats.timings[name] ??= []).push(ms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Client {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }
  cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  async request(method, path, body, label) {
    const started = performance.now();
    stats.requests++;
    const res = await fetch(BASE + path, {
      method,
      headers: { cookie: this.cookieHeader(), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const [k, ...v] = pair.split("=");
      this.cookies.set(k.trim(), v.join("="));
    }
    const text = await res.text();
    record(label ?? `${method} ${path.replace(/\/[A-Za-z0-9_-]{16}(?=\/|$)/g, "/:id")}`, performance.now() - started);
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const error = `${this.name}: ${method} ${path} → ${res.status} ${typeof data === "object" ? JSON.stringify(data?.error ?? data) : ""}`;
      stats.errors.push(error);
      throw new Error(error);
    }
    return data;
  }
  /** Opens the session's event stream; calls onVersion for every announced version. */
  async listen(sessionId, onVersion) {
    this.abort = new AbortController();
    const res = await fetch(`${BASE}/api/sessions/${sessionId}/events`, { headers: { cookie: this.cookieHeader() }, signal: this.abort.signal });
    if (!res.ok) throw new Error(`${this.name}: events → ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const chunk = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            const data = chunk.split("\n").find((l) => l.startsWith("data: "));
            if (data) onVersion(JSON.parse(data.slice(6)).version);
          }
        }
      } catch {
        // closed
      }
    })();
  }
  close() {
    this.abort?.abort();
  }
}

/** Mirrors useLiveState: re-fetch on a new version, one request in flight at a time. */
function liveView(client, url, label) {
  const state = { data: null, version: -1, inFlight: false, again: false, fetches: 0 };
  const refetch = async () => {
    if (state.inFlight) {
      state.again = true;
      return;
    }
    state.inFlight = true;
    try {
      do {
        state.again = false;
        state.fetches++;
        state.data = await client.request("GET", url, undefined, label);
        state.version = state.data.session.version;
      } while (state.again);
    } catch {
      // recorded in stats
    } finally {
      state.inFlight = false;
    }
  };
  return { state, refetch, onVersion: (v) => v !== state.version && void refetch() };
}

function answerFor(current, i) {
  if (current.type === "multiple_choice" || current.type === "poll") {
    const option = current.options[i % current.options.length];
    return { optionIds: [option.id], text: "" };
  }
  return { optionIds: [], text: i % 3 === 0 ? "x = 2, x = 3" : `answer ${i}` };
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return { n: sorted.length, p50: Math.round(q(0.5)), p95: Math.round(q(0.95)), max: Math.round(sorted[sorted.length - 1]) };
}

async function main() {
  const teacher = new Client("teacher");
  await teacher.request("POST", "/api/auth/login", { username: TEACHER, password: PASSWORD });
  const { lessons } = await teacher.request("GET", "/api/lessons");
  const lesson = args.lesson ? lessons.find((l) => l.id === args.lesson) : lessons.find((l) => /quadratic|კვადრატ/i.test(l.title)) ?? lessons[0];
  if (!lesson) throw new Error("The teacher has no lessons.");
  const { sessionId } = await teacher.request("POST", "/api/sessions", { lessonId: lesson.id, classLabel: "sim" });
  const console_ = liveView(teacher, `/api/sessions/${sessionId}`, "teacher view");
  await console_.refetch();
  const code = console_.state.data.session.joinCode;
  await teacher.listen(sessionId, console_.onVersion);

  const presenter = new Client("presenter");
  presenter.cookies = new Map(teacher.cookies);
  const screen = liveView(presenter, `/api/sessions/${sessionId}`, "presenter view");
  await presenter.listen(sessionId, screen.onVersion);

  console.log(`Lesson “${lesson.title}”, session ${code}, ${STUDENTS} students`);
  const students = await Promise.all(
    Array.from({ length: STUDENTS }, async (_, i) => {
      const client = new Client(`student${i + 1}`);
      await client.request("POST", "/api/sessions/join", { code, name: `Student ${i + 1}` }, "POST join");
      const view = liveView(client, `/api/sessions/${sessionId}/me`, "student view");
      await view.refetch();
      await client.listen(sessionId, view.onVersion);
      return { client, view, i };
    }),
  );
  await sleep(500);

  const activities = console_.state.data.activities;
  const propagation = [];
  for (let a = 0; a < activities.length; a++) {
    const launchedAt = performance.now();
    await teacher.request("POST", `/api/sessions/${sessionId}/control`, { type: "next" }, "POST control");
    const activityId = (await teacher.request("GET", `/api/sessions/${sessionId}`, undefined, "teacher view")).session.currentActivityId;
    // Every student screen must show the new activity.
    await Promise.all(
      students.map(async (s) => {
        const deadline = Date.now() + 20_000;
        while (s.view.state.data?.current?.id !== activityId) {
          if (Date.now() > deadline) {
            stats.errors.push(`student${s.i + 1} never saw activity ${a + 1}`);
            return;
          }
          await sleep(20);
        }
        propagation.push(performance.now() - launchedAt);
      }),
    );
    // Everyone answers within SPREAD ms.
    await Promise.all(
      students.map(async (s) => {
        await sleep(Math.random() * SPREAD);
        const current = s.view.state.data.current;
        if (current.type === "discussion" && s.i % 4 === 3) return; // a few skip open questions
        try {
          await s.client.request("POST", `/api/sessions/${sessionId}/respond`, { activityId: current.id, answer: answerFor(current, s.i) }, "POST respond");
        } catch {
          // recorded
        }
      }),
    );
    await sleep(800);
    const expected = activities[a].activity.type === "discussion" ? students.filter((s) => s.i % 4 !== 3).length : STUDENTS;
    const view = await teacher.request("GET", `/api/sessions/${sessionId}`, undefined, "teacher view");
    const got = view.current.results.responseCount;
    if (got !== expected) stats.errors.push(`activity ${a + 1}: teacher sees ${got} responses, expected ${expected}`);
    await teacher.request("POST", `/api/sessions/${sessionId}/control`, { type: "reveal", revealed: true }, "POST control");
    await sleep(300);
  }
  await teacher.request("POST", `/api/sessions/${sessionId}/control`, { type: "end" }, "POST control");
  await sleep(1500);
  const ended = students.filter((s) => s.view.state.data?.session.status === "ended").length;
  if (ended !== STUDENTS) stats.errors.push(`${STUDENTS - ended} students did not see the session end`);
  const final = await teacher.request("GET", `/api/sessions/${sessionId}`, undefined, "teacher view");
  if (final.session.status !== "ended") stats.errors.push("session did not end");
  for (const c of [teacher, presenter, ...students.map((s) => s.client)]) c.close();

  console.log(`Activities: ${activities.length}, requests: ${stats.requests}, student refetches: ${students.reduce((n, s) => n + s.view.state.fetches, 0)}, teacher refetches: ${console_.state.fetches}`);
  console.log("activity shown on all screens (ms):", summary(propagation));
  for (const [name, values] of Object.entries(stats.timings).sort()) console.log(`${name.padEnd(22)}`, summary(values));
  console.log(`participants recorded: ${final.participants.length}`);
  if (stats.errors.length) {
    console.log(`ERRORS (${stats.errors.length}):`);
    for (const e of stats.errors.slice(0, 20)) console.log("  " + e);
    process.exit(1);
  }
  console.log("OK: every answer reached the teacher, every screen followed the lesson.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  if (stats.errors.length) console.error(stats.errors.slice(0, 10).join("\n"));
  process.exit(1);
});
