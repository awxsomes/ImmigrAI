import type { Category } from "@/lib/types";

/**
 * The navigation taxonomy. IDs are stable and used in URLs (?cat=&sub=).
 * Keywords are the everyday phrases an owner might type, not technical terms.
 */
export const CATEGORIES: Category[] = [
  {
    id: "translate",
    name: "Translate Languages",
    keywords: ["translate", "translation", "language", "interpreter", "bilingual", "speak english", "understand customers"],
    subcategories: [
      { id: "translators", name: "Translators", description: "Translate text, documents, menus, signs and conversations.", keywords: ["translate", "translator", "translation", "menu", "sign", "letter", "interpreter", "understand my customers", "speak to customers"] },
      { id: "voiceovers", name: "Voiceovers", description: "Turn text into natural spoken audio in many languages.", keywords: ["voice", "voiceover", "voice over", "narration", "text to speech", "announcement", "greeting", "voicemail greeting", "video voice"] },
    ],
  },
  {
    id: "customers",
    name: "Get More Customers",
    keywords: ["more customers", "customers", "marketing", "grow", "promote", "more business", "advertise", "nobody knows about"],
    subcategories: [
      { id: "website", name: "Website Creation", description: "Build a simple website or online menu without coding.", keywords: ["website", "web page", "site", "online menu", "domain", "online store", "shop online", "sell online", "online orders"] },
      { id: "social", name: "Social Media", description: "Create and schedule posts for Instagram, Facebook, TikTok and WhatsApp.", keywords: ["social media", "instagram", "facebook", "tiktok", "posts", "post", "content", "followers", "reels", "photos"] },
      { id: "reviews", name: "Online Reviews", description: "Collect, respond to and manage Google and Yelp reviews.", keywords: ["reviews", "review", "google reviews", "yelp", "reputation", "ratings", "bad review", "stars", "show up on google", "google maps", "near me"] },
      { id: "ads", name: "Advertisements", description: "Make and run low-budget ads online or in print.", keywords: ["ads", "ad", "advertising", "advertisement", "flyer", "flyers", "promotion", "google ads", "facebook ads", "coupon", "banner", "poster", "posters"] },
    ],
  },
  {
    id: "money",
    name: "Manage Money & Taxes",
    keywords: ["money", "finance", "accounting", "cash"],
    subcategories: [
      { id: "bookkeeping", name: "Bookkeeping", description: "Track income, expenses, receipts and invoices.", keywords: ["bookkeeping", "accounting", "receipts", "invoices", "invoice", "expenses", "books", "ledger", "quickbooks", "bank statements"] },
      { id: "profits", name: "Profits", description: "Understand margins and which products make money.", keywords: ["profit", "profits", "margin", "margins", "losing money", "pricing", "revenue", "how much am i making", "making money"] },
      { id: "taxes", name: "Taxes", description: "Prepare, estimate and file business taxes.", keywords: ["taxes", "tax", "irs", "file taxes", "sales tax", "1099", "quarterly", "deductions", "cpa", "write offs"] },
      { id: "budgeting", name: "Budgeting", description: "Plan monthly spending and cash flow.", keywords: ["budget", "budgeting", "cash flow", "spending", "savings", "forecast", "plan my money"] },
      { id: "costs", name: "Cost Optimization", description: "Find where to cut costs and compare subscriptions.", keywords: ["cut costs", "save money", "cheaper", "reduce expenses", "subscriptions", "bills", "utility bills", "costs too high", "spending too much"] },
    ],
  },
  {
    id: "payments",
    name: "Accept Payments",
    keywords: ["payments", "payment", "get paid", "pay me", "customers pay"],
    subcategories: [
      { id: "sales-tracker", name: "Sales Tracker", description: "See daily sales, best sellers and trends.", keywords: ["sales", "track sales", "daily sales", "best sellers", "sales report", "how much did i sell", "what sells"] },
      { id: "payment-methods", name: "Payment Methods", description: "Accept cards, tap to pay, online payments and invoices.", keywords: ["accept cards", "credit card", "credit cards", "debit", "tap to pay", "apple pay", "online payment", "payment link", "qr code", "venmo", "zelle", "take cards", "card reader"] },
      { id: "pos", name: "Point of Sales (POS)", description: "A register system for in-person sales, tips and receipts.", keywords: ["pos", "point of sale", "point of sales", "register", "cash register", "checkout", "tips", "kiosk", "terminal"] },
    ],
  },
  {
    id: "inventory",
    name: "Track Products and Suppliers",
    keywords: ["stock", "products", "supplies", "ingredients"],
    subcategories: [
      { id: "product-tracker", name: "Product Tracker", description: "Know what you have, what sells and what is running out.", keywords: ["products", "track products", "stock levels", "running out", "barcode", "sku", "count stock", "what i have"] },
      { id: "supplier-comparer", name: "Supplier Comparer", description: "Compare prices and find better suppliers.", keywords: ["supplier", "suppliers", "vendor", "vendors", "wholesale", "compare prices", "cheaper supplier", "distributor", "buy in bulk"] },
      { id: "inventory-manager", name: "Inventory Manager", description: "Reorder automatically and manage more than one location.", keywords: ["inventory", "reorder", "restock", "warehouse", "manage stock", "low stock", "purchase orders", "ran out"] },
    ],
  },
  {
    id: "employees",
    name: "Manage Employees",
    keywords: ["employees", "employee", "staff", "workers", "worker", "team"],
    subcategories: [
      { id: "hiring", name: "Hiring", description: "Post jobs, screen applicants and bring on new hires.", keywords: ["hire", "hiring", "job post", "applicants", "recruit", "find workers", "interview", "help wanted", "new employee"] },
      { id: "scheduling", name: "Employee Schedules", description: "Build shift schedules, track hours and swap shifts.", keywords: ["employee schedules", "employee schedule", "schedule", "schedules", "scheduling", "shifts", "shift", "roster", "time clock", "hours", "clock in", "who works when", "timesheet"] },
      { id: "payroll", name: "Payroll", description: "Pay employees, handle withholding and file payroll taxes.", keywords: ["payroll", "pay employees", "pay my employees", "pay workers", "paychecks", "paycheck", "direct deposit", "withholding", "w-2", "payroll taxes", "contractors"] },
      { id: "training", name: "Training", description: "Train staff with short lessons and checklists.", keywords: ["training", "train staff", "train my staff", "train employees", "lessons", "checklist", "safety training"] },
    ],
  },
  {
    id: "calls",
    name: "Answer Calls",
    keywords: ["calls", "call", "phone"],
    subcategories: [
      { id: "phone-ai", name: "Automated phone calls", description: "An AI receptionist that answers, takes messages and books.", keywords: ["answer the phone", "answer phone", "answer calls", "phone", "receptionist", "missed calls", "voicemail", "call", "calls", "ai phone", "answering service", "when i am busy"] },
      { id: "support", name: "Customer support", description: "Reply to customer questions by chat, text or email.", keywords: ["customer support", "customer service", "chat", "text message", "text messages", "sms", "email replies", "faq", "chatbot", "whatsapp", "answer questions", "customer questions"] },
      { id: "booking", name: "Appointment booking", description: "Let customers book and get reminders automatically.", keywords: ["appointment", "appointments", "booking", "bookings", "book online", "book an appointment", "book a table", "book a haircut", "reservation", "reservations", "reminders", "no show", "no shows", "haircut booking"] },
    ],
  },
  {
    id: "legal",
    name: "Handle Legal/Business Paperwork",
    keywords: ["legal", "paperwork", "forms", "documents"],
    subcategories: [
      { id: "legal-help", name: "Legal assistance", description: "Understand contracts, leases and legal questions in plain language.", keywords: ["legal", "lawyer", "contract", "contracts", "lease", "legal question", "sue", "dispute", "attorney", "letter from", "confusing letter"] },
      { id: "permits", name: "Business permits", description: "Find and apply for permits, licenses and registrations.", keywords: ["permit", "permits", "license", "licenses", "business license", "register business", "register my business", "llc", "ein", "health permit", "food license", "open a business", "start a business"] },
      { id: "employment-docs", name: "Employment documents", description: "Create offer letters, I-9s, W-4s and handbooks.", keywords: ["employment documents", "i-9", "i9", "w-4", "w4", "offer letter", "handbook", "employee forms", "hr forms", "contractor agreement"] },
      { id: "regulations", name: "Regulations", description: "Stay compliant with labor, health and tax rules.", keywords: ["regulations", "regulation", "compliance", "rules", "labor law", "minimum wage", "osha", "health code", "deadlines"] },
    ],
  },
  {
    id: "safety",
    name: "Safety & Security",
    keywords: ["safety", "security", "safe"],
    subcategories: [
      { id: "community-alerts", name: "Community alerts", description: "Get local alerts about crime, weather and emergencies.", keywords: ["community alerts", "neighborhood", "crime", "weather alert", "emergency", "local news", "robbery", "break in", "safety alert"] },
      { id: "ice-alerts", name: "ICE alerts", description: "Know your rights and get community notifications about immigration enforcement.", keywords: ["ice", "ice alerts", "immigration", "raid", "raids", "know your rights", "my rights", "deportation", "enforcement", "migra", "immigration alert"] },
      { id: "cybersecurity", name: "Cybersecurity", description: "Protect accounts, passwords and devices from scams.", keywords: ["cybersecurity", "password", "passwords", "hacked", "scam", "scams", "phishing", "fraud", "two factor", "protect my account", "virus"] },
      { id: "food-health", name: "Food & Health safety", description: "Track temperatures, checklists and health inspection prep.", keywords: ["food safety", "health inspection", "inspection", "temperature log", "temperature", "haccp", "servsafe", "allergens", "sanitation", "health inspector"] },
    ],
  },
  {
    id: "learn",
    name: "Learn New Skills",
    keywords: ["learn", "course", "courses", "class", "classes", "teach me", "skills"],
    subcategories: [
      { id: "ai-courses", name: "AI courses", description: "Learn to use AI tools with simple lessons.", keywords: ["learn ai", "ai course", "ai courses", "chatgpt course", "how to use ai", "ai basics", "ai class"] },
      { id: "business-courses", name: "Business courses", description: "Free and low-cost business classes, including LinkedIn Learning and the SBA.", keywords: ["business course", "business courses", "business class", "linkedin learning", "sba", "marketing course", "accounting class", "mentor", "mentoring", "advice"] },
      { id: "study-tools", name: "Study tools", description: "Flashcards, summaries and practice for licenses and exams.", keywords: ["study", "flashcards", "exam", "test prep", "license exam", "servsafe exam", "citizenship test", "english practice", "learn english", "practice english"] },
    ],
  },
];

/**
 * Needs where tools are never added automatically. A fake or badly secured immigration
 * enforcement app could put someone in danger, so this list is limited to nonprofit
 * resources that were checked, until a person reviews any new ones.
 */
export const NO_LIVE_DISCOVERY = new Set(["ice-alerts"]);

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

export function findCategory(id?: string | null) {
  return id ? (CATEGORY_MAP.get(id) ?? null) : null;
}

export function findSubcategory(categoryId?: string | null, subId?: string | null) {
  const category = findCategory(categoryId);
  if (!category || !subId) return null;
  return category.subcategories.find((s) => s.id === subId) ?? null;
}

/** Flat list for the AI prompt and the instant matcher. */
export function flatTaxonomy() {
  return CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => ({
      categoryId: c.id,
      categoryName: c.name,
      subcategoryId: s.id,
      subcategoryName: s.name,
      description: s.description,
      subKeywords: s.keywords,
      categoryKeywords: c.keywords,
    })),
  );
}
