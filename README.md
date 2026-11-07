# ImmigrAI

*Making AI Accessible to Every Entrepreneur.*
*Your Guide to AI for Small Businesses.*

An "Angie's List" of AI tools for immigrant-run main street businesses. An owner describes what they need in their own words, in any language, and gets affordable, easy tools with verified ratings, full language lists, environmental estimates and a check of how the tools work together.

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

- A rating must appear in the text of the exact page cited, on an independent review site, on a page naming that product.
- The Apple App Store must be the US store, and a Trustpilot page's domain must match the vendor's. This caught real errors during development: another app with the same name, and a similarly named company.
- At least 25 reviews are needed, or the tool shows "no confirmed rating".
- Languages must be named on a cited page. The script also reads the vendor's own language page for the full list.
- A tool's Environmental Impact score is calculated from the kind of AI it runs, using the published figures on `/methodology`, not a number a model made up.

### Keeping the catalog fresh

```bash
npm run research
```

This re-researches any tool without data. Add `-- --force` to redo all of them (about $1.30 for 56 tools), or `-- --new` to look for tools launched this year. Research can still misread a price, so a wrong one can be corrected with `priceOverride` in `src/data/seed-base.ts`, which always wins over research. Then translate what changed:

```bash
npm run translate
```

### Built for slow connections

- Pages are prerendered, so readable HTML arrives before any JavaScript.
- Translations stay on the server. Each page sends only the words it uses.
- The search word list downloads only when someone focuses the search box.
- There are no images, no icon library, no animation library and no third-party scripts.
- Fonts are served from this site. Chinese uses the device's own fonts.
- Dropdowns use the browser's `<details>`, so they open before JavaScript loads.
- Automatic web search is skipped if the device asks to save data.

## Scaling up

The prototype has no database by design. Each piece has a clear next step, behind an interface that already exists:

| Today | When it grows |
|---|---|
| `research.json` in git, refreshed by script | A database, refreshed by a scheduled job |
| Search results cached by the CDN for 12 hours | The same, plus a shared cache so instances share results |
| Rate limits per server instance | Upstash Redis behind the same two functions in `ratelimit.ts` |
| Saved tools in `localStorage` | Accounts, using the same `UserData` shape |
| Static kits in `bundles.ts` | Kits built by AI from what the owner already runs |

A category search costs about $0.04 and is shared between visitors through the CDN, so cost grows with the number of categories and languages, not the number of visitors.

## Project layout

```
src/app/[lang]/        Pages, one folder per route, under a language prefix
src/app/api/           Three API routes: suggest, discover, tool
src/components/ui/     Watermelon UI components, adapted
src/components/tools/  Tool cards, results, compare, My tools
src/lib/research-core  Web research and the checks on it
src/lib/scoring        Environmental, ImmigrAI and compatibility scoring
src/lib/matcher        On-device search
src/data/              Taxonomy, starter catalog, kits, research results
src/content/           Legal and long-form pages, interface text, translations
scripts/               Research and translation jobs
docs/                  UX research and the security and compliance checklists
```

Before launch, read [docs/checklists.md](docs/checklists.md). It lists what still needs a person, including rotating the API key, a legal review and native-speaker review of the translations.
