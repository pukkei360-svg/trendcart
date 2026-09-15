import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** PUT /api/admin/categories/[id] — update (auth). */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const categoryId = Number(id)
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const existing = await db.category.findUnique({ where: { id: categoryId } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    const body = await req.json().catch(() => ({}))
    const name = String(body.name || existing.name).trim()
    const slug = slugify(String(body.slug || '').trim() || name)
    const icon = String(body.icon || existing.icon).trim() || existing.icon
    const description = String(body.description ?? existing.description).trim()
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    const duplicate = await db.category.findUnique({ where: { slug } })
    if (duplicate && duplicate.id !== categoryId) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 400 })
    }
    const updated = await db.category.update({
      where: { id: categoryId },
      data: { name, slug, icon, description },
    })
    return NextResponse.json({ category: updated })
  } catch (err) {
    console.error('PUT /api/admin/categories/[id] failed', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

/** DELETE /api/admin/categories/[id] (auth) — blocked while products exist. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminUserId(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const categoryId = Number(id)
    if (!Number.isFinite(categoryId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const productCount = await db.product.count({ where: { categoryId } })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) still use this category` },
        { status: 400 },
      )
    }
    await db.category.delete({ where: { id: categoryId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/categories/[id] failed', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
