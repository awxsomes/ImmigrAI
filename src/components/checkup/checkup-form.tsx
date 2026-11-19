"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";
import { startCheckup, type CheckupRequest } from "@/lib/form-actions";
import type { CHECKUP_FORM_KEYS } from "./labels";
import { readCheckupForm, setPendingCheckup } from "./pending-checkup";

export type CheckupFormLabels = Pick<Dict, (typeof CHECKUP_FORM_KEYS)[number]>;
type Action = (payload: FormData) => void;

/**
 * The checkup form. It is sent with POST, so a business name and city never appear in a
 * page address. With scripts running, the details go straight to the checkup in memory.
 * Before they load, the form posts to the checkup page, which picks the details up from
 * the server action. Both forms share one permalink, so React can hand the result across.
 */
export function CheckupFields({ t, idPrefix, action, onStart }: { t: CheckupFormLabels; idPrefix: string; action: Action; onStart: (request: CheckupRequest) => void }) {
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const request = readCheckupForm(event.currentTarget);
        if (request) onStart(request);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="block font-semibold">
            {t.checkup_name}
          </label>
          <Input id={`${idPrefix}-name`} name="name" required minLength={2} maxLength={80} autoComplete="organization" className="mt-1 border-line-strong" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-city`} className="block font-semibold">
            {t.checkup_city}
          </label>
          <Input id={`${idPrefix}-city`} name="city" required minLength={2} maxLength={60} autoComplete="address-level2" className="mt-1 border-line-strong" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-site`} className="block font-semibold">
          {t.checkup_site}
        </label>
        <Input id={`${idPrefix}-site`} name="site" type="text" inputMode="url" maxLength={200} autoComplete="url" className="mt-1 border-line-strong" />
      </div>
      <Button type="submit" size="lg">
        {t.checkup_go}
      </Button>
      <p className="text-sm">{t.checkup_privacy}</p>
    </form>
  );
}

/** On the home page: opens the checkup page with the details held in memory. */
export function CheckupForm({ lang, t, idPrefix = "checkup" }: { lang: string; t: CheckupFormLabels; idPrefix?: string }) {
  const router = useRouter();
  const [, action] = useActionState(startCheckup, null, `/${lang}/checkup`);
  return (
    <CheckupFields
      t={t}
      idPrefix={idPrefix}
      action={action}
      onStart={(request) => {
        setPendingCheckup(request);
        router.push(`/${lang}/checkup`);
      }}
    />
  );
}
