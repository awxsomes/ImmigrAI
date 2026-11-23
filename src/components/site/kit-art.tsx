/**
 * The drawing at the top of the home page, in the site's blue and amber. Inline SVG, so it costs
 * no extra download, stays sharp on any screen and needs no image license. Decorative only:
 * the text beside it carries the meaning.
 */

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
