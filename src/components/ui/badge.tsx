import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Watermelon Badge, adapted to a plain span with readable text sizes and strong contrast. */
const VARIANTS = {
  default: "border-green bg-green-tint text-green-dark",
  warm: "border-[#a97a0c] bg-marigold-tint text-ink",
  alert: "border-brick bg-brick-tint text-[#7a2a14]",
  outline: "border-line-strong bg-surface text-ink",
};

function Badge({ className, variant = "default", ...props }: ComponentProps<"span"> & { variant?: keyof typeof VARIANTS }) {
  return <span data-slot="badge" className={cn("inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-medium", VARIANTS[variant], className)} {...props} />;
}

export { Badge };
