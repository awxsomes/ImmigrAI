import type { Metadata } from "next";
import { MyToolsView } from "@/components/tools/my-tools-view";
import { getDict } from "@/lib/i18n";
import { COMPAT_KEYS, pick } from "@/lib/labels";
import { pageLanguageName } from "@/lib/localize";

export const metadata: Metadata = { title: "My tools", robots: { index: false } };

export default async function MyToolsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(lang);
  return (
    <MyToolsView
      lang={lang}
      defaultLanguage={pageLanguageName(lang)}
      t={{
        ...pick(t, COMPAT_KEYS),
        ...pick(t, [
          "my_title", "my_sub", "my_empty", "my_browse", "my_export", "my_delete", "my_remove", "my_alreadyTitle", "my_alreadyD", "my_listTitle",
          "my_stackTitle", "my_lowestTotal", "my_fitLabel", "my_needTwo", "my_savingOff", "my_turnOn", "my_saved", "my_yourData", "my_onlyPaper", "my_seeKit",
          "card_free", "card_freePlan", "card_noMonthlyFee", "card_youSetBudget", "card_perReturn", "price_amount", "price_amountPerson", "price_amountLocation", "price_amountUse", "price_plan",
          "sub_title", "sub_intro", "sub_paying", "sub_cost", "sub_costHelp", "sub_renews", "sub_trialEnds", "sub_howToCancel", "sub_perMonth", "sub_perYear",
          "sub_none", "sub_dueTitle", "sub_due", "sub_trialTitle", "sub_trial", "sub_overlapTitle", "sub_overlap",
          "tool_ratingLegend", "tool_star", "tool_clearRating", "tool_inUse", "tool_note", "tool_rateHelp",
          "doc_confirmQ", "doc_confirmDelete", "doc_cancel", "doc_deleted",
          "my_languageTitle", "my_languageD", "my_languageSiteIn", "my_languageNoSite", "my_languageWorks", "my_languageUnknown", "filter_myLanguage", "filter_chooseLanguage",
        ]),
      }}
    />
  );
}
