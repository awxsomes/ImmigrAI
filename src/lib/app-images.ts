/**
 * iPhone launch screens, drawn by scripts/make-app-images.mts. An iPhone only shows one when
 * its screen matches exactly, so there is one per screen size, portrait only, newest first.
 * Sizes are in CSS pixels; `ratio` is the screen's pixel density.
 */
const SCREENS = [
  { width: 440, height: 956, ratio: 3 }, // iPhone 16 Pro Max, 17 Pro Max
  { width: 420, height: 912, ratio: 3 }, // iPhone Air
  { width: 402, height: 874, ratio: 3 }, // iPhone 16 Pro, 17, 17 Pro
  { width: 430, height: 932, ratio: 3 }, // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { width: 393, height: 852, ratio: 3 }, // iPhone 14 Pro, 15, 15 Pro, 16
  { width: 428, height: 926, ratio: 3 }, // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  { width: 390, height: 844, ratio: 3 }, // iPhone 12, 12 Pro, 13, 13 Pro, 14
  { width: 360, height: 780, ratio: 3 }, // iPhone 12 mini, 13 mini
  { width: 375, height: 812, ratio: 3 }, // iPhone X, XS, 11 Pro
  { width: 414, height: 896, ratio: 3 }, // iPhone XS Max, 11 Pro Max
  { width: 414, height: 896, ratio: 2 }, // iPhone XR, 11
  { width: 414, height: 736, ratio: 3 }, // iPhone 8 Plus
  { width: 375, height: 667, ratio: 2 }, // iPhone SE (2nd and 3rd), 8
  { width: 320, height: 568, ratio: 2 }, // iPhone SE (1st)
];

export const SPLASH_SCREENS = SCREENS.map((screen) => ({
  ...screen,
  url: `/splash/launch-${screen.width * screen.ratio}x${screen.height * screen.ratio}.png`,
  media: `(device-width: ${screen.width}px) and (device-height: ${screen.height}px) and (-webkit-device-pixel-ratio: ${screen.ratio}) and (orientation: portrait)`,
}));
