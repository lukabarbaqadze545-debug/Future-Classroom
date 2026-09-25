import "server-only";
import { cookies } from "next/headers";
import { getParticipantByToken, type ParticipantRecord } from "@/lib/services/sessions";
import { ApiError } from "@/lib/http/errors";
import { shouldUseSecureCookies } from "./session";

/** Each joined session gets its own httpOnly cookie holding a random token. */
export function participantCookieName(sessionId: string): string {
  return `fcp_${sessionId}`;
}

export async function setParticipantCookie(sessionId: string, token: string): Promise<void> {
  const store = await cookies();
  store.set(participantCookieName(sessionId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getParticipant(sessionId: string): Promise<ParticipantRecord | null> {
  const store = await cookies();
  return getParticipantByToken(sessionId, store.get(participantCookieName(sessionId))?.value);
}

export async function requireParticipant(sessionId: string): Promise<ParticipantRecord> {
  const participant = await getParticipant(sessionId);
  if (!participant) throw new ApiError(401, "unauthorized");
  return participant;
}
