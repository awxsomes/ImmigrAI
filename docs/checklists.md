# Security and compliance checklists

Status for each item in the project brief, based on what the code does today. "Not applicable" means the feature does not exist yet, and the note says what to do when it is added.

## Security

| Item | Status | Where / what |
|---|---|---|
| Hide API keys | Done | `OPENROUTER_API_KEY` is only read in server code (`src/lib/env.ts`, which imports `server-only`). Nothing is prefixed `NEXT_PUBLIC_` except the optional public contact email. |
| Add rate limiting | Partly | `src/lib/ratelimit.ts`, per route and per visitor per minute, using a salted hash of the IP, so typing suggestions can no longer use up a search or a checkup. Counters are per server instance and reset on every cold start, so limits are approximate. **Next:** move the counters to a shared store such as Upstash. |
| Check env variables | Done | Validated in `src/lib/env.ts`. `.env.example` lists them. AI features turn off cleanly if the key is missing. |
| Set spend cap | Done | The OpenRouter key has a $25 limit, confirmed through its API. There is also a daily call cap in the app, per instance. |
| Check keys in git | Done | `.env*` is ignored, except `.env.example`. A search of the tree and git history found the key only in `.env.local`. |
| Rotate the exposed key | **Open: needs you** | The OpenRouter key was pasted into a chat, and the site is now public. Create a new key with a fresh spend limit, put it in `.env.local` and in Vercel, delete the old one, then write the date here. **Rotated on: not yet.** On 2026-11-17 the old key had used $19.66 of its $25 limit. |
| Secure file uploads | Not applicable | No uploads exist. |
| Protect admin routes | Not applicable | No admin routes exist. Research scripts run from the command line. |
| CSRF protection | Done | `assertSameOrigin` in `src/lib/security.ts` checks `Sec-Fetch-Site` and `Origin` on every API route. No cookies or sessions exist to hijack. |
| Add auth | Not applicable | No accounts by design: all user data is in the browser. Add auth before storing anything on a server. |
| Check CORS settings | Done | No `Access-Control-Allow-Origin` is ever sent, so other sites cannot read responses. |
| Check user perms | Not applicable | No accounts or roles exist. |
| Enable HTTPS | Done on deploy | Vercel serves HTTPS. `Strict-Transport-Security` and `upgrade-insecure-requests` are set in production. |
| Sanitize user inputs | Done | `cleanText` and `cleanId` in `src/lib/security.ts`. Size limits on request bodies. Owner text is wrapped in tags and treated as a description, not instructions. |
| Add security headers | Done | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and COOP in `next.config.ts`. |
| Protect against XSS | Done, with one limit | All text, including AI output, renders through React escaping. No raw HTML is used. Links are limited to `https`. **Limit:** the CSP allows `'unsafe-inline'` scripts, because per-request nonces would disable the prerendering this site depends on for speed. Only same-origin scripts can load. |
| Secure cookies | Not applicable | The site sets no cookies. |
| SQL injection protect | Not applicable | No database exists. Use parameterized queries if one is added. |
| Disable debug mode | Done | Source maps are off in production, the `x-powered-by` header is off, and errors return generic messages. |
| Check DB rules | Not applicable | No database exists. |
| Check prod settings | Before launch | Set `OPENROUTER_API_KEY` and `APP_URL` in Vercel. See the launch list below. |

Dependency audit: `npm audit --omit=dev` reported 0 vulnerabilities on 2026-11-06, after removing the `shadcn` CLI and `lucide-react` from runtime dependencies.

## Compliance

| Item | Status | Where / what |
|---|---|---|
| Privacy policy | Draft | `/privacy`. Matches what the code does. Needs a lawyer's review. |
| Terms of service | Draft | `/terms`. Governing law is left open until there is a legal entity. |
| Refund policy | Removed | Taken out at the team's request. The site charges nothing, and the terms say each tool's own terms apply to anything bought from it. |
| Cookie policy | Draft | `/cookies`. |
| Cookie consent banner | Done | `consent-banner.tsx`. Nothing is written to the device before a choice. Reopen from "Privacy choices" in the footer. |
| Remove fake reviews | Done | Invented ratings were removed. Ratings now come only from `research.json` and must pass `verifyReviews` and `finalizeReviews`. A rating must appear in the search engine's text for the cited page; the page itself is not opened, and `/methodology`, the home page FAQ and the README say so. Reviews that belonged to other products with similar names were found by reading each tool's sources and removed, and tools found by web search now need review pages that show their web address. |
| Remove unsupported claims | Partly | Prices and integrations must appear in cited text or are marked unconfirmed. **Languages:** 52 tools have a language list with no cited page. In the Know your rights category these are hidden (`SOURCED_LANGUAGES_ONLY` in `seed-tools.ts`); elsewhere they still show until research finds a source. Base descriptions in `seed-base.ts` were written by hand and were not machine checked. |
| AI claims | Done, needs spot checks | A tool is only labeled as using AI if a cited page names the product and its AI. A few generous results were corrected by hand with `aiOverride` in `seed-base.ts`. |
| Accessibility alt text | Done | The site has no photos. Decorative SVGs are hidden from screen readers, and meaningful ones have labels. |
| Fix color contrast | Done | `npm run check:contrast` checks every color pair: text at least 4.5:1, input edges at least 3:1. |
| Keyboard navigation | Done | Native controls, a skip link, visible focus and the ARIA combobox pattern on search. |
| Check form consents | Done | No box is pre-ticked. The only "consent" action is an explicit button. |
| Add business details | **Needs you** | `/about` and the footer state it is a student prototype. **Set `NEXT_PUBLIC_CONTACT_EMAIL` in Vercel**: the privacy policy now tells people to write to it to exercise their rights, and until it is set the pages say a contact address is coming. Add a legal name and address once they exist. We did not invent any. |
| No unnecessary data | Done | No accounts, analytics or location. The search and checkup forms are sent with POST, so a business name, city or typed need never lands in a page address, browser history or host log, even before JavaScript loads. |
| Age consent for kids' data | Done | Terms and privacy both say 18 or older (until 2026-11-17 the terms also allowed minors with a parent's permission). The consent banner says accepting confirms you are 18 or older. There is no age verification. |
| Audit third-party SDKs | Done | No third-party scripts, analytics or SDKs run in the browser. Server-side, only OpenRouter is called, and it sends web searches to Exa. Vercel hosts the site. All three are named in the privacy policy. |
| Unsubscribe link in emails | Not applicable | The site sends no email. The privacy policy says so, and that any future list needs one. |
| Remove dark patterns | Done | Equal-weight consent buttons, no pre-selection, no countdowns, no upsells, and no sponsored ranking. |
| License fonts and images | Done | Lexend is under the SIL OFL 1.1. No stock images. Listed on `/about`. |
| Remove hidden fees | Done | The site is free. Each tool's extra fees show on its card. Kit totals say that fees are not included. |
| Data deletion request | Done | `/data-deletion` has a working button. No server data exists. |

