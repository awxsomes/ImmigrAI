import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Watermelon Skeleton without the pulse animation: a still shape is easier on slow phones. */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("rounded-md bg-line/60", className)} {...props} />;
}

export { Skeleton };
