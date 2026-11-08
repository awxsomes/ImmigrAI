/**
 * Small drawings for the kits on the home page, in the shop-sign palette. Inline SVG, so
 * they cost no extra download, stay sharp on any screen and need no image license.
 * Decorative only: the kit's name and text carry the meaning.
 */

const frame = "h-24 w-auto";

/** A corner shop with a striped awning, for Start-up Essentials. */
export function StorefrontArt() {
  const stripes = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg viewBox="0 0 240 120" className={frame} aria-hidden="true" focusable="false">
      <rect x="58" y="10" width="124" height="18" rx="3" className="fill-marigold stroke-ink" strokeWidth="3" />
      <rect x="54" y="40" width="132" height="72" className="fill-surface stroke-ink" strokeWidth="3" />
      {stripes.map((i) => (
        <rect key={i} x={46 + i * 18.5} y="28" width="18.5" height="16" className={i % 2 ? "fill-surface" : "fill-green"} />
      ))}
      {stripes.map((i) => (
        <path key={i} d={`M${46 + i * 18.5} 44 a9.25 8 0 0 0 18.5 0`} className={i % 2 ? "fill-surface stroke-ink" : "fill-green stroke-ink"} strokeWidth="2" />
      ))}
      <rect x="46" y="28" width="148" height="16" className="fill-none stroke-ink" strokeWidth="3" />
      <rect x="66" y="64" width="54" height="32" rx="2" className="fill-marigold-tint stroke-ink" strokeWidth="3" />
      <rect x="80" y="72" width="26" height="12" rx="2" className="fill-brick" />
      <rect x="134" y="62" width="34" height="50" rx="2" className="fill-green stroke-ink" strokeWidth="3" />
      <circle cx="161" cy="88" r="2.5" className="fill-marigold" />
      <path d="M20 112 H220" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A steaming pot on a flame, for the restaurant kit. */
export function KitchenArt() {
  return (
    <svg viewBox="0 0 240 120" className={frame} aria-hidden="true" focusable="false">
      <path d="M100 30 q-8 -9 0 -18 M120 30 q-8 -9 0 -18 M140 30 q-8 -9 0 -18" className="fill-none stroke-ink" strokeWidth="3" strokeLinecap="round" />
      <rect x="76" y="40" width="88" height="8" rx="4" className="fill-brick stroke-ink" strokeWidth="3" />
      <rect x="112" y="33" width="16" height="7" rx="3" className="fill-ink" />
      <path d="M80 48 H160 V84 a12 12 0 0 1 -12 12 H92 a12 12 0 0 1 -12 -12 Z" className="fill-green stroke-ink" strokeWidth="3" />
      <path d="M80 58 h-12 M160 58 h12" className="stroke-ink" strokeWidth="5" strokeLinecap="round" />
      <path d="M88 66 H152" className="stroke-surface" strokeWidth="3" strokeLinecap="round" />
      <path d="M104 112 q-6 -8 2 -14 q0 8 8 8 q-2 -9 6 -14 q8 6 6 14 q8 0 8 -8 q8 6 2 14 Z" className="fill-marigold stroke-ink" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 112 H200" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A seedling in a clay pot, for tools launched this year. */
export function SeedlingArt() {
  return (
    <svg viewBox="0 0 240 120" className={frame} aria-hidden="true" focusable="false">
      <path d="M120 82 V44" className="stroke-green" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 60 C104 60 92 50 90 34 C106 34 118 44 120 60 Z" className="fill-green stroke-ink" strokeWidth="2.5" />
      <path d="M120 50 C134 50 146 40 150 24 C134 24 122 34 120 50 Z" className="fill-green stroke-ink" strokeWidth="2.5" />
      <path d="M92 82 H148 L142 112 H98 Z" className="fill-brick stroke-ink" strokeWidth="3" strokeLinejoin="round" />
      <rect x="88" y="78" width="64" height="10" rx="3" className="fill-brick stroke-ink" strokeWidth="3" />
      <path d="M172 26 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" className="fill-marigold stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 50 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" className="fill-marigold stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 112 H200" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
