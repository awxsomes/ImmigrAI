import type { SVGProps } from "react";

/**
 * The few icons the site needs, drawn inline: no icon font or icon library to download.
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
      <rect x="6" y="11" width="20" height="18" rx="1.5" fill="#fffdf8" stroke="#17211d" strokeWidth="2" />
      <rect x="13" y="18" width="6" height="11" fill="#17211d" />
      <path d="M3 4h26l2 8a3.2 3.2 0 0 1-5.6 1.6A3.8 3.8 0 0 1 22 15a3.8 3.8 0 0 1-3-1.4 3.8 3.8 0 0 1-3 1.4 3.8 3.8 0 0 1-3-1.4A3.8 3.8 0 0 1 10 15a3.8 3.8 0 0 1-3.4-1.4A3.2 3.2 0 0 1 1 12z" fill="#0e5a45" stroke="#17211d" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 4 10 14.5M20.5 4 22 14.5" stroke="#f4b223" strokeWidth="3" />
    </svg>
  );
}
