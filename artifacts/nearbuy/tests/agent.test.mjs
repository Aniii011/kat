import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import handler, { wantsMarkdown, resolveRequestPath } from "../api/agent.js";
import {
  PAGES, CONTENT_PATHS, classifyPath, pageToMarkdown, pageToHtml, homeJsonLd, jsonLdScript,
  applyPageToShell, SUPPORT_EMAIL, SITE_URL,
} from "../api/_lib/site-content.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const SHELL = applyPageToShell(
  read("index.html").replace("<!--SEO_CONTENT-->", pageToHtml(PAGES["/"])).replace("<!--SEO_JSONLD-->", jsonLdScript()),
  PAGES["/"],
);
const textLen = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

// Calls the real handler with a fake req/res and a shell file served from memory.
async function call(urlPath, { accept, method = "GET" } = {}) {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, text: async () => SHELL });
  const headers = {};
  let body = "";
  const res = {
    statusCode: 0,
    setHeader: (k, v) => (headers[k.toLowerCase()] = v),
    end: (b) => (body = b),
  };
  const p = urlPath === "/" ? "/" : urlPath;
  const req = { method, url: `/api/agent?p=${encodeURIComponent(p)}`, headers: { host: "kat.com.ng", ...(accept ? { accept } : {}) } };
  const cwd = process.cwd();
  process.chdir(path.join(root, "tests")); // no dist/ here -> exercises the fetch fallback
  try { await handler(req, res); } finally { process.chdir(cwd); globalThis.fetch = origFetch; }
  return { status: res.statusCode, headers, body };
}

test("support email constant matches the app's SUPPORT_EMAIL", () => {
  assert.match(read("src/lib/support.ts"), new RegExp(`SUPPORT_EMAIL = "${SUPPORT_EMAIL}"`));
});

test("every <Route> in App.tsx is classified (no route drifts into a 404)", () => {
  const paths = [...read("src/App.tsx").matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(paths.length > 20);
  for (const p of paths) {
    const concrete = p.replace(/:[A-Za-z]+/g, "abc123");
    assert.notEqual(classifyPath(concrete), "unknown", `${p} would 404`);
  }
});

test("classifyPath", () => {
  assert.equal(classifyPath("/"), "content");
  assert.equal(classifyPath("/about/"), "content");
  assert.equal(classifyPath("/listing/42"), "spa");
  assert.equal(classifyPath("/thrift-drops"), "spa");
  assert.equal(classifyPath("/nope"), "unknown");
  assert.equal(classifyPath("/wp-admin/setup.php"), "unknown");
  assert.equal(classifyPath("/listing"), "unknown");
  assert.equal(classifyPath("/listing/a/b"), "unknown");
});

test("wantsMarkdown honours q-values and defaults to HTML", () => {
  assert.equal(wantsMarkdown("text/markdown"), true);
  assert.equal(wantsMarkdown("text/markdown, text/html;q=0.5"), true);
  assert.equal(wantsMarkdown("text/html"), false);
  assert.equal(wantsMarkdown("text/html,application/xhtml+xml,*/*;q=0.8"), false);
  assert.equal(wantsMarkdown("*/*"), false);
  assert.equal(wantsMarkdown("text/markdown;q=0"), false);
  assert.equal(wantsMarkdown(undefined), false);
});

test("resolveRequestPath reads ?p= and normalises", () => {
  assert.equal(resolveRequestPath({ url: "/api/agent?p=/about/" }), "/about");
  assert.equal(resolveRequestPath({ url: "/api/agent?p=/" }), "/");
});

test("unknown path: real 404, Markdown body for agents with Content-Type and pointers", async () => {
  const r = await call("/some-path-that-does-not-exist", { accept: "text/markdown" });
  assert.equal(r.status, 404);
  assert.match(r.headers["content-type"], /^text\/markdown/);
  assert.ok(r.body.length > 20);
  assert.match(r.body, /llms\.txt/);
  assert.match(r.body, /sitemap\.xml/);
  assert.match(r.headers.vary, /Accept/);
});

test("unknown path: browsers get 404 with the app shell (in-app not-found still renders)", async () => {
  const r = await call("/some-path-that-does-not-exist", { accept: "text/html" });
  assert.equal(r.status, 404);
  assert.match(r.headers["content-type"], /^text\/html/);
  assert.match(r.body, /<div id="root">/);
});

test("unknown path markdown body cannot be injected through the path", async () => {
  const r = await call("/x`\n# injected", { accept: "text/markdown" });
  assert.equal(r.status, 404);
  assert.ok(!r.body.includes("\n# injected"));
});

test("real SPA routes still return 200 with the shell", async () => {
  for (const p of ["/thrift-drops", "/listing/abc", "/store/xyz", "/cart", "/admin/orders/9"]) {
    const r = await call(p, { accept: "text/html" });
    assert.equal(r.status, 200, p);
    assert.match(r.body, /<div id="root">/);
  }
});

test("homepage: Accept: text/markdown -> Markdown with Vary: Accept", async () => {
  const r = await call("/", { accept: "text/markdown" });
  assert.equal(r.status, 200);
  assert.match(r.headers["content-type"], /^text\/markdown/);
  assert.match(r.headers.vary, /\bAccept\b/);
  assert.ok(r.body.startsWith("# "));
  assert.ok(r.body.length > 500);
  assert.ok(!/<html|<div/i.test(r.body));
});

test("homepage: Accept: text/html -> HTML (and no Accept -> HTML)", async () => {
  for (const accept of ["text/html", undefined]) {
    const r = await call("/", { accept });
    assert.equal(r.status, 200);
    assert.match(r.headers["content-type"], /^text\/html/);
    assert.match(r.headers.vary, /\bAccept\b/);
    assert.match(r.body, /<html lang="en">/);
  }
});

test("HEAD returns headers and no body", async () => {
  const r = await call("/", { accept: "text/markdown", method: "HEAD" });
  assert.equal(r.status, 200);
  assert.equal(r.body, "");
});

test("non-GET methods are rejected", async () => {
  const r = await call("/", { method: "POST" });
  assert.equal(r.status, 405);
});

test("raw homepage HTML has >=500 chars of text, one H1, sequential headings", () => {
  assert.ok(textLen(SHELL.split("<body>")[1]) >= 500, `only ${textLen(SHELL.split("<body>")[1])} chars`);
  assert.equal((SHELL.match(/<h1[ >]/g) || []).length, 1);
  const levels = [...SHELL.matchAll(/<h([1-6])[ >]/g)].map((m) => +m[1]);
  levels.forEach((l, i) => assert.ok(i === 0 || l <= levels[i - 1] + 1, "heading levels skip"));
});

test("trust pages (/about /contact /privacy /terms) have >=500 chars in raw HTML", async () => {
  for (const p of ["/about", "/contact", "/privacy", "/terms"]) {
    const r = await call(p, { accept: "text/html" });
    assert.equal(r.status, 200, p);
    assert.ok(textLen(r.body.split("<body>")[1]) >= 500, `${p} too short`);
    assert.match(r.body, new RegExp(`<link rel="canonical" href="${SITE_URL}${p}"`));
    assert.ok(!r.body.includes("application/ld+json"), `${p} must not repeat homepage JSON-LD`);
    const md = await call(p, { accept: "text/markdown" });
    assert.ok(md.body.length >= 500 && md.headers["content-type"].startsWith("text/markdown"));
  }
});

test("Markdown/HTML renderers escape content", () => {
  const html = pageToHtml({ path: "/x", h1: "<b>", blocks: [{ p: ['"><script>alert(1)</script>'] }] });
  assert.ok(!html.includes("<script>"));
  assert.ok(!jsonLdScript().slice(8).includes("</script><"));
});

test("homepage JSON-LD: Organization with contactPoint + PostalAddress, WebSite, parses", () => {
  const m = SHELL.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, "JSON-LD missing from raw HTML");
  const data = JSON.parse(m[1]);
  const org = data["@graph"].find((n) => n["@type"] === "Organization");
  assert.equal(org.name, "KAT");
  assert.equal(org.url, "https://kat.com.ng/");
  assert.ok(org.description);
  assert.equal(org.contactPoint["@type"], "ContactPoint");
  assert.equal(org.contactPoint.email, SUPPORT_EMAIL);
  assert.ok(org.contactPoint.contactType);
  assert.equal(org.address["@type"], "PostalAddress");
  assert.ok(org.address.addressCountry);
  assert.ok(data["@graph"].some((n) => n["@type"] === "WebSite"));
  assert.deepEqual(homeJsonLd()["@graph"][0].name, "KAT");
});

