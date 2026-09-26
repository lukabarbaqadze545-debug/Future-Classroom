import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, makeUser } from "../helpers";
import { authenticate, registerStudent } from "@/lib/services/users";
import { ApiError } from "@/lib/http/errors";

function status(fn: () => unknown): number | null {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof ApiError ? error.status : -1;
  }
}

describe("registration with a name and a password", () => {
  beforeEach(() => freshDb());

  it("creates a student whose name is also the sign-in name", () => {
    const user = registerStudent("  Giorgi   Beridze ", "my-secret-1");
    expect(user).toMatchObject({ role: "student", username: "Giorgi Beridze", displayName: "Giorgi Beridze" });
    // Letter case and extra spaces do not matter when signing in.
    expect(authenticate("giorgi beridze", "my-secret-1")?.id).toBe(user.id);
    expect(authenticate(" GIORGI  BERIDZE", "my-secret-1")?.id).toBe(user.id);
    expect(authenticate("Giorgi Beridze", "wrong-password")).toBeNull();
  });

  it("accepts Georgian names", () => {
    const user = registerStudent("ნინო ქავთარაძე", "პაროლი-12345");
    expect(authenticate("ნინო ქავთარაძე", "პაროლი-12345")?.id).toBe(user.id);
  });

  it("refuses a name that is taken, whatever the letter case", () => {
    makeUser("teacher", "nino");
    registerStudent("Ana", "password-1");
    expect(status(() => registerStudent("ana", "password-2"))).toBe(409);
    expect(status(() => registerStudent("NINO", "password-2"))).toBe(409);
  });

  it("refuses empty or letterless names and short passwords", () => {
    expect(status(() => registerStudent("   ", "password-1"))).toBe(400);
    expect(status(() => registerStudent("A", "password-1"))).toBe(400);
    expect(status(() => registerStudent("12345", "password-1"))).toBe(400);
    expect(status(() => registerStudent("Luka", "short"))).toBe(400);
  });

  it("keeps existing accounts working", () => {
    const teacher = makeUser("teacher", "nino");
    const student = makeUser("student", "mariam.l");
    expect(authenticate("nino", "password123")?.id).toBe(teacher.id);
    expect(authenticate("mariam.l", "password123")?.id).toBe(student.id);
    expect(authenticate("nino", "wrong")).toBeNull();
  });
});
