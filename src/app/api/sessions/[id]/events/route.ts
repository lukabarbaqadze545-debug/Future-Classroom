import type { NextRequest } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getParticipant } from "@/lib/auth/participant";
import { getSession } from "@/lib/services/sessions";
import { subscribeToSession } from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of session version numbers. Clients re-fetch the
 * state they are allowed to see when the version changes; no answers or names
 * are pushed through this channel.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) return new Response("Not found", { status: 404 });
  const user = await getCurrentUser();
  const isOwner = isStaff(user) && (user!.id === session.teacherId || user!.role === "admin");
  const participant = isOwner ? null : await getParticipant(id);
  if (!isOwner && !participant) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send(`retry: 3000\nevent: version\ndata: ${JSON.stringify({ version: session.version })}\n\n`);
      const unsubscribe = subscribeToSession(id, (event) => {
        if (event.audience === "staff" && !isOwner) return;
        send(`event: version\ndata: ${JSON.stringify({ version: event.version })}\n\n`);
      });
      const heartbeat = setInterval(() => send(`: keep-alive\n\n`), 20_000);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
