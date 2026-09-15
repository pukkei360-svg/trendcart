import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'
import { parseProductPayload } from '@/lib/admin-products'

export const dynamic = 'force-dynamic'

/** PUT /api/admin/products/[id] — update a product (auth). */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const productId = Number(id)
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const existing = await db.product.findUnique({ where: { id: productId } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { data, errors } = parseProductPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }
    const duplicate = await db.product.findUnique({ where: { slug: data.slug } })
    if (duplicate && duplicate.id !== productId) {
      return NextResponse.json({ error: `Slug "${data.slug}" already exists` }, { status: 400 })
    }

    const updated = await db.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    })
    return NextResponse.json({ product: updated })
  } catch (err) {
    console.error('PUT /api/admin/products/[id] failed', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

/** DELETE /api/admin/products/[id] (auth). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const productId = Number(id)
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    await db.product.delete({ where: { id: productId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/products/[id] failed', err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
