import { describe, expect, it } from "vitest";
import { fetchProjectSettings, interpretSettingsResult, type SettingsResult } from "@/lib/supabase/check";

const config = { url: "https://abcd.supabase.co", anonKey: "sb_publishable_x" };
const reply = (status: number, body: unknown): typeof fetch =>
  (async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })) as unknown as typeof fetch;
const levels = (result: SettingsResult) => interpretSettingsResult(result, "https://school.example/auth/callback").map((l) => l.level);

describe("Checking the Supabase project", () => {
  it("asks the project for its public settings with the public key only", async () => {
    let seen: { url: string; apikey: string | null } | null = null;
    const spy = (async (url: string, init: RequestInit) => {
      seen = { url, apikey: new Headers(init.headers).get("apikey") };
      return new Response(JSON.stringify({ external: { email: true }, disable_signup: false, mailer_autoconfirm: false }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await fetchProjectSettings(config, spy);
    expect(seen).toEqual({ url: "https://abcd.supabase.co/auth/v1/settings", apikey: "sb_publishable_x" });
    expect(result).toEqual({ ok: true, settings: { external: { email: true }, disable_signup: false, mailer_autoconfirm: false } });
  });

  it("tells a refused key, a wrong address and an unreachable project apart", async () => {
    expect(await fetchProjectSettings(config, reply(401, { message: "Invalid API key" }))).toEqual({ ok: false, reason: "rejected", status: 401 });
    expect(await fetchProjectSettings(config, reply(404, { msg: "nope" }))).toEqual({ ok: false, reason: "unexpected", status: 404 });
    expect(await fetchProjectSettings(config, reply(200, { hello: "world" }))).toEqual({ ok: false, reason: "unexpected", status: 200 });
    const offline = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect(await fetchProjectSettings(config, offline)).toEqual({ ok: false, reason: "unreachable", detail: "fetch failed" });
    expect(levels({ ok: false, reason: "unreachable", detail: "x" })).toEqual(["WARN"]);
    expect(levels({ ok: false, reason: "rejected", status: 401 })).toEqual(["FAIL"]);
  });

  it("explains confirmation, sign-ups and the redirect address", () => {
    const confirmed = interpretSettingsResult(
      { ok: true, settings: { external: { email: true }, disable_signup: false, mailer_autoconfirm: false } },
      "https://school.example/auth/callback",
    );
    expect(confirmed.map((l) => l.level)).toEqual(["OK", "OK", "WARN"]);
    expect(confirmed[1].text).toContain("Email confirmation is ON");
    expect(confirmed[2].text).toContain("https://school.example/auth/callback");

    const open = interpretSettingsResult({ ok: true, settings: { external: { email: true }, disable_signup: true, mailer_autoconfirm: true } }, "x");
    expect(open.map((l) => l.level)).toEqual(["OK", "WARN", "WARN"]);
    expect(open[1].text).toContain("New sign-ups are disabled");
    expect(open[2].text).toContain("Email confirmation is OFF");
    expect(interpretSettingsResult({ ok: true, settings: { external: { email: false } } }, "x").map((l) => l.level)).toEqual(["OK", "FAIL"]);
  });
});
