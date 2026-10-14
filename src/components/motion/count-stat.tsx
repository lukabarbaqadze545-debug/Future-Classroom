import { cn } from "@/components/ui/cn";

/**
 * A number that counts up when it comes into view. Pure CSS (see `.fc-count`),
 * so it is in the server-rendered page, costs no JavaScript and shows the final
 * value where animation is off. Screen readers get the number as plain text.
 */
export function CountNumber({ value, className, scroll = false }: { value: number; className?: string; scroll?: boolean }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden className={cn("fc-count", className)} style={{ "--to": value } as React.CSSProperties} data-scroll={scroll ? "" : undefined} />
    </>
  );
}
