import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Sitemap — PRD §19.
 * The site is a single-page app (all views served from /), so canonical URLs
 * use view parameters. Product and article slugs are enumerated for crawlers.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || 'https://trendcart.example.com'

  const staticViews: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/?view=trending`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/?view=best-sellers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/?view=deals`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/?view=hidden-gems`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/?view=viral`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/?view=categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/?view=reviews`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  try {
    const [products, categories, articles] = await Promise.all([
      db.product.findMany({
        where: { status: 'active' },
        select: { slug: true, updatedAt: true },
      }),
      db.category.findMany({ select: { slug: true } }),
      db.article.findMany({ where: { published: true }, select: { slug: true, createdAt: true } }),
    ])

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/?view=product&slug=${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/?view=category&slug=${encodeURIComponent(c.slug)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${base}/?view=article&slug=${encodeURIComponent(a.slug)}`,
      lastModified: a.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticViews, ...categoryEntries, ...productEntries, ...articleEntries]
  } catch {
    return staticViews
  }
}
