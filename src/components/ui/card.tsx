import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Watermelon Card, adapted to a white surface and a thin edge. */
function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-lg border border-line bg-surface p-5 text-ink", className)} {...props} />;
}

export { Card };
