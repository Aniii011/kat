#!/usr/bin/env node
// Generates public/sitemap.xml from the live Supabase catalog before the
// Vite production build runs, so the output ships as a plain static file
// (no SSR, no new framework).
//
// Scope (Phase 1 — see project notes):
//   included: "/", "/thrift-drops", published "/listing/:id",
//             public "/store/:sellerId" (sellers with a published product)
//   excluded: everything private/authenticated/transactional/admin,
//             "/search" (dynamic, not a stable content URL),
//             "/shop/:storeId" (undecided duplicate route),
//             "/boards" and "/boards/:id" (localStorage-only, not real
//             public/persistent data — see src/hooks/use-boards.ts)
//
// Uses the same anon-key Supabase client config the app already ships
// with (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). No service-role key.
//
// Fails the build loudly on any Supabase error rather than writing an
// empty or stale sitemap.xml.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://kat.com.ng";
const OUTPUT_PATH = resolve(__dirname, "..", "public", "sitemap.xml");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[generate-sitemap] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in the build environment.\n" +
      "[generate-sitemap] Refusing to write an empty or stale sitemap.xml — failing the build instead.\n" +
      "[generate-sitemap] Set both variables in the Vercel project's build environment (same values already used for the client build)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const urls = new Set();

  // Static, always-public routes.
  urls.add(`${SITE_URL}/`);
  urls.add(`${SITE_URL}/thrift-drops`);

  // Published (non-draft) products.
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, seller_id")
    .neq("status", "draft");

  if (productsError) {
    console.error("[generate-sitemap] Failed to query products:", productsError.message);
    process.exit(1);
  }

  const sellerIds = new Set();
  for (const p of products ?? []) {
    if (p.id) urls.add(`${SITE_URL}/listing/${encodeURIComponent(p.id)}`);
    if (p.seller_id) sellerIds.add(p.seller_id);
  }

  // Public seller storefronts: any seller with at least one published
  // product, and only if their profile row still exists (avoid dead links).
  if (sellerIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .in("id", Array.from(sellerIds));

    if (profilesError) {
      console.error("[generate-sitemap] Failed to query profiles:", profilesError.message);
      process.exit(1);
    }

    for (const profile of profiles ?? []) {
      urls.add(`${SITE_URL}/store/${encodeURIComponent(profile.id)}`);
    }
  }

  const urlList = Array.from(urls);

  const body = urlList
    .map((loc) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`[generate-sitemap] Wrote ${urlList.length} URLs to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[generate-sitemap] Unexpected error:", err);
  process.exit(1);
});
