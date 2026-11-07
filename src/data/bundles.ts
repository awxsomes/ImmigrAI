import type { Bundle } from "@/lib/types";

/**
 * Ready-made combinations. How well each one fits together is worked out from the
 * confirmed integrations when the page is built, so these notes only say what that
 * check cannot: which choice to make, and what to watch out for.
 */
export const BUNDLES: Bundle[] = [
  {
    slug: "startup-essentials",
    name: "Start-up Essentials",
    tagline: "The basics for a new business, all with a free way to start.",
    forWho: "Any business opening its doors this year",
    toolSlugs: ["google-business-profile", "square-pos", "wave", "canva", "whatsapp-business", "bitwarden"],
  },
  {
    slug: "restaurant-picks",
    name: "Special Picks for Restaurants",
    tagline: "Take orders, schedule the kitchen and get ready for the inspector.",
    forWho: "Restaurants, food trucks, bakeries and cafes",
    toolSlugs: ["square-pos", "7shifts", "choco", "fooddocs", "google-business-profile", "google-translate"],
    note: "FoodDocs is the one paid tool here. Start with the free tools, and add it when you are ready.",
  },
  {
    slug: "salon-and-barber",
    name: "Salon and Barbershop Kit",
    tagline: "Fill the chair and cut down on no-shows.",
    forWho: "Hair, nails, lashes, barbers and spas",
    toolSlugs: ["fresha", "square-appointments", "canva", "google-business-profile", "homebase"],
    note: "You only need one booking tool. Choose Fresha or Square Appointments, and compare their fees first.",
  },
  {
    slug: "trades-on-the-go",
    name: "Trades on the Go",
    tagline: "Keep up with calls and get paid from the truck.",
    forWho: "HVAC, plumbing, electrical, landscaping, cleaning",
    toolSlugs: ["openphone", "stripe", "calendly", "sortly", "google-business-profile", "keeper-tax"],
  },
  {
    slug: "corner-store-and-retail",
    name: "Corner Store and Retail",
    tagline: "Track what sells and reorder before you run out.",
    forWho: "Bodegas, markets, boutiques, gift shops",
    toolSlugs: ["square-pos", "zoho-inventory", "faire", "google-sheets", "meta-business-suite"],
  },
  {
    slug: "first-employee",
    name: "Hiring Your First Employee",
    tagline: "Find someone, schedule them and pay them correctly.",
    forWho: "Owners going from solo to a small team",
    toolSlugs: ["indeed", "homebase", "gusto", "connecteam", "sba-business-guide"],
    note: "Homebase and Connecteam overlap. Try one before paying for the other. Ask a professional about the rules in your state.",
  },
  {
    slug: "speak-every-language",
    name: "Speak Every Customer's Language",
    tagline: "Serve customers in more languages without hiring a translator.",
    forWho: "Any shop in a multilingual neighborhood",
    toolSlugs: ["google-translate", "deepl", "elevenlabs", "whatsapp-business", "duolingo"],
    note: "Machine translation makes mistakes. Have a person check menus, contracts and anything legal.",
  },
  {
    slug: "safety-first",
    name: "Safety First",
    tagline: "Protect your people, your accounts and your records.",
    forWho: "Every business",
    toolSlugs: ["bitwarden", "ilrc-red-cards", "nilc-know-your-rights", "citizen", "fooddocs"],
    note: "These do not need to connect to each other, because each covers a different risk. Citizen only works in some areas.",
  },
];

export const BUNDLE_BY_SLUG = new Map(BUNDLES.map((b) => [b.slug, b]));
