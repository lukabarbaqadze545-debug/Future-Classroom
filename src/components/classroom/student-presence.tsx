"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Hand, PauseCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

interface Command {
  id: string;
  kind: "open" | "message";
  path: string | null;
  text: string;
  from: string;
}
interface ScreenState {
  locked: boolean;
  lockMessage: string;
  lockedBy: string;
  open: Command | null;
  messages: Command[];
  help: { raisedAt: number; note: string; ackAt: number | null } | null;
}

const BEAT_MS = 6000;

/** The page's own title, without the site name every title ends with. */
function pageTitle(title: string, appTitle: string): string {
  const suffix = ` · ${appTitle}`;
  const bare = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
  return bare === appTitle ? "" : bare;
}

function tabId(): string {
  try {
    let id = sessionStorage.getItem("fc_tab");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("fc_tab", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/**
 * Mounted for signed-in students on every page. Tells the school server which
 * platform page is open (path and title only) and whether the student is
 * active, and shows what the teacher sends: a message, a paused screen, an
 * "open this page". Gives the student a way to raise their hand.
 */
export function StudentPresence() {
  const { dict } = useI18n();
  const c = dict.classroom;
  const appTitle = dict.meta.title;
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<ScreenState | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const lastInput = useRef(0);
  const tab = useRef("");
  const followed = useRef(new Set<string>());
  const leaving = useRef(false);
  const pathRef = useRef("");
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const beat = useCallback(async () => {
    if (leaving.current) return;
    if (!tab.current) tab.current = tabId();
    try {
      const { state: next } = await api<{ state: ScreenState | null }>("/api/classroom/heartbeat", {
        body: {
          tabId: tab.current,
          path: pathRef.current,
          title: pageTitle(document.title, appTitle),
          visible: document.visibilityState === "visible",
          idleMs: Math.max(0, Date.now() - lastInput.current),
        },
      });
      if (!next) return;
      setState(next);
      const open = next.open;
      if (open?.path && !followed.current.has(open.id)) {
        followed.current.add(open.id);
        if (open.path !== pathRef.current) {
          setToast(c.opened);
          router.push(open.path);
        }
      }
    } catch {
      // Offline or signed out: the next beat tries again.
    }
  }, [appTitle, c.opened, router]);

  // Heartbeat, and an immediate one when the page changes or the tab comes back.
  useEffect(() => {
    void beat();
    const timer = window.setInterval(() => void beat(), BEAT_MS);
    // Coming back is reported at once. Going away is reported after a moment, so that closing
    // the tab (which also hides it) is not reported as "another window" after it has left.
    let away = 0;
    const onVisible = () => {
      window.clearTimeout(away);
      if (document.visibilityState === "visible") void beat();
      else away = window.setTimeout(() => void beat(), 1500);
    };
    const onLeave = () => {
      leaving.current = true;
      window.clearTimeout(away);
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) leaving.current = false;
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(away);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("pageshow", onShow);
    };
  }, [beat]);
  useEffect(() => {
    // The title is set after navigation; report once it has.
    const t = window.setTimeout(() => void beat(), 400);
    return () => window.clearTimeout(t);
  }, [pathname, beat]);

  // Keyboard, mouse and touch: when did the student last do anything?
  useEffect(() => {
    lastInput.current = Date.now();
    let last = 0;
    const touch = () => {
      const t = Date.now();
      if (t - last > 1000) {
        last = t;
        lastInput.current = t;
      }
    };
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
    return () => events.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
  }, []);

  // Tab closed or page left.
  useEffect(() => {
    const leave = () => {
      if (!tab.current) return;
      void fetch("/api/classroom/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tabId: tab.current }), keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // While the screen is paused, nothing behind the notice can be used or reached with the keyboard.
  const locked = state?.locked === true;
  useEffect(() => {
    if (!locked) return;
    const others = Array.from(document.body.children).filter((el) => !el.hasAttribute("data-classroom-overlay"));
    others.forEach((el) => el.setAttribute("inert", ""));
    return () => others.forEach((el) => el.removeAttribute("inert"));
  }, [locked]);

  async function raise() {
    setState((s) => (s ? { ...s, help: { raisedAt: Date.now(), note, ackAt: null } } : s));
    try {
      await api("/api/classroom/help", { body: { note } });
    } catch {
      // The next heartbeat shows the real state.
    }
    setHelpOpen(false);
    setNote("");
    void beat();
  }
  async function lower() {
    setState((s) => (s ? { ...s, help: null } : s));
    try {
      await api("/api/classroom/help", { method: "DELETE" });
    } catch {
      // The next heartbeat shows the real state.
    }
    void beat();
  }
  async function dismiss(ids: string[]) {
    setState((s) => (s ? { ...s, messages: s.messages.filter((m) => !ids.includes(m.id)) } : s));
    try {
      await api("/api/classroom/messages", { body: { ids } });
    } catch {
      // Shown again on the next beat; harmless.
    }
  }

  const message = state?.messages[0] ?? null;
  const help = state?.help ?? null;

  return (
    <>
      {/* Raise a hand */}
      <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 print:hidden" data-testid="student-help">
        {helpOpen && !help ? (
          <div role="dialog" aria-label={c.help.title} className="fc-fade-in w-[min(340px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-raised)]">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold">{c.help.title}</h2>
              <button type="button" onClick={() => setHelpOpen(false)} className="-mt-1 -mr-1 rounded-lg p-2 text-ink-subtle hover:bg-muted" aria-label={c.help.close}>
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <label className="mt-2 block text-sm font-medium" htmlFor="help-note">
              {c.help.noteLabel}
            </label>
            <Textarea id="help-note" rows={2} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={c.help.notePlaceholder} className="mt-1" data-testid="help-note" />
            <p className="mt-2 text-xs text-ink-muted">{c.help.privacy}</p>
            <Button className="mt-3 w-full" onClick={() => void raise()} data-testid="help-send">
              <Hand aria-hidden className="size-4" />
              {c.help.send}
            </Button>
          </div>
        ) : null}
        {help ? (
          <div className="fc-fade-in flex items-center gap-3 rounded-2xl border border-warn/40 bg-warn-soft py-2 pr-2 pl-4 text-sm shadow-[var(--shadow-card)]" role="status" data-testid="help-raised" data-acked={help.ackAt ? "yes" : "no"}>
            <Hand aria-hidden className="size-5 shrink-0 text-warn" />
            <span className="font-medium">{help.ackAt ? c.help.coming : c.help.raised}</span>
            <Button size="sm" variant="secondary" onClick={() => void lower()} data-testid="help-lower">
              {c.help.lower}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="shadow-[var(--shadow-card)]" onClick={() => setHelpOpen((o) => !o)} aria-expanded={helpOpen} data-testid="help-button">
            <Hand aria-hidden className="size-4" />
            {c.help.button}
          </Button>
        )}
      </div>

      {toast ? (
        <div role="status" className="fc-fade-in fixed top-20 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-surface shadow-lg" data-testid="classroom-toast">
          {toast}
        </div>
      ) : null}

      {/* A message from the teacher */}
      {message && !locked ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-4" data-testid="teacher-message-wrap">
          <div role="alertdialog" aria-labelledby="teacher-message-title" className="fc-fade-in w-full max-w-lg rounded-2xl border border-brand/30 bg-surface p-5 shadow-[var(--shadow-raised)]" data-testid="teacher-message">
            <h2 id="teacher-message-title" className="text-sm font-semibold text-brand">
              {message.from ? fmt(c.message.from, { name: message.from }) : c.message.fromTeacher}
            </h2>
            <p className="mt-2 text-lg leading-snug whitespace-pre-line">{message.text}</p>
            <Button className="mt-4" onClick={() => void dismiss(state!.messages.map((m) => m.id))} data-testid="teacher-message-ok" autoFocus>
              {c.message.ok}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Paused screen: covers everything and is not reachable behind it */}
      {locked
        ? createPortal(
            <div data-classroom-overlay className="fixed inset-0 z-[100] flex items-center justify-center bg-ink p-6 text-center text-surface" role="alertdialog" aria-modal="true" aria-labelledby="paused-title" data-testid="screen-paused">
              <div className="max-w-xl">
                <PauseCircle aria-hidden className="mx-auto size-20 opacity-90" />
                <h1 id="paused-title" className="mt-6 text-3xl font-semibold">
                  {c.paused.title}
                </h1>
                <p className="mt-4 text-2xl leading-snug" data-testid="paused-message">
                  {state?.lockMessage || c.paused.defaultMessage}
                </p>
                {state?.lockedBy ? <p className="mt-6 text-sm opacity-70">{fmt(c.paused.from, { name: state.lockedBy })}</p> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
