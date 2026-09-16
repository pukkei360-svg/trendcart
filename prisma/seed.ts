/**
 * TrendCart database seeder — REAL products edition.
 * - Reads image URLs from scripts/images/real/<key>.json (fetched via image-search)
 * - Products + Amazon URLs from seed-data/products-real.ts (built by scripts/build-real-seed.py
 *   from live Amazon US data: prices, ratings, review counts)
 * - Clears and repopulates categories, products, articles, settings, admin
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { hashPassword } from '../src/lib/auth'
import { productsReal, AMZ_URLS } from './seed-data/products-real'

const db = new PrismaClient()

const IMAGES_DIR = '/home/z/my-project/scripts/images/real'

function imageFor(key: string, index: number): string {
  const path = join(IMAGES_DIR, `${key}.json`)
  if (!existsSync(path)) {
    throw new Error(`Missing image manifest: ${path}`)
  }
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  const results = data?.results || []
  if (results.length === 0) throw new Error(`No images for key "${key}"`)
  const pick = results[Math.min(index, results.length - 1)]
  return pick.original_url
}

function amazonUrlFor(key: string): string {
  const url = AMZ_URLS[key]
  if (!url) throw new Error(`Missing Amazon URL for product key "${key}"`)
  return url
}

async function main() {
  console.log('Seeding TrendCart database...')

  const products = productsReal
  const { categories, articles } = await import('./seed-data/content')

  // ---- Reset (respecting FK order) ----
  await db.clickEvent.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.article.deleteMany()
  await db.setting.deleteMany()
  await db.adminUser.deleteMany()

  // ---- Categories ----
  const categoryMap = new Map<string, number>()
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    const created = await db.category.create({
      data: { name: c.name, slug: c.slug, icon: c.icon, description: c.description, sortOrder: i },
    })
    categoryMap.set(c.slug, created.id)
  }
  console.log(`Created ${categories.length} categories`)

  // ---- Products ----
  let dealCount = 0
  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug)
    if (!categoryId) throw new Error(`Unknown category "${p.categorySlug}" for ${p.slug}`)

    const discount =
      p.oldPrice && p.price > 0 ? Math.round((1 - p.price / p.oldPrice) * 100) : 0

    await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId,
        image: imageFor(p.imageKey, p.imageIndex),
        amazonUrl: amazonUrlFor(p.imageKey),
        price: p.price,
        oldPrice: p.oldPrice,
        discount,
        rating: p.rating,
        reviewCount: p.reviewCount,
        trendingScore: p.trendingScore,
        popularityScore: p.popularityScore,
        trendingReason: p.trendingReason,
        badge: p.badge,
        viralLabel: p.viralLabel,
        whyWeLikeItJson: JSON.stringify(p.whyWeLikeIt),
        prosJson: JSON.stringify(p.pros),
        consJson: JSON.stringify(p.cons),
        verdict: p.verdict,
        whoItsFor: p.whoItsFor,
        whoShouldSkip: p.whoShouldSkip,
        isDeal: p.isDeal,
        dealLabel: p.isDeal ? p.dealLabel : null,
        isFeatured: p.isFeatured,
        status: 'active',
        // Seed plausible engagement metrics so the admin KPI dashboard is meaningful
        views: Math.round(p.popularityScore * (12 + (p.trendingScore % 9)) + p.reviewCount / 40),
        clicks: 0,
      },
    })
    if (p.isDeal) dealCount++
  }
  console.log(`Created ${products.length} products (${dealCount} active deals)`)

  // Seed a small click history so the admin dashboard has data on first login
  const seededClickSources = ['product-page', 'trending-card', 'deal-card', 'search-result']
  const topProducts = await db.product.findMany({
    orderBy: { views: 'desc' },
    take: 12,
    select: { id: true, views: true },
  })
  let seededClicks = 0
  for (const prod of topProducts) {
    const clicks = Math.round(prod.views * (0.04 + (prod.id % 5) * 0.012))
    if (clicks <= 0) continue
    await db.product.update({ where: { id: prod.id }, data: { clicks } })
    const events = Array.from({ length: Math.min(clicks, 6) }, (_, i) => ({
      productId: prod.id,
      source: seededClickSources[(prod.id + i) % seededClickSources.length],
    }))
    await db.clickEvent.createMany({ data: events })
    seededClicks += clicks
  }
  console.log(`Seeded ${seededClicks} outbound clicks across top products`)

  // ---- Articles ----
  for (const a of articles) {
    await db.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        coverImage: imageFor(a.coverImageKey, a.coverImageIndex),
        contentJson: JSON.stringify(a.sections),
        published: true,
      },
    })
  }
  console.log(`Created ${articles.length} articles`)

  // ---- Settings ----
  const settings: Array<[string, string]> = [
    ['site_name', 'TrendCart'],
    ['tagline', 'Discover What\u2019s Trending. Find What\u2019s Worth Buying.'],
    [
      'amazon_affiliate_tag',
      'wigwise-20',
    ],
    [
      'affiliate_disclosure',
      'Affiliate Disclosure: TrendCart may earn a commission when you purchase through links on this site, at no additional cost to you. As an Amazon Associate, TrendCart earns from qualifying purchases. Prices and availability are accurate as of the date/time indicated and are subject to change.',
    ],
  ]
  for (const [key, value] of settings) {
    await db.setting.create({ data: { key, value } })
  }
  console.log(`Created ${settings.length} settings`)

  // ---- Admin user ----
  await db.adminUser.create({
    data: {
      username: 'admin',
      passwordHash: hashPassword('trendcart2026'),
    },
  })
  console.log('Created admin user (admin / trendcart2026)')

  console.log('Seed complete.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
