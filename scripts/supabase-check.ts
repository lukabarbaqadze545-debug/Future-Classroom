/**
 * Checks the Supabase settings of this site, from this computer.
 *
 *   npm run supabase:check
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (from the
 * environment or .env.local), says what is wrong with them, then asks the
 * project for its public auth settings: whether the key is accepted, whether
 * sign-ups and email confirmation are on and which redirect address to allow.
 * Only the public key is used; nothing is changed or created.
 */
import "./env";
import { diagnoseSupabaseEnv } from "../src/lib/supabase/config";
import { CONFIG_PROBLEM_TEXT, fetchProjectSettings, interpretSettingsResult, type CheckLine } from "../src/lib/supabase/check";

async function main() {
  const report = diagnoseSupabaseEnv(process.env);
  const lines: CheckLine[] = [];
  if (!report.config && report.problems.length === 0) {
    lines.push({ level: "OK", text: "Supabase sign-in is off (neither variable is set): the site uses its own name-and-password accounts only." });
  }
  for (const problem of report.problems) lines.push({ level: problem.severity === "error" ? "FAIL" : "WARN", text: CONFIG_PROBLEM_TEXT[problem.code] });
  if (report.config) {
    lines.push({ level: "OK", text: `Settings found: ${report.config.url}` });
    const base = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/+$/, "") || "https://<your site>";
    lines.push(...interpretSettingsResult(await fetchProjectSettings(report.config), `${base}/auth/callback`));
  }
  for (const line of lines) console.log(`${line.level.padEnd(4)}  ${line.text}`);
  const failed = lines.filter((l) => l.level === "FAIL").length;
  console.log(failed ? `\n${failed} problem(s) need attention.` : "\nNo blocking problems found.");
  process.exit(failed ? 1 : 0);
}

void main();
