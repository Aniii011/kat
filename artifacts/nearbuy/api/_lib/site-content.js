// Single source of truth for everything an AI agent or crawler can read about
// KAT without running JavaScript: the prerendered page copy, the Markdown
// versions of those pages, the JSON-LD, and the route table used to decide
// what is a real page (200) versus an unknown path (404).
//
// Used by:
//   - api/agent.js            (serverless: negotiation, prerender, real 404s)
//   - vite.config.ts          (injects the homepage fallback + JSON-LD into index.html at build time)
//   - tests/agent.test.mjs
//
// The legal copy lives in src/content/legal/*.json and is shared with the React pages.

import privacy from "../../src/content/legal/privacy.json" with { type: "json" };
import terms from "../../src/content/legal/terms.json" with { type: "json" };
import about from "../../src/content/pages/about.json" with { type: "json" };
import contact from "../../src/content/pages/contact.json" with { type: "json" };

export const SITE_URL = "https://kat.com.ng";
export const SITE_NAME = "KAT";
export const SUPPORT_EMAIL = "support@kat.com.ng"; // keep in sync with src/lib/support.ts (tested)
export const TITLE = "KAT — Nigeria's Fashion & Lifestyle Marketplace";
export const DESCRIPTION =
  "KAT — Shop the latest fashion, beauty & lifestyle picks for Nigerian women. New drops daily.";

// ---------------------------------------------------------------------------
// Route table. Mirrors <Route path=...> in src/App.tsx; a test fails if App.tsx
// gains a route that is not classified here.
// ---------------------------------------------------------------------------

/** Public pages that get server-rendered copy + Markdown. */
export const CONTENT_PATHS = ["/", "/about", "/contact", "/privacy", "/terms"];

/** Other real SPA routes: served as the app shell with HTTP 200. */
const SPA_EXACT = new Set([
  "/thrift-drops", "/boards", "/cart", "/search", "/me", "/seller", "/checkout",
  "/order-confirmation", "/orders", "/wishlists", "/inbox", "/reviews", "/following",
  "/admin", "/reset-password", "/auth/callback", "/term",
]);
// Dynamic routes. Ids are not checked here (that would need a database lookup
// on every request), so an unknown id still gets the app shell.
const SPA_PATTERNS = [
  /^\/listing\/[^/]+$/,
  /^\/boards\/[^/]+$/,
  /^\/store\/[^/]+$/,
  /^\/shop\/[^/]+$/,
  /^\/wishlist\/[^/]+$/,
  /^\/admin\/orders\/[^/]+$/,
];

