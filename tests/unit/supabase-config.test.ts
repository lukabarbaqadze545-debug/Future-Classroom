import { describe, expect, it } from "vitest";
import { diagnoseSupabaseEnv } from "@/lib/supabase/config";

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (role: string) => `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role, iss: "supabase" })}.signature`;
const env = (url?: string, key?: string) => ({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key });
const codes = (report: ReturnType<typeof diagnoseSupabaseEnv>) => report.problems.map((p) => `${p.severity}:${p.code}`);

describe("Supabase settings", () => {
  it("is simply off, without complaints, when neither variable is set", () => {
    expect(diagnoseSupabaseEnv(env())).toEqual({ config: null, problems: [] });
    expect(diagnoseSupabaseEnv(env("  ", ""))).toEqual({ config: null, problems: [] });
  });

  it("accepts a project URL with a legacy anon key or a publishable key", () => {
    expect(diagnoseSupabaseEnv(env("https://abcd.supabase.co", jwt("anon")))).toEqual({ config: { url: "https://abcd.supabase.co", anonKey: jwt("anon") }, problems: [] });
    expect(diagnoseSupabaseEnv(env(" https://abcd.supabase.co/ ", " sb_publishable_abc123 ")).config).toEqual({
      url: "https://abcd.supabase.co",
      anonKey: "sb_publishable_abc123",
    });
  });

  it("says which of the two is missing", () => {
    expect(codes(diagnoseSupabaseEnv(env("https://abcd.supabase.co")))).toEqual(["error:missing_key"]);
    expect(codes(diagnoseSupabaseEnv(env(undefined, jwt("anon"))))).toEqual(["error:missing_url"]);
    expect(diagnoseSupabaseEnv(env("https://abcd.supabase.co")).config).toBeNull();
  });

  it("never turns on with a secret key, which browsers would receive", () => {
    expect(codes(diagnoseSupabaseEnv(env("https://abcd.supabase.co", jwt("service_role"))))).toEqual(["error:secret_key"]);
    expect(codes(diagnoseSupabaseEnv(env("https://abcd.supabase.co", "sb_secret_abc")))).toEqual(["error:secret_key"]);
    expect(diagnoseSupabaseEnv(env("https://abcd.supabase.co", jwt("service_role"))).config).toBeNull();
  });

  it("rejects keys and URLs that cannot be right", () => {
    expect(codes(diagnoseSupabaseEnv(env("https://abcd.supabase.co", "not a key")))).toEqual(["error:bad_key"]);
    expect(codes(diagnoseSupabaseEnv(env("https://abcd.supabase.co", jwt("authenticated"))))).toEqual(["error:bad_key"]);
    expect(codes(diagnoseSupabaseEnv(env("abcd.supabase.co", jwt("anon"))))).toEqual(["error:bad_url"]);
    expect(codes(diagnoseSupabaseEnv(env("ftp://abcd.supabase.co", jwt("anon"))))).toEqual(["error:bad_url"]);
  });

  it("warns, but still works, when the URL has a path or is plain http outside this computer", () => {
    const withPath = diagnoseSupabaseEnv(env("https://abcd.supabase.co/rest/v1/", jwt("anon")));
    expect(withPath.config?.url).toBe("https://abcd.supabase.co");
    expect(codes(withPath)).toEqual(["warning:url_has_path"]);
    expect(codes(diagnoseSupabaseEnv(env("http://db.example.org", jwt("anon"))))).toEqual(["warning:insecure_url"]);
    expect(codes(diagnoseSupabaseEnv(env("http://127.0.0.1:54321", jwt("anon"))))).toEqual([]);
  });
});
