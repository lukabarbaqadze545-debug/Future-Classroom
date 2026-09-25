// Starts a production server with a fresh, seeded demo database for e2e tests.
import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.argv[2] ?? "3210";
const dataDir = path.resolve("data", "e2e");
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

const env = {
  ...process.env,
  DATABASE_PATH: path.join(dataDir, "future-classroom.db"),
  UPLOAD_DIR: path.join(dataDir, "uploads"),
  SEED_DEMO: "true",
  DEMO_MODE: "true",
  ANTHROPIC_API_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const next = path.resolve("node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
if (!process.env.E2E_SKIP_BUILD) {
  const build = spawnSync(next, ["build"], { stdio: "inherit", env });
  if (build.status !== 0) process.exit(build.status ?? 1);
}
const server = spawn(next, ["start", "-p", port], { stdio: "inherit", env });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
