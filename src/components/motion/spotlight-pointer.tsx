"use client";

import { useEffect } from "react";

/**
 * Lets any element with the class `fc-spotlight` light up around the pointer:
 * one listener for the whole page writes the pointer's place into the element's
 * --mx and --my (the look is in globals.css). Nothing happens on touch screens.
 */
export function SpotlightPointer() {
  useEffect(() => {
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const target = (event.target as Element | null)?.closest<HTMLElement>(".fc-spotlight");
      if (!target) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        target.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
