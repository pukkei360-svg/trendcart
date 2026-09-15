# 🔥 TrendCart

> **Discover What's Trending. Find What's Worth Buying.**

TrendCart is a product-discovery and affiliate-shopping platform that surfaces trending products, best sellers, deals, hidden gems and viral picks — monetized through Amazon Associates outbound links. The north-star KPI is **outbound click-through rate (CTR)** on "Check Price" buttons.

This repository contains the full Phase 1 MVP (plus selected Phase 2 features): public storefront, search, editorial reviews, articles, admin dashboard and affiliate click tracking.

## ✨ Features

### Storefront
- **Home** — hero + Trending Now, categories, Best Sellers (Today / This Week / This Month tabs), Today's Deals, Hidden Gems 💎, Viral picks, trending articles and a Trending Score transparency explainer
- **Product pages** — Why We Like It, Pros & Cons, Verdict, Who It's For / Who Should Skip, alternatives, price + rating, and the affiliate "Check Price on Amazon" call-to-action
- **Search** — full-text product search with category / price / rating / discount / badge filters and multiple sort keys
- **Editorial articles** — long-form buying guides with embedded product cards
- **SPA navigation** — client-side routing with full URL sync (deep links, back/forward)

### Trending Score system
A proprietary 0–100 score computed from **publicly available signals only** (rating, review volume and growth, discount momentum, recency). Levels: 🔥 Exploding · 🚀 Rising Fast · 📈 Trending · ⭐ Popular · 💎 Hidden Gem. TrendCart never claims to know private Amazon sales data — rankings are labelled "TrendCart Popularity Ranking".

### Admin dashboard
- KPI overview: outbound clicks, CTR, views, product/category counts
- Full product CRUD (scores, editorial content, deals, badges, featured)
- Category CRUD and site settings (site name, affiliate tag, disclosure text)
- Reachable at `/?view=admin` or via the **Admin** link in the site footer

### SEO & compliance
- Product JSON-LD, Open Graph + Twitter cards, dynamic `sitemap.xml` and `robots.txt`
- Affiliate disclosure in the footer and on every product page
- Outbound links carry `rel="sponsored nofollow noopener noreferrer"` + associate tag
- Price-accuracy notices ("prices subject to change") per Amazon Associates program rules

## 🛠 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite |
| Auth | scrypt password hashing + HMAC-signed bearer tokens |

## 🚀 Quick start

Prerequisites: [Bun](https://bun.sh) 1.1+ (or Node 20+; the lockfile is `bun.lock`).

```bash
git clone https://github.com/pukkei360-svg/trendcart.git
cd trendcart
bun install

# configure environment
cp .env.example .env     # edit DATABASE_URL + set a strong ADMIN_SECRET

# create + seed the database (32 demo products, 8 categories, 3 articles)
bun run db:push
bun prisma/seed.ts

bun run dev              # → http://localhost:3000
```

Production build: `bun run build` then `bun run start`.

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite path, e.g. `file:../db/custom.db` (relative paths resolve from `prisma/schema.prisma`) |
| `ADMIN_SECRET` | Secret used to sign admin session tokens — generate with `openssl rand -hex 32` |

## 🔐 Admin access (demo credentials)

- URL: `http://localhost:3000/?view=admin` (or the Admin link in the footer)
- Username: `admin` · Password: `trendcart2026`

> ⚠️ **These are demo seed credentials.** Before any public deployment, change them in `prisma/seed.ts` (then re-seed) or update the `AdminUser` table directly.

## 💰 Amazon Associates setup

1. Join the [Amazon Associates program](https://affiliate-program.amazon.com/) and get your tracking ID
2. Sign in to the admin dashboard → **Settings** → set **Amazon affiliate tag** (the seeded default `trendcart-20` is a placeholder — replace it with your own)
3. Outbound links are automatically tagged and click events recorded for the CTR dashboard

## 📁 Project structure

```
prisma/                  # schema + seed (demo products, articles, settings, admin)
  └── seed-data/         # typed seed content
scripts/
  ├── images/            # image URL manifests used by the seeder
  ├── fetch-images.py    # resumable image-fetch tooling
  └── fetch-images.sh
src/
  ├── app/
  │   ├── api/           # products, categories, articles, click tracking, admin APIs
  │   ├── page.tsx       # TrendCart entry
  │   ├── sitemap.ts / robots.ts
  │   └── layout.tsx     # metadata + fonts
  ├── components/
  │   ├── trendcart/     # the app: router, header/footer, cards and views
  │   │                  #   (home, product, search, reviews, articles, admin)
  │   └── ui/            # shadcn/ui primitives
  └── lib/               # db, auth, affiliate tagging, serializers, types
```

## ⚠️ Demo data notice

All products, ratings, prices and reviews in the seed data are **illustrative demo content**. Before launching publicly, replace them with real, verified product data via the admin dashboard — and keep the compliance guardrails: no fabricated ratings, no misleading claims, disclosure always visible.

## 🗺 Roadmap

- **Phase 2** — automated product import pipeline, price history, product comparison
- **Phase 3** — AI shopping assistant, price alerts, wishlists, personalization
