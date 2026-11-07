/** Parse "a,b,c" from a URL into at most four safe tool slugs. */
export function cleanSlugs(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean)
    .slice(0, 4);
}
