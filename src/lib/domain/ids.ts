import { randomBytes, randomInt, createHash } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** URL-safe random identifier (base62). 16 chars ≈ 95 bits of entropy. */
export function newId(length = 16): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Secret token for cookies. Only its hash is stored in the database. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Classroom join codes look like "FC-4821". */
export function newJoinCode(): string {
  return `FC-${randomInt(1000, 10000)}`;
}

/** Accepts "fc-4821", "FC4821", "4821", " fc 4821 " and returns "FC-4821". */
export function normalizeJoinCode(input: string): string | null {
  const digits = input.toUpperCase().replace(/^\s*FC/, "").replace(/[^0-9]/g, "");
  if (digits.length !== 4) return null;
  return `FC-${digits}`;
}
