import type { SVGProps } from "react";

/**
 * The icons the site needs, drawn inline: no icon font or icon library to download.
 * One style throughout: 24px outline strokes in the current text color.
 * Decorative by default. Any icon that carries meaning has text beside it.
 */
type IconProps = SVGProps<SVGSVGElement>;
type Icon = (props: IconProps) => React.JSX.Element;

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

/* Needs and areas of help. */

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a3 3 0 0 1 0 6" />
      <path d="M10 8v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-5" />
      <path d="M12 8l4.5-3.8a.9.9 0 0 1 1.5.7v12.2a.9.9 0 0 1-1.5.7L12 14H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h8" />
    </svg>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9a2 2 0 0 0-1.8-1h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1M12 6v2m0 8v2" />
    </svg>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h.01M11 15h2" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

export function TranslateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h7M9 3v2c0 4.4-2.2 8-5 8M5 9c0 2.1 3 3.9 6.7 4M12 20l4-9 4 9M19.1 18h-6.2" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2zM9 13h6M9 17h6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6v13M12 6v13M21 6v13" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M4 11h16" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 20l1.3-3.9A9 8 0 1 1 7.7 19L3 20" />
    </svg>
  );
}

export function StarOutlineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 17.75l-6.2 3.25 1.2-6.9-5-4.85 6.9-1L12 2l3.1 6.25 6.9 1-5 4.85 1.2 6.9z" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6" />
      <path d="M20 12v4h-4a2 2 0 0 1 0-4h4" />
    </svg>
  );
}

export function LifebuoyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="9" />
      <path d="M15 15l3.35 3.35M9 15l-3.35 3.35M5.65 5.65L9 9M18.35 5.65L15 9" />
    </svg>
  );
}

/** One icon per area of help, keyed by the taxonomy's category id. */
export const CATEGORY_ICONS: Record<string, Icon> = {
  calls: PhoneIcon,
  customers: MegaphoneIcon,
  money: CoinIcon,
  payments: CardIcon,
  inventory: BoxIcon,
  employees: UsersIcon,
  translate: TranslateIcon,
  legal: FileIcon,
  safety: ShieldIcon,
  learn: BookIcon,
};

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
