import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'
import type { AdminStats } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** GET /api/admin/stats — dashboard KPI metrics (auth required). */
export async function GET(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [totalProducts, activeProducts, draftProducts, totalCategories, activeDeals, totalClicksAgg, totalViews, topRows, recentRows] =
      await Promise.all([
        db.product.count(),
        db.product.count({ where: { status: 'active' } }),
        db.product.count({ where: { status: 'draft' } }),
        db.category.count(),
        db.product.count({ where: { isDeal: true, status: 'active' } }),
        db.product.aggregate({ _sum: { clicks: true } }),
        db.product.aggregate({ _sum: { views: true } }),
        db.product.findMany({
          orderBy: { clicks: 'desc' },
          take: 5,
          select: { id: true, name: true, slug: true, clicks: true, views: true, image: true },
        }),
        db.clickEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { product: { select: { name: true } } },
        }),
      ])

    const totalClicks = totalClicksAgg._sum.clicks || 0
    const views = totalViews._sum.views || 0
    const stats: AdminStats = {
      totalProducts,
      activeProducts,
      draftProducts,
      totalCategories,
      activeDeals,
      totalClicks,
      totalViews: views,
      ctr: views > 0 ? (totalClicks / views) * 100 : 0,
      topProducts: topRows,
      recentClicks: recentRows.map((r) => ({
        id: r.id,
        productName: r.product.name,
        source: r.source,
        createdAt: r.createdAt.toISOString(),
      })),
    }
    return NextResponse.json({ stats })
  } catch (err) {
    console.error('GET /api/admin/stats failed', err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
