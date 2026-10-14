#!/usr/bin/env node
// Simulates classroom control for one class against a running server with real
// student accounts (OPEN_ACCESS=false): N students send a heartbeat every 6 s as
// the browser does, the teacher's live view polls every 4 s, and the teacher
// sends a message, opens a page and pauses and resumes the screens. Reports
// request latencies and how long each command took to reach the students.
//
//   node scripts/classroom-control-sim.mjs --base http://localhost:3000 --students 20 --seconds 60
//
// Options: --teacher nino --password demo1234. Exits 1 on errors or undelivered commands.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const BASE = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const STUDENTS = Number(args.students ?? 20);
const SECONDS = Number(args.seconds ?? 60);
const TEACHER = args.teacher ?? "nino";
const PASSWORD = args.password ?? "demo1234";
const BEAT_MS = 6000;
const POLL_MS = 4000;

const timings = {};
const errors = [];
let requests = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Client {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }
  async request(method, path, body, label) {
    const started = performance.now();
    requests++;
    const res = await fetch(BASE + path, {
      method,
      headers: { cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const [k, ...v] = pair.split("=");
      this.cookies.set(k.trim(), v.join("="));
    }
    const text = await res.text();
    (timings[label ?? method + " " + path] ??= []).push(performance.now() - started);
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      errors.push(`${this.name}: ${method} ${path} → ${res.status} ${JSON.stringify(data?.error ?? data)}`);
      throw new Error(errors.at(-1));
    }
    return data;
  }
}

const teacher = new Client("teacher");
await teacher.request("POST", "/api/auth/login", { username: TEACHER, password: PASSWORD });
const cls = (await teacher.request("POST", "/api/classes", { name: `Sim ${Date.now().toString(36).slice(-4)}` })).class;
const names = Array.from({ length: STUDENTS }, (_, i) => `Sim Student ${i + 1}`);
const { created } = await teacher.request("POST", `/api/classes/${cls.id}/members`, { newStudents: names });

const seen = { message: new Map(), open: new Map(), locked: new Map(), unlocked: new Map() };
const sent = {};
let running = true;

async function student(account, index) {
  const me = new Client(account.username);
  await me.request("POST", "/api/auth/login", { username: account.username, password: account.password });
  const paths = ["/student", "/labs/stem", "/library", "/labs/programming", "/subjects"];
  let path = paths[index % paths.length];
  let wasLocked = false;
  await sleep((index / STUDENTS) * BEAT_MS); // browsers do not beat in step
  while (running) {
    const { state } = await me.request("POST", "/api/classroom/heartbeat", { tabId: `tab${index}`, path, title: "Sim", visible: true, idleMs: 1000 }, "POST heartbeat");
    const now = performance.now();
    if (state?.messages?.length && !seen.message.has(index)) seen.message.set(index, now);
    if (state?.open?.path && !seen.open.has(index)) {
      seen.open.set(index, now);
      path = state.open.path;
    }
    if (state?.locked && !wasLocked) seen.locked.set(index, now);
    if (!state?.locked && wasLocked) seen.unlocked.set(index, now);
    wasLocked = Boolean(state?.locked);
    await sleep(BEAT_MS);
  }
}

async function teacherView() {
  while (running) {
    await teacher.request("GET", `/api/classroom/${cls.id}`, undefined, "GET class state");
    await sleep(POLL_MS);
  }
}

const started = performance.now();
const workers = created.map((a, i) => student(a, i).catch(() => {}));
const view = teacherView().catch(() => {});
const at = (fraction) => sleep(Math.max(0, started + SECONDS * 1000 * fraction - performance.now()));

await at(0.25);
sent.message = performance.now();
await teacher.request("POST", `/api/classroom/${cls.id}/control`, { action: "message", studentIds: null, text: "Eyes up." }, "POST control");
await at(0.45);
sent.open = performance.now();
await teacher.request("POST", `/api/classroom/${cls.id}/control`, { action: "open", studentIds: null, path: "/library" }, "POST control");
await at(0.65);
sent.locked = performance.now();
await teacher.request("POST", `/api/classroom/${cls.id}/control`, { action: "lock", studentIds: null, message: "Listen." }, "POST control");
await at(0.8);
sent.unlocked = performance.now();
await teacher.request("POST", `/api/classroom/${cls.id}/control`, { action: "unlock", studentIds: null }, "POST control");
await at(1);
running = false;
await Promise.race([Promise.all([...workers, view]), sleep(BEAT_MS + 2000)]);

const pct = (list, p) => {
  const s = [...list].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
console.log(`\n${STUDENTS} students, ${SECONDS} s, ${requests} requests (${(requests / SECONDS).toFixed(1)} per second)\n`);
for (const [label, list] of Object.entries(timings)) {
  console.log(`${label.padEnd(20)} n=${String(list.length).padStart(4)}  p50 ${pct(list, 50).toFixed(0).padStart(4)} ms  p95 ${pct(list, 95).toFixed(0).padStart(4)} ms  max ${Math.max(...list).toFixed(0).padStart(4)} ms`);
}
console.log("");
let missing = 0;
for (const kind of ["message", "open", "locked", "unlocked"]) {
  const delays = [...seen[kind].values()].map((t) => t - sent[kind]);
  const got = delays.length;
  missing += STUDENTS - got;
  console.log(`${kind.padEnd(9)} reached ${got}/${STUDENTS} students, after ${got ? `${(pct(delays, 50) / 1000).toFixed(1)} s (median), ${(Math.max(...delays) / 1000).toFixed(1)} s (slowest)` : "—"}`);
}
if (errors.length) console.log(`\n${errors.length} errors, first: ${errors[0]}`);
process.exit(errors.length || missing ? 1 : 0);
