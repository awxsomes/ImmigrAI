/**
 * Regression list for the instant matcher (src/lib/matcher.ts), which turns an owner's words
 * into a need before any AI is asked. Free and offline, so it runs in CI.
 *
 *   node --no-warnings scripts/check-matcher.mts
 *
 * Each case names the need the first suggestion must be, or needs that must never be
 * suggested. Owners often type without accents on a phone, so unaccented Spanish and
 * Vietnamese are here on purpose, and so are words like "ice cream" that must never be
 * read as immigration enforcement. Add a case whenever a query goes wrong.
 */
import "./lib/app-modules.mts";

const { localSuggestions } = await import("../src/lib/matcher.ts");

interface Case {
  q: string;
  /** The need the first suggestion must be, as "categoryId/subcategoryId". */
  top?: string;
  /** Needs that must not appear anywhere in the suggestions. */
  never?: string[];
  /** True when nothing should be suggested, so the question goes to the AI instead. */
  none?: boolean;
}

const RIGHTS = "safety/know-your-rights";

const CASES: Case[] = [
  // English, in an owner's own words
  { q: "answer the phone when I am busy", top: "calls/phone-ai" },
  { q: "pay my two employees", top: "employees/payroll" },
  { q: "who works when", top: "employees/scheduling" },
  { q: "my books are a mess", top: "money/bookkeeping" },
  { q: "file my quarterly taxes", top: "money/taxes" },
  { q: "how much am i making", top: "money/profits" },
  { q: "cash flow forecast", top: "money/budgeting" },
  { q: "track daily sales", top: "payments/sales-tracker" },
  { q: "take credit cards at the market", top: "payments/payment-methods" },
  { q: "point of sale for my food truck", top: "payments/pos" },
  { q: "barcode scanner for stock", top: "inventory/product-tracker" },
  { q: "cheaper supplier for flour", top: "inventory/supplier-comparer" },
  { q: "write instagram posts", top: "customers/social" },
  { q: "reply to bad reviews", top: "customers/reviews" },
  { q: "build a website", top: "customers/website" },
  { q: "no shows for haircuts", top: "calls/booking" },
  { q: "need a lawyer for my lease", top: "legal/legal-help" },
  { q: "get a business license", top: "legal/permits" },
  { q: "employee handbook", top: "legal/employment-docs" },
  { q: "my password got hacked", top: "safety/cybersecurity" },
  { q: "health inspection coming", top: "safety/food-health" },
  { q: "train new staff on food safety", top: "employees/training" },
  { q: "learn how to use chatgpt", top: "learn/ai-courses" },

  // Spanish, with and without accents
  { q: "necesito hacer la nomina", top: "employees/payroll" },
  { q: "necesito hacer la nómina", top: "employees/payroll" },
  { q: "contestar llamadas", top: "calls/phone-ai" },
  { q: "traducir mi menu", top: "translate/translators" },
  { q: "resenas de google", top: "customers/reviews" },
  { q: "aceptar tarjetas de credito", top: "payments/payment-methods" },
  { q: "cuanto gano", top: "money/profits" },

  // Vietnamese, with and without accents
  { q: "dat lich hen", top: "calls/booking" },
  { q: "đặt lịch hẹn", top: "calls/booking" },
  { q: "tra luong nhan vien", top: "employees/payroll" },
  { q: "xep ca lam viec", top: "employees/scheduling" },
  { q: "khai thue", top: "money/taxes" },

  // Chinese
  { q: "我需要排班", top: "employees/scheduling" },
  { q: "发工资", top: "employees/payroll" },

  // "ice" that has nothing to do with immigration enforcement, and the real thing
  { q: "ice cream", never: [RIGHTS] },
  { q: "ice cream shop needs a register", top: "payments/pos", never: [RIGHTS] },
  { q: "shaved ice stand taking cards", never: [RIGHTS] },
  { q: "ice machine broke", never: [RIGHTS] },
  { q: "ICE came to my store", top: RIGHTS },
  { q: "una redada de ICE", top: RIGHTS },
];

let failed = 0;
for (const c of CASES) {
  const got = localSuggestions(c.q).map((s) => `${s.categoryId}/${s.subcategoryId}`);
  const problems = [
    c.top && got[0] !== c.top ? `expected ${c.top} first` : "",
    ...(c.never ?? []).filter((need) => got.includes(need)).map((need) => `must not suggest ${need}`),
    c.none && got.length > 0 ? "expected no suggestion" : "",
  ].filter(Boolean);
  if (problems.length) {
    failed++;
    console.error(`FAIL ${JSON.stringify(c.q)}: ${problems.join("; ")}. Got: ${got.join(", ") || "nothing"}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${CASES.length} matcher cases failed.`);
  process.exit(1);
}
console.log(`All ${CASES.length} matcher cases pass.`);
