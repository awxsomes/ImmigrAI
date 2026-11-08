import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";
import type { CHECKUP_FORM_KEYS } from "./labels";

type Labels = Pick<Dict, (typeof CHECKUP_FORM_KEYS)[number]>;

/** A plain form, so it submits before any JavaScript has loaded on a slow connection. */
export function CheckupForm({ lang, t, idPrefix = "checkup" }: { lang: string; t: Labels; idPrefix?: string }) {
  return (
    <form action={`/${lang}/checkup`} method="get" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="block font-semibold">
            {t.checkup_name}
          </label>
          <Input id={`${idPrefix}-name`} name="name" required minLength={2} maxLength={80} autoComplete="organization" className="mt-1 border-ink" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-city`} className="block font-semibold">
            {t.checkup_city}
          </label>
          <Input id={`${idPrefix}-city`} name="city" required minLength={2} maxLength={60} autoComplete="address-level2" className="mt-1 border-ink" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-site`} className="block font-semibold">
          {t.checkup_site}
        </label>
        <Input id={`${idPrefix}-site`} name="site" type="text" inputMode="url" maxLength={200} autoComplete="url" className="mt-1 border-ink" />
      </div>
      <Button type="submit" size="lg">
        {t.checkup_go}
      </Button>
      <p className="text-sm">{t.checkup_privacy}</p>
    </form>
  );
}
