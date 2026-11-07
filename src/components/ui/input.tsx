import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Watermelon Input, adapted to a plain <input>. 16px or larger text stops phones zooming in on focus. */
function Input({ className, large, ...props }: ComponentProps<"input"> & { large?: boolean }) {
  return (
    <input
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border-2 bg-surface px-3 text-ink placeholder:text-muted-ink",
        large ? "min-h-14 text-lg" : "min-h-12 text-base",
        className ?? "border-line-strong",
      )}
      {...props}
    />
  );
}

export { Input };
