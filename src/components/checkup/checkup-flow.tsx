"use client";

import { useActionState, useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { startCheckup, type CheckupRequest } from "@/lib/form-actions";
import { CheckupFields, type CheckupFormLabels } from "./checkup-form";
import { CheckupView } from "./checkup-view";
import { clearPendingCheckup, peekPendingCheckup } from "./pending-checkup";
import type { CHECKUP_KEYS } from "./view-labels";

type ViewLabels = Pick<Dict, (typeof CHECKUP_KEYS)[number]>;

/** The checkup page: the form, then the results for what was sent. */
export function CheckupFlow({ lang, t, viewT }: { lang: string; t: CheckupFormLabels & Pick<Dict, "checkup_title" | "checkup_intro">; viewT: ViewLabels }) {
  const [posted, action] = useActionState(startCheckup, null, `/${lang}/checkup`);
  // Undefined until the owner starts one here. Null after they ask to start again.
  const [chosen, setChosen] = useState<CheckupRequest | null | undefined>(() => peekPendingCheckup() ?? undefined);
  const current = chosen === undefined ? posted : chosen;

  // Read once: coming back to this page later shows an empty form.
  useEffect(() => clearPendingCheckup(), []);

  if (current) {
    return (
      <CheckupView
        key={`${current.name}|${current.city}|${current.site}`}
        lang={lang}
        name={current.name}
        city={current.city}
        website={current.site}
        t={viewT}
        onReset={() => {
          setChosen(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl font-bold">{t.checkup_title}</h1>
      <p className="mt-2 mb-6 text-lg">{t.checkup_intro}</p>
      <CheckupFields t={t} idPrefix="checkup" action={action} onStart={setChosen} />
    </div>
  );
}
