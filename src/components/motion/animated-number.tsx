"use client";

import { useEffect, useRef, useState } from "react";

/** A number that eases from where it was to its new value (from 0 the first time). Shows the value at once when motion is reduced. */
export function AnimatedNumber({ value, duration = 1100, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = Math.round(origin + (value - origin) * eased);
      from.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {shown}
    </span>
  );
}
