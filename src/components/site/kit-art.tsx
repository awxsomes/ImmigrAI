/**
 * Small drawings for the home page, in the site's blue and amber. Inline SVG, so they cost
 * no extra download, stay sharp on any screen and need no image license. Decorative only:
 * the text beside them carries the meaning.
 */

const frame = "h-24 w-auto";

/** A phone with greetings in the site's languages, for the top of the home page. */
export function HeroArt({ className }: { className?: string }) {
  const bubbles = [
    { y: 76, x: 121, w: 92, fill: "fill-soft", text: "Hola", light: false },
    { y: 124, x: 147, w: 92, fill: "fill-blue", text: "你好", light: true },
    { y: 172, x: 121, w: 104, fill: "fill-amber-tint", text: "Xin chào", light: false },
    { y: 220, x: 147, w: 92, fill: "fill-blue", text: "Hello", light: true },
  ];
  return (
    <svg viewBox="0 0 360 300" className={className} aria-hidden="true" focusable="false">
      <path d="M58 62 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" className="fill-amber stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path d="M304 150 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" className="fill-amber stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <rect x="105" y="14" width="150" height="276" rx="24" className="fill-surface stroke-ink" strokeWidth="3" />
      <rect x="120" y="40" width="120" height="18" rx="6" className="fill-blue-tint" />
      {bubbles.map((b) => (
        <g key={b.text}>
          <rect x={b.x} y={b.y} width={b.w} height="36" rx="14" className={`${b.fill} ${b.light ? "" : "stroke-ink"}`} strokeWidth="2" />
          <text x={b.x + b.w / 2} y={b.y + 24} textAnchor="middle" fontSize="16" fontWeight="600" className={b.light ? "fill-white" : "fill-ink"}>
            {b.text}
          </text>
        </g>
      ))}
      <rect x="160" y="270" width="40" height="5" rx="2.5" className="fill-ink" />
    </svg>
  );
}

/** A corner shop with a striped awning, for Start-up Essentials. */
export function StorefrontArt() {
  const stripes = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg viewBox="0 0 240 120" className={frame} aria-hidden="true" focusable="false">
      <rect x="58" y="10" width="124" height="18" rx="3" className="fill-amber stroke-ink" strokeWidth="3" />
      <rect x="54" y="40" width="132" height="72" className="fill-surface stroke-ink" strokeWidth="3" />
      {stripes.map((i) => (
        <rect key={i} x={46 + i * 18.5} y="28" width="18.5" height="16" className={i % 2 ? "fill-surface" : "fill-blue"} />
      ))}
      {stripes.map((i) => (
        <path key={i} d={`M${46 + i * 18.5} 44 a9.25 8 0 0 0 18.5 0`} className={i % 2 ? "fill-surface stroke-ink" : "fill-blue stroke-ink"} strokeWidth="2" />
      ))}
      <rect x="46" y="28" width="148" height="16" className="fill-none stroke-ink" strokeWidth="3" />
      <rect x="66" y="64" width="54" height="32" rx="2" className="fill-amber-tint stroke-ink" strokeWidth="3" />
      <rect x="80" y="72" width="26" height="12" rx="2" className="fill-brick" />
      <rect x="134" y="62" width="34" height="50" rx="2" className="fill-blue stroke-ink" strokeWidth="3" />
      <circle cx="161" cy="88" r="2.5" className="fill-amber" />
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
      <path d="M80 48 H160 V84 a12 12 0 0 1 -12 12 H92 a12 12 0 0 1 -12 -12 Z" className="fill-blue stroke-ink" strokeWidth="3" />
      <path d="M80 58 h-12 M160 58 h12" className="stroke-ink" strokeWidth="5" strokeLinecap="round" />
      <path d="M88 66 H152" className="stroke-surface" strokeWidth="3" strokeLinecap="round" />
      <path d="M104 112 q-6 -8 2 -14 q0 8 8 8 q-2 -9 6 -14 q8 6 6 14 q8 0 8 -8 q8 6 2 14 Z" className="fill-amber stroke-ink" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 112 H200" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A seedling in a clay pot, for tools launched this year. */
export function SeedlingArt() {
  return (
    <svg viewBox="0 0 240 120" className={frame} aria-hidden="true" focusable="false">
      <path d="M120 82 V44" className="stroke-blue" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 60 C104 60 92 50 90 34 C106 34 118 44 120 60 Z" className="fill-blue stroke-ink" strokeWidth="2.5" />
      <path d="M120 50 C134 50 146 40 150 24 C134 24 122 34 120 50 Z" className="fill-blue stroke-ink" strokeWidth="2.5" />
      <path d="M92 82 H148 L142 112 H98 Z" className="fill-brick stroke-ink" strokeWidth="3" strokeLinejoin="round" />
      <rect x="88" y="78" width="64" height="10" rx="3" className="fill-brick stroke-ink" strokeWidth="3" />
      <path d="M172 26 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" className="fill-amber stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 50 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" className="fill-amber stroke-ink" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 112 H200" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
