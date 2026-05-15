# Dripp

Nigeria's favourite fashion, beauty & lifestyle marketplace — a mobile-first marketplace app for Nigerian women to shop and slay.

## Run & Operate

- `pnpm --filter @workspace/nearbuy run dev` — run the Dripp frontend (port auto-assigned via $PORT)
- `pnpm --filter @workspace/nearbuy run typecheck` — typecheck the frontend
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase credentials (injected via Vite `define`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS v4, shadcn/ui, Wouter routing
- Data: Supabase JS client (with static fallback in `src/data/listings.ts`)
- Animations: framer-motion (available)
- Icons: lucide-react

## Where things live

```
artifacts/nearbuy/
├── src/
│   ├── data/listings.ts          ← Static data model + 19 Nigerian fashion products
│   ├── hooks/use-listings.ts     ← Supabase data fetching (falls back to static)
│   ├── context/theme-context.tsx ← 6-theme system (light/dark/pink/blue/beige/luxury)
│   ├── pages/
│   │   ├── home.tsx              ← Main shop page (hero, categories, vibe filter, grid)
│   │   ├── listing-detail.tsx    ← Product detail (fashion context, thrift flow)
│   │   └── thrift-drops.tsx      ← Dedicated thrift drops page
│   ├── components/
│   │   ├── ai-assistant.tsx      ← Floating AI stylist chat (client-side, no API)
│   │   └── theme-switcher.tsx    ← 6-theme dropdown switcher
│   └── index.css                 ← All CSS theme variable definitions
├── supabase-setup.sql            ← DB schema + Nigerian fashion seed data
└── App.tsx                       ← Root with ThemeProvider + routes
```

## Architecture decisions

- **Static-first with Supabase upgrade path**: `src/data/listings.ts` is the source of truth for dev and demo. All hooks (`use-listings.ts`) try Supabase first and fall back to static data if tables don't exist (handles the 400 error gracefully).
- **6-theme system**: Applied via CSS class on `document.documentElement`. No theme = light, `dark` = dark mode, `theme-pink/blue/beige/black-luxury` for fashion themes. All colours defined as CSS custom properties.
- **Client-side AI assistant**: The floating stylist uses keyword regex matching against static product data. Zero API cost, zero latency, works offline.
- **Currency**: All prices in Nigerian Naira (₦) formatted via `toLocaleString("en-NG")`.
- **Thrift drops**: Separate section with deposit system. Items have `isThrift: true` and `depositAmount`. Deposit dialog flow handled client-side.

## Product

- **Home**: Sticky nav, announcement bar, scrollable category pills, "Shop by Vibe" aesthetic filters, hero banner, responsive product grid (2–5 cols), Thrift Drops preview, trust badges footer
- **Listing Detail**: Image gallery, seller profile + follower count, aesthetic badges, ₦ pricing, colour/size selectors, quantity picker, Add to Bag + Buy Now, deposit flow for thrift items, reviews, related products
- **Thrift Drops**: Dedicated page explaining the deposit model, 3-step guide, thrift item grid, deposit confirmation dialog
- **AI Stylist**: Floating chat button (bottom-right), slide-up panel, quick-reply chips, keyword-based outfit suggestions with product links
- **Theme Switcher**: Dropdown with 6 themes (Light, Dark, Pink, Blue, Beige, Black Luxury), persisted in localStorage

## User preferences

- Brand name: **Dripp** (lowercase, stylised as `dripp.`)
- Currency: Nigerian Naira (₦)
- Target audience: Nigerian women, fashion-forward, mobile-first
- Keep the static data fallback — don't require Supabase for the app to work

## Gotchas

- Supabase 400 errors are expected when tables don't exist — the app uses `staticListings` as fallback. Do NOT show error UI if `fallback` is available.
- Theme classes go on `document.documentElement` (`<html>`), not `<body>`.
- All Supabase env vars are injected at build time by Vite's `define` config in `vite.config.ts` — they use `VITE_` prefix.
- Run `supabase-setup.sql` in Supabase SQL Editor to create tables and seed Nigerian fashion data.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
