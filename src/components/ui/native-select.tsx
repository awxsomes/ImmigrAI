import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { ChevronIcon } from "@/components/icons";

/** Watermelon Native Select: the device's own picker, the easiest on a phone and free to download. */
function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)} data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        className="min-h-12 w-full appearance-none rounded-lg border-2 border-line-strong bg-surface py-2 pr-10 pl-3 text-base text-ink"
        {...props}
      />
      <ChevronIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}

export { NativeSelect };
