import type { Prisma } from '@prisma/client'
import { buildAffiliateUrl } from '@/lib/affiliate'
import type { Badge, DealLabel, ProductDTO, ProductFullDTO } from '@/lib/types'

type ProductRow = Prisma.ProductGetPayload<{ include: { category: true } }>

function parseList(json: string): string[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

/** Compact serializer used in product grids and cards. */
export function toProductDTO(
  row: ProductRow,
  tag: string | null,
): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    category: {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
      icon: row.category.icon,
    },
    image: row.image,
    amazonUrl: row.amazonUrl,
    affiliateUrl: buildAffiliateUrl(row.amazonUrl, tag),
    price: row.price,
    oldPrice: row.oldPrice ?? null,
    discount: row.discount,
    rating: row.rating,
    reviewCount: row.reviewCount,
    trendingScore: row.trendingScore,
    popularityScore: row.popularityScore,
    trendingReason: row.trendingReason,
    badge: row.badge as Badge,
    viralLabel: row.viralLabel ?? null,
    isDeal: row.isDeal,
    dealLabel: (row.dealLabel as DealLabel | null) ?? null,
    isFeatured: row.isFeatured,
    status: row.status === 'draft' ? 'draft' : 'active',
    views: row.views,
    clicks: row.clicks,
  }
}

/** Full serializer for the dedicated product page. */
export function toProductFullDTO(
  row: ProductRow,
  tag: string | null,
  alternatives: ProductRow[],
): ProductFullDTO {
  return {
    ...toProductDTO(row, tag),
    whyWeLikeIt: parseList(row.whyWeLikeItJson),
    pros: parseList(row.prosJson),
    cons: parseList(row.consJson),
    verdict: row.verdict,
    whoItsFor: row.whoItsFor,
    whoShouldSkip: row.whoShouldSkip,
    alternatives: alternatives.map((alt) => toProductDTO(alt, tag)),
  }
}
