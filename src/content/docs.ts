/**
 * Long-form pages in plain English. scripts/translate-content.mts turns these into
 * Spanish, Chinese and Vietnamese. {contact} is replaced at render time from src/lib/site.ts.
 *
 * The legal pages describe what the code actually does today. They were written for a
 * prototype and have not been reviewed by a lawyer; have one review them before launch.
 */

import type { DocPath } from "./doc-paths";

export interface DocSection {
  /** A fixed anchor for links into the page. Never sent for translation. */
  id?: string;
  h: string;
  p?: string[];
  ul?: string[];
  /** Links shown under the section: [label, url]. Labels are translated, urls are not. */
  links?: Array<[string, string]>;
}

export interface Doc {
  title: string;
  intro: string;
  sections: DocSection[];
}

export const DOC_UPDATED = "2026-11-23";

export const DOCS = {
  methodology: {
    title: "How we calculate our scores",
    intro:
      "Most of a score comes from written rules applied to facts on public pages. Some parts are our estimates, and on some tools a person corrected what the research got wrong. This page shows the rules, where each number comes from, where people stepped in, and what we cannot measure.",
    sections: [
      {
        id: "score",
        h: "ImmigrAI score",
        p: [
          "A high star rating can hide a tool that is expensive, English-only, hard to set up or made for someone else. So the ImmigrAI score (0 to 100) blends: made for the job 25%, public reviews 20%, ease of use 20%, cost 15%, language support 10%, and connections to software owners use 10%. Energy use is not part of the score.",
          "How famous a tool is does not count. The number of reviews only decides how much a rating can move away from the average.",
        ],
        ul: [
          "Made for the job: 5 out of 5 if it is built for one kind of business, 4 if it does one job without being told how, 2.5 if it is broad business software, and 1 if it is a blank box where you have to write the instructions yourself.",
          "Reviews: each rating is pulled toward {ratingPrior}, the average of every tool we could rate, as if {priorReviews} reviews at that average were added to it. A rating from thousands of reviews barely moves. A tool with no confirmed reviews counts as exactly {ratingPrior}, so being small or new neither helps nor hurts it.",
          "Ease of use is our estimate, based on setup time, whether it has a phone app, and whether you can sign up without talking to a salesperson.",
          "Cost comes from the lowest monthly price that lets you actually use the tool. Tools with no monthly fee but a charge on each sale score a little lower than fully free tools, and tools where you set your own ad budget score lower still, because the real cost is harder to predict.",
          "Language support counts the languages most spoken by immigrant owners, such as Spanish, Chinese, Vietnamese, Korean, Tagalog, Arabic, Haitian Creole, Portuguese, Russian, French and Hindi. Four or more earns full marks. A long list of other languages earns nothing extra.",
          "Connections count only software small businesses really run, such as QuickBooks, Square, Toast, Google Calendar or WhatsApp. Three or more earns full marks. A long list of other connections earns nothing extra.",
        ],
      },
      {
        id: "confirmed",
        h: "Confirmed or estimated",
        p: ["On each tool's page, every part of the score is marked Confirmed or Estimate, so you can see which numbers to trust and which to check yourself."],
        ul: [
          "Confirmed: we read it on a public page, such as a price on the company's pricing page, a star rating on a review site, a full language list or a named connection, or a person checked it.",
          "Estimate: made for the job and ease of use come from an AI model reading the tool's own pages, unless a person checked them. Together they are {guessShare}% of the score.",
          "Language support is an estimate when we found no full language list, and cost is an estimate when we could not find the price on a page.",
        ],
      },
      {
        id: "people",
        h: "Where a person changed the result",
        p: [
          "Automatic research makes mistakes. For example, a page that mentions restaurants does not make a product a restaurant product. A person corrected these by hand: who the tool is made for on {checkedFocus} tools, the price on {checkedPrice} tools, and what the AI does on {checkedAi} tools. Each of those tools says so on its page.",
          "These are accuracy fixes, not favors. No tool pays to be listed or ranked, and a correction can lower a score as easily as raise it.",
          "On the {uncheckedFocus} tools where no person checked who the tool is made for, about {guessShare}% of the score comes from the AI model's reading of the tool's pages rather than from a confirmed fact.",
        ],
      },
      {
        id: "languages",
        h: "Works in your language, not supported, or not checked",
        ul: [
          "Works in Spanish: a page about this tool names Spanish.",
          "Spanish: not supported: we read the tool's full language list, from its own language page or its Apple App Store listing, and Spanish is not on it.",
          "Spanish: not checked: we have not found a full list. This is common for small tools, and the tool may still work in Spanish, so ask the company.",
          "A page only counts if it is about this tool. A page that compares several tools cannot add a language to this one.",
          "Google Play listings do not show languages, so only the App Store is read.",
        ],
      },
      {
        h: "What counts as an AI tool",
        p: ["ImmigrAI focuses on AI tools, including small and new ones. We check public pages about each tool and label it. When sorted by best overall, tools built around AI come first, then normal software with AI features, then general tools you have to write prompts for, then tools with no AI."],
        ul: [
          "AI tool: AI does the product's main job, such as answering calls or writing posts.",
          "Has AI features: normal software with AI you can actually use, and we say what it does.",
          "General tool: a blank box or all-purpose app, such as a chatbot or a design app, where you have to work out what to ask. We list these last among AI tools.",
          "No AI: no AI you can use. AI that only runs behind the scenes, such as fraud screening, does not count. These are listed separately, and include free guides and advisors that are useful anyway.",
          "Small and new tools often have few public reviews. We show that clearly, so try them before you pay.",
        ],
      },
      {
        h: "How we check plans, setup steps and rules",
        ul: [
          "A plan only appears if its price is on a page the search returned, and we prefer the company's own pricing page. If we cannot confirm the plans, the page says so.",
          "Setup steps only appear if they came from a page on the company's own site.",
          "A rule, such as how to cancel or whether your data is used to train AI, only appears if the exact words are on a page we read. If we cannot find it, the page says it is not stated, so ask before you pay.",
        ],
      },
      {
        h: "How we check reviews",
        p: ["We do not write or host reviews. We search public review sites, and a rating only counts if it passes these checks:"],
        ul: [
          "The rating must appear in the search engine's result for the exact page we link to. We do not open the page ourselves, so the page may show a newer number. Check it before you rely on it.",
          "The page must be on an independent site: Capterra, G2, Trustpilot, the Apple App Store, Google Play, GetApp, Software Advice or TrustRadius. A company's own testimonials never count.",
          "The page must be about this product alone, so comparison and category pages do not count. For Apple we only accept the US store, and an App Store link with no country opens the US store, so it counts. For Trustpilot the reviewed web address must match the company's, or another address the company uses, such as zettle.com for PayPal Zettle.",
          "Small tools often share a name with another product. For tools we find by searching the web, the review page must also show the tool's own web address. If it does not, we show no rating. No rating is better than the wrong one.",
          "There must be at least 25 reviews in total. Fewer than that, and we show no rating.",
          "Sites with more reviews count more, on a logarithmic scale, so no single site decides the result.",
        ],
      },
      {
        h: "What we leave out",
        ul: [
          "Tools rated below 3.5 out of 5, once enough reviews confirm it.",
          "Tools that start above $150 per month.",
          "Immigration enforcement apps found by web search. That list only holds nonprofit resources we checked, because a fake or unsafe app could put people at risk.",
          "Nonprofit and government resources get no star rating at all, because review sites do not measure them fairly. Some reviews of a government agency are about loans, not about its free guide.",
        ],
      },
      {
        h: "How we check whether tools work together",
        ul: [
          "Connects directly: one tool's own pages name the other as an integration.",
          "Connects through another product: both tools work with a shared connector, such as Zapier or QuickBooks. This may take a little setup.",
          "Not connected: we found no link between them. They still run on the same kind of device, so you can use each one on its own, but you may need to type some information twice.",
          "Does not connect: nothing in common that we could confirm.",
        ],
        p: ["A kit's fit score is the average across every pair of tools in it. If a link exists but we could not confirm it, we report the lower level."],
      },
      {
        id: "live",
        h: "Limits of live search",
        p: [
          "Prices, ratings and features change, and an AI model reading the web can misread a page. Our checks catch many errors but not all of them. Always confirm the price and terms on the tool's own website before you pay.",
          "Tools found by a live search are marked 'Found today, not reviewed', because no person has looked at them. Before one is shown, its website must be one the search really returned, and the site must show a price in US dollars and a privacy policy. Those were the most common reasons people turned down tools that search found.",
        ],
      },
      {
        id: "report",
        h: "Report a mistake",
        p: ["If something on a tool's page is wrong, use 'Report a mistake' on that page. It opens an email with the page filled in.", "{contact}"],
      },
      {
        id: "energy",
        h: "Energy use (estimate)",
        p: [
          "Each tool's page has a rough estimate of the electricity it uses, closed by default. It is not part of the score and does not change the order of results. We show it because we think the energy AI uses should be visible to the people paying for it.",
          "Almost no company publishes these figures for its own product. So we place each tool in a class based on the kind of AI it runs, and every tool in a class gets the same estimate. Low means 0.1 watt-hours or less per task, Medium means under 1, and High means 1 or more.",
          "For scale, a home refrigerator uses about 1,000 to 2,000 watt-hours a day. A busy salon whose AI answers 600 calls a month would use about 1,800 watt-hours a month, about what a refrigerator uses in a day or two.",
        ],
      },
      {
        h: "Where the energy figures come from",
        ul: [
          "A typical chatbot reply: about 0.3 Wh. Google reported 0.24 Wh for a median Gemini text prompt in August 2025, and OpenAI's chief executive stated about 0.34 Wh for an average ChatGPT prompt, without explaining the method.",
          "An image: about 0.63 Wh, from MIT Technology Review's May 2025 figure for Stable Diffusion 3 Medium, including cooling and other overhead.",
          "Our own assumptions, with no published source: 0.5 Wh for one voice clip, 3 Wh for a full AI phone call (about eight model replies plus speech), and the lower figures for tools with no AI or small background AI.",
          "Water is estimated at 1.08 milliliters per watt-hour, from Google's published figures of 0.26 mL for a 0.24 Wh prompt.",
          "Carbon is estimated at 0.4 grams per watt-hour, the US grid average for 2024 as used by MIT Technology Review. Many tools run on cleaner power than this, but they rarely publish enough to confirm it.",
        ],
        links: [
          ["Google's paper on Gemini's footprint", "https://arxiv.org/abs/2508.15734"],
          ["MIT Technology Review methodology", "https://www.technologyreview.com/2025/05/20/1116331/ai-energy-demand-methodology/"],
        ],
      },
      {
        h: "What the energy estimate cannot tell you",
        ul: [
          "It does not include the energy used to train a model, or to make the phones and computers you use.",
          "Two tools in the same class can differ a lot. A company's real figures could be better or worse than ours.",
          "Published figures vary widely and companies report them differently, so treat the estimate as a rough guide.",
        ],
      },
    ],
  },

  "free-help": {
    title: "Free help from real people",
    intro:
      "Software is only part of the answer. These programs offer free or low-cost help from a person, and many have advisors who speak other languages.",
    sections: [
      {
        h: "Important: SBA loan rules changed in 2026",
        p: [
          "Since March 1, 2026, the SBA's 7(a) and 504 loan programs require every owner of the business to be a U.S. citizen or U.S. national. News reports say the rule was extended to microloans and surety bonds on April 1, 2026. Green card holders and other non-citizen owners are not eligible for these loans, even if they own a small share.",
          "This can change. Ask a counselor or a lawyer about your own situation, and check the SBA's current rules before you apply.",
        ],
        links: [["News report from CBS", "https://www.cbsnews.com/news/sba-loan-rule-change-permanent-residents/"]],
      },
      {
        id: "free-legal-tax",
        h: "Free legal, tax and labor help",
        p: [
          "AI tools for contracts, taxes, payroll and HR are not lawyers, accountants or tax preparers, and no professional has checked them. Before you sign, send or file something important, ask a person. These programs are free for people who qualify.",
        ],
        ul: [
          "Legal aid: nonprofit offices that help with leases, contracts, official letters and other legal problems, for people with lower incomes.",
          "IRS Volunteer Income Tax Assistance (VITA): IRS-certified volunteers who prepare tax returns for free for people with lower incomes. Some simple self-employment returns are included, so ask what they can do before you go.",
          "Low Income Taxpayer Clinics: free or low-cost help if you have a dispute with the IRS.",
          "U.S. Department of Labor, Wage and Hour Division: free answers about minimum wage, overtime, breaks and hiring rules, in many languages.",
        ],
        links: [
          ["Find free legal aid near you (LawHelp.org)", "https://www.lawhelp.org"],
          ["Find free tax help (IRS VITA)", "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers"],
          ["Low Income Taxpayer Clinics", "https://www.taxpayeradvocate.irs.gov/about-us/low-income-taxpayer-clinics-litc/"],
          ["Department of Labor, Wage and Hour Division", "https://www.dol.gov/agencies/whd"],
        ],
      },
      {
        h: "Free business advice",
        p: ["These SBA-supported programs offer free counseling. Call your local office and ask if they have an advisor in your language, and whether you qualify."],
        ul: [
          "SCORE: free mentoring from experienced business owners, in person or by video.",
          "Small Business Development Centers: free advice on planning, money and marketing, often at a local college.",
          "Women's Business Centers: training and advice, with a focus on women owners.",
        ],
        links: [
          ["Find SBA help near you", "https://www.sba.gov/local-assistance"],
          ["SCORE", "https://www.score.org"],
          ["Small Business Development Centers", "https://americassbdc.org"],
          ["Women's Business Centers", "https://www.sba.gov/local-assistance/resource-partners/womens-business-centers"],
        ],
      },
      {
        h: "Other places to look for funding",
        p: [
          "Community Development Financial Institutions, called CDFIs, are lenders that serve communities banks often miss. Their rules are their own, so ask each one directly what it requires. We do not give financial advice, and this is not a recommendation of any lender.",
        ],
        links: [["About CDFIs", "https://www.cdfifund.gov/programs-training/certification/cdfi"]],
      },
      {
        h: "Getting started paperwork",
        p: ["An Employer Identification Number (EIN) from the IRS is free. You should never have to pay a company to get one, although some will offer to charge you for it."],
        links: [["Apply for an EIN at IRS.gov", "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"]],
      },
      {
        h: "Know your rights",
        p: [
          "If you are worried about immigration enforcement at your business, these nonprofit groups publish free guides in many languages. This is general information, not legal advice. Talk to an immigration lawyer about your situation.",
        ],
        links: [
          ["Red Cards from the Immigrant Legal Resource Center", "https://www.ilrc.org/red-cards"],
          ["National Immigration Law Center", "https://www.nilc.org"],
        ],
      },
    ],
  },

  about: {
    title: "About ImmigrAI",
    intro: "ImmigrAI helps immigrant-run main street businesses find AI tools that are affordable, easy to use and available in their language.",
    sections: [
      {
        h: "Who we are",
        p: [
          "ImmigrAI is a prototype, not yet a registered company. It was built to answer one question: how can a small business owner with limited time, money and English find the right AI tools?",
          "{contact}",
        ],
      },
      {
        h: "How this is paid for",
        p: [
          "ImmigrAI is free to use. We do not sell tools, charge fees, run ads or take commissions, and no tool pays to be listed or ranked. The order of results comes only from the scores described on our methodology page.",
        ],
      },
      {
        h: "Why we show energy use",
        p: [
          "AI runs in data centers that use electricity and water. We think the people paying for a tool should be able to see that, so each tool's page has a rough estimate of its energy use. This is a choice about our values, not a ranking: it does not change a tool's score or its place in the results.",
        ],
      },
      {
        h: "What this site is not",
        p: [
          "We are not lawyers, accountants or financial advisors. Nothing here is legal, tax, immigration or financial advice. Some text is written by AI and translated by machine, so please confirm anything important.",
        ],
      },
      {
        h: "Fonts, images and software",
        ul: [
          "Text is set in Inter, under the SIL Open Font License 1.1. The font files are served from this site, not from Google.",
          "There are no stock photos. Icons and the logo were drawn for this site.",
          "Interface components are adapted from Watermelon UI and built on Base UI (MIT).",
          "Software: Next.js, React, Tailwind CSS and Zod (all MIT).",
          "No analytics, advertising or tracking software is included.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    intro: "Short version: we have no accounts, no tracking and no database of visitors. What you save stays on your own device.",
    sections: [
      {
        h: "What we do not collect",
        p: [
          "We do not ask for your personal name, email, phone number, home address, Social Security number or immigration status. We do not use analytics, advertising or tracking tools. We do not sell or share personal data, because we do not keep any.",
        ],
      },
      {
        h: "What stays on your device",
        p: ["If you say yes on our banner, your browser's local storage keeps the tools you saved, your ratings and notes, what you pay for them and when, the kind of business you run, your team size, the software you already use, and your language. We do not keep a copy of any of this. Details only leave your device for the searches described below. You can download it or delete it at any time. Your browser also keeps copies of the pages you open, so ImmigrAI still opens with a weak connection or none. The copies hold only our public pages, never what you type or save."],
      },
      {
        h: "What passes through our servers",
        ul: [
          "Search text. When you type a longer question, it is sent to our server and on to OpenRouter, which passes it to an AI model that matches it to a category. When we look for tools for one specific need, OpenRouter also sends search words based on your question to Exa, a web search engine. Please do not type private details such as names, Social Security numbers or immigration status.",
          "Your words travel inside the request, not in the page address, so they do not appear in your browser history or in the addresses our host logs. The one exception: if you type only one or two words that we cannot match to a category, such as a product's name, they become part of the page address.",
          "Business details. When you run a business checkup or search for one specific need, the business name, city, website, kind of business, team size and the software you use are sent to our server and on to OpenRouter and Exa, so an AI model and a search engine can look for reviews and match tools to you. The checkup form sends them inside the request, never in the page address. Please do not add the names of customers or employees.",
          "Your business's website. If you give us a website or we find one, our server reads that public page to look for things such as online booking. We do not keep a copy.",
          "Prompt help. When you ask us to write prompts, the problem you described and your kind of business are sent to our server and on to OpenRouter.",
          "We do not write what you type to a database. Our server may hold a search result in temporary memory for up to a day, so the same search does not cost again. We ask OpenRouter to use only AI providers that do not keep or train on it, and we rely on those companies to honor that.",
          "Category searches, such as 'payroll tools', contain no personal details, and the results may be shared with other visitors to save cost.",
          "Internet address. To limit abuse, we keep a scrambled version of your internet address in temporary memory for a few minutes. Our hosting company, Vercel, may also keep standard server logs for a short time.",
        ],
      },
      {
        h: "Companies involved",
        ul: [
          "Vercel hosts this website and runs our server, so every visit passes through Vercel. It may keep standard server logs, such as internet addresses and page addresses, for a short time.",
          "OpenRouter connects us to AI models. The AI model company may process the text of your search and the business details described above.",
          "Exa is the web search engine OpenRouter uses for us. It receives search words based on what you typed, and a business's name and city during a checkup. Exa's own privacy policy applies to those searches.",
          "When you click a link to a tool, you leave our site. That company's own privacy policy applies.",
        ],
      },
      {
        h: "Emails",
        p: ["We do not send emails and have no mailing list. If we ever add one, you would have to choose to join, and every email would include an unsubscribe link."],
      },
      {
        h: "Children",
        p: ["This site is for adults running businesses. It is not meant for anyone under 18. We do not knowingly collect information from children. A parent who believes a child has saved information here can delete it using our data deletion page on that device."],
      },
      {
        h: "Your choices and rights",
        p: [
          "Because we keep no personal data about you on our servers, there is nothing for us to look up, correct or delete under laws such as the California Consumer Privacy Act or the GDPR. You control the data on your device through the My tools page and the data deletion page.",
          "You can still ask us a question, make a request under those laws, or ask what Vercel, OpenRouter or Exa may hold. Write to the address below, and we will reply and help you contact those companies.",
          "{contact}",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of service",
    intro: "By using ImmigrAI you agree to these terms. They are written to be read.",
    sections: [
      {
        h: "What ImmigrAI is",
        p: ["ImmigrAI is a free guide to third-party software. It is a prototype, so features may change or stop working. We do not provide, sell or support the tools we list."],
      },
      {
        h: "Who can use it",
        p: ["You must be 18 or older to use this site. It is meant for adults running or starting a business."],
      },
      {
        h: "Not professional advice",
        p: ["Nothing on this site is legal, tax, immigration or financial advice. Pages about rights, permits, taxes and loans are general information and can be out of date. Talk to a qualified professional about your own situation."],
      },
      {
        h: "Information can be wrong",
        p: ["Prices, ratings, languages and features come from automated web research and can be wrong or out of date. Energy-use figures are estimates. Some text is written or translated by AI. Confirm anything important on the tool's own website before you pay or rely on it."],
      },
      {
        h: "Other companies' tools",
        p: ["When you use a tool listed here, your agreement is with that company. Read its terms, especially about contracts, automatic renewals and cancellations. We are not responsible for their products, charges or conduct."],
      },
      {
        h: "Fair use",
        p: ["Please do not misuse this site: no attacks, no attempts to get around rate limits, and no bulk automated copying. Do not use our AI search to send anything illegal or harmful."],
      },
      {
        h: "No warranty and limited liability",
        p: ["This site is provided as it is, without guarantees. To the extent the law allows, we are not liable for losses that come from using it or from relying on its information."],
      },
      {
        h: "Changes",
        p: ["We may update these terms. The date at the top of this page shows the latest version. Which state's law governs these terms will be set before this prototype launches publicly.", "{contact}"],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    intro: "We do not set any cookies. We store things in your browser only if you say yes.",
    sections: [
      {
        h: "Cookies",
        p: ["ImmigrAI does not set cookies. Your language is part of the page address, so no cookie is needed to remember it. There are no advertising or analytics cookies, and no third-party scripts. Our fonts come from this site, so Google receives no request when you visit."],
      },
      {
        h: "Local storage",
        p: ["Local storage is a small space in your browser. If you say yes on our banner, we use two entries:"],
        ul: [
          "immigrai:consent remembers your choice on the banner.",
          "immigrai:v1 holds your saved tools, ratings, notes, what you pay for them and when, the kind of business you run, your team size, the software you already use and your language.",
        ],
      },
      {
        h: "Offline copies",
        p: ["If you say yes, we also keep a copy of each page you open, and the files it needs, in your browser's cache storage. This lets ImmigrAI open with a weak connection or none. The copies hold only our public pages, never what you type or save. Saying no later, or deleting your data, removes them."],
      },
      {
        h: "If you say no",
        p: ["The site still works. Your list lasts until you close the page, and nothing about it is kept. Your choice is the one thing we remember, so the banner does not keep asking."],
      },
      {
        h: "Changing your mind",
        p: ["Choose 'Privacy choices' at the bottom of any page. You can also clear your browser data or use the data deletion page."],
      },
    ],
  },

  accessibility: {
    title: "Accessibility",
    intro: "We want this site to work for everyone, including people who use a keyboard, a screen reader, an older phone or a slow connection.",
    sections: [
      {
        h: "What we aim for",
        p: ["We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2, level AA. We have tested parts of the site ourselves, but it has not had an independent audit, and it has not been tested with a wide group of people with disabilities."],
      },
      {
        h: "What we have built in",
        ul: [
          "Everything works with a keyboard, with a visible focus ring and a 'skip to main content' link.",
          "Text has strong contrast against its background, and color is never the only signal.",
          "Buttons and links are large enough to tap easily.",
          "Pages have clear headings and labels for screen readers.",
          "Nothing flashes. The only thing that moves on its own is a soft shimmer on gray shapes while a page loads, and it stays still if your device is set to reduce motion.",
          "The interface is available in English, Spanish, Chinese and Vietnamese.",
        ],
      },
      {
        h: "Known limits",
        ul: [
          "Translations were made by machine and have not all been reviewed by native speakers.",
          "Language lists and text on other companies' websites are outside our control.",
        ],
      },
      {
        h: "Tell us about a problem",
        p: ["If something is hard to use, please tell us what page you were on and what happened.", "{contact}"],
      },
    ],
  },

  "data-deletion": {
    title: "Delete my data",
    intro: "Everything you save on ImmigrAI is on this device. You can remove it yourself right now.",
    sections: [
      {
        h: "What gets deleted",
        p: ["This removes your saved tools, ratings, notes, what you pay for them and when, your business details, the software you already use, your language, your banner choice and the offline copies of our pages from this browser. It cannot be undone. If you use ImmigrAI on another device, delete it there too."],
      },
      {
        h: "What we hold on our servers",
        p: ["We have no accounts and no database of visitors, so there is nothing to delete on our side and no need to send us a request. Temporary abuse-prevention data disappears by itself within minutes. Server logs kept by our hosting company expire on their schedule, and we cannot link them to you.", "{contact}"],
      },
    ],
  },
} satisfies Record<DocPath, Doc>;

export type DocKey = keyof typeof DOCS;
export const DOC_KEYS = Object.keys(DOCS) as DocKey[];
