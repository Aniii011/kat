import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PAGES, SITE_URL, applyPageToShell, classifyPath, normalizePath,
  notFoundMarkdown, pageToMarkdown,
} from "./_lib/site-content.js";

// One entry point for every page path that is not a static file (vercel.json
// rewrites "/:path*" here). It decides:
//   - real public pages (/, /about, /contact, /privacy, /terms):
//       Accept: text/markdown  -> Markdown (Content-Type: text/markdown, Vary: Accept)
//       otherwise              -> the app shell with that page's copy prerendered
//   - other real SPA routes     -> the app shell, HTTP 200 (unchanged behaviour)
//   - anything else             -> HTTP 404 (Markdown body for agents, app shell for browsers
//                                  so the normal "not found" screen still renders)

/** True when the client prefers text/markdown over text/html (q-values respected). */
export function wantsMarkdown(accept) {
  if (!accept) return false;
  let md = -1, html = -1;
  for (const part of String(accept).split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const quality = q ? Number(q.slice(2)) : 1;
    if (Number.isNaN(quality)) continue;
    if (type === "text/markdown") md = Math.max(md, quality);
    else if (type === "text/html" || type === "application/xhtml+xml") html = Math.max(html, quality);
  }
  return md > 0 && md >= html;
}

async function loadShell(req) {
  try {
    return await readFile(path.join(process.cwd(), "dist/public/app-shell.html"), "utf8");
  } catch {
    // Fallback: fetch the deployed static file (it is served before rewrites run).
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await fetch(`${proto}://${host}/app-shell.html`);
    if (!r.ok) throw new Error(`app-shell.html fetch failed: ${r.status}`);
    return r.text();
  }
}

function send(res, status, type, body, extra = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("Vary", "Accept");
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.end(body);
}

export function resolveRequestPath(req) {
  const url = new URL(req.url, "http://localhost");
  return normalizePath(url.searchParams.get("p") ?? url.pathname);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return send(res, 405, "text/plain; charset=utf-8", "Method not allowed");
  }

  const reqPath = resolveRequestPath(req);
  const kind = classifyPath(reqPath);
  const markdown = wantsMarkdown(req.headers.accept);
  const cache = { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" };
  const body = (b) => (req.method === "HEAD" ? "" : b);

  try {
    if (kind === "content") {
      const page = PAGES[reqPath];
      if (markdown) {
        return send(res, 200, "text/markdown; charset=utf-8", body(pageToMarkdown(page)), {
          ...cache,
          "Content-Location": `${SITE_URL}${page.path}`,
        });
      }
      return send(res, 200, "text/html; charset=utf-8", body(applyPageToShell(await loadShell(req), page)), cache);
    }

    if (kind === "spa") {
      if (markdown) {
        return send(
          res, 200, "text/markdown; charset=utf-8",
          body(`# KAT\n\nThis page is an interactive part of the KAT app and has no Markdown version. Public pages: ${SITE_URL}/ , ${SITE_URL}/about , ${SITE_URL}/contact . Agent guide: ${SITE_URL}/llms.txt\n`),
          cache,
        );
      }
      return send(res, 200, "text/html; charset=utf-8", body(await loadShell(req)), cache);
    }

    // Unknown path: real 404.
    const nf = { "Cache-Control": "public, max-age=0, s-maxage=60", "X-Robots-Tag": "noindex" };
    if (markdown) {
      return send(res, 404, "text/markdown; charset=utf-8", body(notFoundMarkdown(reqPath)), nf);
    }
    // Browsers still get the app shell so the existing in-app not-found screen renders.
    return send(res, 404, "text/html; charset=utf-8", body(await loadShell(req)), nf);
  } catch (err) {
    console.error("[agent] failed:", err);
    return send(res, 500, "text/plain; charset=utf-8", "Internal error");
  }
}
