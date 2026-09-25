import Link from "next/link";

/** Wordmark: a simple, calm mark — a window onto the classroom. */
export function Logo({ label, href = "/", compact = false }: { label: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg font-semibold text-ink">
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
        <rect width="32" height="32" rx="9" fill="#1d4ed8" />
        <path d="M9 21.5V12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 22h18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="15.5" r="2.4" fill="#9db7ff" />
      </svg>
      {compact ? <span className="sr-only">{label}</span> : <span className="text-[15px] tracking-tight">{label}</span>}
    </Link>
  );
}
