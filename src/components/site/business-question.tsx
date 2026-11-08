"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { BUSINESS_QUESTION_KEYS } from "@/components/checkup/labels";
import { NativeSelect } from "@/components/ui/native-select";
import { CURRENT_SYSTEMS } from "@/data/systems";
import type { Dict } from "@/lib/i18n";
import { setAlreadyUse, setBusiness, useUserData } from "@/lib/storage";
import { BUSINESS_TYPES, type BusinessType, type TeamSize } from "@/lib/types";

type Labels = Pick<Dict, (typeof BUSINESS_QUESTION_KEYS)[number]>;

const GROUP_LABEL = {
  accounting: "biz_groupAccounting",
  register: "biz_groupRegister",
  booking: "biz_groupBooking",
  customers: "biz_groupCustomers",
  store: "biz_groupStore",
  office: "biz_groupOffice",
  social: "biz_groupSocial",
} as const;

const OTHER = "other";

/**
 * The first thing we ask, and never required. "Something else" matches like no answer at
 * all, so it is only remembered for as long as the page is open.
 */
export function BusinessQuestion({ t }: { t: Labels }) {
  const id = useId();
  const { data } = useUserData();
  const [choseOther, setChoseOther] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const { type, size } = data.business;

  // On a slow phone someone can choose before the page's scripts start, and the choice would be lost.
  useEffect(() => {
    const early = selectRef.current?.value;
    if (early === OTHER) setChoseOther(true);
    else if (early) setBusiness({ type: early as BusinessType });
  }, []);

  function toggleSystem(name: string, on: boolean) {
    setAlreadyUse(on ? [...data.alreadyUse, name] : data.alreadyUse.filter((n) => n !== name));
  }

  return (
    <div>
      <label htmlFor={`${id}-type`} className="block font-semibold">
        {t.biz_question}
      </label>
      <NativeSelect
        ref={selectRef}
        id={`${id}-type`}
        className="mt-1 sm:max-w-md"
        value={type || (choseOther ? OTHER : "")}
        onChange={(event) => {
          const value = event.target.value;
          setChoseOther(value === OTHER);
          setBusiness({ type: value === OTHER ? "" : (value as BusinessType | "") });
        }}
      >
        <option value="">{t.biz_choose}</option>
        {BUSINESS_TYPES.map((business) => (
          <option key={business} value={business}>
            {t[`businessType_${business}`]}
          </option>
        ))}
        <option value={OTHER}>{t.businessType_other}</option>
      </NativeSelect>

      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-medium underline underline-offset-2">
          {t.biz_more}
          <span aria-hidden="true" className="text-xl leading-none no-underline group-open:hidden">
            +
          </span>
          <span aria-hidden="true" className="hidden text-xl leading-none no-underline group-open:inline">
            &minus;
          </span>
        </summary>
        <div className="mt-1 space-y-5 rounded-lg border-2 border-line bg-surface p-4">
          <div className="sm:max-w-md">
            <label htmlFor={`${id}-size`} className="block font-semibold">
              {t.biz_size}
            </label>
            <NativeSelect id={`${id}-size`} className="mt-1" value={size} onChange={(event) => setBusiness({ size: event.target.value as TeamSize })}>
              <option value="">{t.biz_sizeUnknown}</option>
              <option value="1">{t.biz_size1}</option>
              <option value="2-5">{t.biz_size2}</option>
              <option value="6-20">{t.biz_size6}</option>
              <option value="21+">{t.biz_size21}</option>
            </NativeSelect>
          </div>
          <div>
            <p className="font-semibold">{t.biz_software}</p>
            <div className="mt-2 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {CURRENT_SYSTEMS.map(({ group, names }) => (
                <fieldset key={group}>
                  <legend className="text-sm font-medium text-muted-ink">{t[GROUP_LABEL[group]]}</legend>
                  <ul>
                    {names.map((name) => (
                      <li key={name}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-6 shrink-0 accent-[#0e5a45]"
                            checked={data.alreadyUse.includes(name)}
                            onChange={(event) => toggleSystem(name, event.target.checked)}
                          />
                          {name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-ink">{t.biz_note}</p>
        </div>
      </details>
    </div>
  );
}
