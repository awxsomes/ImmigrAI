/**
 * Business details shown on legal pages and in the footer. Set these in the
 * environment rather than editing the code. Nothing is invented: when a detail is
 * missing, the site says it will be published before launch.
 */
export const SITE = {
  name: "ImmigrAI",
  tagline: "Making AI Accessible to Every Entrepreneur.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
};

export function siteUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
