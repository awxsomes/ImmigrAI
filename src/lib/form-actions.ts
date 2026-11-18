"use server";

import { redirect } from "next/navigation";
import { isSpecificNeed } from "@/components/search/pending-need";
import { searchHref } from "./format";
import { isUiLang } from "./i18n";
import { localSuggestions } from "./matcher";

/**
 * The two forms an owner types into, sent with POST so their words never become part of
 * a page address, browser history or server log.
 *
 * With JavaScript running, neither form reaches these functions: the words go straight to
 * the search or checkup request. These only run when a form is sent before the page's
 * scripts have loaded, such as on a slow phone.
 */

export interface CheckupRequest {
  name: string;
  city: string;
  site: string;
}

function field(form: FormData, name: string, max: number) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Returns what was typed, checked, so the checkup page can start. Used with useActionState. */
export async function startCheckup(_previous: CheckupRequest | null, form: FormData): Promise<CheckupRequest | null> {
  const name = field(form, "name", 80);
  const city = field(form, "city", 60);
  if (name.length < 2 || city.length < 2) return null;
  return { name, city, site: field(form, "site", 200) };
}

/**
 * Sends the search box to the right page. A sentence goes to its category and nothing else.
 * One or two words that match no category, such as a product's name, stay in the address
 * so the results page can look them up, as the privacy policy says.
 */
export async function searchFromForm(form: FormData) {
  const requested = field(form, "lang", 5);
  const lang = isUiLang(requested) ? requested : "en";
  const q = field(form, "q", 200);
  if (!q) redirect(`/${lang}/search`);
  const top = localSuggestions(q)[0];
  if (top) redirect(searchHref(lang, top.categoryId, top.subcategoryId));
  if (isSpecificNeed(q)) redirect(`/${lang}/search`);
  redirect(`/${lang}/search?q=${encodeURIComponent(q)}`);
}
