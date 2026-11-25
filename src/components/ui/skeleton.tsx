import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * A gray placeholder in the shape of what is loading, with a soft band of light sweeping
 * across it so the page reads as busy, not empty. The sweep moves a layer instead of
 * repainting, so it stays smooth on slow phones, and it stops for anyone whose device is set
 * to reduce motion. Hidden from screen readers: the loading screen announces itself once.
 * Its gray and rounded corners are set in globals.css below every class, so any class can change them.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden",
        "after:absolute after:inset-0 after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-white/70 after:to-transparent motion-reduce:after:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
