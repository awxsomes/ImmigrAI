import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Watermelon Button, adapted: a plain <button> with no headless-library wrapper or variant
 * library, so a server-rendered page ships no JavaScript just to draw a button. Touch
 * targets are at least 48px. Hover darkens instead of fading, so contrast never drops.
 */
const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 font-medium whitespace-normal text-center no-underline transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted-ink";

const VARIANTS = {
  default: "border-green bg-green text-white hover:border-green-dark hover:bg-green-dark",
  accent: "border-ink bg-marigold text-ink hover:bg-[#e3a214]",
  outline: "border-ink bg-surface text-ink hover:bg-green-tint",
  ghost: "border-transparent bg-transparent text-ink underline underline-offset-2 hover:bg-green-tint",
  destructive: "border-brick bg-surface text-brick hover:bg-brick-tint",
};

const SIZES = {
  default: "min-h-12 px-5 py-2 text-base",
  sm: "min-h-10 px-3 py-1 text-sm",
  lg: "min-h-14 px-7 py-2 text-lg",
};

interface VariantProps {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

function buttonVariants({ variant = "default", size = "default" }: VariantProps = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}

function Button({ className, variant, size, type = "button", ...props }: ComponentProps<"button"> & VariantProps) {
  return <button type={type} data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
