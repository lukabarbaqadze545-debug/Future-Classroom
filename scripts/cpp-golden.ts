/**
 * Development tool: writes the expected output of every C++ test program in
 * tests/fixtures/cpp by compiling and running it with the real g++.
 *
 *   npx tsx scripts/cpp-golden.ts            # (re)generate every .out
 *   npx tsx scripts/cpp-golden.ts --check    # only report .out files that are out of date
 *
 * The unit tests compare our interpreter with these files, so they never need g++.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(__dirname, "..", "tests", "fixtures", "cpp");
const check = process.argv.includes("--check");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-golden-"));
let stale = 0;
let written = 0;

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".cpp")).sort()) {
  const name = file.slice(0, -4);
  const bin = path.join(dir, name);
  try {
    execFileSync("g++", ["-std=c++17", "-O1", "-w", "-o", bin, path.join(root, file)], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    console.error(`✗ ${file} does not compile with g++:\n${String((e as { stderr?: Buffer }).stderr ?? e)}`);
    stale++;
    continue;
  }
  const inFile = path.join(root, `${name}.in`);
  const input = fs.existsSync(inFile) ? fs.readFileSync(inFile) : "";
  const run = spawnSync(bin, [], { input, encoding: "buffer", timeout: 20_000, maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) {
    console.error(`✗ ${file} exited with ${run.status ?? run.signal}`);
    stale++;
    continue;
  }
  const outFile = path.join(root, `${name}.out`);
  const have = fs.existsSync(outFile) ? fs.readFileSync(outFile) : null;
  if (have !== null && Buffer.compare(have, run.stdout) === 0) continue;
  if (check) {
    console.error(`✗ ${name}.out is out of date`);
    stale++;
  } else {
    fs.writeFileSync(outFile, run.stdout);
    written++;
  }
}

fs.rmSync(dir, { recursive: true, force: true });
console.log(check ? (stale ? `${stale} file(s) out of date` : "All golden outputs are current.") : `Wrote ${written} golden output(s).`);
process.exit(stale ? 1 : 0);
