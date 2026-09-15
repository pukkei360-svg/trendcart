import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/track/click — records an outbound Amazon affiliate click.
 * This powers the site's primary KPI (outbound CTR) in the admin dashboard.
 * Body: { productId: number, source?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const productId = Number(body?.productId)
    const source = String(body?.source || 'unknown').slice(0, 60)
    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
    }
    const exists = await db.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    await db.$transaction([
      db.clickEvent.create({ data: { productId, source } }),
      db.product.update({ where: { id: productId }, data: { clicks: { increment: 1 } } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/track/click failed', err)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}
