import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAffiliateTag } from '@/lib/affiliate'
import { toProductDTO } from '@/lib/serializers'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products
 * Public product listing with section presets, category filters, search,
 * price/rating/discount filters and sorting.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const section = sp.get('section') || 'all'
    const categorySlug = sp.get('category')
    const q = sp.get('q')?.trim() || ''
    const minRating = parseFloat(sp.get('minRating') || '0')
    const minPrice = parseFloat(sp.get('minPrice') || '0')
    const maxPrice = parseFloat(sp.get('maxPrice') || '0')
    const minDiscount = parseInt(sp.get('minDiscount') || '0', 10)
    const sort = sp.get('sort') || 'trending'
    const limit = Math.min(Math.max(parseInt(sp.get('limit') || '24', 10) || 24, 1), 100)
    const offset = Math.max(parseInt(sp.get('offset') || '0', 10) || 0, 0)

    const where: Prisma.ProductWhereInput = { status: 'active' }

    // Section presets
    if (section === 'deals') {
      where.isDeal = true
    } else if (section === 'hidden-gems') {
      where.badge = 'hidden-gem'
    } else if (section === 'viral') {
      where.viralLabel = { not: null }
    } else if (section === 'featured') {
      where.isFeatured = true
    }

    // Filters
    if (categorySlug) {
      where.category = { slug: categorySlug }
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { shortDescription: { contains: q } },
        { description: { contains: q } },
        { trendingReason: { contains: q } },
        { category: { name: { contains: q } } },
      ]
    }
    if (minRating > 0) where.rating = { gte: minRating }
    if (minPrice > 0 || maxPrice > 0) {
      where.price = {
        ...(minPrice > 0 ? { gte: minPrice } : {}),
        ...(maxPrice > 0 ? { lte: maxPrice } : {}),
      }
    }
    if (minDiscount > 0) where.discount = { gte: minDiscount }

    // Sorting
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      section === 'best-sellers' && sort === 'trending'
        ? { popularityScore: 'desc' }
        : sort === 'popularity'
          ? { popularityScore: 'desc' }
          : sort === 'price-asc'
            ? { price: 'asc' }
            : sort === 'price-desc'
              ? { price: 'desc' }
              : sort === 'rating'
                ? { rating: 'desc' }
                : sort === 'discount'
                  ? { discount: 'desc' }
                  : sort === 'reviews'
                    ? { reviewCount: 'desc' }
                    : sort === 'newest'
                      ? { createdAt: 'desc' }
                      : { trendingScore: 'desc' }

    const [rows, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: { category: true },
      }),
      db.product.count({ where }),
    ])

    const tag = await getAffiliateTag()
    return NextResponse.json({
      products: rows.map((row) => toProductDTO(row, tag)),
      total,
      hasMore: offset + rows.length < total,
    })
  } catch (err) {
    console.error('GET /api/products failed', err)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}
