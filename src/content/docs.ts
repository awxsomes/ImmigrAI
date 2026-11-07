/**
 * Long-form pages in plain English. scripts/translate-content.mts turns these into
 * Spanish, Chinese and Vietnamese. {contact} is replaced at render time from src/lib/site.ts.
 *
 * The legal pages describe what the code actually does today. They were written for a
 * prototype and have not been reviewed by a lawyer; have one review them before launch.
 */

import type { DocPath } from "./doc-paths";

export interface DocSection {
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

export const DOC_UPDATED = "2026-11-06";

export const DOCS = {
  methodology: {
    title: "How we calculate our scores",
    intro:
      "Every score on this site follows a written rule. This page shows the rules, where the numbers come from, and what we cannot measure.",
    sections: [
      {
        h: "Environmental Impact score",
        p: [
          "The score runs from 0 to 100, based on how much electricity, water and computing power a tool uses for one task. Higher means a lighter footprint.",
          "Four parts make up the score: Energy (30%), measured in watt-hours per task. Water (20%), measured in milliliters per task. Carbon (20%), measured in grams of CO2 equivalent per task. Computational efficiency (30%), based on the tokens processed, the model size and the computing resources needed.",
          "This is an estimate, not a measurement. Almost no company publishes these numbers for its own product. So we place each tool in a class based on the kind of AI it runs, and every tool in a class gets the same estimate. The table below shows each class.",
        ],
      },
      {
        h: "Turning the estimate into a score",
        ul: [
          "Energy, water and carbon use a logarithmic scale. A task using 0.01 watt-hours or less scores 100, and 10 watt-hours or more scores 0, because AI tasks differ by hundreds of times.",
          "Water is estimated at 1.08 milliliters per watt-hour, from Google's published figures of 0.26 mL for a 0.24 Wh prompt.",
          "Carbon is estimated at 0.4 grams per watt-hour, the US grid average for 2024 as used by MIT Technology Review. Many tools run on cleaner power than this, but they rarely publish enough to confirm it.",
          "Computational efficiency is set for each class, from 98 for no AI model down to 18 for AI that runs throughout a phone call.",
        ],
      },
      {
        h: "Where the figures come from",
        ul: [
          "A typical chatbot reply: about 0.3 Wh. Google reported 0.24 Wh for a median Gemini text prompt in August 2025, and OpenAI's chief executive stated about 0.34 Wh for an average ChatGPT prompt, without explaining the method.",
          "An image: about 0.63 Wh, from MIT Technology Review's May 2025 figure for Stable Diffusion 3 Medium, including cooling and other overhead.",
          "Our own assumptions, with no published source: 0.5 Wh for one voice clip, 3 Wh for a full AI phone call (about eight model replies plus speech), and the lower figures for tools with no AI or small background AI.",
        ],
        links: [
          ["Google's paper on Gemini's footprint", "https://arxiv.org/abs/2508.15734"],
          ["MIT Technology Review methodology", "https://www.technologyreview.com/2025/05/20/1116331/ai-energy-demand-methodology/"],
        ],
      },
      {
        h: "What this score cannot tell you",
        ul: [
          "It does not include the energy used to train a model, or to make the phones and computers you use.",
          "Two tools in the same class can differ a lot. A company's real figures could be better or worse than ours.",
          "Published figures vary widely and companies report them differently, so treat the score as a rough guide for comparing tools.",
        ],
      },
      {
        h: "ImmigrAI score",
        p: [
          "A high star rating can hide a tool that is expensive, English-only or hard to set up. So the ImmigrAI score (0 to 100) blends: reviews 35%, ease of use 20%, cost 15%, language support 15%, connections to other tools 10%, and environmental impact 5%.",
          "If we cannot confirm a tool's reviews, we leave reviews out and score the rest. We never fill the gap with an invented number, and the tool's page says so.",
        ],
        ul: [
          "Ease of use is our estimate, based on setup time, whether it has a phone app, and whether you can sign up without talking to a salesperson.",
          "Cost comes from the lowest monthly price that lets you actually use the tool. Tools with no monthly fee but a charge on each sale score a little lower than fully free tools, and tools where you set your own ad budget score lower still, because the real cost is harder to predict.",
          "Language support comes from how many languages we could confirm.",
          "Connections come from how many other products we could confirm it works with.",
        ],
      },
      {
        h: "How we check reviews",
        p: ["We do not write or host reviews. We search public review sites, and a rating only counts if it passes these checks:"],
        ul: [
          "The rating must appear in the text of the exact page we link to.",
          "The page must be on an independent site: Capterra, G2, Trustpilot, the Apple App Store, Google Play, GetApp, Software Advice or TrustRadius. A company's own testimonials never count.",
          "The page must be about this product. For Apple we only accept the US store, and for Trustpilot the reviewed web address must match the company's.",
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
          "Works side by side: no link we could confirm, but both run on the same kind of device. You may need to type some information twice.",
          "Does not connect: nothing in common that we could confirm.",
        ],
        p: ["A kit's fit score is the average across every pair of tools in it. If a link exists but we could not confirm it, we report the lower level."],
      },
      {
        h: "Limits of live search",
        p: [
          "Prices, ratings and features change, and an AI model reading the web can misread a page. Our checks catch many errors but not all of them. Always confirm the price and terms on the tool's own website before you pay.",
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
        h: "What this site is not",
        p: [
          "We are not lawyers, accountants or financial advisors. Nothing here is legal, tax, immigration or financial advice. Some text is written by AI and translated by machine, so please confirm anything important.",
        ],
      },
      {
        h: "Fonts, images and software",
        ul: [
          "Text is set in Lexend, under the SIL Open Font License 1.1. The font files are served from this site, not from Google.",
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
          "We do not ask for your name, email, phone number, address, Social Security number or immigration status. We do not use analytics, advertising or tracking tools. We do not sell or share personal data, because we do not keep any.",
        ],
      },
      {
        h: "What stays on your device",
        p: ["If you say yes on our banner, your browser's local storage keeps the tools you saved, your ratings and notes, the tools you already use, and your language. This data stays on your device and is never sent to us. You can download it or delete it at any time."],
      },
      {
        h: "What passes through our servers",
        ul: [
          "Search text. When you type a longer question, it is sent to our server and on to OpenRouter, which passes it to an AI model that matches it to a category. Please do not type private details such as names, Social Security numbers or immigration status.",
          "If we cannot match your words to a category, they become part of the page address, which can appear in your browser history and in server logs.",
          "We do not store what you type. We ask OpenRouter to use only AI providers that do not keep or train on it, and we rely on those companies to honor that.",
          "Category searches, such as 'payroll tools', contain no personal details, and the results may be shared with other visitors to save cost.",
          "Internet address. To limit abuse, we keep a scrambled version of your internet address in temporary memory for a few minutes. Our hosting company, Vercel, may also keep standard server logs for a short time.",
        ],
      },
      {
        h: "Companies involved",
        ul: [
          "Vercel hosts this website.",
          "OpenRouter connects us to AI models. The AI model company may process the text of your search.",
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
        p: ["You must be 18 or older, or use this site with a parent or guardian's permission. It is meant for people running or starting a business."],
      },
      {
        h: "Not professional advice",
        p: ["Nothing on this site is legal, tax, immigration or financial advice. Pages about rights, permits, taxes and loans are general information and can be out of date. Talk to a qualified professional about your own situation."],
      },
      {
        h: "Information can be wrong",
        p: ["Prices, ratings, languages and features come from automated web research and can be wrong or out of date. Environmental scores are estimates. Some text is written or translated by AI. Confirm anything important on the tool's own website before you pay or rely on it."],
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

  refunds: {
    title: "Refund policy",
    intro: "ImmigrAI is free. We never ask for payment, so there is nothing to refund.",
    sections: [
      {
        h: "No fees from us",
        p: ["There are no subscriptions, hidden fees or paid upgrades on this site. If anyone asks you to pay ImmigrAI, it is not us."],
      },
      {
        h: "Refunds for tools you buy",
        p: ["If you pay for a tool listed here, you are paying that company, and its refund policy applies. We cannot issue refunds or cancel plans for you."],
        ul: [
          "Before you pay, look for the contract length, renewal date and cancellation steps.",
          "If you start a free trial, set a reminder for the day before it ends.",
          "If you are charged after you cancel, contact the company first and keep the record. Your bank or card company may be able to help you dispute the charge.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    intro: "We do not set any cookies. We use your browser's local storage only if you say yes.",
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
          "immigrai:v1 holds your saved tools, ratings, notes, the tools you already use and your language.",
        ],
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
          "Nothing flashes or moves on its own.",
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
        p: ["This removes your saved tools, ratings, notes, the tools you already use, your language and your banner choice from this browser. It cannot be undone. If you use ImmigrAI on another device, delete it there too."],
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
