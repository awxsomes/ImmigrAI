/** Joins class names. A merging library added 13 KB to every page for conflicts we do not have. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
