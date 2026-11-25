/**
 * Draws the images a phone needs to install the site as an app, from the brand mark:
 * - public/icons/: the home-screen icons (Android, and Apple's apple-touch-icon).
 * - public/splash/: the launch screens an iPhone shows while the app opens, one per screen
 *   size. Without them an iPhone shows a blank white screen. Android draws its own from the
 *   manifest's icon and background color.
 *
 * Run after changing the brand mark (ShopMark in src/components/icons.tsx), then commit the
 * images. Uses sharp, which comes with Next.js.
 *
 *   npm run app-images
 */
import fs from "node:fs";
import sharp from "sharp";
import { SPLASH_SCREENS } from "../src/lib/app-images.ts";

/** ShopMark, drawn on a 32 by 32 grid. */
const MARK = `
  <rect x="6" y="11" width="20" height="18" rx="1.5" fill="#ffffff" stroke="#111827" stroke-width="2"/>
  <rect x="13" y="18" width="6" height="11" fill="#111827"/>
  <path d="M3 4h26l2 8a3.2 3.2 0 0 1-5.6 1.6A3.8 3.8 0 0 1 22 15a3.8 3.8 0 0 1-3-1.4 3.8 3.8 0 0 1-3 1.4 3.8 3.8 0 0 1-3-1.4A3.8 3.8 0 0 1 10 15a3.8 3.8 0 0 1-3.4-1.4A3.2 3.2 0 0 1 1 12z" fill="#1d4ed8" stroke="#111827" stroke-width="2" stroke-linejoin="round"/>
  <path d="M11.5 4 10 14.5M20.5 4 22 14.5" stroke="#f59e0b" stroke-width="3"/>`;

const TINT = "#eaf1ff";
const PAPER = "#ffffff";

/** The mark centered on a canvas, `share` of the shorter side wide. */
function canvas(width: number, height: number, share: number, background: string, radius = 0) {
  const size = Math.min(width, height) * share;
  const scale = size / 32;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="${radius}" fill="${background}"/>
  <g transform="translate(${x} ${y}) scale(${scale})">${MARK}</g>
</svg>`);
}

async function write(file: string, svg: Buffer) {
  await sharp(svg).png({ compressionLevel: 9, palette: true }).toFile(file);
  console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}

fs.mkdirSync("public/icons", { recursive: true });
fs.mkdirSync("public/splash", { recursive: true });

// Rounded, for places that show the icon as it is.
await write("public/icons/icon-192.png", canvas(192, 192, 0.66, TINT, 42));
await write("public/icons/icon-512.png", canvas(512, 512, 0.66, TINT, 112));
// Square to the edges: Android cuts its own shape, and keeps the middle 80% in view.
await write("public/icons/maskable-512.png", canvas(512, 512, 0.5, TINT));
// Apple rounds the corners itself, and shows see-through parts as black.
await write("public/icons/apple-touch-icon.png", canvas(180, 180, 0.64, TINT));

for (const screen of SPLASH_SCREENS) {
  await write(`public${screen.url}`, canvas(screen.width * screen.ratio, screen.height * screen.ratio, 0.3, PAPER));
}
