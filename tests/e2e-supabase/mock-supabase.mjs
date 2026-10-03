// A small stand-in for the Supabase Auth HTTP API, for the e2e tests of the
// sign-up flow (nothing here talks to the internet). It answers the calls
// supabase-js makes (signup, password sign-in, resend, user, settings) and has
// two test-only endpoints: POST /__mock/link {email} confirms the address the
// way the email link would and returns the access token the link carries
// ({ "confirm": false } returns the token without confirming);
// GET /__mock/signups lists what was sent to sign up.
//
// What happens is decided by the address (the part before the @):
//   taken      -> 422 user_already_exists
//   weak       -> 422 weak_password
//   ratelimit  -> 429 over_email_send_rate_limit
//   dupconfirm -> a user without identities (the answer for an existing address when confirmation is on)
//   auto       -> no email confirmation: the answer already carries a session
//   boom       -> 500
//   anything else needs the confirmation link.
import http from "node:http";
import crypto from "node:crypto";

const port = Number(process.argv[2] ?? 3299);
const users = new Map(); // email -> { id, email, password, name, confirmed, token }
const signups = [];

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};
const fail = (res, status, code, msg, extra = {}) => send(res, status, { code: status, error_code: code, msg, ...extra });

const userJson = (u) => ({
  id: u.id,
  aud: "authenticated",
  role: "authenticated",
  email: u.email,
  email_confirmed_at: u.confirmed ? new Date().toISOString() : undefined,
  confirmed_at: u.confirmed ? new Date().toISOString() : undefined,
  user_metadata: { full_name: u.name },
  app_metadata: { provider: "email" },
  identities: [{ identity_id: crypto.randomUUID(), id: u.id, user_id: u.id, provider: "email" }],
  created_at: new Date().toISOString(),
});
const session = (u) => ({ access_token: u.token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "refresh-" + u.id, user: userJson(u) });

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    return {};
  }
}

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "apikey, authorization, content-type, x-client-info, x-supabase-api-version");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return void res.writeHead(204).end();
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const local = (name) => name.split("@")[0].toLowerCase();

    if (url.pathname === "/health") return send(res, 200, { ok: true });
    if (url.pathname === "/__mock/signups") return send(res, 200, signups);
    if (url.pathname === "/__mock/link" && req.method === "POST") {
      const { email, confirm = true } = await body(req);
      const user = users.get(String(email).toLowerCase());
      if (!user) return send(res, 404, { error: "unknown" });
      if (confirm) user.confirmed = true;
      return send(res, 200, { accessToken: user.token });
    }
    if (url.pathname === "/auth/v1/settings") return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: false });

    if (url.pathname === "/auth/v1/signup" && req.method === "POST") {
      const input = await body(req);
      const email = String(input.email ?? "").toLowerCase();
      signups.push({ email, name: input.data?.full_name ?? null, redirectTo: url.searchParams.get("redirect_to") });
      const who = local(email);
      if (who === "boom") return fail(res, 500, "unexpected_failure", "Database error");
      if (who === "taken") return fail(res, 422, "user_already_exists", "User already registered");
      if (who === "weak") return fail(res, 422, "weak_password", "Password should be at least 8 characters.", { weak_password: { reasons: ["length"] } });
      if (who === "ratelimit") return fail(res, 429, "over_email_send_rate_limit", "email rate limit exceeded");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "validation_failed", "Unable to validate email address: invalid format");
      if (who === "dupconfirm") return send(res, 200, { ...userJson({ id: crypto.randomUUID(), email, name: null, confirmed: false }), identities: [] });
      const user = { id: crypto.randomUUID(), email, password: input.password, name: input.data?.full_name ?? null, confirmed: who === "auto", token: "mock-token-" + crypto.randomBytes(12).toString("hex") };
      users.set(email, user);
      return send(res, 200, user.confirmed ? session(user) : userJson(user));
    }

    if (url.pathname === "/auth/v1/token" && req.method === "POST") {
      const input = await body(req);
      const user = users.get(String(input.email ?? "").toLowerCase());
      if (!user || user.password !== input.password) return fail(res, 400, "invalid_credentials", "Invalid login credentials");
      if (!user.confirmed) return fail(res, 400, "email_not_confirmed", "Email not confirmed");
      return send(res, 200, session(user));
    }

    if (url.pathname === "/auth/v1/resend" && req.method === "POST") {
      const input = await body(req);
      if (local(String(input.email ?? "")) === "resendfail") return fail(res, 429, "over_email_send_rate_limit", "email rate limit exceeded");
      signups.push({ email: String(input.email).toLowerCase(), resend: true });
      return send(res, 200, {});
    }

    if (url.pathname === "/auth/v1/user") {
      const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
      const user = [...users.values()].find((u) => u.token === token);
      return user ? send(res, 200, userJson(user)) : fail(res, 401, "bad_jwt", "invalid JWT: unable to parse or verify signature");
    }
    return send(res, 404, { msg: "not found" });
  })
  .listen(port, "127.0.0.1", () => console.log(`mock Supabase on ${port}`));
