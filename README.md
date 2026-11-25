# ImmigrAI

*Making AI Accessible to Every Entrepreneur.*
*Your Guide to AI for Small Businesses.*

An "Angie's List" of AI tools for immigrant-run main street businesses, including small and new tools that owners would struggle to find. An owner describes what they need in their own words, in any language, and gets affordable, easy tools with verified ratings, honest language answers (works, not supported, or not checked yet) and a check of how the tools work together. Each tool page also shows a rough estimate of its energy use. That is a values choice, not a ranking: we think the people paying for AI should be able to see what it uses, so the estimate is there to read, and it never changes a score or the order of results.

## Run it

```bash
npm install
```

```bash
cp .env.example .env.local
```

Add your OpenRouter key to `.env.local`, then:

```bash
npm run dev
```

The site works without a key. Smart search falls back to its on-device word list, and live discovery says it is paused.

## How it works

```
Owner's words ──> on-device word list ──> instant suggestions
                        │ not confident
                        v
                  /api/suggest ──> AI model (no web search, very cheap)

Category page ──> prebuilt HTML: catalog tools, checked ahead of time
                        │ in the background
                        v
                  /api/discover ──> web search for new tools
                                ──> web search of review sites, per tool
                                ──> every claim checked against cited text
                                ──> constraints applied: price, rating
```

### Honest data by construction

A model can be confidently wrong, so its claims only count when the text the search engine returned backs them up. See `src/lib/research-core.ts`:

- A rating must appear in the search engine's result text for the exact page cited, on an independent review site, on a page naming that product. The page itself is not opened, so the live page may show a newer number.
- The Apple App Store must be the US store (a link with no country opens the US store, so it counts), and a Trustpilot page's domain must match the vendor's or another domain it uses (`aliasDomains`, such as zettle.com for PayPal Zettle). This caught real errors during development: another app with the same name, and a similarly named company.
- Comparison and category pages do not count, because they show several products side by side.
- Tools found by web search must have review pages that show their own web address, because a small tool's name often belongs to other products too. A name match alone gave several new tools the wrong reviews during development, so those reviews were removed. Having no rating is better than having the wrong one.
- At least 25 reviews are needed, or the tool shows "no confirmed rating".
- Languages must be named on a cited page about that product, checked page by page, so a competitor's language list cannot count. The script also reads the vendor's own language page, and `npm run research:stores` reads the Languages field of the US App Store listing (free, no API key). Only a full list turns a missing language into "not supported"; otherwise the site says "not checked".
- A tool only counts as using AI if a returned page names both the product and its AI. Each tool says what its AI does, and AI that only runs behind the scenes does not count.
- Ratings are pulled toward the catalog average by review count (a Bayesian average), and a tool with no confirmed reviews counts as the average, so a small tool is neither rewarded nor punished for being unknown.
- Where a person corrected the research (who a tool is made for, its price, what its AI does), the tool page says "Checked by a person", and every part of the score is marked Confirmed or Estimate.
- Tools found by live search are marked "Found today, not reviewed". Their website must be one the search returned, and must show a US dollar price and a privacy page, the most common reasons people rejected searched-for tools.

### Keeping the catalog fresh

```bash
npm run research
```

This re-researches any tool without data. Add `-- --force` to redo all of them (about $0.02 a tool), `-- --stale=30` to redo tools checked more than 30 days ago, or `-- --new` to look for tools launched in the last year. `.github/workflows/refresh-research.yml` runs the stale refresh every Monday and opens a pull request to review. Research can still misread a price, so a wrong one can be corrected with `priceOverride` in `src/data/seed-base.ts`, which always wins over research. Then translate what changed:

To keep the catalog focused on AI, `npm run research:ai -- --find` looks for small AI tools for every need, and `npm run research:ai -- --check` confirms what each tool's AI does. Read the new tools in `src/data/seed-discovered.json` before publishing them, because small tools have few reviews to check against.


```bash
npm run translate
```

Only missing text, or text whose English changed since it was translated, is sent. Every translated tool field stores a hash of its English, and a translation whose numbers differ from the English (such as "$16" against "$19") is rejected. Plans are matched to their translations by name. `npm run check:i18n` fails when anything is missing, out of date or has different numbers, and runs in CI (`.github/workflows/ci.yml`).

### Measuring search

`npm run check:matcher` runs a 43-question regression list through the instant matcher in CI. `npm run eval` measures need-first matching against the hand-labelled needs in `docs/eval/needs.json` (precision@5 and the "does not do the job" rate) and writes each run to `docs/eval/runs/`. See [docs/eval/README.md](docs/eval/README.md).

### Built for slow connections

- Pages are prerendered, so readable HTML arrives before any JavaScript.
- Translations stay on the server. Each page sends only the words it uses.
- The search word list downloads only when someone focuses the search box.
- Pages show no images, and there is no icon library, no animation library and no third-party scripts.
- Fonts are served from this site. Chinese uses the device's own fonts.
- Dropdowns use the browser's `<details>`, so they open before JavaScript loads.
- Automatic web search is skipped if the device asks to save data.
- Every route has a loading screen in the shape of its page. Links fetch only each page's frame ahead of time, a few KB, so a tap shows the next screen at once and the content fills in.
- With no connection, a tapped page waits and finishes loading by itself once the phone is back online, and a banner says so (`experimental.useOffline`). Visitors who say yes to saving also get copies of the pages they open, kept by `public/sw.js`, so those open offline. Saying no or deleting data removes the copies.
- On a phone the site can be added to the home screen and opens full screen like an app, with a tab bar along the bottom. `npm run app-images` redraws the home-screen icons and iPhone launch screens from the logo.

## Scaling up

The prototype has no database by design. Each piece has a clear next step, behind an interface that already exists:

| Today | When it grows |
|---|---|
| `research.json` in git, refreshed by script | A database, refreshed by a scheduled job |
| Search results cached by the CDN for 12 hours | The same, plus a shared cache so instances share results |
| Rate limits per route, visitor and server instance, reset on a cold start | Upstash Redis behind the same two functions in `ratelimit.ts` |
| Saved tools in `localStorage` | Accounts, using the same `UserData` shape |
| Static kits in `bundles.ts` | Kits built by AI from what the owner already runs |

A category search costs about $0.04 and is shared between visitors through the CDN, so cost grows with the number of categories and languages, not the number of visitors.

## Project layout

```
src/app/[lang]/        Pages, one folder per route, under a language prefix
src/app/api/           API routes: suggest, match, discover, checkup, prompts, tool
src/components/ui/     Watermelon UI components, adapted
src/components/tools/  Tool cards, results, compare, My tools
src/lib/research-core  Web research and the checks on it
src/lib/scoring        ImmigrAI score, energy estimate and compatibility
src/lib/matcher        On-device search
src/data/              Taxonomy, starter catalog, kits, research results
src/content/           Legal and long-form pages, interface text, translations
scripts/               Research and translation jobs
docs/                  UX research and the security and compliance checklists
```

Before launch, read [docs/checklists.md](docs/checklists.md). It lists what still needs a person, including rotating the API key, a legal review and native-speaker review of the translations.
