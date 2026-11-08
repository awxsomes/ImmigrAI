/**
 * Software owners already run, grouped the way they think about it. Tools are matched
 * against these names, so a new tool can be checked against what the business has today.
 */
export const CURRENT_SYSTEMS: Array<{ group: "accounting" | "register" | "booking" | "customers" | "store" | "office" | "social"; names: string[] }> = [
  { group: "accounting", names: ["QuickBooks", "Xero", "FreshBooks", "Wave"] },
  { group: "register", names: ["Square", "Clover", "Toast", "Stripe", "PayPal"] },
  { group: "booking", names: ["Booksy", "Vagaro", "Fresha", "Jobber", "Housecall Pro"] },
  { group: "customers", names: ["HubSpot", "Salesforce", "Zoho CRM", "Mailchimp"] },
  { group: "store", names: ["Shopify", "Wix", "WooCommerce", "DoorDash", "Uber Eats"] },
  { group: "office", names: ["Google Sheets", "Microsoft Excel", "Gmail", "Outlook", "Google Calendar"] },
  { group: "social", names: ["WhatsApp", "Facebook", "Instagram"] },
];

export const SYSTEM_NAMES = CURRENT_SYSTEMS.flatMap((g) => g.names);

/** Services that let two products exchange information when they have no direct link. */
export const CONNECTORS = ["Zapier", "Make"];
