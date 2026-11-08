/** Kept out of the "use client" files: a list exported from one of those cannot be read on the server. */

export const BUSINESS_QUESTION_KEYS = [
  "biz_question", "biz_choose", "biz_more", "biz_size", "biz_sizeUnknown", "biz_size1", "biz_size2", "biz_size6", "biz_size21", "biz_software",
  "biz_groupAccounting", "biz_groupRegister", "biz_groupBooking", "biz_groupCustomers", "biz_groupStore", "biz_groupOffice", "biz_groupSocial", "biz_note",
  "businessType_restaurant", "businessType_salon", "businessType_retail", "businessType_trades", "businessType_cleaning", "businessType_other",
] as const;

export const CHECKUP_FORM_KEYS = ["checkup_name", "checkup_city", "checkup_site", "checkup_go", "checkup_privacy"] as const;
