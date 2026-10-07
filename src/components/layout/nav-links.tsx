"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/components/ui/cn";

export function NavLinks({ items, label }: { items: { href: string; label: string; exact?: boolean }[]; label: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  // The line under the current item slides to it (it is placed without sliding the first time).
  useEffect(() => {
    const place = () => {
      const current = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
      const line = bar.current;
      if (!line) return;
      if (!current) {
        line.style.opacity = "0";
        return;
      }
      const slide = placed.current;
      if (!slide) line.style.transition = "none";
      line.style.width = `${current.offsetWidth - 16}px`;
      line.style.translate = `${current.offsetLeft + 8}px 0`;
      line.style.opacity = "1";
      if (!slide) {
        void line.offsetWidth;
        line.style.transition = "";
        placed.current = true;
      }
    };
    place();
    const observer = new ResizeObserver(() => {
      placed.current = false;
      place();
    });
    if (nav.current) observer.observe(nav.current);
    return () => observer.disconnect();
  }, [pathname, items.length]);

  return (
    <nav ref={nav} aria-label={label} className="relative -mx-1 flex items-center gap-0.5 overflow-x-auto">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-200",
              active ? "text-brand-ink" : "text-ink-muted hover:bg-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <span ref={bar} aria-hidden className="fc-nav-bar" style={{ opacity: 0 }} />
    </nav>
  );
}
