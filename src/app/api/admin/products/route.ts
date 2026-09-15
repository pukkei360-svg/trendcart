import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'
import { parseProductPayload } from '@/lib/admin-products'
import { getAffiliateTag } from '@/lib/affiliate'
import { toProductFullDTO } from '@/lib/serializers'

export const dynamic = 'force-dynamic'

/** GET /api/admin/products — full catalog incl. drafts (auth). */
export async function GET(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    })
    const tag = await getAffiliateTag()
    return NextResponse.json({
      products: rows.map((row) => toProductFullDTO(row, tag, [])),
    })
  } catch (err) {
    console.error('GET /api/admin/products failed', err)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

/** POST /api/admin/products — create a product (auth). */
export async function POST(req: NextRequest) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const { data, errors } = parseProductPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }
    const duplicate = await db.product.findUnique({ where: { slug: data.slug } })
    if (duplicate) {
      return NextResponse.json({ error: `Slug "${data.slug}" already exists` }, { status: 400 })
    }
    const created = await db.product.create({
      data,
      include: { category: true },
    })
    return NextResponse.json({ product: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/products failed', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
