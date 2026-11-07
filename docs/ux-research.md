# UX research: how comparable products help people choose

## Method and a limit

The brief asked for 10 to 15 examples from Mobbin. **Mobbin could not be used**: its connector requires a paid plan, and its website returned a 403 to our browser. We did not try to get around either.

Instead we looked directly at the live products below on 2026-11-06, using an in-app browser at desktop width. Capterra showed a bot check and was skipped. NYT Wirecutter is blocked in the tool. This is a review of first screens and page structure, not a usability study, and no business owners were interviewed. If a Mobbin subscription becomes available, or you can test with real owners, both are worth doing.

## What we looked at

| Product | Screen | What we took from it | What we avoided |
|---|---|---|---|
| Angi (home) | Search over a photo, row of service shortcuts | One question as the page's main job, with the need categories right below | Forcing a ZIP code before anything else |
| Angi (category) | "Get matched" form | Direct, plain page titles | No list until you enter a location |
| Thumbtack (home) | "Describe your project or problem" | Invites a sentence rather than a keyword, which is what our search accepts | Heavy full-screen photo |
| Thumbtack (category) | ZIP form, then breadcrumbs and a plain explanation | Breadcrumbs and a one-line explanation of each category | Location gate |
| Yelp | Compact search and category row, cookie banner | Search stays reachable from the header | Banner's three competing buttons, with two filled and one not |
| GOV.UK Business | Very plain page, cookie choice | Plain headings, strong contrast. Accept and Reject look the same and carry equal weight, which we copied | |
| NerdWallet | Filter and sort above the list, count of results, fixed facts per card | "Showing 9 of 9", visible sort, the same fact rows on every card (Starting at, rating) | Dense promotional content near the top |
| Shopify App Store | Grid: name, rating with count, "Free plan available", one line | Rating always shown with its count. Price signal on the first line | Tiny text, sponsored placements |
| Square App Marketplace | Spinner for several seconds | | A blank page until JavaScript loads, which would fail on a slow connection |
| Product Hunt | Sign-in prompt, scrolling ticker | | Moving elements and vague categories such as "Productivity" |
| There's An AI For That | Dark, very dense, sponsored top slot | | Everything we would not put in front of a first-time user |
| SBA.gov | Plain top menu (Loans, Counseling), large stock photo | Direct menu labels | Photo weight on the first screen |
| Wise | Store ratings with the store name and count, language picker in the header | Naming the source of a rating. Language always visible at the top | |

## Patterns we applied

1. **Ask one question first.** Every marketplace leads with a single prompt. Ours is "What does your business need help with?", and it accepts a full sentence in any language.
2. **Name problems, not products.** Categories read as needs ("Answer Calls"), not technology ("AI receptionist").
3. **Never gate results.** Angi and Thumbtack ask for a location first. We show results immediately with no location and no account.
4. **Same facts, same order, on every card.** NerdWallet and Shopify show that fixed rows make scanning possible. Our order is cost, rating, language, footprint, connections.
5. **A rating needs its source.** Shopify and Wise always show the count, and Wise names the store. We go further and link each site's rating.
6. **Filter and sort stay visible, with a count.** Results always say how many of how many.
7. **Equal-weight consent.** GOV.UK shows that Accept and Reject can carry the same weight. Ours do.
8. **Render without waiting.** Square's spinner is the failure to avoid. Our pages are prerendered HTML that reads correctly before any JavaScript runs.
9. **Language in the header, in its own script.** Someone who cannot read English must still be able to find "Español" or "中文".

## Needs of the owner this design assumes

These are assumptions from the brief and should be tested with real owners: limited time, limited English, mostly on a phone, sometimes on a poor connection, wary of contracts and surprise fees, and cautious about giving personal details.