## Translations

| Check | Status |
|---|---|
| Every interface word, page, kit, tool text and category in Spanish, Chinese and Vietnamese | `npm run check:i18n`, run in CI. It also fails when the English changed after a translation was made. |
| One word for each idea | `GLOSSARY` in `scripts/i18n-sources.mts`, given to the translator. "Kit" had two Chinese words before. |
| Native-speaker review | **Not done.** All of it is machine translation. |

## What was checked on 2026-11-17

Targeted checks of that day's fixes, on a local dev server. Not a repeat of the full pass below.

| Check | Result |
|---|---|
| "I sell ice cream and want more customers" | Goes to website, social and reviews. Never to Know your rights. |
| "immigration forms I-9" | Employment documents only |
| "ice agents came to my restaurant", "la migra", "移民局抓人" | Know your rights, and live web search is blocked |
| Old `?sub=ice-alerts` links | Redirect to `know-your-rights` |
| Checkup and search forms before JavaScript loads | Sent with POST. A sentence redirects to its category with no words in the address; the checkup page renders from the POST body. |
| Rate limits | 12 suggestions use up only the suggest allowance; a visitor's 3 checkups do not block their searches or another visitor's checkup. |
| Discovery with a stalled AI provider | Gives up after one 25-second try instead of retrying past the 60-second limit, and the failure is cached for 5 minutes. |
| Calendar reminder | Valid iCalendar file with an alert 3 days before. Not yet opened on a real phone. |

## What was tested, and how (2026-11-06)

**This pass predates the business checkup, need-first matching, the subscription tracker and the 2026-11-17 fixes.** Those have not had the accessibility, keyboard, slow-network or API-protection checks below. Run them again before relying on this table.

Run against a production build on a local server, in headless Microsoft Edge.

| Check | Result |
|---|---|
| Accessibility scan (axe-core, WCAG 2.0 to 2.2 A and AA, plus best practices), 21 pages | 0 violations. An automated scan finds only some problems. |
| Keyboard only | Logical tab order with a visible focus ring. Arrow keys and Enter work in search. Esc closes menus. |
| Color contrast (`npm run check:contrast`) | All pairs pass |
| Phone width, 375px | No sideways scrolling on the pages checked |
| First visit download | About 120 KB of JavaScript, 11 KB of HTML, 6 KB of CSS and a 39 KB font, compressed with Brotli. Older browsers also get a 34 KB polyfill. |
| Slow 3G (400 Kbps, 400ms latency) with a 4x slower CPU | Content appears in about 2 seconds, fully loaded in about 5.5 seconds. Measured with gzip, on a local server. |
| Owner's journey | Search, filters, live discovery, save, rate, compare and delete all worked, with no browser errors. |
| API protection | Cross-site requests 403, wrong content type 415, oversized body 413, bad JSON 400, over the rate limit 429. |
| Script injection in search and compare addresses | Escaped |
| API key in browser files | Not found |

**Not tested:** real phones, real screen readers, a real slow network, the deployed Vercel site, and real business owners. Lighthouse would not start in this environment.

## Before going public

The site is already public, so items 1 to 3 are overdue.

1. **Rotate the OpenRouter key** and set a new spend limit. Write the date in the security table above.
2. Have a lawyer review the legal pages, and choose a governing law.
3. Add real business details and set `NEXT_PUBLIC_CONTACT_EMAIL`.
4. Have native speakers review the Spanish, Chinese and Vietnamese, especially the legal pages and the Free Help notice.
5. Have a legal-aid clinic or immigration attorney review the Know your rights category (renamed from "ICE alerts" on 2026-11-17) and its links. Live discovery is turned off for this category on purpose (`NO_LIVE_DISCOVERY` in `src/data/taxonomy.ts`), because a fake or unsafe app could put people at risk. The MigraWatch hotline is held back (`HELD_FOR_REVIEW` in `src/data/seed-tools.ts`) until that review, because reporting enforcement activity is the function the site refuses to list apps for.
6. Have a lawyer and a tax preparer read the "not professional advice" notes on legal, tax, payroll and HR tools (`src/lib/advice.ts`), and confirm the free-help links.
7. Read through the small AI tools in `src/data/seed-discovered.json`. Many have no reviews yet, so a person should check they are real, safe and sold in the US.
8. Confirm the SBA citizenship rule against the SBA's own notice. Our page relies on news reports.
9. Test with real owners, and on a real low-end phone.
