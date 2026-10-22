#!/usr/bin/env node
// Runs after `vite build`. Renames dist/public/index.html to app-shell.html.
//
// Why: Vercel serves static files before rewrites, so a built index.html would
// answer "/" directly and the homepage could never negotiate Markdown or carry
// per-request headers. Without index.html, "/" falls through to the rewrite in
// vercel.json and is handled by api/agent.js, which reads app-shell.html.
import { renameSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "public");
const from = resolve(dir, "index.html");
const to = resolve(dir, "app-shell.html");
if (!existsSync(from)) {
  console.error(`[finalize-shell] ${from} not found - did vite build run?`);
  process.exit(1);
}
renameSync(from, to);
console.log("[finalize-shell] index.html -> app-shell.html");
