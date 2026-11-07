import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Watermelon Label, without the client directive it does not need. */
function Label({ className, ...props }: ComponentProps<"label">) {
  return <label data-slot="label" className={cn("block text-base font-medium text-ink", className)} {...props} />;
}

export { Label };