export function normalizePath(p) {
  let path = String(p || "/").split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

/** @returns {"content" | "spa" | "unknown"} */
export function classifyPath(p) {
  const path = normalizePath(p);
  if (CONTENT_PATHS.includes(path)) return "content";
  if (SPA_EXACT.has(path) || SPA_PATTERNS.some((re) => re.test(path))) return "spa";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Page copy
// ---------------------------------------------------------------------------

const VIBES = ["Old Money", "Baddie", "Boho", "90s African Aunty", "Clean Girl", "Streetwear", "Vacay", "Soft Girl"];
const CATEGORIES = [
  "Woman", "Men", "Kids", "Shoes", "Jewelry & Accessories", "Beauty & Health",
  "Gym & Outdoor", "Phone & Accessories", "Home", "Thrift", "Deals",
];

/**
 * A page is: path, title, description, h1, and blocks.
 * block = { h2?, p?: string[], ul?: string[], links?: [label, href][] }
 */
const HOME = {
  path: "/",
  title: TITLE,
  description: DESCRIPTION,
  h1: "KAT — Nigeria's Fashion & Lifestyle Marketplace",
  blocks: [
    {
      p: [
        "KAT (kat.com.ng) is an online marketplace where people in Nigeria browse and buy fashion, beauty and lifestyle products from independent sellers, including thrift and pre-loved items. New drops arrive every week, and you can save items, build wishlists and boards, and follow the stores you like.",
        "Pay securely online with Paystack and track every order from acceptance to delivery in your KAT account.",
      ],
    },
    { h2: "Shop by category", ul: CATEGORIES },
    {
      h2: "Shop by vibe",
      p: ["Not sure what you want? Browse by aesthetic instead of by item type."],
      ul: VIBES,
    },
    {
      h2: "Thrift Drops",
      p: ["Pre-loved and thrift pieces from independent sellers, released in regular drops. Browse them at https://kat.com.ng/thrift-drops."],
    },
    {
      h2: "Sell on KAT",
      p: ["Independent sellers can apply for a store, list products with photos and variants, and manage their orders from a seller dashboard inside the app."],
    },
    {
      h2: "About KAT",
      links: [
        ["About KAT", "/about"],
        ["Contact", "/contact"],
        ["Privacy Policy", "/privacy"],
        ["Terms of Service", "/terms"],
      ],
    },
  ],
};

function sectionedPage(path, data, title, description) {
  return {
    path,
    title,
    description,
    h1: data.title,
    blocks: [
      { p: [...(data.updated ? [`Last updated: ${data.updated}.`] : []), data.intro] },
      ...data.sections.map((s, i) => ({ h2: `${i + 1}. ${s.title}`, p: s.body, ul: s.bullets })),
    ],
  };
}

export const PAGES = {
  "/": HOME,
  "/about": sectionedPage("/about", about, "About KAT — Nigeria's Fashion & Lifestyle Marketplace", "What KAT is, who it is for, and how buying and selling on the marketplace works."),
  "/contact": sectionedPage("/contact", contact, "Contact KAT — Support for buyers and sellers", "How to reach KAT support about orders, payments, returns, selling and your account."),
  "/privacy": sectionedPage("/privacy", privacy, "Privacy Policy — KAT", "How KAT collects, uses and protects your personal information."),
  "/terms": sectionedPage("/terms", terms, "Terms of Service — KAT", "The terms that apply when you buy or sell on KAT."),
};

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function pageToMarkdown(page) {
  const out = [`# ${page.h1}`, ""];
  for (const b of page.blocks) {
    if (b.h2) out.push(`## ${b.h2}`, "");
    for (const p of b.p ?? []) out.push(p, "");
    if (b.ul?.length) out.push(...b.ul.map((x) => `- ${x}`), "");
    if (b.links?.length) out.push(...b.links.map(([l, h]) => `- [${l}](${SITE_URL}${h})`), "");
  }
  out.push("---", `Canonical URL: ${SITE_URL}${page.path === "/" ? "/" : page.path}`, `Agent guide: ${SITE_URL}/llms.txt`, "");
  return out.join("\n");
}

/** Semantic HTML for the pre-JS fallback (replaced when React mounts). */
export function pageToHtml(page) {
  const parts = [`<h1>${escapeHtml(page.h1)}</h1>`];
  for (const b of page.blocks) {
    if (b.h2) parts.push(`<h2>${escapeHtml(b.h2)}</h2>`);
    for (const p of b.p ?? []) parts.push(`<p>${escapeHtml(p)}</p>`);
    if (b.ul?.length) parts.push(`<ul>${b.ul.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
    if (b.links?.length)
      parts.push(`<ul>${b.links.map(([l, h]) => `<li><a href="${h}">${escapeHtml(l)}</a></li>`).join("")}</ul>`);
  }
  return `<main id="seo-fallback">${parts.join("")}</main>`;
}

export function notFoundMarkdown(path) {
  return [
    "# 404 — Page not found",
    "",
    `The path \`${path.replace(/[`\n\r]/g, "")}\` does not exist on KAT (kat.com.ng), so this response is a real HTTP 404.`,
    "",
    "Where to go instead:",
    "",
    `- Homepage: ${SITE_URL}/`,
    `- Agent guide (what KAT is and when to use it): ${SITE_URL}/llms.txt`,
    `- Sitemap of public pages: ${SITE_URL}/sitemap.xml`,
    `- Contact support: ${SUPPORT_EMAIL}`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// JSON-LD (homepage)
// ---------------------------------------------------------------------------

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon.svg`,
        description: DESCRIPTION,
        areaServed: "NG",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SUPPORT_EMAIL,
          availableLanguage: "English",
          areaServed: "NG",
        },
        // Country only: no street address has been published for KAT yet.
        address: { "@type": "PostalAddress", addressCountry: "NG" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: DESCRIPTION,
        inLanguage: "en-NG",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function jsonLdScript() {
  // "<" escaped so the JSON can never close the script tag.
  return `<script type="application/ld+json">${JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c")}</script>`;
}

/**
 * Applies a page's server-rendered bits to the built index.html shell:
 * title, description, canonical, og tags, JSON-LD (home only) and the
 * pre-JS fallback content. Works on the built shell (which contains the homepage
 * fallback) and on the source index.html (which contains the <!--SEO_CONTENT--> marker).
 */
export function applyPageToShell(html, page) {
  const url = `${SITE_URL}${page.path}`;
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(page.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(page.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  out = out.replace(/<main id="seo-fallback">[\s\S]*?<\/main>|<!--SEO_CONTENT-->/, () => pageToHtml(page));
  if (page.path !== "/") out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  return out;
}
