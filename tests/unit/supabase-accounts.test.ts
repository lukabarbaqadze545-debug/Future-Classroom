import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { accountForSupabaseUser, displayNameFor, emailSignInOf, type VerifiedSupabaseUser } from "@/lib/services/supabase-accounts";
import { authenticate } from "@/lib/services/users";
import { ApiError } from "@/lib/http/errors";

const person = (over: Partial<VerifiedSupabaseUser> = {}): VerifiedSupabaseUser => ({
  id: "5f1c0c1e-aaaa-4bbb-8ccc-000000000001",
  email: "Lika@Example.org",
  emailConfirmed: true,
  fullName: "Lika Beridze",
  ...over,
});

describe("Accounts opened through Supabase", () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });
  afterEach(() => {
    delete process.env.SELF_REGISTRATION;
    delete process.env.DEFAULT_LANGUAGE;
  });

  it("opens a student account for a confirmed person, with the name they typed and no password", () => {
    const user = accountForSupabaseUser(person());
    expect(user).toMatchObject({ role: "student", username: "Lika Beridze", displayName: "Lika Beridze" });
    expect(db.prepare("SELECT email, supabase_id AS sid, password_hash AS hash FROM users WHERE id = ?").get(user.id)).toEqual({
      email: "lika@example.org",
      sid: person().id,
      hash: "!",
    });
    expect(authenticate("Lika Beridze", "!")).toBeNull();
    expect(authenticate("Lika Beridze", "")).toBeNull();
    expect(emailSignInOf(user.id)).toBe("lika@example.org");
    expect(emailSignInOf(makeUser("student", "giorgi").id)).toBeNull();
  });

  it("finds the same account again, and keeps its email up to date", () => {
    const first = accountForSupabaseUser(person());
    const again = accountForSupabaseUser(person({ email: "lika.new@example.org", fullName: "Someone Else" }));
    expect(again).toEqual(first);
    expect(db.prepare("SELECT COUNT(*) AS n FROM users WHERE supabase_id IS NOT NULL").get()).toEqual({ n: 1 });
    expect(emailSignInOf(first.id)).toBe("lika.new@example.org");
  });

  it("refuses an address that was not confirmed", () => {
    expect(() => accountForSupabaseUser(person({ emailConfirmed: false }))).toThrowError(expect.objectContaining({ status: 403, code: "email_not_confirmed" }));
    expect(db.prepare("SELECT COUNT(*) AS n FROM users WHERE supabase_id IS NOT NULL").get()).toEqual({ n: 0 });
  });

  it("never lets a registration take over an existing account, and never makes a teacher", () => {
    const teacher = makeUser("teacher", "nino");
    const user = accountForSupabaseUser(person({ fullName: "nino", email: "nino@example.org" }));
    expect(user.id).not.toBe(teacher.id);
    expect(user).toMatchObject({ role: "student", username: "nino 2" });
    expect(accountForSupabaseUser(person({ id: "5f1c0c1e-aaaa-4bbb-8ccc-000000000002", fullName: "nino" }))).toMatchObject({ username: "nino 3" });
    expect(db.prepare("SELECT role FROM users WHERE username = 'nino'").get()).toEqual({ role: "teacher" });
  });

  it("only lets existing accounts in when the school turned self-registration off", () => {
    const existing = accountForSupabaseUser(person());
    process.env.SELF_REGISTRATION = "false";
    expect(accountForSupabaseUser(person())).toEqual(existing);
    expect(() => accountForSupabaseUser(person({ id: "5f1c0c1e-aaaa-4bbb-8ccc-000000000009", fullName: "New Person" }))).toThrowError(ApiError);
    expect(db.prepare("SELECT COUNT(*) AS n FROM users WHERE supabase_id IS NOT NULL").get()).toEqual({ n: 1 });
  });

  it("cleans the display name and has a fallback in the school's language", () => {
    expect(displayNameFor("  Mariam   <b>Kapanadze</b>  ")).toBe("Mariam bKapanadze/b");
    expect(displayNameFor("x".repeat(80))).toHaveLength(40);
    expect(displayNameFor(null)).toBe("მოსწავლე");
    expect(displayNameFor("12")).toBe("მოსწავლე");
    process.env.DEFAULT_LANGUAGE = "en";
    expect(displayNameFor("")).toBe("Student");
  });
});
