import type { CheckupRequest } from "@/lib/form-actions";

/**
 * The business name and city, held in memory between pressing the home page's checkup
 * button and the checkup page. Like the search words, they stay out of the page address,
 * browser history and server logs, and a reload forgets them.
 */
let pending: CheckupRequest | null = null;

export function setPendingCheckup(request: CheckupRequest) {
  pending = request;
}

export function peekPendingCheckup() {
  return pending;
}

export function clearPendingCheckup() {
  pending = null;
}

/** The same rules the server applies, so a form that would be refused is never sent. */
export function readCheckupForm(form: HTMLFormElement): CheckupRequest | null {
  const data = new FormData(form);
  const text = (name: string, max: number) => String(data.get(name) ?? "").trim().slice(0, max);
  const name = text("name", 80);
  const city = text("city", 60);
  if (name.length < 2 || city.length < 2) return null;
  return { name, city, site: text("site", 200) };
}