test("metadata: canonical, html lang, og:image, og:type on the homepage", () => {
  assert.match(SHELL, /<link rel="canonical" href="https:\/\/kat\.com\.ng\/"/);
  assert.match(SHELL, /<html lang="en"/);
  assert.match(SHELL, /<meta property="og:image" content="https:\/\/kat\.com\.ng\/opengraph\.jpg"/);
  assert.match(SHELL, /<meta property="og:type" content="website"/);
  assert.ok(existsSync(path.join(root, "public/opengraph.jpg")));
});

test("llms.txt has a 'when to use' section, how-to-call guidance and only real URLs", () => {
  const t = read("public/llms.txt");
  assert.match(t, /^# KAT/m);
  assert.match(t, /^## When to use KAT/m);
  assert.match(t, /^## How an agent should call KAT/m);
  for (const raw of t.match(/https:\/\/kat\.com\.ng\/[A-Za-z0-9\-_./<>]*/g)) {
    const u = raw.replace(/[.,;:)]+$/, "");
    const p = u.replace("https://kat.com.ng", "") || "/";
    if (/<|>/.test(u) || p.endsWith("/") && p !== "/") continue;
    if (p === "/sitemap.xml" || p === "/llms.txt") continue;
    assert.notEqual(classifyPath(p.replace(/\/$/, "") || "/"), "unknown", `llms.txt links to ${u}`);
  }
});

test("robots.txt does not block the trust pages or llms.txt", () => {
  const r = read("public/robots.txt");
  for (const p of ["/about", "/contact", "/privacy", "/terms", "/llms.txt"]) assert.ok(!new RegExp(`Disallow: ${p}\\b`).test(r), p);
});

test("vercel.json routes page requests through the agent handler and keeps api/ excluded", () => {
  const v = JSON.parse(read("vercel.json"));
  assert.equal(v.rewrites.length, 1);
  assert.match(v.rewrites[0].source, /\(\?!api\//);
  assert.match(v.rewrites[0].destination, /^\/api\/agent\?p=/);
  assert.match(v.functions["api/agent.js"].includeFiles, /dist\/public\/app-shell\.html/);
});

test("pageToMarkdown covers every content path", () => {
  for (const p of CONTENT_PATHS) assert.ok(pageToMarkdown(PAGES[p]).length > 300, p);
});

test("build renames index.html so \"/\" reaches the handler instead of a static file", () => {
  assert.match(JSON.parse(read("package.json")).scripts.build, /finalize-shell\.mjs$/);
  assert.match(read("scripts/finalize-shell.mjs"), /app-shell\.html/);
  assert.match(read("api/agent.js"), /dist\/public\/app-shell\.html/);
  assert.ok(!/dist\/public\/index\.html/.test(read("api/agent.js")));
});
