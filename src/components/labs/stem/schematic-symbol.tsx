import type { Component } from "@/lib/labs/stem/electronics";

/** Standard schematic symbols (IEC style), drawn inline so they print and scale cleanly. */
export function SchematicSymbol({ id, label }: { id: Component["id"]; label: string }) {
  const stroke = { stroke: "currentColor", strokeWidth: 3, fill: "none", strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 120 60" role="img" aria-label={label} className="h-14 w-28 text-ink">
      <title>{label}</title>
      {id === "battery" ? (
        <>
          <line x1="10" y1="30" x2="52" y2="30" {...stroke} />
          <line x1="52" y1="12" x2="52" y2="48" {...stroke} />
          <line x1="66" y1="20" x2="66" y2="40" {...stroke} strokeWidth={6} />
          <line x1="66" y1="30" x2="110" y2="30" {...stroke} />
          <text x="40" y="12" className="fill-current text-[12px]">+</text>
        </>
      ) : id === "resistor" ? (
        <>
          <line x1="8" y1="30" x2="34" y2="30" {...stroke} />
          <rect x="34" y="20" width="52" height="20" {...stroke} />
          <line x1="86" y1="30" x2="112" y2="30" {...stroke} />
        </>
      ) : id === "led" || id === "diode" ? (
        <>
          <line x1="8" y1="30" x2="44" y2="30" {...stroke} />
          <path d="M44,16 L44,44 L72,30 Z" {...stroke} />
          <line x1="72" y1="14" x2="72" y2="46" {...stroke} />
          <line x1="72" y1="30" x2="112" y2="30" {...stroke} />
          {id === "led" ? (
            <>
              <path d="M60,10 L72,0 M66,0 L72,0 L72,6" {...stroke} strokeWidth={2} />
              <path d="M70,14 L82,4 M76,4 L82,4 L82,10" {...stroke} strokeWidth={2} />
            </>
          ) : null}
        </>
      ) : id === "switch" ? (
        <>
          <line x1="8" y1="30" x2="40" y2="30" {...stroke} />
          <circle cx="42" cy="30" r="3" fill="currentColor" />
          <line x1="42" y1="30" x2="76" y2="14" {...stroke} />
          <circle cx="80" cy="30" r="3" fill="currentColor" />
          <line x1="80" y1="30" x2="112" y2="30" {...stroke} />
        </>
      ) : id === "lamp" ? (
        <>
          <line x1="8" y1="30" x2="44" y2="30" {...stroke} />
          <circle cx="60" cy="30" r="16" {...stroke} />
          <line x1="49" y1="19" x2="71" y2="41" {...stroke} />
          <line x1="71" y1="19" x2="49" y2="41" {...stroke} />
          <line x1="76" y1="30" x2="112" y2="30" {...stroke} />
        </>
      ) : id === "capacitor" ? (
        <>
          <line x1="8" y1="30" x2="54" y2="30" {...stroke} />
          <line x1="54" y1="12" x2="54" y2="48" {...stroke} />
          <line x1="66" y1="12" x2="66" y2="48" {...stroke} />
          <line x1="66" y1="30" x2="112" y2="30" {...stroke} />
        </>
      ) : (
        <>
          <line x1="8" y1="30" x2="44" y2="30" {...stroke} />
          <circle cx="60" cy="30" r="16" {...stroke} />
          <text x="60" y="36" textAnchor="middle" className="fill-current text-[18px] font-bold">
            M
          </text>
          <line x1="76" y1="30" x2="112" y2="30" {...stroke} />
        </>
      )}
    </svg>
  );
}
