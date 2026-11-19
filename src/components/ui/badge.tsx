import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Watermelon Badge, adapted to a plain span: a soft pill with readable text and strong contrast. */
const VARIANTS = {
  default: "border-transparent bg-blue-tint text-blue-dark",
  warm: "border-transparent bg-amber-tint text-ink",
  alert: "border-transparent bg-brick-tint text-brick-dark",
  outline: "border-line-strong bg-surface text-ink",
};

function Badge({ className, variant = "default", ...props }: ComponentProps<"span"> & { variant?: keyof typeof VARIANTS }) {
  return <span data-slot="badge" className={cn("inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold", VARIANTS[variant], className)} {...props} />;
}

export { Badge };
