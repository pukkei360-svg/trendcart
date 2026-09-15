import type { Prisma } from '@prisma/client'

/** Shared admin product payload parser (create + update). */
export function parseProductPayload(body: Record<string, unknown>): {
  data: Prisma.ProductUncheckedCreateInput
  errors: string[]
} {
  const errors: string[] = []

  const name = String(body.name || '').trim()
  if (!name) errors.push('Name is required')

  let slug = String(body.slug || '').trim().toLowerCase()
  if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!/^[a-z0-9-]+$/.test(slug)) errors.push('Slug may only contain lowercase letters, numbers and hyphens')

  const price = Number(body.price)
  if (!Number.isFinite(price) || price < 0) errors.push('Price must be a positive number')

  const oldPriceRaw = Number(body.oldPrice)
  const oldPrice = Number.isFinite(oldPriceRaw) && oldPriceRaw > 0 ? oldPriceRaw : null
  const discount = oldPrice && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0

  const rating = Math.min(Math.max(Number(body.rating) || 0, 0), 5)
  const reviewCount = Math.max(Math.round(Number(body.reviewCount) || 0), 0)
  const trendingScore = Math.min(Math.max(Math.round(Number(body.trendingScore) || 0), 0), 100)
  const popularityScore = Math.min(Math.max(Math.round(Number(body.popularityScore) || 0), 0), 100)
  const categoryId = Number(body.categoryId)
  if (!Number.isFinite(categoryId) || categoryId <= 0) errors.push('Category is required')

  const amazonUrl = String(body.amazonUrl || '').trim()
  if (!/^https?:\/\//i.test(amazonUrl)) errors.push('A valid Amazon URL is required')

  const image = String(body.image || '').trim()
  if (!/^https?:\/\//i.test(image)) errors.push('A valid image URL is required')

  const toList = (value: unknown): string =>
    JSON.stringify(
      Array.isArray(value)
        ? value.map((v) => String(v).trim()).filter(Boolean)
        : String(value || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
    )

  const badge = ['exploding', 'rising', 'trending', 'popular', 'hidden-gem'].includes(String(body.badge))
    ? String(body.badge)
    : 'trending'
  const dealLabelRaw = String(body.dealLabel || '').trim()
  const dealLabel = ['Huge Discount', 'Great Deal', 'Limited Deal', 'Price Drop'].includes(dealLabelRaw)
    ? dealLabelRaw
    : null
  const isDeal = Boolean(body.isDeal)
  const viralLabelRaw = String(body.viralLabel || '').trim()
  const viralLabel = ['Viral', 'Rising', "Everyone's Watching", 'Fast Growing'].includes(viralLabelRaw)
    ? viralLabelRaw
    : null

  const data: Prisma.ProductUncheckedCreateInput = {
    name,
    slug,
    shortDescription: String(body.shortDescription || '').trim(),
    description: String(body.description || '').trim(),
    categoryId,
    image,
    amazonUrl,
    price,
    oldPrice,
    discount: Math.max(discount, 0),
    rating,
    reviewCount,
    trendingScore,
    popularityScore,
    trendingReason: String(body.trendingReason || '').trim(),
    badge,
    viralLabel,
    whyWeLikeItJson: toList(body.whyWeLikeIt),
    prosJson: toList(body.pros),
    consJson: toList(body.cons),
    verdict: String(body.verdict || '').trim(),
    whoItsFor: String(body.whoItsFor || '').trim(),
    whoShouldSkip: String(body.whoShouldSkip || '').trim(),
    isDeal,
    dealLabel: isDeal ? dealLabel : null,
    isFeatured: Boolean(body.isFeatured),
    status: body.status === 'draft' ? 'draft' : 'active',
  }

  return { data, errors }
}
