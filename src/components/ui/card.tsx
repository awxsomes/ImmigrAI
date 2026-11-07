import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Watermelon Card, adapted to the site's paper surface and a solid edge. */
function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-xl border-2 border-line bg-surface p-5 text-ink", className)} {...props} />;
}

export { Card };
