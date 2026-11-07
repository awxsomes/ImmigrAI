"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

/**
 * Watermelon Slider on Base UI, restyled with a thumb large enough for a thumb.
 * Keyboard arrows and screen reader values come from Base UI.
 */
function Slider(props: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root className="w-full" data-slot="slider" thumbAlignment="edge" {...props}>
      <SliderPrimitive.Control className="relative flex min-h-11 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-line">
          <SliderPrimitive.Indicator className="h-full bg-green" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-7 rounded-full border-[3px] border-green bg-surface" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
