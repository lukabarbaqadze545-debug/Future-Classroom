import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "subtle";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-brand-solid text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_22px_-10px_rgb(229_36_47/0.85)] hover:bg-brand-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_30px_-8px_rgb(240_65_77/0.9)] disabled:bg-brand-solid/40 disabled:text-white/60 disabled:shadow-none",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-muted disabled:text-ink-subtle",
  ghost: "text-ink-muted hover:bg-muted hover:text-ink disabled:text-ink-subtle/60",
  danger: "bg-surface text-danger border border-danger/30 hover:bg-danger-soft disabled:opacity-50",
  success: "bg-success text-[#04140c] hover:bg-success/90 shadow-sm disabled:opacity-50",
  subtle: "bg-brand-soft text-brand-ink hover:bg-brand-soft/70 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-[15px] gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
  xl: "h-16 px-7 text-lg gap-3 rounded-2xl",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none",
    "disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & { variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
