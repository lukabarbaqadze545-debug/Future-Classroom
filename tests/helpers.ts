import { openDatabase, setDbForTests } from "@/lib/db";
import { createUser } from "@/lib/services/users";
import { setAIProviderForTests } from "@/lib/ai";
import { resetRateLimits } from "@/lib/http/rate-limit";
import type { CurrentUser } from "@/lib/auth/session";

/** Fresh in-memory database per test. */
export function freshDb() {
  const db = openDatabase(":memory:");
  setDbForTests(db);
  setAIProviderForTests(null);
  resetRateLimits();
  return db;
}

export function makeUser(role: CurrentUser["role"], username: string, displayName = username): CurrentUser {
  const user = createUser({ role, username, displayName, password: "password123" });
  return { id: user.id, role: user.role, username: user.username, displayName: user.displayName };
}
