import type { SVGProps } from "react";

/**
 * The icons the site needs, drawn inline: no icon font or icon library to download.
 * One style throughout: 24px outline strokes in the current text color.
 * Decorative by default. Any icon that carries meaning has text beside it.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.400 5.500 12 3z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M12 2.6l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.6l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
    </svg>
  );
}

/** The brand mark: a shop awning over a door. */
export function ShopMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect x="6" y="11" width="20" height="18" rx="1.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      <rect x="13" y="18" width="6" height="11" fill="#111827" />
      <path d="M3 4h26l2 8a3.2 3.2 0 0 1-5.6 1.6A3.8 3.8 0 0 1 22 15a3.8 3.8 0 0 1-3-1.4 3.8 3.8 0 0 1-3 1.4 3.8 3.8 0 0 1-3-1.4A3.8 3.8 0 0 1 10 15a3.8 3.8 0 0 1-3.4-1.4A3.2 3.2 0 0 1 1 12z" fill="#1d4ed8" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 4 10 14.5M20.5 4 22 14.5" stroke="#f59e0b" strokeWidth="3" />
    </svg>
  );
}

/*
  Tab bar icons. Like the icons in a phone's own apps, each one fills in while its tab is open,
  so the open tab is shown by shape as well as color.
*/
type TabIconProps = IconProps & { filled?: boolean };

export function HomeIcon({ filled, ...props }: TabIconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.2 12 3.5l8.5 6.7V19.5a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

export function KitsIcon({ filled, ...props }: TabIconProps) {
  const fill = filled ? "currentColor" : "none";
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.75" fill={fill} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.75" fill={fill} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.75" fill={fill} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.75" fill={fill} />
    </svg>
  );
}

export function CheckupIcon({ filled, ...props }: TabIconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="4" width="15" height="17" rx="2" fill={filled ? "currentColor" : "none"} />
      <path d="M9 2.75h6v2.5H9z" fill="#ffffff" />
      <path d="M8.5 13.25l2.5 2.5 4.5-5" stroke={filled ? "#ffffff" : "currentColor"} />
    </svg>
  );
}

export function SavedIcon({ filled, ...props }: TabIconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h12a.5.5 0 0 1 .5.5v16.5L12 16l-6.5 4.5V4a.5.5 0 0 1 .5-.5z" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

/** A ring that turns while something is on its way. It holds still for anyone whose device is set to reduce motion. */
export function Spinner(props: IconProps) {
  return (
    <svg {...base} {...props} className={`animate-spin motion-reduce:animate-none ${props.className ?? ""}`}>
      <circle cx="12" cy="12" r="8.5" opacity="0.3" />
      <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" />
    </svg>
  );
}
