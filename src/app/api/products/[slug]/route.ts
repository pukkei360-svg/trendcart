import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAffiliateTag } from '@/lib/affiliate'
import { toProductFullDTO } from '@/lib/serializers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/[slug]
 * Full product payload (editorial content + alternatives) and increments
 * the product view counter used by the admin KPI dashboard.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const row = await db.product.findUnique({
      where: { slug },
      include: { category: true },
    })
    if (!row || row.status !== 'active') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const alternatives = await db.product.findMany({
      where: { categoryId: row.categoryId, status: 'active', id: { not: row.id } },
      orderBy: { popularityScore: 'desc' },
      take: 4,
      include: { category: true },
    })

    // fire-and-forget view counter
    db.product
      .update({ where: { id: row.id }, data: { views: { increment: 1 } } })
      .catch(() => {})

    const tag = await getAffiliateTag()
    return NextResponse.json({ product: toProductFullDTO(row, tag, alternatives) })
  } catch (err) {
    console.error('GET /api/products/[slug] failed', err)
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}
